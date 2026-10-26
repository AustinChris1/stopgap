import { handle } from "@hono/node-server/vercel";
import app from "../apps/server/src/app.ts";

// Vercel's Node runtime calls the handler with (req, res), so this adapter is the
// right one; the Web-standard hono/vercel handler never responds and times out.
export default handle(app);
