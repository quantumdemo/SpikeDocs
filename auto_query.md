# SpikeDocs Project Q&A & Technical Acceptance Log (`auto_query.md`)

## 1. Initial Clarifications & Architecture Choices

### Stack & Framework
- **Framework:** Next.js App Router with TypeScript and Tailwind CSS.
- **PWA:** Integrated `manifest.json`, Service Worker (`public/sw.js`), and offline fallback support.
- **Theme & Design:** Clean white background with vibrant red accent (`#DC2626` / `red-600`), mobile bottom navigation, floating `+` quick upload button, and desktop collapsible sidebar.

### Client-Side Zero-Data Retention Engine
- All document manipulation occurs strictly inside local browser memory via `pdf-lib`, `pdfjs-dist`, `docx`, `xlsx`, and `tesseract.js` (WebAssembly).
- No user files are uploaded to or stored on servers.

---

## 2. Admin Security & Supabase Architecture

### Database Schema & Security Controls
1. **Admin Allowlist Database Check Constraint:**
   - A PL/pgSQL trigger (`enforce_admin_allowlist_trigger`) enforces that any profile set to `is_admin = true` must have an email present in `public.admin_allowlist`.
2. **Role Hierarchy:**
   - Granting admin access requires `super_admin` privileges.
3. **MFA (2FA) Security Enforcement:**
   - Admin access checks `auth.mfa.getAuthenticatorAssuranceLevel()` to ensure elevated AAL2 authenticator assurance.
4. **Audit Logging:**
   - All admin actions are recorded in `public.admin_audit_logs`.
5. **Admin Automatic Pro Access:**
   - Admins automatically receive `is_pro = true` without paying subscription fees.

### How to Add an Email as Super Admin in Supabase
```sql
-- Step 1: Add email to the allowlist
INSERT INTO public.admin_allowlist (email, added_by)
VALUES ('your-email@example.com', 'owner_setup')
ON CONFLICT (email) DO NOTHING;

-- Step 2: Set role to super_admin and enable admin status
UPDATE public.profiles
SET
  is_admin = TRUE,
  is_pro = TRUE,
  role = 'super_admin'::user_role,
  mfa_enabled = TRUE
WHERE email = 'your-email@example.com';
```

---

## 3. Freemium Model & Usage Enforcement

- **Free Users:**
  - Maximum of 5 file upload conversions per day.
  - Access to basic tools (Merge, Split, Rotate, Compress, Edit).
  - Maximum file size limit 50MB.
- **Pro Users:**
  - Unlimited file uploads & conversions.
  - Unlimited file sizes (> 50MB).
  - Full access to AI Summarizer, AI Translation, WebAssembly OCR, and Batch Processing.

---

## 4. Payment Integrations (Stripe & Paystack)

- **Stripe Webhook (`/api/webhooks/stripe`):**
  - Handles `checkout.session.completed` and `customer.subscription.deleted`.
- **Paystack Webhook (`/api/webhooks/paystack`):**
  - HMAC SHA512 signature verified.
  - Handles `charge.success` and `subscription.disable` for local/African markets.

---

## 5. Final QA Sign-Off & Project Acceptance Checklist

1. **Absolute Data Privacy:** Confirmed 100% in-browser local processing. No server uploads.
2. **PWA & Responsiveness:** Verified on 1280px desktop and 375px mobile screens with installable PWA manifest & service worker.
3. **SEO Architecture:** Statically generated routes for all 30+ tools, OpenGraph metadata, custom H1s, how-to guides, and embedded JSON-LD FAQ schema.
4. **Payment & Access Gating:** Fully integrated Stripe and Paystack webhooks with daily usage enforcement for free users.
5. **Admin Dashboard (`/admin`):** Secure panel displaying MAU, Pro Subscribers, MRR, churn alerts, and audit logs.
