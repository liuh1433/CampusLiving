import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const localPath = (path) => fileURLToPath(new URL(path, import.meta.url));
const libraryAsset = localPath("./assets/glb/library_jinming.glb");
const publicLibraryAsset = localPath("./public/assets/glb/library_jinming.glb");

export default defineConfig({
  plugins: [{
    name: "library-model-output",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "assets/lucide-LICENSE.txt", source: readFileSync(localPath("./src/library/vendor/LICENSE")) });
      // Public assets are copied by Vite; support the model author's assets/ output too.
      if (!existsSync(publicLibraryAsset) && existsSync(libraryAsset)) {
        this.emitFile({ type: "asset", fileName: "assets/glb/library_jinming.glb", source: readFileSync(libraryAsset) });
      }
    },
  }],
  build: {
    rollupOptions: {
      input: {
        main: localPath("./index.html"),
        library: localPath("./library.html"),
      },
    },
  },
});
