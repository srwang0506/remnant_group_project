import "./base.css";
import "katex/dist/katex.min.css";
import "./journal.css";
import { mountThemeToggle } from "./theme.js";
import { mountBlogLanguage } from "./language.js";
import { affectedLights, createLightsExample } from "../data/lights-example.js";

mountThemeToggle();
const header = document.querySelector(".site-header");
const updateHeader = () => {
  const height = getComputedStyle(header).position === "sticky" ? header.getBoundingClientRect().height : 0;
  document.documentElement.style.setProperty("--header-height", `${height}px`);
};
new ResizeObserver(updateHeader).observe(header);
window.addEventListener("resize", updateHeader, { passive: true });
updateHeader();

const board = document.querySelector("#lights-board");
const status = document.querySelector("#lights-status");
let language = "en";
let lastPress = null;
let cells;
const flip = (index) => affectedLights(index).forEach((cell) => { cells[cell] = !cells[cell]; });
const buttons = Array.from({ length: 25 }, (_, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.addEventListener("click", () => {
    flip(index);
    lastPress = affectedLights(index).length;
    render();
  });
  board.append(button);
  return button;
});
function render() {
  buttons.forEach((button, index) => {
    button.setAttribute("aria-pressed", String(cells[index]));
    button.setAttribute("aria-label", language === "zh"
      ? `第 ${Math.floor(index / 5) + 1} 行，第 ${index % 5 + 1} 列：${cells[index] ? "已点亮" : "未点亮"}`
      : `Row ${Math.floor(index / 5) + 1}, column ${index % 5 + 1}: ${cells[index] ? "active" : "inactive"}`);
  });
  const active = cells.filter(Boolean).length;
  status.textContent = language === "zh"
    ? `已点亮 ${active} / 25 格。${active === 25 ? "全部恢复！" : lastPress ? `上次按键翻转了 ${lastPress} 格。` : ""}`
    : `${active} of 25 panels active.${active === 25 ? " All panels restored." : lastPress ? ` Last press flipped ${lastPress} panels.` : ""}`;
}
function reset() {
  cells = createLightsExample();
  lastPress = null;
  render();
}
document.querySelector("#lights-reset").addEventListener("click", reset);
reset();

mountBlogLanguage((next) => {
  language = next;
  render();
  window.dispatchEvent(new Event("bloglanguagechange"));
  updateHeader();
});

const labFilm = document.querySelector("#lab-film");
const filmChapters = document.querySelector(".film-chapters");
const chapterButtons = [...filmChapters.querySelectorAll("button[data-lab-start]")];
let pendingChapter = null;
const seekChapter = () => {
  if (pendingChapter === null) return;
  labFilm.currentTime = pendingChapter;
  pendingChapter = null;
};
labFilm.addEventListener("loadedmetadata", seekChapter);
chapterButtons.forEach((button) => {
  button.setAttribute("aria-controls", "lab-film");
  button.addEventListener("click", () => {
    pendingChapter = Number(button.dataset.labStart);
    if (labFilm.readyState >= 1) seekChapter();
    labFilm.play().catch(() => { /* Native video controls remain available. */ });
  });
});
labFilm.addEventListener("timeupdate", () => {
  const current = chapterButtons.reduce((active, button) => Number(button.dataset.labStart) <= labFilm.currentTime ? button : active, null);
  chapterButtons.forEach((button) => {
    if (button === current) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
});
filmChapters.hidden = false;
