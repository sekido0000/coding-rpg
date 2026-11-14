import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // tsconfig.json の paths と同じく，@/ を src/ として読む
      "@": fileURLToPath(
        new URL("./src", import.meta.url),
      ),
    },
  },
});
