import { describe, it, expect } from "vitest";
import { htmlToSatori } from "./html-to-satori.js";

// Helper: get the root wrapper's props
function root(html) {
  return htmlToSatori(html);
}

// Helper: get the children of the root wrapper (unwrap single child)
function children(html) {
  const r = root(html);
  return r.props.children;
}

describe("htmlToSatori", () => {
  // ── Root wrapper ──────────────────────────────────────────────────────
  describe("root wrapper element", () => {
    it("always wraps output in a div with flex column layout at 100% size", () => {
      const result = root("<p>Hello</p>");
      expect(result.type).toBe("div");
      expect(result.props.style).toEqual({
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      });
    });

    it("returns root wrapper even for empty HTML", () => {
      const result = root("");
      expect(result.type).toBe("div");
      expect(result.props.style).toEqual({
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      });
    });
  });

  // ── Basic text content ────────────────────────────────────────────────
  describe("basic text content", () => {
    it("renders plain text inside a block element", () => {
      const result = children("<p>Hello World</p>");
      expect(result).toEqual({
        type: "div",
        props: {
          style: {
            marginTop: "8px",
            marginBottom: "8px",
            display: "flex",
            flexDirection: "column",
          },
          children: "Hello World",
        },
      });
    });

    it("renders multiple text nodes across siblings", () => {
      const result = children("<p>One</p><p>Two</p>");
      expect(result).toHaveLength(2);
      expect(result[0].props.children).toBe("One");
      expect(result[1].props.children).toBe("Two");
    });

    it("renders bare text content (no wrapping tag)", () => {
      const result = children("Just text");
      expect(result).toBe("Just text");
    });
  });

  // ── Inline style parsing ──────────────────────────────────────────────
  describe("inline style parsing", () => {
    it("parses a single inline style property", () => {
      const result = children('<div style="color: red">Hi</div>');
      expect(result.props.style.color).toBe("red");
    });

    it("parses multiple inline style properties", () => {
      const result = children(
        '<div style="color: red; font-size: 20px; background-color: blue">Hi</div>'
      );
      expect(result.props.style.color).toBe("red");
      expect(result.props.style.fontSize).toBe("20px");
      expect(result.props.style.backgroundColor).toBe("blue");
    });

    it("converts kebab-case CSS properties to camelCase", () => {
      const result = children(
        '<div style="margin-top: 10px; padding-left: 5px; border-radius: 4px">Hi</div>'
      );
      expect(result.props.style.marginTop).toBe("10px");
      expect(result.props.style.paddingLeft).toBe("5px");
      expect(result.props.style.borderRadius).toBe("4px");
    });

    it("ignores empty or malformed declarations gracefully", () => {
      const result = children('<div style="color: red;; ; ;">Hi</div>');
      expect(result.props.style.color).toBe("red");
    });
  });

  // ── <style> tag CSS extraction ────────────────────────────────────────
  describe("style tag CSS extraction", () => {
    it("applies element selector styles", () => {
      const html = "<style>p { color: green; }</style><p>Styled</p>";
      const result = children(html);
      expect(result.props.style.color).toBe("green");
    });

    it("applies .class selector styles", () => {
      const html =
        '<style>.highlight { background-color: yellow; }</style><div class="highlight">Hi</div>';
      const result = children(html);
      expect(result.props.style.backgroundColor).toBe("yellow");
    });

    it("applies #id selector styles", () => {
      const html =
        '<style>#main { font-size: 24px; }</style><div id="main">Hi</div>';
      const result = children(html);
      expect(result.props.style.fontSize).toBe("24px");
    });

    it("applies compound selector (tag.class)", () => {
      const html =
        '<style>div.box { padding: 10px; }</style><div class="box">Hi</div>';
      const result = children(html);
      expect(result.props.style.padding).toBe("10px");
    });

    it("compound selector does not match wrong tag", () => {
      const html =
        '<style>p.box { padding: 10px; }</style><div class="box">Hi</div>';
      const result = children(html);
      expect(result.props.style.padding).toBeUndefined();
    });

    it("applies compound selector (tag#id)", () => {
      const html =
        '<style>div#hero { margin: 20px; }</style><div id="hero">Hi</div>';
      const result = children(html);
      expect(result.props.style.margin).toBe("20px");
    });

    it("inline styles override <style> tag rules", () => {
      const html =
        '<style>p { color: green; }</style><p style="color: red">Styled</p>';
      const result = children(html);
      expect(result.props.style.color).toBe("red");
    });

    it("handles comma-separated selectors", () => {
      const html =
        "<style>h1, h2 { color: blue; }</style><h1>A</h1><h2>B</h2>";
      const result = children(html);
      expect(result[0].props.style.color).toBe("blue");
      expect(result[1].props.style.color).toBe("blue");
    });
  });

  // ── Default styles for semantic elements ──────────────────────────────
  describe("default styles for semantic elements", () => {
    it("applies default styles to h1", () => {
      const result = children("<h1>Title</h1>");
      expect(result.props.style.fontSize).toBe("32px");
      expect(result.props.style.fontWeight).toBe("700");
    });

    it("applies default styles to h2", () => {
      const result = children("<h2>Title</h2>");
      expect(result.props.style.fontSize).toBe("28px");
    });

    it("applies default styles to h3", () => {
      const result = children("<h3>Title</h3>");
      expect(result.props.style.fontSize).toBe("24px");
    });

    it("applies default styles to h4", () => {
      const result = children("<h4>Title</h4>");
      expect(result.props.style.fontSize).toBe("20px");
    });

    it("applies default styles to h5", () => {
      const result = children("<h5>Title</h5>");
      expect(result.props.style.fontSize).toBe("18px");
    });

    it("applies default styles to h6", () => {
      const result = children("<h6>Title</h6>");
      expect(result.props.style.fontSize).toBe("16px");
    });

    it("applies default styles to p", () => {
      const result = children("<p>Text</p>");
      expect(result.props.style.marginTop).toBe("8px");
      expect(result.props.style.marginBottom).toBe("8px");
    });

    it("applies default styles to strong", () => {
      const result = children("<strong>Bold</strong>");
      expect(result.props.style.fontWeight).toBe("700");
    });

    it("applies default styles to b", () => {
      const result = children("<b>Bold</b>");
      expect(result.props.style.fontWeight).toBe("700");
    });

    it("applies default styles to em", () => {
      const result = children("<em>Italic</em>");
      expect(result.props.style.fontStyle).toBe("italic");
    });

    it("applies default styles to i", () => {
      const result = children("<i>Italic</i>");
      expect(result.props.style.fontStyle).toBe("italic");
    });

    it("applies default styles to u", () => {
      const result = children("<u>Underline</u>");
      expect(result.props.style.textDecoration).toBe("underline");
    });

    it("applies default styles to small", () => {
      const result = children("<small>Small</small>");
      expect(result.props.style.fontSize).toBe("14px");
    });

    it("applies default styles to pre", () => {
      const result = children("<pre>Code</pre>");
      expect(result.props.style.fontFamily).toBe("monospace");
      expect(result.props.style.whiteSpace).toBe("pre-wrap");
    });

    it("applies default styles to code", () => {
      const result = children("<code>x = 1</code>");
      expect(result.props.style.fontFamily).toBe("monospace");
    });

    it("CSS style rules override default styles", () => {
      const html =
        '<style>h1 { font-size: 50px; }</style><h1>Big</h1>';
      const result = children(html);
      expect(result.props.style.fontSize).toBe("50px");
      // fontWeight still comes from defaults
      expect(result.props.style.fontWeight).toBe("700");
    });
  });

  // ── Inline vs block element mapping ───────────────────────────────────
  describe("element type mapping", () => {
    it("maps inline elements to span", () => {
      const inlineTags = ["span", "strong", "b", "em", "i", "u", "a", "small", "code"];
      for (const tag of inlineTags) {
        const result = children(`<${tag}>text</${tag}>`);
        expect(result.type).toBe("span");
      }
    });

    it("maps block elements to div", () => {
      const blockTags = ["div", "section", "article", "header", "footer", "main", "nav", "ul", "li"];
      for (const tag of blockTags) {
        const result = children(`<${tag}>text</${tag}>`);
        expect(result.type).toBe("div");
      }
    });

    it("block-level divs get display:flex and flexDirection:column by default", () => {
      const result = children("<div>Content</div>");
      expect(result.props.style.display).toBe("flex");
      expect(result.props.style.flexDirection).toBe("column");
    });

    it("inline elements (span) do not get display:flex", () => {
      const result = children("<span>Content</span>");
      expect(result.props.style.display).toBeUndefined();
    });
  });

  // ── Skipped elements ──────────────────────────────────────────────────
  describe("skipped elements", () => {
    it("skips script tags", () => {
      const result = children('<script>alert("hi")</script><p>Visible</p>');
      expect(result.props.children).toBe("Visible");
    });

    it("skips style tags from output tree (but still parses rules)", () => {
      const html = "<style>p { color: red; }</style><p>Styled</p>";
      const result = children(html);
      // Only the <p> should be in the tree, not the <style>
      expect(result.type).toBe("div");
      expect(result.props.style.color).toBe("red");
    });

    it("skips link tags", () => {
      const result = children('<link rel="stylesheet" href="x.css"><p>Hi</p>');
      expect(result.props.children).toBe("Hi");
    });

    it("skips meta tags", () => {
      const result = children('<meta charset="utf-8"><p>Hi</p>');
      expect(result.props.children).toBe("Hi");
    });

    it("skips noscript tags", () => {
      const result = children("<noscript>Fallback</noscript><p>Hi</p>");
      expect(result.props.children).toBe("Hi");
    });
  });

  // ── <img> handling ────────────────────────────────────────────────────
  describe("img tag handling", () => {
    it("converts img with src to img element", () => {
      const result = children('<img src="photo.png">');
      expect(result.type).toBe("img");
      expect(result.props.src).toBe("photo.png");
    });

    it("converts width and height attributes to style with px", () => {
      const result = children('<img src="photo.png" width="200" height="100">');
      expect(result.props.style.width).toBe("200px");
      expect(result.props.style.height).toBe("100px");
    });

    it("preserves px suffix if already present in attributes", () => {
      const result = children('<img src="photo.png" width="200px" height="100px">');
      expect(result.props.style.width).toBe("200px");
      expect(result.props.style.height).toBe("100px");
    });

    it("returns null for img without src (skipped from tree)", () => {
      const result = children('<img width="200">');
      // No src means img is skipped; root children should be empty array
      expect(result).toEqual([]);
    });

    it("applies inline styles to img", () => {
      const result = children('<img src="x.png" style="border-radius: 8px">');
      expect(result.props.style.borderRadius).toBe("8px");
    });
  });

  // ── Nested HTML structures ────────────────────────────────────────────
  describe("nested HTML structures", () => {
    it("handles nested divs", () => {
      const result = children("<div><div>Inner</div></div>");
      expect(result.type).toBe("div");
      expect(result.props.children.type).toBe("div");
      expect(result.props.children.props.children).toBe("Inner");
    });

    it("handles mixed inline and block nesting", () => {
      const result = children("<p>Hello <strong>World</strong></p>");
      const kids = result.props.children;
      expect(kids).toHaveLength(2);
      expect(kids[0]).toBe("Hello ");
      expect(kids[1].type).toBe("span");
      expect(kids[1].props.children).toBe("World");
    });

    it("handles deeply nested structure", () => {
      const html = "<div><section><article><p>Deep</p></article></section></div>";
      const result = children(html);
      // div > section(div) > article(div) > p(div)
      const p = result.props.children.props.children.props.children;
      expect(p.type).toBe("div");
      expect(p.props.children).toBe("Deep");
    });
  });

  // ── <body> extraction ─────────────────────────────────────────────────
  describe("body extraction from full HTML documents", () => {
    it("extracts body content from a full HTML document", () => {
      const html = `
        <html>
          <head><title>Test</title></head>
          <body><p>Body content</p></body>
        </html>
      `;
      const result = children(html);
      expect(result.type).toBe("div");
      expect(result.props.children).toBe("Body content");
    });

    it("ignores head/title elements and only processes body", () => {
      const html = `
        <html>
          <head><title>Skip me</title><meta charset="utf-8"></head>
          <body><div>Only this</div></body>
        </html>
      `;
      const result = children(html);
      expect(result.type).toBe("div");
      expect(result.props.children).toBe("Only this");
    });

    it("applies style rules from head even when extracting body", () => {
      const html = `
        <html>
          <head><style>p { color: purple; }</style></head>
          <body><p>Styled</p></body>
        </html>
      `;
      const result = children(html);
      expect(result.props.style.color).toBe("purple");
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles empty HTML string", () => {
      const result = root("");
      expect(result.type).toBe("div");
      // Empty input produces an empty children array
      expect(result.props.children).toEqual([]);
    });

    it("handles whitespace-only HTML", () => {
      const result = root("   \n\t  ");
      // whitespace-only text nodes are filtered out, leaving empty array
      expect(result.props.children).toEqual([]);
    });

    it("filters out whitespace-only text nodes between elements", () => {
      const html = "<p>A</p>   \n   <p>B</p>";
      const result = children(html);
      expect(result).toHaveLength(2);
      expect(result[0].props.children).toBe("A");
      expect(result[1].props.children).toBe("B");
    });

    it("handles element with no children", () => {
      const result = children("<div></div>");
      expect(result.type).toBe("div");
      expect(result.props.children).toBeUndefined();
    });

    it("handles element with missing attributes gracefully", () => {
      const result = children("<div>Text</div>");
      // No style attribute, no class, no id -- should still work
      expect(result.type).toBe("div");
      expect(result.props.children).toBe("Text");
    });

    it("single child is unwrapped from array", () => {
      const result = children("<div><p>Only child</p></div>");
      // Single child should not be in an array
      expect(result.props.children.type).toBe("div");
      expect(result.props.children.props.children).toBe("Only child");
    });

    it("multiple children remain as array", () => {
      const result = children("<div><p>A</p><p>B</p></div>");
      expect(Array.isArray(result.props.children)).toBe(true);
      expect(result.props.children).toHaveLength(2);
    });
  });
});
