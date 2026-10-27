// Assembles the slide sources into one standalone deck/index.html.
// No dependencies: node deck/build.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const index = JSON.parse(readFileSync(join(here, "deck.json"), "utf8"));

const known = new Set(readdirSync(join(here, "slides")).map((f) => f.replace(/\.html$/, "")));
const missing = index.order.filter((id) => !known.has(id));
if (missing.length) throw new Error(`deck.json lists slides with no file: ${missing.join(", ")}`);

// The artifact runtime serves uploaded images from /_blob/<id>; in the repo they are files.
const BLOBS = {
  "/_blob/4309f0e1f01b3d8482c1f2f02fe7b22c": "img/hero.png",
  "/_blob/7e8bdf140ec452a2a5ee9fa905bcdfc5": "img/ladder.png",
};

const slides = index.order
  .map((id) => {
    let html = readFileSync(join(here, "slides", `${id}.html`), "utf8").trim();
    for (const [blob, path] of Object.entries(BLOBS)) html = html.split(blob).join(path);
    // Speaker notes are kept in the file but hidden on the printed page.
    return html;
  })
  .join("\n");

const href = Object.values(index.faces).find((f) => f.href)?.href ?? "";

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${index.title}</title>
${href ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${href}">` : ""}
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #2a2724; font-family: 'IBM Plex Sans', Arial, sans-serif; }
  main { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 24px; }
  section {
    position: relative; width: 1920px; height: 1080px; overflow: hidden;
    transform-origin: top left; box-shadow: 0 8px 40px rgba(0,0,0,.35);
  }
  .frame { position: relative; overflow: hidden; }
  aside { display: none; }
  h1, h2, h3, p, ul, ol, table { margin: 0; }
  ul, ol { padding-left: 1.2em; }
  table { border-collapse: collapse; width: 100%; }
  th, td { padding: 14px 20px; border-bottom: 1px solid rgba(128,128,128,.35); text-align: left; }
  x-shape, x-connector { display: block; }
  x-shape[kind="arrow-right"] {
    clip-path: polygon(0 28%, 60% 28%, 60% 0, 100% 50%, 60% 100%, 60% 72%, 0 72%);
  }
  x-connector { border-top: 2px solid currentColor; height: 0; align-self: center; }
  @media print {
    body { background: #fff; }
    main { padding: 0; gap: 0; }
    .frame { page-break-after: always; box-shadow: none; }
    section { box-shadow: none; }
    @page { size: 1920px 1080px; margin: 0; }
  }
</style>
</head>
<body>
<main id="deck">
${slides}
</main>
<script>
  // Each slide is a fixed 1920x1080 canvas scaled to the window, so one file
  // reads on screen and prints to PDF at the same proportions.
  function fit() {
    const pad = 48;
    const scale = Math.min(1, (window.innerWidth - pad) / 1920);
    for (const s of document.querySelectorAll('#deck > section')) {
      s.style.transform = 'scale(' + scale + ')';
      let frame = s.parentElement;
      if (!frame || !frame.classList.contains('frame')) {
        frame = document.createElement('div');
        frame.className = 'frame';
        s.replaceWith(frame);
        frame.appendChild(s);
      }
      frame.style.width = 1920 * scale + 'px';
      frame.style.height = 1080 * scale + 'px';
    }
  }
  fit();
  window.addEventListener('resize', fit);
</script>
</body>
</html>
`;

writeFileSync(join(here, "index.html"), page, "utf8");
console.log(`wrote deck/index.html — ${index.order.length} slides`);
