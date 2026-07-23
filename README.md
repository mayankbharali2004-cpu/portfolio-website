# Mayank Bharali — Portfolio Website

A fully static portfolio site (plain HTML + CSS + JavaScript, no frameworks, no build step).
Design concept: **"the workbook"** — since the portfolio is built on Excel models, the site
borrows spreadsheet vernacular: formula-style section labels, cell-grid backgrounds, project
cards that highlight like selected cells, and a hero panel with a spinnable 3D
currency cube alongside live model figures.

---

## 1. File structure

```
Portfolio Website/
├── index.html        ← ALL page content lives here (edit text here)
├── css/
│   └── style.css     ← all styling; colors/fonts defined at the top
├── js/
│   └── main.js       ← all animations & interactions
├── data/
│   ├── Mayank_Bharali_Resume_...docx   ← resume (linked by the ↓ buttons)
│   └── projects/     ← downloadable model files (xlsx/pptx) for the project cards
├── assets/
│   └── img/          ← put your photo & project screenshots here
├── revenue-forecast-deck/   ← standalone HTML slide deck (its own mini site —
│                              own index.html/css/js, opened by "Open slideshow")
└── README.md         ← this file
```

There is no build step. Open `index.html` in a browser and it just works.

---

## 2. How the code works (quick tour)

### index.html
One page, top to bottom: **nav → hero → about → ticker → projects → skills →
experience → contact → footer**. Every section follows the same skeleton:

```html
<section class="section" id="projects">
  <div class="section__head reveal">
    <p class="formula">=SHEET("Projects")</p>   <!-- eyebrow label -->
    <h2 class="section__title">…</h2>
  </div>
  …content…
</section>
```

- The `id` is what the nav links point to (`href="#projects"`).
- The class `reveal` on any element makes it fade in when scrolled into view.
- Search the file for **`PLACEHOLDER`** to find every spot that still needs
  a real link, photo, or file.

### css/style.css
Organised into numbered blocks `[0]`–`[12]` with a table of contents at the top.
The most important block is **[0] Design tokens**: every color, font and spacing
value is a CSS variable there. Change `--green` once and the whole site follows.

### js/main.js
Five small, independent modules (numbered comments match):
1. **Rubik's cube** — builds the hero's 3D CSS cube (6 faces × 9 currency-symbol
   tiles) and handles drag-to-spin, idle auto-rotate, and arrow-key control. Tile
   colours and symbols are arrays at the top of the module; the cube's size is the
   `--cube` value in `style.css`.
2. **Count-up metrics** — any element with `data-count="22.6"` animates from 0.
3. **Scroll reveals** — an IntersectionObserver adds `.is-visible` to `.reveal`
   elements when they enter the viewport.
4. **Nav scroll-spy + mobile menu** — highlights the current section's link;
   hamburger toggle on mobile.
5. **Footer year** — auto-updates.
6. **Cursor trail ("data dust")** — tiny green cell-squares and mono glyphs
   (₹ % ▲ digits) trail the mouse on a canvas overlay. Sweeping the cursor
   back through the trail scatters it; clicking fires a small burst. All
   tuning knobs (density, lifetime, repel radius) live in the `CONFIG`
   object at the top of block `[6]` in `js/main.js`. Automatically disabled
   on touch devices and for reduced-motion users. To remove the effect
   entirely, delete the whole `[6]` block.

Accessibility is built in: if the visitor's OS has *reduce motion* enabled,
every animation is skipped and final values show instantly. The site also
works with JavaScript disabled.

---

## 3. Common edits (recipes)

### Change the colors
Open `css/style.css`, block `[0]`:
```css
--paper: #FAFAF6;   /* page background   */
--green: #0A6B3D;   /* primary accent    */
--ink:   #101613;   /* text              */
```

### Add a project
In `index.html`, find the `#projects` section, copy one whole
`<article class="card reveal"> … </article>` block, paste it below the last
one, and edit:
- `card__title` — project name
- `tag` — tools used
- `card__metrics` — 2–3 headline numbers (keep them short)
- `card__body` — bullet points
- `card__links` — buttons (see below)

**Remove a project:** delete its entire `<article>` block.

### Link a project button to its real file
The three modelling cards download the actual Excel/PowerPoint files, which
live in `data/projects/`. To point a button at a file:
1. Drop the file into `data/projects/`.
2. Set the button's `href` to `data/projects/your-file-name.xlsx`, with
   spaces percent-encoded as `%20` (and commas as `%2C` if the filename has
   any) — e.g. `data/projects/My%20Model.xlsx`.
3. Add the `download` attribute so the browser downloads it instead of
   trying to render it inline (browsers can't preview .xlsx/.pptx).

If you'd rather link to a Google Drive share or a hosted case-study page
instead of a downloadable file, just swap the `href` for that URL and drop
the `download` attribute.

### Add your photo
1. Save a square image (600×600px+) as `assets/img/profile.jpg`.
2. In `index.html`, find the `about__photo--placeholder` div and replace it with:
   ```html
   <img src="assets/img/profile.jpg" alt="Mayank Bharali" class="about__photo" />
   ```

### Update the hero metrics
The three numbers in the hero panel are driven by data attributes:
```html
<dd class="metric__value mono" data-count="22.6" data-decimals="1"
    data-prefix="₹" data-suffix="L+">₹0.0L+</dd>
```
Change `data-count` (and prefix/suffix) — the count-up animation adapts
automatically. The text inside the tag is only the no-JS fallback.

### Edit the ticker (scrolling interests strip)
In `index.html` find `<div class="ticker">`. The items appear **twice**
(that's what makes the loop seamless) — edit both copies identically.

### Add a nav link / section
1. Add a new `<section class="section" id="my-section">` in `<main>`.
2. Add `<a href="#my-section" class="nav__link">Label</a>` inside `nav__links`.
The scroll-spy picks it up automatically.

### Swap the resume
Drop the new file into `data/` and update the two links that point at it
(one in the nav, one in the contact section — search for `data/` in
`index.html`). A PDF is recommended over .docx so it opens in the browser.

### Update the HTML slideshow deck
The "Open slideshow" card links to `revenue-forecast-deck/index.html` — a
self-contained mini site with its own `index.html`, `css/`, `js/`, `slides/`
and `data/deck_data.json`. It's a separate app, not part of the main page:
- To update the numbers it shows, regenerate `revenue-forecast-deck/data/deck_data.json`
  from the source Excel model and drop it in (same filename).
- To edit a slide's content or styling, edit `revenue-forecast-deck/slides/slideN.html`
  / `.css` directly.
- It opens in a new tab (`target="_blank"` on the card's link) since it's a
  full-screen presentation with its own navigation.

### Change fonts
Fonts are loaded in `index.html`'s `<head>` (Google Fonts link) and mapped
in `style.css` block `[0]` (`--font-display`, `--font-body`, `--font-mono`).
Change both places together.

---

## 4. Deploying to Cloudflare Pages

The site is 100% static, so it's directly compatible — no configuration needed.

**Option A — drag & drop (fastest):**
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Upload assets**.
2. Drag the whole `Portfolio Website` folder in. Done — you get a `*.pages.dev` URL.

**Option B — Git (recommended, auto-deploys on every push):**
1. Push this folder to a GitHub repository.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repo. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
4. Deploy. Every future `git push` redeploys automatically.

You can later attach a custom domain (e.g. `mayankbharali.com`) under
**Pages → Custom domains**.

---

## 5. Placeholders checklist

Things to fill in before sharing the site (search `PLACEHOLDER` in `index.html`):

- [x] LinkedIn URL (contact section button)
- [x] Revenue forecast, cap table, and GTM plan files → `data/projects/`
- [x] HTML slideshow deck → `revenue-forecast-deck/`
- [ ] Profile photo → `assets/img/profile.jpg`
- [ ] PDF version of the resume (nicer than .docx in a browser)
