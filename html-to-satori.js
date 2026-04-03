const { parse } = require("node-html-parser");

// CSS property name to JS camelCase
function camelCase(prop) {
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// Parse an inline style string into a JS object
function parseInlineStyle(styleStr) {
  if (!styleStr) return {};
  const style = {};
  for (const decl of styleStr.split(";")) {
    const colon = decl.indexOf(":");
    if (colon === -1) continue;
    const prop = decl.slice(0, colon).trim();
    const value = decl.slice(colon + 1).trim();
    if (prop && value) {
      style[camelCase(prop)] = value;
    }
  }
  return style;
}

// Extract rules from <style> tags. Handles element, .class, and #id selectors.
function extractStyleRules(root) {
  const rules = [];
  for (const styleTag of root.querySelectorAll("style")) {
    const css = styleTag.textContent;
    // Simple regex-based CSS rule parser — good enough for basic stylesheets
    const rulePattern = /([^{}]+)\{([^{}]+)\}/g;
    let match;
    while ((match = rulePattern.exec(css)) !== null) {
      const selectorGroup = match[1].trim();
      const declarations = parseInlineStyle(match[2]);
      for (const selector of selectorGroup.split(",")) {
        rules.push({ selector: selector.trim(), style: declarations });
      }
    }
  }
  return rules;
}

// Check if a simple selector matches a node
function selectorMatches(selector, node) {
  if (!node.tagName) return false;
  const tag = node.tagName.toLowerCase();
  const classAttr = node.getAttribute?.("class") || "";
  const classList = classAttr ? classAttr.split(/\s+/) : [];
  const id = node.getAttribute?.("id") || "";

  // Parse compound selectors like "div.foo#bar"
  // Break into tag, classes, and id parts
  const idMatch = selector.match(/#([\w-]+)/);
  const classMatches = [...selector.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
  const tagMatch = selector.match(/^([\w-]+)/);

  if (idMatch && idMatch[1] !== id) return false;
  for (const cls of classMatches) {
    if (!classList.includes(cls)) return false;
  }
  if (tagMatch && tagMatch[1] !== tag) return false;
  // Selector has only classes/id with no tag — that's fine, we matched above
  return true;
}

// Compute style for a node by applying matching <style> rules then inline styles
function computeStyle(node, rules) {
  let style = {};
  for (const rule of rules) {
    if (selectorMatches(rule.selector, node)) {
      style = { ...style, ...rule.style };
    }
  }
  // Inline styles override
  const inline = parseInlineStyle(node.getAttribute?.("style") || "");
  return { ...style, ...inline };
}

// Default styles that make common HTML elements look right in Satori's flex world
const DEFAULT_STYLES = {
  h1: { fontSize: "32px", fontWeight: "700", marginTop: "16px", marginBottom: "16px" },
  h2: { fontSize: "28px", fontWeight: "700", marginTop: "14px", marginBottom: "14px" },
  h3: { fontSize: "24px", fontWeight: "700", marginTop: "12px", marginBottom: "12px" },
  h4: { fontSize: "20px", fontWeight: "700", marginTop: "10px", marginBottom: "10px" },
  h5: { fontSize: "18px", fontWeight: "700", marginTop: "8px", marginBottom: "8px" },
  h6: { fontSize: "16px", fontWeight: "700", marginTop: "6px", marginBottom: "6px" },
  p: { marginTop: "8px", marginBottom: "8px" },
  strong: { fontWeight: "700" },
  b: { fontWeight: "700" },
  em: { fontStyle: "italic" },
  i: { fontStyle: "italic" },
  u: { textDecoration: "underline" },
  small: { fontSize: "14px" },
  pre: { fontFamily: "monospace", whiteSpace: "pre-wrap" },
  code: { fontFamily: "monospace" },
};

// Elements that are inline-level (rendered as span)
const INLINE_ELEMENTS = new Set([
  "span", "strong", "b", "em", "i", "u", "a", "small", "code", "sub", "sup",
]);

// Elements to skip entirely
const SKIP_ELEMENTS = new Set([
  "script", "style", "link", "meta", "head", "title", "noscript",
]);

// Satori only supports a handful of element types
const SATORI_ELEMENTS = new Set(["div", "span", "img", "svg"]);

function convertNode(node, rules) {
  // Text node
  if (node.nodeType === 3) {
    const text = node.textContent;
    if (!text.trim()) return null;
    return text;
  }

  // Not an element node
  if (node.nodeType !== 1) return null;

  const tag = node.tagName?.toLowerCase();
  if (!tag || SKIP_ELEMENTS.has(tag)) return null;

  // Handle <img>
  if (tag === "img") {
    const src = node.getAttribute("src");
    if (!src) return null;
    const style = {
      ...computeStyle(node, rules),
    };
    // Preserve width/height attributes
    const w = node.getAttribute("width");
    const h = node.getAttribute("height");
    if (w) style.width = w.includes("px") ? w : `${w}px`;
    if (h) style.height = h.includes("px") ? h : `${h}px`;
    return { type: "img", props: { src, style } };
  }

  // Convert children
  const children = [];
  for (const child of node.childNodes) {
    const converted = convertNode(child, rules);
    if (converted !== null) children.push(converted);
  }

  const computedStyle = computeStyle(node, rules);
  const defaults = DEFAULT_STYLES[tag] || {};
  const style = { ...defaults, ...computedStyle };

  // Map HTML tag to Satori-compatible type
  let type;
  if (INLINE_ELEMENTS.has(tag)) {
    type = "span";
  } else {
    type = "div";
  }

  // Block-level elements default to flex column layout (Satori requires display:flex on divs)
  if (type === "div" && !style.display) {
    style.display = "flex";
    if (!style.flexDirection) style.flexDirection = "column";
  }

  const props = { style };
  if (children.length === 1) {
    props.children = children[0];
  } else if (children.length > 1) {
    props.children = children;
  }

  return { type, props };
}

/**
 * Convert an HTML string into a Satori-compatible element tree.
 */
function htmlToSatori(html) {
  const root = parse(html);
  const rules = extractStyleRules(root);

  // Find the <body> if present, otherwise use root
  const body = root.querySelector("body") || root;

  const children = [];
  for (const child of body.childNodes) {
    const converted = convertNode(child, rules);
    if (converted !== null) children.push(converted);
  }

  // Wrap everything in a root flex container
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      },
      children: children.length === 1 ? children[0] : children,
    },
  };
}

module.exports = { htmlToSatori };
