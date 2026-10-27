# Setup

The packet runs with no credentials. These two steps add the sponsor integrations.
Zetaris is required by the rules. Nemotron is optional.

## 1. Zetaris, required

Section 05 of the event rules says every submission must integrate Zetaris and Meterless, and the
video must show both. Meterless is already wired. Zetaris needs a local install.

### Before you start

Give Docker 8 GB of memory and 4 CPUs in Settings then Resources. The preflight script fails
below 6 GB, and a 4 GB VM dies after the download finishes with an out of memory kill that
names nothing useful. You also need 15 GB free on disk: the download is about 4 GB and the
images unpack to about 10 GB.

On Windows, run the shell commands from WSL.

### Get the archive

The Run locally page at https://cloud.enterprise.zetaris.com/dashboard/download has the
registry sign-in command with its password, the zip, and the admin sign-in. The zip is 28 MB,
most of it the JDBC driver.

This repo assumes the bundle is unpacked at `~/zetaris/zetaris-platform`.

### Install

Run the `docker login` line exactly as the download page prints it. The password is only on
that page, so copy it from there rather than retyping it.

```bash
cd ~/zetaris/zetaris-platform
./preflight.sh        # every line should say PASS
docker compose pull   # about 4 GB, 10 to 20 minutes
docker compose up -d  # 2 to 10 minutes, setup continues after it returns
./verify.sh           # rerun after a minute if anything fails
```

Nothing in `.env` has to be edited. The bundle ships working defaults, including the
administrator account. Everything binds to 127.0.0.1, so nothing on your network can reach it.

`postgres`, `driver` and `api` should be healthy, `ui` and `bootstrap` started, and `init`
exited cleanly.

### Connect Stopgap to it

1. Open http://localhost:3000 and sign in. The admin email and password are on the download page
   and in the bundle's `.env`. Change the password from the user menu once you are in.
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
NVIDIA_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b
```

If the model id 404s, open the model page on build.nvidia.com and copy the exact id shown in its
sample request. With no key, or on any error, the packet omits the sentence and says so.
