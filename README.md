# UMKM Landing

A reusable, lightweight landing-page template for Indonesian small businesses (UMKM), with a visual editor.
One template, one config file per client, static output you can host anywhere.

- **Zero dependencies.** Plain HTML, CSS and JavaScript. Node.js is only used for the local editor and the build script.
- **One config per client.** All text, colours, fonts, products, prices, images, WhatsApp details and section visibility live in `clients/<client>/config.json`.
- **Visual editor.** Edit in a form or click text and images directly in the live preview, then save and build.
- **Static output.** `dist/<client>/` is a single `index.html` (CSS and JS inlined) plus `fonts/` and `images/`, and a ready-to-upload `.zip`.
- **Three complete demos** showing the same template in different industries.

| Demo | Industry | Shows off |
| --- | --- | --- |
| `kopi-lentera` | Coffee shop and bakery | Split hero, product cards with category filter, gallery, all 10 sections |
| `garis-rapi` | Barbershop | Dark theme, full-bleed hero, price-list layout, gallery hidden |
| `seruni-skin` | Skincare (online only) | Centred hero, serif type, location and gallery hidden, marketplace links |

All demo names, prices, numbers, addresses and reviews are fictional and labelled as such on the page.
The demo WhatsApp number (`620000000000`) is deliberately invalid so nobody real gets messaged.

Screenshots: [`docs/`](docs/) · Panduan operator (Bahasa Indonesia): [`PANDUAN.md`](PANDUAN.md)

---

## Quick start

Requires [Node.js](https://nodejs.org) 18 or newer. There is nothing to install.

```bash
npm start
```

Then open <http://localhost:4173/editor/>.

Double-click alternatives: `Mulai Editor.bat` (Windows) or `mulai-editor.command` (macOS/Linux).

| Command | What it does |
| --- | --- |
| `npm start` | Local editor, live preview and save API on port 4173 (`PORT=5000 npm start` to change) |
| `npm run build` | Build every client into `dist/` (`npm run build -- kopi-lentera` for one) |
| `npm run new -- "Nama Usaha"` | Create a new client by copying a demo (`--from garis-rapi` to pick the source) |
| `npm test` | Fast checks without a browser: renderer, WhatsApp links, escaping, build |
| `npm run qa` | Full browser test of page and editor (needs Playwright, optional) |
| `npm run perf` | Throttled mobile load measurement of the built sites (needs Playwright, optional) |
| `npm run art` | Regenerate the demo illustrations |

URLs while the server runs:

- Editor: `http://localhost:4173/editor/?client=<client>`
- Saved preview: `http://localhost:4173/preview/<client>/`
- Built site: `http://localhost:4173/dist/<client>/`

---

## Creating a site for a new client

1. **Duplicate.** In the editor click **+ Klien baru**, type the business name and choose the demo closest to their industry.
   (Or run `npm run new -- "Toko Bunga Melati" --from seruni-skin`.) This creates `clients/toko-bunga-melati/`.
2. **Identity.** In *Identitas & SEO* set the name, tagline, page title and description. Clear the **DEMO bar** text and switch off *Sembunyikan dari mesin pencari*.
3. **Look.** In *Warna & font* pick a palette or set the four colours, a font style and corner style.
4. **WhatsApp.** In *WhatsApp & pengumuman* enter the client's number (`0812…`, `62812…` and `+62 812…` all work) and the pre-filled messages.
5. **Sections.** In *Susunan bagian* switch off what the business does not need and reorder the rest.
6. **Content.** Open each section and replace the text, products, prices, FAQ and testimonials. Click any image to replace it.
   Photos are resized and converted to WebP in the browser before upload.
7. **Save** (`Ctrl/Cmd + S`), then **Buat situs**. The dialog shows the page weight, any warnings and a link to download the `.zip`.
8. **Publish.** Upload the contents of `dist/<client>/` to any static host: cPanel (upload the zip and extract), Netlify, Vercel, Cloudflare Pages or GitHub Pages. No database or server is needed.

Before handing over, check the warnings from the build: an invalid WhatsApp number, a DEMO bar that is still on, an empty site URL, or oversized images.

---

## What can be edited

Everything below is editable in the editor with no code. The same keys exist in `config.json` if you prefer a text editor.

| Area | Editable |
| --- | --- |
| Identity and SEO | Business name, tagline, logo, page title, meta description, site URL, share image, noindex, Google Analytics 4 ID, Meta Pixel ID, business type for structured data |
| Theme | 8 palettes or 4 free colours (derived shades and readable text colours are computed), 6 font styles, 3 corner styles |
| WhatsApp | Number, default message, per-product message with `{produk}` and `{harga}`, floating button and its label |
| Buttons | Label and destination of every button: WhatsApp (default or custom message), phone, email, Google Maps, scroll to a section, or any URL |
| Sections | Show or hide and reorder all 10 sections; the navigation updates itself |
| Hero | 3 layouts (split, centred, full-bleed photo), image shape, texts, two buttons, rating line, two floating info cards, circular sticker |
| Trust | Up to 4 figures with captions and a footnote |
| About | Story, selling points, two images, round badge, owner name and role, button |
| Products | Unlimited items: name, price, strike-through price, unit, description, photo, category, badge; card or price-list layout; category filter; order-button label |
| Benefits | Unlimited items with a choice of 38 icons |
| Gallery | Unlimited photos with captions, lightbox, button |
| Testimonials | Unlimited reviews with stars, rating summary, footnote |
| FAQ | Unlimited questions, help box with button |
| Location | Address, opening hours, click-to-load Google Map, directions and phone buttons |
| Contact | Channels (WhatsApp, phone, email, Instagram, TikTok, Facebook, YouTube, Shopee, Tokopedia, website and others), quick-order form that opens WhatsApp |
| Footer | Description, copyright line, extra links, "made by" credit for your studio |
| Announcement | Promo bar text and link; DEMO bar text |

Wrap a word in asterisks, for example `Kopi enak, *tiap pagi.*`, to give it the accent treatment in headings.

## What cannot be edited yet

These need code changes or are simply not built:

- **The design of a section.** Layout, spacing and the set of sections are fixed in `template/`. You can pick between the provided variants, but not draw a new layout in the editor.
- **New fonts or icons.** Adding one means adding a file to `template/fonts/` or a path to `ICONS` in `template/render.js`.
- **More than one page.** It is a single landing page. No blog, product detail pages or multiple languages on one site.
- **Checkout, cart, payment, stock.** Orders go to WhatsApp or marketplace links. There is no backend.
- **Form submissions by email or to a spreadsheet.** The quick form only opens WhatsApp with a pre-filled message.
- **Client self-service online.** The editor runs on your computer. There is no hosted, login-protected editor for clients.
- **Cropping images.** Photos are resized and compressed but cropped by CSS around the centre; choose photos with the subject in the middle.
- **Responsive image variants.** One file per image (max 1600 px), no `srcset`.
- **Image cleanup.** Replaced images stay in `clients/<client>/images/`. Only referenced files are copied to `dist/`, so the published site stays lean.

---

## Project structure

```
umkm-landing/
├── clients/                  one folder per client
│   └── kopi-lentera/
│       ├── config.json       ALL content and settings for this client
│       └── images/           this client's images
├── template/                 shared by every client
│   ├── render.js             config -> HTML. Section components live here
│   ├── styles.css            all styling, themed through CSS variables
│   ├── site.js               small runtime: menu, filter, lightbox, map, form
│   ├── preview.html          live-preview shell used by the editor
│   └── fonts/                self-hosted fonts (SIL Open Font License)
├── editor/                   visual editor
│   ├── schema.js             the form definition: one line per editable field
│   └── editor.js / .css / index.html
├── scripts/
│   ├── dev.js                local server: editor, preview, save API
│   ├── build.js              static build and zip
│   ├── lib.js                shared helpers (read/write config, build, zip)
│   ├── new-client.js         duplicate a client from the command line
│   ├── make-demo-art.js      generates the demo illustrations
│   └── test.js, qa.js, perf.js
└── dist/                     build output (generated, safe to delete)
```

### How it fits together

`template/render.js` is one pure function, `config -> HTML`, that runs in three places: the Node build, the Node preview route, and the browser editor. That is why the preview always matches the built site.

Each section is a small function in `render.js` (`R.hero`, `R.products`, …). Text nodes are emitted through `T(c, tag, class, 'path.in.config')`, which also makes them click-to-edit in the preview.

Theme colours are derived in `themeVars()`: from four input colours it computes surfaces, borders, hover states and text colours that keep sufficient contrast, including for dark backgrounds.

### Adding an editable field

1. Use the value in `template/render.js`, for example `T(c, 'p', 'hero-extra', 'hero.extra')`.
2. Add one line to `editor/schema.js`: `{ k: 'hero.extra', t: 'text', l: 'Teks tambahan' }`.
3. Style it in `template/styles.css` if needed.

Field types: `text`, `area`, `color`, `select`, `toggle`, `image`, `cta`, `dest`, `icon`, `list`, `strings`.

### Adding a section

Add an entry to `SECTIONS` and a renderer `R.<name>` in `render.js`, styles in `styles.css`, a group in `schema.js`, and the section id to the `sections` array of each client that should show it.

---

## Performance

Measured with `npm run perf` on the built demos (360 px screen, CPU slowed 4×, 1.6 Mbps with 150 ms latency, served locally with gzip):

| Demo | First paint | Largest paint | Layout shift | Blocking time | First load | Whole page |
| --- | --- | --- | --- | --- | --- | --- |
| kopi-lentera | 0.54 s | 0.86 s | 0.000 | 176 ms | 132 KB | 151 KB |
| garis-rapi | 0.50 s | 0.50 s | 0.000 | 117 ms | 87 KB | 90 KB |
| seruni-skin | 0.50 s | 0.64 s | 0.000 | 146 ms | 91 KB | 97 KB |

These are lab numbers from a local server, so real hosting adds network time. They are useful for comparing before and after a change. The demos use vector illustrations, which are much smaller than photographs.

What keeps it light: no framework, no third-party requests, CSS and JS inlined (about 19 KB gzipped HTML in total), only the fonts the theme uses, lazy-loaded images with fixed dimensions, and a map that loads only when the visitor asks for it.

**The main bottleneck on real client sites will be photos.** A typical compressed photo is 100–300 KB and a page with 15 of them can reach 2–3 MB. The hero image loads first and matters most. The build warns about any image over 350 KB. The second-largest cost is fonts (67–107 KB); the *Sistem* font style ships none.

## Accessibility and SEO

Semantic landmarks, one `h1`, a skip link, visible focus styles, labelled buttons, `alt` text on images, native `details` for the FAQ and `dialog` for the lightbox, reduced-motion support, and tap targets of at least 40 px. Title, description, canonical URL, Open Graph tags, `LocalBusiness` structured data, and `robots.txt` plus `sitemap.xml` when a site URL is set.

## Notes

- **The editor server is for your own computer.** It binds to `127.0.0.1`, writes files into `clients/`, and has no login. Do not expose it to the internet.
- **Demo images** are original SVG illustrations generated by `scripts/make-demo-art.js`, so they are free to reuse. Replace them with real photos for real clients.
- **Fonts** (Plus Jakarta Sans, Fraunces, Bricolage Grotesque, Instrument Serif, Outfit) are under the SIL Open Font License 1.1, which allows commercial use and redistribution.
- **Opening `dist/<client>/index.html` straight from disk works**, but the browser console shows font-preload warnings that disappear once the site is served over http(s).
- Keep honest content: only real reviews with permission, and only numbers the business can back up.
