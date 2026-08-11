const root = document.documentElement;
const themeButton = document.querySelector(".theme-toggle");
const savedTheme = localStorage.getItem("kmr-theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: light)")
  .matches
  ? "light"
  : "dark";

function setTheme(theme) {
  root.dataset.theme = theme;
  themeButton.innerHTML =
    theme === "dark"
      ? '<span aria-hidden="true">☼</span>'
      : '<span aria-hidden="true">☾</span>';
  themeButton.setAttribute(
    "aria-label",
    `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
  );
  document.querySelector('meta[name="theme-color"]').content =
    theme === "dark" ? "#0d0d0d" : "#e8dcc0";
}

setTheme(savedTheme || preferredTheme);
themeButton.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  setTheme(next);
  localStorage.setItem("kmr-theme", next);
});

const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.getElementById("nav-links");
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.innerHTML = open ? "Close <span>×</span>" : "Menu <span>+</span>";
  navLinks.classList.toggle("open", open);
});
navLinks.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.innerHTML = "Menu <span>+</span>";
    navLinks.classList.remove("open");
  }),
);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("visible", entry.isIntersecting);
    });
  },
  { threshold: 0.08, rootMargin: "0px 0px -7% 0px" },
);
document.querySelectorAll(".reveal").forEach((element) => {
  if (reducedMotion.matches) element.classList.add("visible");
  else revealObserver.observe(element);
});

document.querySelectorAll(".service > button").forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.closest(".service");
    document.querySelectorAll(".service").forEach((service) => {
      const active =
        service === selected ? !service.classList.contains("active") : false;
      service.classList.toggle("active", active);
      service
        .querySelector("button")
        .setAttribute("aria-expanded", String(active));
      service.querySelector("button i").textContent = active ? "−" : "+";
    });
  });
});

document.querySelectorAll(".project-filters button").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".project-filters button")
      .forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const filter = button.dataset.filter;
    document.querySelectorAll(".project-card").forEach((card) => {
      const visible =
        filter === "all" || card.dataset.category.split(" ").includes(filter);
      card.classList.toggle("hidden", !visible);
    });
  });
});

const canvas = document.getElementById("ribbons");
const context = canvas.getContext("2d");
const pointer = { x: -1000, y: -1000 };
const disturbances = [];
let ribbonTime = 0;
let animationFrame = null;

function ribbonColors() {
  const styles = getComputedStyle(root);
  return {
    background: styles.getPropertyValue("--bg").trim(),
    line: styles.getPropertyValue("--violet").trim(),
  };
}

function resizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawRibbons();
}

function deform(x, y, progress, now) {
  const distance = Math.hypot(x - pointer.x, y - pointer.y);
  const influence = Math.max(0, 1 - distance / 240);
  let disturbance = 0;
  disturbances.forEach((point) => {
    const age = now - point.time;
    const radius = age / 8;
    const gap = Math.abs(Math.hypot(x - point.x, y - point.y) - radius);
    if (age < 2400 && gap < 70)
      disturbance += (1 - age / 2400) * (1 - gap / 70) * Math.sin(gap * 0.1);
  });
  return {
    x:
      Math.sin(progress * Math.PI * 4 + ribbonTime * 0.012) * 20 +
      Math.sin(x * 0.015 + y * 0.01 + ribbonTime * 0.005) * 6 +
      influence * 12 +
      disturbance * 15,
    y:
      Math.sin(progress * Math.PI * 7 - ribbonTime * 0.009) * 10 +
      influence * 4 +
      disturbance * 9,
  };
}

function drawRibbons() {
  const width = innerWidth;
  const height = innerHeight;
  const density = width < 700 ? 24 : 38;
  const ribbonWidth = width * 0.94;
  const startX = (width - ribbonWidth) / 2;
  const now = Date.now();
  const colors = ribbonColors();
  context.fillStyle = colors.background;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = colors.line;
  context.globalAlpha = root.dataset.theme === "dark" ? 0.2 : 0.1;
  context.lineWidth = 0.5;
  for (let column = 0; column <= density; column++) {
    context.beginPath();
    for (let row = 0; row <= density; row++) {
      const progress = (row / density) * 1.16 - 0.08;
      const x = startX + (column / density) * ribbonWidth;
      const y = progress * height;
      const offset = deform(x, y, progress, now);
      if (!row) context.moveTo(x + offset.x, y + offset.y);
      else context.lineTo(x + offset.x, y + offset.y);
    }
    context.stroke();
  }
  for (let row = 0; row <= density; row++) {
    const progress = (row / density) * 1.16 - 0.08;
    context.beginPath();
    for (let column = 0; column <= density; column++) {
      const x = startX + (column / density) * ribbonWidth;
      const y = progress * height;
      const offset = deform(x, y, progress, now);
      if (!column) context.moveTo(x + offset.x, y + offset.y);
      else context.lineTo(x + offset.x, y + offset.y);
    }
    context.stroke();
  }
  context.globalAlpha = 1;
}

function animateRibbons() {
  ribbonTime += 0.3;
  for (let index = disturbances.length - 1; index >= 0; index--) {
    if (Date.now() - disturbances[index].time > 2400)
      disturbances.splice(index, 1);
  }
  drawRibbons();
  animationFrame = requestAnimationFrame(animateRibbons);
}

function setRibbonMotion() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = null;
  if (reducedMotion.matches) drawRibbons();
  else animateRibbons();
}

addEventListener(
  "pointermove",
  (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  },
  { passive: true },
);
addEventListener(
  "pointerdown",
  (event) =>
    disturbances.push({ x: event.clientX, y: event.clientY, time: Date.now() }),
  { passive: true },
);
addEventListener("resize", resizeCanvas, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden && animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  } else if (!document.hidden && !reducedMotion.matches && !animationFrame)
    animateRibbons();
});
reducedMotion.addEventListener("change", setRibbonMotion);
resizeCanvas();
setRibbonMotion();

const EMAILJS_PUBLIC_KEY = "hQ7MetsDwq9-q6rHt";
const EMAILJS_SERVICE_ID = "service_i6mjqpg";
const EMAILJS_TEMPLATE_ID = "template_8vas6bm";
let emailClient = window.emailjs ?? null;
if (emailClient) {
  try {
    emailClient.init({
      publicKey: EMAILJS_PUBLIC_KEY,
      limitRate: { id: "portfolio-contact", throttle: 10000 },
    });
  } catch {
    emailClient = null;
  }
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
  const values = Object.fromEntries(
    fields.map((field) => [field, document.getElementById(field).value.trim()]),
  );
  const invalid = fields.filter(
    (field) =>
      !values[field] || (field === "email" && !validEmail(values.email)),
  );
  fields.forEach((field) => fieldError(field, invalid.includes(field)));
  if (invalid.length) {
    document.getElementById(invalid[0]).focus();
    return;
  }
  if (!emailClient) {
    sendErrorBox.classList.add("show");
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = "Sending…";
  try {
    await emailClient.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
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
