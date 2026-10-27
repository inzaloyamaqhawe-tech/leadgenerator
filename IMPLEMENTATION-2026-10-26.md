# Township Prospector integration â€” 26 October 2026

## Delivered

- Replaced the Lovable wordmark and favicon with Bolide assets.
- Changed the work stages to `New`, `Researching`, `Contacted`, `Follow-up`, `Interested`, `Not interested` and `Unreachable`.
- Removed the manual CRM export workflow.
- Added authenticated Xneelo APIs for prospects, activity, photos and CRM owners.
- Added a one-time migration of existing Supabase prospect records into Xneelo when the new tables are empty.
- Added optimistic record versions so one user's older screen cannot silently overwrite a teammate's newer edit.
- Added case-insensitive prospect duplicate protection for business, township and address.
- Added the **Move to CRM pipeline** workflow. It requires a responsible CRM owner and checks company, solution and site matches before creating a deal.
- Added duplicate choices to link the existing CRM opportunity or create a separate opportunity with a reason.
- Made promotion idempotent and stored the source prospect ID on the CRM deal.
- Kept photo objects in the existing private Supabase bucket while moving their business metadata to Xneelo.
- Configured the frontend for the `/leadgenerator/` subdirectory and SPA route rewrites.
- Removed public self-signup and email-dependent password reset during rollout. Administrators provision approved users with a temporary password and mark the Supabase user as confirmed, so no verification message is required.

## Lead API

The deployed browser calls `POST /leadgenerator/api/prospector.php`. This authenticated proxy validates the signed-in Supabase user and forwards only approved actions to the private CRM endpoint. Supported actions are `list`, `get`, `create`, `update`, `activity`, `addActivity`, `photos`, `addPhoto`, `owners`, `promotionPreview` and `promote`.

This API creates and manages leads supplied by a person or another approved server integration. Automatic discovery is a separate step and needs the external data sources listed below. The private CRM secret remains in PHP config and is never sent to the browser.

## User onboarding during rollout

Do not enable open signup while email verification is disabled. In Supabase **Authentication â†’ Users**, create each approved user with a temporary password and enable **Auto Confirm User**. The existing database trigger creates the profile and member role. An administrator can then adjust team, role and active status in Township Prospector.

For bulk onboarding later, configure a private Supabase service-role key on Xneelo and add a protected admin import endpoint. Never place that key in `.env` variables beginning with `VITE_` or in browser JavaScript.

## Shared database tables

The CRM migration `database/20261026-township-prospector.sql` creates `township_leads`, `township_lead_activity`, `township_lead_photos` and `township_lead_promotions`.

Only an explicitly interested prospect is linked to `deals`. All earlier prospecting work stays in the Township Prospector tables.

## External services still needed

The core workflow works without these services. They improve research and automation when Bolide is ready to configure provider accounts and budgets.

1. **Google Places API** â€” discover businesses, addresses, phone numbers, websites and place IDs. Calls should run through a server endpoint so the key is never exposed in the browser.
2. **Google Geocoding API** â€” convert verified addresses to map coordinates.
3. **Google Solar API** â€” estimate roof geometry and solar potential where coverage is available. It does not reliably prove that panels are already installed, so manual roof verification and photo evidence remain necessary.
4. **Current satellite or aerial imagery provider** â€” optional visual panel checks where licensing permits it. A person should confirm any automated indication before it becomes company data.
5. **Utility data sources** â€” Eskom and municipal supply areas do not have one dependable nationwide public API. Keep the existing rule table and confirm the supplier from the customer's bill.
6. **AI drafting provider** â€” optional. Configure a server-side key for outreach drafts; the lead workflow itself does not depend on AI.

For each paid API, restrict the key to the server/IP or approved HTTP referrer, set a budget alert, and store it only in the private Xneelo `api/config.php`.

## Deployment layout

```text
/leadgenerator/
  .htaccess
  _shell.html
  assets/
  api/
    .htaccess
    bootstrap.php
    prospector.php
    ai-draft.php
    config.php       private; never commit
```

The parent WordPress rewrite leaves this real directory alone. The subdirectory `.htaccess` serves generated files and PHP endpoints directly and sends client routes such as `/leadgenerator/auth` to `_shell.html`.
# OpenAI drafting migration â€” 27 October 2026

- Replaced the unavailable Lovable AI gateway with the OpenAI Responses API.
- Kept the OpenAI project key in ignored server configuration only.
- Confirmed the key is absent from Git-tracked files and browser JavaScript assets.
- Continued to protect `api/config.php` from direct HTTP access through `api/.htaccess`.
- Updated local and Xneelo routes to return the same JSON response format.
- Configured the economical `gpt-4.1-mini` model for lead outreach drafts.
- Authentication succeeds, but the supplied OpenAI project currently returns `credit_balance_exhausted`; API credits must be added before generation can complete.

## Dashboard, sidebar and theme update ? 27 October 2026

- Replaced the top-only section navigation with a persistent desktop sidebar for Dashboard, Leads, Work board, Utility map, CRM sync and Team admin.
- Added a modern dashboard showing total areas, total leads, conversations, solar checks pending, CRM conversions, leads per area, status distribution and recently updated leads.
- Added a persistent compact mode that hides menu names, expands the data workspace and shows labels when icons are hovered.
- Added optional Bolide dark mode; the existing light appearance remains the default. Both modes use Bolide magenta, orange, plum and neutral design tokens.
- Audited company-data controls: lead creation, lead edits, roof/contact details, status changes, notes, photos, ownership, CRM promotion and admin roles continue through the Xneelo-backed APIs. Search, filters, selected tabs, menu width and theme are view preferences and remain local to the browser.
- No lead records or database schema were replaced for this interface update.
