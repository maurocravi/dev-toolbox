import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";

const watch = process.argv.includes("--watch");
const outDir = "extension/dist";

const commonOptions = {
  bundle: true,
  format: "iife",
  target: "chrome120",
  sourcemap: true,
  logLevel: "info",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
};

async function build() {
  // Clean dist
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  // Build popup
  await esbuild.build({
    ...commonOptions,
    entryPoints: ["extension/src/popup/popup.ts"],
    outfile: `${outDir}/popup.js`,
    platform: "browser",
  });

  // Build background
  await esbuild.build({
    ...commonOptions,
    entryPoints: ["extension/src/background.ts"],
    outfile: `${outDir}/background.js`,
    platform: "browser",
  });

  // Copy static files
  const staticFiles = [
    "extension/src/popup/popup.html",
    "extension/src/popup/popup.css",
    "extension/manifest.json",
  ];

  for (const file of staticFiles) {
    if (fs.existsSync(file)) {
      const dest = path.join(outDir, path.basename(file));
      fs.copyFileSync(file, dest);
    }
  }

  // Copy icons
  const iconsDir = "extension/icons";
  if (fs.existsSync(iconsDir)) {
    const iconsDest = path.join(outDir, "icons");
    fs.mkdirSync(iconsDest, { recursive: true });
    for (const icon of fs.readdirSync(iconsDir)) {
      fs.copyFileSync(path.join(iconsDir, icon), path.join(iconsDest, icon));
    }
  }

  console.log("\n✅ Extension built successfully in extension/dist/\n");
}

if (watch) {
  const ctx = await esbuild.context({
    ...commonOptions,
    entryPoints: [
      "extension/src/popup/popup.ts",
      "extension/src/background.ts",
    ],
    outdir: outDir,
    platform: "browser",
  });
  await ctx.watch();
  console.log("👀 Watching for changes...");
} else {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
