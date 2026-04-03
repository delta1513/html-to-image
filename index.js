const express = require("express");
const satori = require("satori").default;
const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
const path = require("path");
const { htmlToSatori } = require("./html-to-satori");

const app = express();
const PORT = process.env.PORT || 3000;

const robotoRegular = fs.readFileSync(
  path.join(__dirname, "fonts", "Roboto-Regular.ttf")
);
const robotoBold = fs.readFileSync(
  path.join(__dirname, "fonts", "Roboto-Bold.ttf")
);

const satoriConfig = () => ({
  fonts: [
    { name: "Roboto", data: robotoRegular, weight: 400, style: "normal" },
    { name: "Roboto", data: robotoBold, weight: 700, style: "normal" },
  ],
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

// Local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
