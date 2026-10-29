import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const paystackSignature = req.headers.get('x-paystack-signature');

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (secret && paystackSignature) {
      const hash = crypto.createHmac('sha512', secret).update(bodyText).digest('hex');
      if (hash !== paystackSignature) {
        return new Response(JSON.stringify({ error: 'Invalid Paystack signature' }), { status: 400 });
      }
    }

    const event = JSON.parse(bodyText);
    const supabase = await createClient();

    if (event.event === 'charge.success') {
      const data = event.data;
      const userEmail = data.customer.email;
      const planCode = data.plan?.plan_code;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (profile) {
        await supabase.from('subscriptions').upsert({
          user_id: profile.id,
          is_pro: true,
          tier: planCode ? 'pro_yearly' : 'pro_monthly',
          gateway: 'paystack',
          customer_id: data.customer.customer_code,
          subscription_id: data.reference,
          status: 'active',
          updated_at: new Date().toISOString(),
        });

        await supabase.from('profiles').update({ is_pro: true }).eq('id', profile.id);
      }
    } else if (event.event === 'subscription.disable') {
      const data = event.data;
      const userEmail = data.customer.email;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (profile) {
        await supabase.from('subscriptions').update({
          is_pro: false,
          status: 'disabled',
          updated_at: new Date().toISOString(),
        }).eq('user_id', profile.id);

        await supabase.from('profiles').update({ is_pro: false }).eq('id', profile.id);
      }
    }

    return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
  } catch (err: any) {
    console.error('Paystack webhook error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
