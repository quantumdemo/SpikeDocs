import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-10-28.endive' as any,
});

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      event = JSON.parse(body);
    }

    const supabase = await createClient();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (userId) {
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          is_pro: true,
          tier: session.mode === 'subscription' ? 'pro_monthly' : 'pro_yearly',
          gateway: 'stripe',
          customer_id: customerId,
          subscription_id: subscriptionId,
          status: 'active',
          updated_at: new Date().toISOString(),
        });

        await supabase.from('profiles').update({ is_pro: true }).eq('id', userId);
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('customer_id', customerId)
        .single();

      if (sub) {
        await supabase.from('subscriptions').update({
          is_pro: false,
          status: 'canceled',
          updated_at: new Date().toISOString(),
        }).eq('user_id', sub.user_id);

        await supabase.from('profiles').update({ is_pro: false }).eq('id', sub.user_id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
