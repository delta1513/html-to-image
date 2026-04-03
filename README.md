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

### Embed in Markdown

```markdown
![My Image](http://localhost:3000/image?text=Hello+World)
![Green Banner](http://localhost:3000/image?text=Status:+OK&bg=%23059669&width=600&height=200)
```

## Fonts

The service loads `fonts/Roboto-Regular.ttf` at startup. To use a different font, replace that file with any `.ttf` font and update the font name in `index.js`.
