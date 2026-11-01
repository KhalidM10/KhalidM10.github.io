const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* private mode */ }
  },
};

/* theme */
const themeButton = document.querySelector(".theme-toggle");
const themeListeners = [];

function setTheme(theme) {
  root.dataset.theme = theme;
  themeButton.innerHTML =
    theme === "dark" ? '<span aria-hidden="true">☼</span>' : '<span aria-hidden="true">☾</span>';
  themeButton.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#0b0c0e" : "#f4f3ef";
  themeListeners.forEach((listener) => listener());
}

function toggleTheme() {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  setTheme(next);
  storage.set("kmr-theme", next);
}

setTheme(
  storage.get("kmr-theme") ||
    (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"),
);
themeButton.addEventListener("click", toggleTheme);

/* status bar clock (Istanbul and Nairobi share UTC+3) */
const clock = document.getElementById("clock");
const clockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
});
function tick() {
  clock.textContent = clockFormat.format(new Date());
}
tick();
setInterval(tick, 15000);

/* explorer drawer (mobile) */
const explorer = document.getElementById("explorer");
const filesButton = document.querySelector(".files-toggle");
function setExplorer(open) {
  explorer.classList.toggle("open", open);
  filesButton.setAttribute("aria-expanded", String(open));
}
filesButton.addEventListener("click", () => setExplorer(!explorer.classList.contains("open")));
explorer.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setExplorer(false)));
document.addEventListener("click", (event) => {
  if (explorer.classList.contains("open") && !explorer.contains(event.target) && !filesButton.contains(event.target))
    setExplorer(false);
});

/* active file: tree highlight + tab bar */
const activeFile = document.getElementById("active-file");
const activeCrumb = document.getElementById("active-crumb");
const activeExt = activeFile.previousElementSibling;
const tracked = [...document.querySelectorAll("main [data-file]")];
const treeLinks = [...explorer.querySelectorAll("a[data-file]")];
let currentFile = "";

function showFile(file, label, crumb) {
  activeFile.textContent = label;
  activeCrumb.textContent = crumb;
  treeLinks.forEach((link) => {
    const match = link.dataset.file === file;
    if (match) {
      const ext = link.querySelector(".ext");
      activeExt.className = ext.className;
      activeExt.textContent = ext.textContent;
    }
    link.classList.toggle("active", match);
    if (match) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function updateActiveFile() {
  if (document.body.classList.contains("reading")) return;
  const line = window.innerHeight * 0.3;
  let current = tracked[0];
  let currentTop = -Infinity;
  tracked.forEach((element) => {
    // Lowest heading above the line wins; side-by-side cards keep the left one.
    const top = Math.round(element.getBoundingClientRect().top);
    if (top <= line && top > currentTop && !element.classList.contains("hidden")) {
      current = element;
      currentTop = top;
    }
  });
  const file = current.dataset.file;
  if (file === currentFile) return;
  currentFile = file;
  showFile(file, file.split("/").filter(Boolean).pop() + (file.endsWith("/") ? "/" : ""), file);
}

let spyFrame = null;
window.addEventListener(
  "scroll",
  () => {
    if (!spyFrame) spyFrame = requestAnimationFrame(() => { spyFrame = null; updateActiveFile(); });
  },
  { passive: true },
);
updateActiveFile();

/* reveal on scroll */
const revealTargets = document.querySelectorAll(".file-head, .two-col, .cap, .project, .log li, .contact-grid");
if (!reducedMotion.matches && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    }),
    { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
  );
  revealTargets.forEach((element) => {
    element.classList.add("reveal");
    revealObserver.observe(element);
  });
}

/* project filters */
const filterButtons = document.querySelectorAll(".filters button");
function applyFilter(filter) {
  filterButtons.forEach((button) => {
    const active = button.dataset.filter === filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll(".project").forEach((card) => {
    card.classList.toggle("hidden", filter !== "all" && !card.dataset.category.split(" ").includes(filter));
  });
}
filterButtons.forEach((button) => button.addEventListener("click", () => applyFilter(button.dataset.filter)));

/* case-study reader: #/projects/<slug> opens the long-form write-up */
const reader = document.getElementById("reader");
const cases = [...reader.querySelectorAll(".case")];
const siteTitle = document.title;

function route() {
  const match = location.hash.match(/^#\/projects\/([\w-]+)$/);
  const article = match && document.getElementById(`case-${match[1]}`);
  const wasReading = document.body.classList.contains("reading");
  document.body.classList.toggle("reading", Boolean(article));
  reader.hidden = !article;
  cases.forEach((item) => { item.hidden = item !== article; });

  if (article) {
    const slug = match[1];
    const treeFile = treeLinks.find((link) => link.getAttribute("href") === `#/projects/${slug}`)?.dataset.file;
    currentFile = "";
    showFile(treeFile, "README.md", article.querySelector(".path").firstChild.textContent.trim());
    activeExt.className = "ext md";
    activeExt.textContent = "md";
    document.title = `${article.dataset.name} — Khalid Mohamed Rabe`;
    window.scrollTo({ top: 0, behavior: "instant" });
    article.querySelector("h1").focus({ preventScroll: true });
    return;
  }

  document.title = siteTitle;
  if (wasReading) {
    const target = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: "instant" });
    else window.scrollTo({ top: 0, behavior: "instant" });
  }
  currentFile = "";
  updateActiveFile();
}

window.addEventListener("hashchange", route);
route();

/* command palette */
const palette = document.getElementById("palette");
const paletteInput = document.getElementById("palette-input");
const paletteList = document.getElementById("palette-list");
const paletteTrigger = document.querySelector(".palette-trigger");
const goTo = (id) => () => {
  applyFilter("all");
  if (document.body.classList.contains("reading")) location.hash = id;
  else document.getElementById(id).scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
};
const openCase = (slug) => () => { location.hash = `/projects/${slug}`; };
const openUrl = (url) => () => window.open(url, "_blank", "noopener");
const commands = [
  { label: "readme.md", hint: "go to", run: goTo("readme") },
  { label: "about.md", hint: "go to", run: goTo("about") },
  { label: "capabilities.md", hint: "go to", run: goTo("capabilities") },
  { label: "projects/", hint: "go to", run: goTo("projects") },
  { label: "projects/continental", hint: "case study", run: openCase("continental") },
  { label: "projects/doc-platform", hint: "case study", run: openCase("doc-platform") },
  { label: "projects/medassist-ai", hint: "case study", run: openCase("medassist") },
  { label: "projects/water-potability", hint: "case study", run: openCase("water") },
  { label: "projects/safarigo", hint: "case study", run: openCase("safarigo") },
  { label: "experience.log", hint: "go to", run: goTo("experience") },
  { label: "contact.md", hint: "go to", run: goTo("contact") },
  {
    label: "Download cv.pdf",
    hint: "file",
    run: () => document.querySelector(".status-cv").click(),
  },
  { label: "Email Khalid", hint: "action", run: () => { window.location.href = "mailto:lidumoha9@gmail.com"; } },
  { label: "Open GitHub", hint: "link", run: openUrl("https://github.com/KhalidM10") },
  { label: "Open LinkedIn", hint: "link", run: openUrl("https://www.linkedin.com/in/khalid-rabe-668216280/") },
  { label: "Open Continental live site", hint: "link", run: openUrl("https://continental-dry-cleaners.vercel.app") },
  { label: "Toggle theme", hint: "action", run: toggleTheme },
];
let visibleCommands = commands;
let selected = 0;
let lastFocus = null;

function renderPalette() {
  const query = paletteInput.value.trim().toLowerCase();
  visibleCommands = commands.filter((command) => command.label.toLowerCase().includes(query));
  selected = Math.min(selected, Math.max(visibleCommands.length - 1, 0));
  paletteList.replaceChildren(
    ...(visibleCommands.length
      ? visibleCommands.map((command, index) => {
          const item = document.createElement("li");
          item.id = `cmd-${index}`;
          item.setAttribute("role", "option");
          item.setAttribute("aria-selected", String(index === selected));
          item.textContent = command.label;
          const hint = document.createElement("span");
          hint.textContent = command.hint;
          item.append(hint);
          item.addEventListener("mousemove", () => { if (selected !== index) { selected = index; renderPalette(); } });
          item.addEventListener("click", () => runCommand(index));
          return item;
        })
      : [Object.assign(document.createElement("li"), { className: "empty", textContent: "No matches" })]),
  );
  paletteInput.setAttribute("aria-activedescendant", visibleCommands.length ? `cmd-${selected}` : "");
  paletteList.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
}

function openPalette() {
  lastFocus = document.activeElement;
  palette.hidden = false;
  paletteInput.value = "";
  selected = 0;
  renderPalette();
  paletteInput.focus();
}

function closePalette() {
  palette.hidden = true;
  lastFocus?.focus?.();
}

function runCommand(index) {
  const command = visibleCommands[index];
  if (!command) return;
  closePalette();
  command.run();
}

paletteTrigger.addEventListener("click", openPalette);
paletteInput.addEventListener("input", () => { selected = 0; renderPalette(); });
palette.addEventListener("click", (event) => { if (event.target === palette) closePalette(); });
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    palette.hidden ? openPalette() : closePalette();
    return;
  }
  if (palette.hidden) {
    if (event.key === "Escape") setExplorer(false);
    return;
  }
  if (event.key === "Escape") closePalette();
  else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const step = event.key === "ArrowDown" ? 1 : -1;
    selected = (selected + step + visibleCommands.length) % Math.max(visibleCommands.length, 1);
    renderPalette();
  } else if (event.key === "Enter") {
    event.preventDefault();
    runCommand(selected);
  } else if (event.key === "Tab") {
    event.preventDefault();
    paletteInput.focus();
  }
});
if (/Mac|iPhone|iPad/.test(navigator.platform)) paletteTrigger.querySelector("kbd").textContent = "⌘K";

/* page background: drifting topographic contour lines (WebGL) */
(function heroField() {
  const canvas = document.getElementById("bg-field");
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) {
    canvas.classList.add("static");
    return;
  }

  const vertexSource = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const fragmentSource = `
    precision mediump float;
    uniform vec2 res; uniform float t; uniform vec2 mouse; uniform vec3 tint;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
    }
    float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= .5; } return v; }
    void main(){
      float unit = min(res.y, res.x * .75);
      vec2 uv = gl_FragCoord.xy / unit;
      vec2 m = mouse * res / unit;
      float lift = .18 * exp(-6. * dot(uv - m, uv - m));
      float h = fbm(uv * 2.2 + vec2(t * .018, -t * .012)) + lift;
      float bands = h * 14.;
      float line = smoothstep(.44, .49, abs(fract(bands) - .5));
      float major = step(.8, fract(bands / 5. + .1)) * .4;
      float a = line * (.32 + major);
      gl_FragColor = vec4(tint * a, a);
    }`;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  }
  const vs = compile(gl.VERTEX_SHADER, vertexSource);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vs || !fs) { canvas.classList.add("static"); return; }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { canvas.classList.add("static"); return; }
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniform = (name) => gl.getUniformLocation(program, name);
  const uRes = uniform("res"), uTime = uniform("t"), uMouse = uniform("mouse"), uTint = uniform("tint");

  const mouse = { x: 0.75, y: 0.6, tx: 0.75, ty: 0.6 };
  let visible = true;
  let frame = null;
  const start = performance.now();

  function setTint() {
    const hex = getComputedStyle(root).getPropertyValue("--accent").trim().replace("#", "");
    const value = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
    gl.uniform3f(uTint, ((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }

  function draw(now) {
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    gl.uniform1f(uTime, reducedMotion.matches ? 8 : (now - start) / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop(now) {
    draw(now);
    frame = visible && !document.hidden && !reducedMotion.matches ? requestAnimationFrame(loop) : null;
  }

  function wake() {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(loop);
  }

  window.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.tx = (event.clientX - rect.left) / rect.width;
    mouse.ty = 1 - (event.clientY - rect.top) / rect.height;
    wake();
  });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); }).observe(canvas);
  document.addEventListener("visibilitychange", wake);
  reducedMotion.addEventListener("change", wake);
  window.addEventListener("resize", () => { resize(); wake(); });
  themeListeners.push(() => { setTint(); wake(); });

  setTint();
  resize();
  wake();
})();

/* contact form (EmailJS) */
const EMAILJS_PUBLIC_KEY = "hQ7MetsDwq9-q6rHt";
const EMAILJS_SERVICE_ID = "service_i6mjqpg";
const EMAILJS_TEMPLATE_ID = "template_8vas6bm";
let emailClient = null;

function getEmailClient() {
  if (emailClient || !window.emailjs) return emailClient;
  try {
    window.emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY,
      limitRate: { id: "portfolio-contact", throttle: 10000 },
    });
    emailClient = window.emailjs;
  } catch {
    emailClient = null;
  }
  return emailClient;
}

const form = document.getElementById("contact-form");
const submitButton = form.querySelector('button[type="submit"]');
const successBox = document.getElementById("form-success");
const sendErrorBox = document.getElementById("form-send-error");
const fields = ["name", "email", "subject", "message"];
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function fieldError(field, show) {
  const input = document.getElementById(field);
  document.getElementById(`${field}-error`).classList.toggle("show", show);
  input.setAttribute("aria-invalid", String(show));
  if (show) input.setAttribute("aria-describedby", `${field}-error`);
  else input.removeAttribute("aria-describedby");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  successBox.classList.remove("show");
  sendErrorBox.classList.remove("show");
  if (document.getElementById("website").value) {
    form.reset();
    successBox.classList.add("show");
    return;
  }
  const values = Object.fromEntries(fields.map((field) => [field, document.getElementById(field).value.trim()]));
  const invalid = fields.filter((field) => !values[field] || (field === "email" && !validEmail(values.email)));
  fields.forEach((field) => fieldError(field, invalid.includes(field)));
  if (invalid.length) {
    document.getElementById(invalid[0]).focus();
    return;
  }
  const client = getEmailClient();
  if (!client) {
    sendErrorBox.classList.add("show");
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = "Sending…";
  try {
    await client.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      from_name: values.name,
      from_email: values.email,
      subject: values.subject,
      message: values.message,
    });
    form.reset();
    successBox.classList.add("show");
  } catch (error) {
    console.error("EmailJS send failed:", error);
    sendErrorBox.classList.add("show");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send message ↗";
  }
});
