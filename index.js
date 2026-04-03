const express = require("express");
const satori = require("satori").default;
const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
const path = require("path");
const { htmlToSatori } = require("./html-to-satori");

const app = express();
const PORT = process.env.PORT || 3000;

const robotoFont = fs.readFileSync(
  path.join(__dirname, "fonts", "Roboto-Regular.ttf")
);

const satoriConfig = () => ({
  fonts: [
    {
      name: "Roboto",
      data: robotoFont,
      weight: 400,
      style: "normal",
    },
  ],
});

function renderPng(svg, width) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
  });
  return resvg.render().asPng();
}

// Render text as an image
app.get("/image", async (req, res) => {
  const {
    text = "Hello World",
    width: w = "800",
    height: h = "400",
    bg = "#1e293b",
    color = "#f8fafc",
    fontSize: fs = "48",
    scale: s = "3",
  } = req.query;

  const width = parseInt(w, 10);
  const height = parseInt(h, 10);
  const scale = Math.min(Math.max(parseInt(s, 10) || 3, 1), 5);

  const element = {
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: bg,
        color,
        fontSize: `${fs * scale}px`,
        fontFamily: "Roboto",
        padding: `${40 * scale}px`,
        textAlign: "center",
        wordBreak: "break-word",
      },
      children: text,
    },
  };

  try {
    const svg = await satori(element, { width: width * scale, height: height * scale, ...satoriConfig() });
    const pngBuffer = renderPng(svg, width * scale);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(pngBuffer);
  } catch (err) {
    console.error("Image generation failed:", err);
    res.status(500).json({ error: "Image generation failed" });
  }
});

// Fetch a URL and render its HTML as an image
app.get("/render", async (req, res) => {
  const { url, width: w = "800", height: h = "400", scale: s = "3" } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing required 'url' query parameter" });
  }

  const width = parseInt(w, 10);
  const height = parseInt(h, 10);
  const scale = Math.min(Math.max(parseInt(s, 10) || 3, 1), 5);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: `Failed to fetch URL: ${response.status}` });
    }
    const html = await response.text();
    const element = htmlToSatori(html);

    // Inject Roboto as the default font family on the root element
    element.props.style.fontFamily = element.props.style.fontFamily || "Roboto";

    const svg = await satori(element, { width: width * scale, height: height * scale, ...satoriConfig() });
    const pngBuffer = renderPng(svg, width * scale);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(pngBuffer);
  } catch (err) {
    console.error("Render failed:", err);
    res.status(500).json({ error: "Render failed", details: err.message });
  }
});

// Local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
