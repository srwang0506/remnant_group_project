export function mountThemeToggle() {
  const button = document.createElement("button");
  button.type = "button";
  button.id = "themeToggle";
  button.className = "theme-btn";

  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    const label = document.documentElement.lang === "zh-CN"
      ? `切换到${theme === "dark" ? "浅色" : "深色"}模式`
      : `Switch to ${theme === "dark" ? "light" : "dark"} mode`;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = theme === "dark"
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3.75"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.3A8.8 8.8 0 0 1 9.7 3.5a8.8 8.8 0 1 0 10.8 10.8Z"/></svg>';
  };
  let saved;
  try { saved = localStorage.getItem("theme"); } catch { /* Storage can be unavailable in private browsing. */ }
  apply(["light", "dark"].includes(saved) ? saved : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    apply(next);
    try { localStorage.setItem("theme", next); } catch { /* The current page still changes theme. */ }
  });
  window.addEventListener("bloglanguagechange", () => apply(document.documentElement.dataset.theme));
  document.querySelector(".theme-toggle-wrapper").append(button);
}
