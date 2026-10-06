import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Absolute so /ots/ resolves the logo, icons and PDF template from the site root.
  base: "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        // The open team sheet page, served at /ots/.
        ots: resolve(__dirname, "ots/index.html")
      }
    }
  }
});
