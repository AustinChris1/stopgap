import { serve } from "@hono/node-server";
import app, { GENERIC, PIN } from "./app.ts";

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port });
console.log(`stopgap server on http://localhost:${port} (pin ${PIN}, generic ${GENERIC})`);
