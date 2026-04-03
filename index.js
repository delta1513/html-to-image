const express = require("express");
const satori = require("satori").default;
const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const robotoFont = fs.readFileSync(
  path.join(__dirname, "fonts", "Roboto-Regular.ttf")
);

app.get("/image", async (req, res) => {
  const {
    text = "Hello World",
    width: w = "800",
    height: h = "400",
    bg = "#1e293b",
    color = "#f8fafc",
    fontSize: fs = "48",
  } = req.query;

  const width = parseInt(w, 10);
  const height = parseInt(h, 10);

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
        fontSize: `${fs}px`,
        fontFamily: "Roboto",
        padding: "40px",
        textAlign: "center",
        wordBreak: "break-word",
      },
      children: text,
    },
  };

  try {
    const svg = await satori(element, {
      width,
      height,
      fonts: [
        {
          name: "Roboto",
          data: robotoFont,
          weight: 400,
          style: "normal",
        },
      ],
    });

    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: width },
    });
    const pngBuffer = resvg.render().asPng();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(pngBuffer);
  } catch (err) {
    console.error("Image generation failed:", err);
    res.status(500).json({ error: "Image generation failed" });
  }
});

// Local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
