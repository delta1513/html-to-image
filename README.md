# html-to-image

A standalone Node.js web service that dynamically generates PNG images from URL query parameters. Built with [Satori](https://github.com/vercel/satori) and [@resvg/resvg-js](https://github.com/yisibl/resvg-js) — no headless browser required.

## Setup

```bash
npm install
npm start
```

The server starts on `http://localhost:3000` (override with `PORT` env var).

## API

### `GET /image`

| Parameter  | Default     | Description                |
|------------|-------------|----------------------------|
| `text`     | Hello World | Text to render             |
| `width`    | 800         | Image width in pixels      |
| `height`   | 400         | Image height in pixels     |
| `bg`       | #1e293b     | Background color           |
| `color`    | #f8fafc     | Text color                 |
| `fontSize` | 48          | Font size in pixels        |

### Examples

```
http://localhost:3000/image?text=Hello+World
http://localhost:3000/image?text=Custom+Title&bg=%23059669&fontSize=64
```

### `GET /render`

Fetches HTML from a URL and renders it as a PNG image.

| Parameter | Default | Description           |
|-----------|---------|-----------------------|
| `url`     | —       | **(required)** URL to fetch HTML from |
| `width`   | 800     | Image width in pixels |
| `height`  | 400     | Image height in pixels |

```
http://localhost:3000/render?url=https://example.com/card.html&width=600&height=300
```

#### HTML requirements and constraints

The `/render` endpoint converts HTML into a Satori element tree before rendering to PNG. Satori only supports a small set of element types (`div`, `span`, `img`, `svg`), so the converter maps your HTML accordingly.

**Element mapping**

| Your HTML | Rendered as | Notes |
|-----------|-------------|-------|
| Block elements (`div`, `section`, `article`, `main`, `header`, `footer`, `nav`, `h1`-`h6`, `p`, `ul`, `ol`, `li`, `pre`, `blockquote`, etc.) | `div` | Automatically gets `display: flex; flex-direction: column` unless you set `display` yourself |
| Inline elements (`span`, `strong`, `b`, `em`, `i`, `u`, `a`, `small`, `code`, `sub`, `sup`) | `span` | |
| `img` | `img` | Requires `src`; `width`/`height` attributes are preserved |

**Skipped elements** -- these are silently ignored:

`script`, `style`, `link`, `meta`, `head`, `title`, `noscript`

**CSS support**

- **Inline styles** -- fully supported via the `style` attribute.
- **`<style>` tags** -- supported with simple selectors:
  - Element selectors: `p { ... }`
  - Class selectors: `.card { ... }`
  - ID selectors: `#header { ... }`
  - Compound selectors: `div.card#main { ... }`
  - Grouped selectors: `h1, h2, h3 { ... }`
- Inline styles always override `<style>` rules.

**Default styles on semantic elements**

The converter applies sensible defaults so semantic HTML looks reasonable without extra CSS:

| Element | Defaults |
|---------|----------|
| `h1`-`h6` | Bold, font sizes from 32px down to 16px, vertical margins |
| `p` | 8px top/bottom margin |
| `strong`, `b` | `font-weight: 700` |
| `em`, `i` | `font-style: italic` |
| `u` | `text-decoration: underline` |
| `small` | `font-size: 14px` |
| `pre` | `font-family: monospace; white-space: pre-wrap` |
| `code` | `font-family: monospace` |

Your CSS overrides these defaults.

**What does NOT work**

- External stylesheets (`<link rel="stylesheet">` is ignored)
- Descendant selectors (`div p`, `.card > h1`)
- Pseudo-classes and pseudo-elements (`:hover`, `::before`)
- Media queries
- JavaScript (all `<script>` tags are stripped)
- CSS variables, `calc()`, animations, transitions
- `<table>` renders as a flex div -- use flexbox instead

**Tips for good results**

- Use **inline styles** or simple **`<style>` selectors** (element, class, or ID).
- Use **flexbox** for all layout -- every `div` already defaults to `display: flex; flex-direction: column`.
- Set explicit `width` and `height` on images.
- Keep markup simple -- the closer your HTML is to Satori's native `div`/`span`/`img` model, the better it renders.
- Test with the [Satori Playground](https://og-playground.vercel.app/) to debug layout issues.

### Embed in Markdown

```markdown
![My Image](http://localhost:3000/image?text=Hello+World)
![Green Banner](http://localhost:3000/image?text=Status:+OK&bg=%23059669&width=600&height=200)
![From URL](http://localhost:3000/render?url=https://example.com/card.html&width=600&height=300)
```

## Fonts

The service loads `fonts/Roboto-Regular.ttf` at startup. To use a different font, replace that file with any `.ttf` font and update the font name in `index.js`.
