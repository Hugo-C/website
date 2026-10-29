// Build the frontend assets into public/, which Django serves as static files.
//
// The templates load the bundles with plain <script> tags, so they are built
// as IIFEs. Rolldown only supports that for a single input, hence one build
// per entry.
//
// Usage: node vite.build.mjs [--production] [--watch]
import { cp } from "node:fs/promises";
import { parseArgs } from "node:util";
import { build, mergeConfig } from "vite";

const { values: args } = parseArgs({
  options: {
    production: { type: "boolean", default: false },
    watch: { type: "boolean", default: false },
  },
});

// Vendor files loaded directly by some templates, outside of the bundles
const vendorFiles = {
  "node_modules/bootstrap-icons/font": "public/css",
  "node_modules/blueimp-gallery/css": "public/css",
  "node_modules/blueimp-gallery/js": "public/js",
  "node_modules/blueimp-gallery/img": "public/img",
  "node_modules/croppie/croppie.js": "public/js/croppie.js",
  "node_modules/croppie/croppie.min.js": "public/js/croppie.min.js",
  "node_modules/croppie/croppie.css": "public/css/croppie.css",
};

const config = {
  configFile: false,
  mode: args.production ? "production" : "development",
  // Make asset URLs relative to the CSS files referencing them
  base: "./",
  // public/ is where the assets are built, not a source of files to copy
  publicDir: false,
  build: {
    outDir: "public",
    // public/ also holds files tracked in git
    emptyOutDir: false,
    // Extract each entry's CSS into a single file, instead of injecting it from
    // the JS as Vite does for IIFE bundles
    cssCodeSplit: false,
    minify: args.production,
    sourcemap: args.production ? false : "inline",
    watch: args.watch ? {} : null,
    rolldownOptions: {
      output: {
        format: "iife",
        // The templates load the .min.js files, so development builds use the
        // same names, only without minification
        entryFileNames: "js/[name].min.js",
      },
    },
  },
};

for (const [from, to] of Object.entries(vendorFiles)) {
  await cp(from, to, { recursive: true });
}

// Vite names every non code-split CSS bundle style.css, so each build names its
// own. Apart from it, only bootstrap-icons' fonts are too big to be inlined.
await build(
  mergeConfig(config, {
    build: {
      rolldownOptions: {
        input: { lutris: "frontend/js/app.js" },
        output: {
          assetFileNames: ({ names }) =>
            names[0].endsWith(".css") ? "css/lutris.css" : "webfonts/[name][extname]",
        },
      },
    },
  }),
);
await build(
  mergeConfig(config, {
    build: {
      rolldownOptions: {
        input: { editor: "frontend/js/editor.js" },
        output: {
          assetFileNames: ({ names }) =>
            names[0].endsWith(".css") ? "css/editor.css" : "webfonts/[name][extname]",
        },
      },
    },
  }),
);
await build(
  mergeConfig(config, {
    build: {
      rolldownOptions: {
        input: { styles: "frontend/css/lutris.scss" },
        output: {
          assetFileNames: ({ names }) =>
            names[0].endsWith(".css") ? "css/styles.css" : "webfonts/[name][extname]",
        },
      },
    },
  }),
);
