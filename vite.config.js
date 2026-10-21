import { defineConfig } from "vite";
import { remnantContent } from "./build/remnant-content.js";

export default defineConfig({
  base: "/remnant_group_project/",
  plugins: [remnantContent()],
  build: { outDir: "docs" },
});
