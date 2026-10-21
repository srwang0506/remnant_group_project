import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import { katex } from "@mdit/plugin-katex";
import { createHighlighter } from "shiki";
import { LIGHTS_SIZE, LIGHTS_SCRAMBLE, createLightsExample } from "../data/lights-example.js";

const directory = new URL("../content/", import.meta.url);
const read = (filename) => readFileSync(new URL(filename, directory), "utf8");
let highlighterPromise;

function exampleTable(language) {
  const cells = createLightsExample();
  const header = language === "zh"
    ? "| 行 | 初始状态（1 为亮） | 按键方案（1 为按） |"
    : "| Row | Initial state (1 = on) | Press pattern (1 = press) |";
  const rows = Array.from({ length: LIGHTS_SIZE }, (_, row) => {
    const state = cells.slice(row * LIGHTS_SIZE, (row + 1) * LIGHTS_SIZE).map(Number).join("");
    const presses = Array.from({ length: LIGHTS_SIZE }, (_, col) => Number(LIGHTS_SCRAMBLE.includes(row * LIGHTS_SIZE + col))).join("");
    return `| ${row + 1} | \`${state}\` | \`${presses}\` |`;
  });
  return [header, "| --- | --- | --- |", ...rows].join("\n");
}

export async function renderAlgorithm(language) {
  const highlighter = await (highlighterPromise ??= createHighlighter({
    themes: ["light-plus", "dark-plus"],
    langs: ["python"],
  }));
  const md = new MarkdownIt({ html: true }).use(katex, { throwOnError: true, trust: false, output: "htmlAndMathml" });
  const plainFence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, index, options, env, renderer) => {
    const token = tokens[index];
    const codeLanguage = token.info.trim().split(/\s+/)[0];
    if (!highlighter.getLoadedLanguages().includes(codeLanguage)) {
      return plainFence(tokens, index, options, env, renderer);
    }
    return highlighter.codeToHtml(token.content.replace(/\n$/, ""), {
      lang: codeLanguage,
      themes: { light: "light-plus", dark: "dark-plus" },
      defaultColor: false,
      transformers: [{
        pre(node) {
          node.properties["aria-label"] = language === "zh" ? "Python 求解器代码，可横向滚动" : "Python solver code, scroll horizontally if needed";
        },
      }],
    }) + "\n";
  };
  const tableLabel = language === "zh" ? "棋盘实例，可横向滚动" : "Board example, scroll horizontally if needed";
  md.renderer.rules.table_open = () => `<div class="algorithm-table" role="region" aria-label="${tableLabel}" tabindex="0"><table>\n`;
  md.renderer.rules.table_close = () => "</table></div>\n";
  const source = read(`lights-algorithm.${language}.md`)
    .replace(`<!-- worked-example:${language} -->`, exampleTable(language))
    .replace("<!-- solver-code -->", `\`\`\`python\n${read("lights-solver.py").trim()}\n\`\`\``);
  let html = md.render(source);
  if (html.includes("katex-error")) throw new Error(`Invalid math in the ${language} Lights Out notebook`);
  // Matching headings let language switching retain the reader's place in the notebook.
  let heading = 0;
  html = html.replace(/<h4>/g, () => `<h4 data-algorithm-section="${++heading}">`);
  return html;
}

export function remnantContent() {
  return {
    name: "remnant-markdown-content",
    transformIndexHtml: {
      order: "pre",
      async handler(html) {
        if (!html.includes("<!-- lights-algorithm:en -->")) return html;
        const translations = JSON.parse(read("zh.json"));
        const keys = [...html.matchAll(/data-i18n(?:-alt|-aria-label)?="([^"]+)"/g)].map((match) => match[1]);
        for (const key of keys) {
          if (typeof translations[key] !== "string") throw new Error(`Missing Chinese translation: ${key}`);
        }
        for (const language of ["en", "zh"]) {
          const algorithm = await renderAlgorithm(language);
          html = html.replace(`<!-- lights-algorithm:${language} -->`, () => algorithm);
        }
        return html;
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(fileURLToPath(directory)) && /\.(md|py)$/.test(file)) {
        server.ws.send({ type: "full-reload" });
        return [];
      }
    },
  };
}
