# Setup

The packet runs with no credentials. These two steps add the sponsor integrations.
Zetaris is required by the rules. Nemotron is optional.

## 1. Zetaris, required

Section 05 of the event rules says every submission must integrate Zetaris and Meterless, and the
video must show both. Meterless is already wired. Zetaris needs a local install.

### Before you start

Free up disk. The install guide wants at least 15 GB free plus room for datasets and logs, and
the preflight script fails below 6 GB of memory available to Docker.

Start Docker Desktop and wait for the whale icon to stop animating. On Windows, run the shell
commands below from WSL2 with Docker Desktop integration enabled.

### Get the archive

1. Register or sign in at https://cloud.enterprise.zetaris.com/register
2. Open the Run locally page at https://cloud.enterprise.zetaris.com/dashboard/download
3. Download `zetaris-platform.zip` and copy the registry sign-in command shown on that page.
   The credentials come from Zetaris and are printed there. They are not published anywhere else.
   If the download is missing for your account, contact Zetaris Support to have it enabled.
4. Move the zip out of Downloads before unpacking it.

### Install

```bash
unzip zetaris-platform.zip
cd zetaris-platform
docker login zetarishackathon.azurecr.io    # use the credentials from the download page
./preflight.sh
```

Edit `.env` before the first start. Set `ZETARIS_ADMIN_EMAIL` and `ZETARIS_ADMIN_PASSWORD`. The
password needs at least eight characters with lowercase, uppercase, a digit, and one of `$ @ ! % * ? &`.
Then set the sizing values:

```
ZSPARK_DRIVER_MEM=2g
ZSPARK_DRIVER_CORES=2
ZSPARK_MASTER_URL=local[2]
ZETARIS_API_MAX_HEAP=1g
UI_PORT=3000
ALLOWED_ORIGINS=http://localhost:3000
GUI_URL=http://localhost:3000
```

```bash
chmod 600 .env
docker compose pull
docker compose up -d
docker compose ps --all
./verify.sh
```

`postgres`, `driver`, `api`, `ui` and `ai-datasteward` should be running. `init` and `bootstrap`
should show `Exited (0)`. `verify.sh` passes nine checks.

### Connect Stopgap to it

1. Open http://localhost:3000 and sign in with the administrator account you just created.
2. Run `SELECT 1 AS one;` in the SQL Editor to confirm the engine answers.
3. Management then Organisation. Copy the numeric **ID** field, not the name or the URL slug.
4. Management then API Tokens. Click **+** and copy the key. It is shown once.
5. Put both in `.env` at the repo root:

```
ZETARIS_REST_URL=http://localhost:8888/api/v1.0
ZETARIS_ORG_ID=<the numeric ID>
ZETARIS_API_KEY=<the key>
```

6. Restart the API with `pnpm dev:server`. The Zetaris panel in the packet route should read
   `reachable`. Press **Register source**, then **Run the join**.

If the create fails, the SQL is in [zetaris/sql](zetaris/sql) and can be pasted straight into the
Zetaris SQL Editor instead. That still counts as the integration on camera, and the panel will
show the query once the tables exist.

## 2. NVIDIA Nemotron, optional

Free. Hosted endpoints on build.nvidia.com are free for NVIDIA Developer Program members for
prototyping. There is no card.

1. Sign in or create a free account at https://build.nvidia.com
2. Complete verification if prompted. Some accounts are asked for a phone number.
3. Generate a key from Settings then API Keys, or the Get API Key button on any model page.
   Keys start with `nvapi-`.
4. Add it to `.env`:

```
NVIDIA_API_KEY=nvapi-...
NVIDIA_MODEL=nvidia/nemotron-3-nano-30b-a3b
```

If the model id 404s, open the model page on build.nvidia.com and copy the exact id shown in its
sample request. With no key, or on any error, the packet omits the sentence and says so.
