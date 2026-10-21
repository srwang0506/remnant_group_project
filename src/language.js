import chinese from "../content/zh.json";

export function mountBlogLanguage(onChange) {
  const control = document.querySelector(".journal-language");
  const buttons = [...control.querySelectorAll("[data-language]")];
  const text = [...document.querySelectorAll("[data-i18n]")].map((element) => ({
    element, english: element.innerHTML, chinese: chinese[element.dataset.i18n],
  }));
  const attributes = ["alt", "aria-label"].flatMap((attribute) =>
    [...document.querySelectorAll(`[data-i18n-${attribute}]`)].map((element) => ({
      element, attribute, english: element.getAttribute(attribute),
      chinese: chinese[element.getAttribute(`data-i18n-${attribute}`)],
    })));
  const notebooks = [...document.querySelectorAll("[data-algorithm-language]")];
  let language = "en";

  function apply(next, retainPosition = false) {
    if (next !== "zh") next = "en";
    const headerBottom = document.querySelector(".site-header").getBoundingClientRect().bottom;
    const readingBlocks = [...document.querySelectorAll(".journal-intro [data-i18n], .journal-cover [data-i18n], .journal-body [data-i18n], [data-algorithm-section]")];
    const anchor = retainPosition ? readingBlocks.find((element) =>
      element.getClientRects().length && element.getBoundingClientRect().bottom > headerBottom) : null;
    const offset = anchor?.getBoundingClientRect().top;

    language = next;
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
    text.forEach(({ element, english, chinese }) => { element.innerHTML = next === "zh" ? chinese : english; });
    attributes.forEach(({ element, attribute, english, chinese }) => element.setAttribute(attribute, next === "zh" ? chinese : english));
    notebooks.forEach((element) => { element.hidden = element.dataset.algorithmLanguage !== next; });
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.language === next)));
    document.title = next === "zh" ? "REMNANT 设计手记 · 记忆的回响" : "Designing REMNANT · Echoes of Memory";
    onChange(next);

    if (anchor) {
      const target = anchor.dataset.algorithmSection
        ? document.querySelector(`[data-algorithm-language="${next}"] [data-algorithm-section="${anchor.dataset.algorithmSection}"]`)
        : anchor;
      window.scrollBy({ top: target.getBoundingClientRect().top - offset, behavior: "instant" });
    }
  }

  buttons.forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.language === language) return;
    apply(button.dataset.language, true);
    const url = new URL(window.location.href);
    url.hash = url.hash.replace(/lights-ref-(?:en|zh)-/, `lights-ref-${language}-`);
    if (language === "en") url.searchParams.delete("lang");
    else url.searchParams.set("lang", "zh");
    // Plain blog links always start in English; ?lang=zh makes a Chinese view shareable.
    window.history.replaceState(null, "", url);
  }));
  apply(new URL(window.location.href).searchParams.get("lang"));
  control.hidden = false;
}
