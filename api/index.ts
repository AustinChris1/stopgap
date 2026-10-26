import { handle } from "hono/vercel";
import app from "../apps/server/src/app.ts";

// The packet reads public FDA and NLM endpoints at request time, so it needs a
// real runtime rather than the edge, and a little headroom for the enrichment fan-out.
export const config = { runtime: "nodejs", maxDuration: 30 };

export default handle(app);
