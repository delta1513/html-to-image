# html-to-image

A standalone Node.js web service that dynamically generates PNG images from URL query parameters. Built with [Satori](https://github.com/vercel/satori) and [@resvg/resvg-js](https://github.com/yisibl/resvg-js) — no headless browser required.

## Setup

```bash
npm install
npm start
```

The server starts on `http://localhost:3000` (override with `PORT` env var).

## API

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
![From URL](http://localhost:3000/render?url=https://example.com/card.html&width=600&height=300)
```

---

### `GET /template`

Fetches a [Nunjucks](https://mozilla.github.io/nunjucks/) (`.njk`) template from a URL, renders it to HTML using the remaining query parameters as template variables, then converts the result to a PNG via the same pipeline as `/render`.

| Parameter  | Default | Description |
|------------|---------|-------------|
| `template` | —       | **(required)** URL to a `.njk` template file |
| `width`    | 800     | Image width in pixels |
| `height`   | 400     | Image height in pixels |
| `scale`    | 3       | Pixel-density multiplier (1–5) |
| *(any other param)* | — | Passed as a template variable |

```
http://localhost:3000/template?template=https://example.com/card.njk&name=Alice&score=42&width=600&height=300
```

#### Template syntax

Templates are rendered with full Nunjucks / Jinja2 syntax:

- Variable interpolation: `{{ variable }}`
- Conditionals: `{% if condition %}...{% endif %}`
- Loops: `{% for item in list %}...{% endfor %}`
- Filters: `{{ name | upper }}`, `{{ score | default(0) }}`

All HTML requirements and constraints from `/render` apply to the rendered output (element mapping, CSS support, etc.).

#### Example template

```html
<!-- card.njk -->
<div style="font-family: Roboto; padding: 32px; background: #1e1e2e; color: #cdd6f4; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center;">
  <h1 style="margin: 0 0 8px; font-size: 28px; color: #cba6f7;">{{ title }}</h1>
  <p style="margin: 0 0 16px; font-size: 16px; color: #a6adc8;">{{ subtitle }}</p>
  {% if badge %}
  <span style="align-self: flex-start; background: #cba6f7; color: #1e1e2e; padding: 4px 12px; border-radius: 99px; font-size: 13px; font-weight: 700;">
    {{ badge }}
  </span>
  {% endif %}
</div>
```

Rendered with:

```
http://localhost:3000/template?template=https://example.com/card.njk&title=Hello+World&subtitle=Generated+with+html-to-image&badge=NEW
```

#### Embed in Markdown

```markdown
![Card](http://localhost:3000/template?template=https://example.com/card.njk&title=Hello+World&subtitle=Generated+with+html-to-image&badge=NEW&width=600&height=300)
```

## Fonts

The service loads `fonts/Roboto-Regular.ttf` at startup. To use a different font, replace that file with any `.ttf` font and update the font name in `index.js`.

---

![](https://html-to-image-eta.vercel.app/template?template=https://gitlab.com/delta1512/deltadelta.dev/-/raw/main/badges/ai-transparency.njk&width=350&height=225&scale=4&c1=Code&l1=ai&c2=This+README&l2=ai&c3=This+Badge&l3=ai)
