# SpikeDocs: Comprehensive Security, Freemium & Anti-Abuse Preventive Measures Report

## 1. Executive Summary

SpikeDocs is designed as a privacy-first Progressive Web App (PWA) where 100% of PDF processing happens locally in the user's browser memory (via WebAssembly and client-side engines like `qpdf-wasm`, `pdf-lib`, and `pdfjs-dist`).

To ensure sustainable monetization, protect against platform abuse, and maintain strict tier boundaries between free, non-signed-up, and Pro users before and after Supabase database linking, the platform implements a defense-in-depth security and entitlement architecture.

---

## 2. Measures for Users Who Do Not Sign Up (Guest Users)

For visitors who use the web app without signing in or linking an account:

1. **Daily Upload Cap (5 Files/Day Maximum)**:
   - Guest activity is tracked using local storage date counters (`spikedocs_daily_uploads` and `spikedocs_usage_date`).
   - If a guest attempts to select, drop, or process more than 5 files within a 24-hour UTC window, the UI immediately blocks further processing and displays an upgrade banner.
2. **Pro Tool Hard Locking**:
   - High-value tools (such as *AI Summarizer*, *Translate PDF*, *PDF to Excel*, *PDF to PowerPoint*, *HTML to PDF*, *PDF to Markdown*, *PDF to PDF/A*, and *OCR Searchable PDF*) are designated with `isPro: true`.
   - Guest users encountering a Pro tool see a locked Pro Gate modal requiring them to create an account or subscribe to SpikeDocs Pro. The "Process" action is disabled.
3. **File Size Capping**:
   - Free/guest uploads are strictly restricted to files $\le$ 50MB. Files exceeding 50MB are rejected at the drop zone.
4. **Zero-Retention Client Processing**:
   - Because processing happens client-side without server storage, guest users cannot consume backend server compute or storage resources.

---

## 3. Measures for Free Tier Signed-In Users

For users who register with a free account:

1. **Persistent Server-Side Usage Tracking**:
   - The Supabase migration schema includes a `public.daily_usage` table tracking `(user_id, usage_date, upload_count)`.
   - Each upload transaction checks against the 5-upload quota.
2. **Subscription State Synchronization**:
   - User profile rows in `public.profiles` track `is_pro` status.
   - Stripe and Paystack webhook handlers automatically set `is_pro = true` on `checkout.session.completed` / `charge.success`, and revert to `is_pro = false` on subscription cancellation or expiration.

---

## 4. Measures for Pro & Admin Users

1. **Pro Status Entitlements**:
   - Unlimited batch file processing.
   - Large file sizes ($> 50\text{MB}$) unlocked.
   - Full access to all 31 tools including AI & OCR, machine translation, and multi-format conversions.
2. **Automatic Admin Pro Access**:
   - Co-founders and administrators are verified through `public.admin_allowlist` and the `check_admin_allowlist` database trigger.
   - When an email matches the allowlist, `is_pro := TRUE` is automatically awarded by the database trigger without requiring a payment gateway transaction.
3. **Admin Security Hardening**:
   - MFA/2FA elevation check (`aal2`) required for admin operations.
   - All administrative actions are recorded in `public.admin_audit_logs`.

---

## 5. Summary Table of Tier Entitlements

| Feature | Guest (Unauthenticated) | Free Tier (Signed In) | SpikeDocs Pro / Admins |
| :--- | :--- | :--- | :--- |
| **Max Uploads / Day** | 5 files | 5 files | Unlimited |
| **Max File Size** | 50 MB | 50 MB | Unlimited ($>50\text{MB}$) |
| **Basic PDF Tools** | Full access | Full access | Full access |
| **Pro Tools (OCR, AI, PPTX, XLSX)** | Locked | Locked | Unlocked |
| **Layout-Preserving Translation** | Locked | Locked | Unlocked |
| **Server Storage** | 0% (Client memory only) | 0% (Client memory only) | 0% (Client memory only) |
