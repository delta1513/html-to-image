const express = require("express");
const satori = require("satori").default;
const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
const path = require("path");
const { htmlToSatori } = require("./html-to-satori");
const nunjucks = require("nunjucks");

const app = express();
const PORT = process.env.PORT || 3000;

const robotoRegular = fs.readFileSync(
  path.join(__dirname, "fonts", "Roboto-Regular.ttf")
);
const robotoBold = fs.readFileSync(
  path.join(__dirname, "fonts", "Roboto-Bold.ttf")
);

// In-memory cache for fetched emoji SVGs
const emojiCache = new Map();

async function loadEmoji(code) {
  // Convert emoji to its Twemoji filename (hyphen-separated codepoints, no fe0f)
  const codepoints = [...code]
    .map((c) => c.codePointAt(0).toString(16))
    .filter((c) => c !== "fe0f")
    .join("-");

  if (emojiCache.has(codepoints)) return emojiCache.get(codepoints);

  const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints}.svg`;
  const res = await fetch(url);
  if (!res.ok) return undefined;
  const svg = await res.text();
  const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  emojiCache.set(codepoints, dataUri);
  return dataUri;
}

const satoriConfig = () => ({
  fonts: [
    { name: "Roboto", data: robotoRegular, weight: 400, style: "normal" },
    { name: "Roboto", data: robotoBold, weight: 700, style: "normal" },
  ],
  loadAdditionalAsset: async (languageCode, segment) => {
    if (languageCode === "emoji") {
      return loadEmoji(segment);
    }
  },
});

function renderPng(svg, width) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
  });
  return resvg.render().asPng();
}

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
    const pngBuffer = renderPng(svg, width);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(pngBuffer);
  } catch (err) {
    console.error("Render failed:", err);
    res.status(500).json({ error: "Render failed", details: err.message });
  }
});

// Fetch a Nunjucks template from a URL, render with query params, then convert to PNG
app.get("/template", async (req, res) => {
  const { template, width: w = "800", height: h = "400", scale: s = "3", ...vars } = req.query;

  if (!template) {
    return res.status(400).json({ error: "Missing required 'template' query parameter" });
  }

  const width = parseInt(w, 10);
  const height = parseInt(h, 10);
  const scale = Math.min(Math.max(parseInt(s, 10) || 3, 1), 5);

  try {
    const response = await fetch(template);
    if (!response.ok) {
      return res.status(502).json({ error: `Failed to fetch template: ${response.status}` });
    }
    const templateStr = await response.text();
    const html = nunjucks.renderString(templateStr, vars);
    const element = htmlToSatori(html);

    element.props.style.fontFamily = element.props.style.fontFamily || "Roboto";

    const svg = await satori(element, { width: width * scale, height: height * scale, ...satoriConfig() });
    const pngBuffer = renderPng(svg, width);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(pngBuffer);
  } catch (err) {
    console.error("Template render failed:", err);
    res.status(500).json({ error: "Template render failed", details: err.message });
  }
});

// Local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
