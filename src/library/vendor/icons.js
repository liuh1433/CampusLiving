/**
 * @license Lucide v1.8.0 - ISC. Feather-derived icons - MIT.
 * Icon nodes vendored from the lucide package. See LICENSE in this directory.
 */
const icons = {
  "arrow-left": [["path", { d: "m12 19-7-7 7-7" }], ["path", { d: "M19 12H5" }]],
  "chevron-down": [["path", { d: "m6 9 6 6 6-6" }]],
  "rotate-ccw": [["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }], ["path", { d: "M3 3v5h5" }]],
  "rotate-3d": [
    ["path", { d: "M16.466 7.5C15.643 4.237 13.952 2 12 2 9.239 2 7 6.477 7 12s2.239 10 5 10c.342 0 .677-.069 1-.2" }],
    ["path", { d: "m15.194 13.707 3.814 1.86-1.86 3.814" }],
    ["path", { d: "M19 15.57c-1.804.885-4.274 1.43-7 1.43-5.523 0-10-2.239-10-5s4.477-5 10-5c4.838 0 8.873 1.718 9.8 4" }],
  ],
  house: [
    ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" }],
    ["path", { d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }],
  ],
  trees: [
    ["path", { d: "M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" }],
    ["path", { d: "M7 16v6" }], ["path", { d: "M13 19v3" }],
    ["path", { d: "M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5" }],
  ],
  camera: [
    ["path", { d: "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" }],
    ["circle", { cx: "12", cy: "13", r: "3" }],
  ],
  download: [["path", { d: "M12 15V3" }], ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }], ["path", { d: "m7 10 5 5 5-5" }]],
  plus: [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]],
  minus: [["path", { d: "M5 12h14" }]],
  compass: [["circle", { cx: "12", cy: "12", r: "10" }], ["path", { d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" }]],
  "loader-circle": [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]],
  "circle-alert": [["circle", { cx: "12", cy: "12", r: "10" }], ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }], ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16" }]],
};

export function createIcon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const attributes = {
    width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    "stroke-width": 1.7, "stroke-linecap": "round", "stroke-linejoin": "round",
    "aria-hidden": "true", focusable: "false",
  };
  for (const [key, value] of Object.entries(attributes)) svg.setAttribute(key, value);
  for (const [tag, attrs] of icons[name] ?? []) {
    const child = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attrs)) child.setAttribute(key, value);
    svg.append(child);
  }
  return svg;
}

export function mountIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((element) => {
    element.replaceChildren(createIcon(element.dataset.icon));
  });
}
