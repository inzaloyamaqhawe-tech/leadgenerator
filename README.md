# Bolide Township Prospector

Internal prospecting tool for researching township businesses and qualifying them before CRM handover.

## Data flow

- Supabase authenticates users and stores the existing site-photo objects.
- Xneelo stores prospects, status changes, activity, photo metadata and the CRM promotion record.
- A prospect remains outside the CRM while it is being researched or contacted.
- **Move to CRM pipeline** checks duplicates, requires a CRM owner, then creates or links one CRM deal at **Lead Received**.
- A promoted prospect keeps its CRM deal ID, so repeating the action cannot create another deal.

On the first authenticated load after deployment, existing Supabase lead, activity and photo metadata is copied to Xneelo only when the Xneelo prospect table is empty. Subsequent reads and writes use Xneelo.

## Local development

1. Copy `.env.example` to `.env` and enter the local values.
2. Install dependencies with `bun install --frozen-lockfile`.
3. Run `bun run dev`.

The local TanStack server validates the Supabase session and forwards database requests to the protected CRM integration endpoint. The CRM API secret is server-only.

## Production build

```powershell
$env:BASE_PATH='/leadgenerator/'
bun run build
python prepare_xneelo.py
```

`prepare_xneelo.py` creates the ignored `deploy-leadgenerator` folder and its private `api/config.php`. Upload the **contents** of that folder individually into Xneelo's `leadgenerator` directory. Do not add another directory level and do not commit the deployment folder.

See [IMPLEMENTATION-2026-10-26.md](IMPLEMENTATION-2026-10-26.md) for the database, API and deployment record.
