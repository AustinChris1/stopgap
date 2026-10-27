# Deck

Twelve slides for the Open Agent Hackathon 2026 submission.

- **`Stopgap-deck.pdf`** — the file to upload. Twelve pages at 1920 by 1080.
- **`index.html`** — the same deck in a browser. Open it directly; no server needed.
- **`slides/*.html`** — one file per slide, in the order `deck.json` lists.
- **`img/`** — the two product shots the deck uses.

## Rebuilding

```bash
node deck/build.mjs
```

That reads `deck.json` and the slide files and writes `index.html`. It fails loudly if the
index lists a slide with no file.

To refresh the PDF, open `index.html` and print to PDF at 1920 by 1080 with margins off, or:

```bash
"<path to Chrome or Edge>" --headless=new --no-pdf-header-footer \
  --print-to-pdf=deck/Stopgap-deck.pdf file:///<absolute path>/deck/index.html
```

Speaker notes live in an `<aside>` at the end of each slide file. They are hidden on the page
and in the PDF, so they are there to read while rehearsing, not to present.
