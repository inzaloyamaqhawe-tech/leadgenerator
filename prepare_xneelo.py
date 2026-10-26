from pathlib import Path
import os
import re
import shutil

ROOT = Path(__file__).resolve().parent
BUILD = ROOT / ".output" / "public"
DEST = ROOT / "deploy-leadgenerator"
CRM_CONFIG = ROOT.parent / "BOLIDECRM" / "app" / "api" / "config.php"


def env_values(path: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        result[key.strip()] = value.strip().strip('"').strip("'")
    return result


def php_value(text: str, key: str) -> str:
    match = re.search(rf"['\"]{re.escape(key)}['\"]\s*=>\s*(['\"])(.*?)\1", text)
    if not match:
        raise SystemExit(f"Missing {key} in the private CRM config.")
    return match.group(2)


def php_quote(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


if not (BUILD / "_shell.html").is_file():
    raise SystemExit("Build first with BASE_PATH=/leadgenerator/ so .output/public/_shell.html exists.")
shell = (BUILD / "_shell.html").read_text(encoding="utf-8")
if "/leadgenerator/" not in shell:
    raise SystemExit("The build does not target /leadgenerator/. Rebuild with BASE_PATH=/leadgenerator/.")
if not CRM_CONFIG.is_file():
    raise SystemExit("The private CRM api/config.php is required to prepare the server proxy.")

env = env_values(ROOT / ".env")
supabase_url = env.get("SUPABASE_URL") or env.get("VITE_SUPABASE_URL")
supabase_key = env.get("SUPABASE_PUBLISHABLE_KEY") or env.get("VITE_SUPABASE_PUBLISHABLE_KEY")
if not supabase_url or not supabase_key:
    raise SystemExit("The private .env needs the Supabase URL and publishable key.")
crm_secret = php_value(CRM_CONFIG.read_text(encoding="utf-8-sig"), "api_secret")

resolved = DEST.resolve()
if resolved.parent != ROOT.resolve() or resolved.name != "deploy-leadgenerator":
    raise SystemExit("Refusing to update an unexpected deployment directory.")
DEST.mkdir(exist_ok=True)
source_assets = {path.name for path in (BUILD / "assets").glob("*") if path.is_file()}
destination_assets = DEST / "assets"
if destination_assets.exists():
    for old_asset in destination_assets.iterdir():
        if old_asset.is_file() and old_asset.name not in source_assets:
            old_asset.unlink()
shutil.copytree(BUILD, DEST, dirs_exist_ok=True)
obsolete_logo = DEST / "bolide-logo.jpg"
if obsolete_logo.exists():
    obsolete_logo.unlink()

config = """<?php
return [
    'supabase_url' => {supabase_url},
    'supabase_publishable_key' => {supabase_key},
    'crm_api_url' => 'https://bolide.co.za/crm/api/township-prospects.php',
    'crm_auth_url' => 'https://bolide.co.za/crm/api/auth.php',
    'crm_api_secret' => {crm_secret},
    'lovable_api_key' => {lovable_key},
];
""".format(
    supabase_url=php_quote(supabase_url),
    supabase_key=php_quote(supabase_key),
    crm_secret=php_quote(crm_secret),
    lovable_key=php_quote(os.environ.get("LOVABLE_API_KEY", "")),
)
(DEST / "api" / "config.php").write_text(config, encoding="utf-8", newline="\n")

for bundle in (DEST / "assets").glob("*.js"):
    if crm_secret and crm_secret in bundle.read_text(encoding="utf-8"):
        raise SystemExit("A private CRM secret was found in a public JavaScript bundle.")

files = sorted(str(path.relative_to(DEST)).replace("\\", "/") for path in DEST.rglob("*") if path.is_file())
(ROOT / "UPLOAD-FILES-2026-10-26.txt").write_text(
    "Upload the CONTENTS of deploy-leadgenerator into Xneelo /leadgenerator.\n"
    "Keep the paths below exactly as shown. Do not create a second leadgenerator folder.\n\n"
    + "\n".join(files)
    + "\n",
    encoding="utf-8",
    newline="\n",
)
print(f"Prepared {len(files)} individual files in {DEST}")
