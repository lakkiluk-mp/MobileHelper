const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

const aliases = {
  "@etalon/shared": path.resolve(monorepoRoot, "packages/shared/src/index.ts"),
  "@etalon/content": path.resolve(monorepoRoot, "packages/content/src/browser.ts"),
  "@etalon/runner": path.resolve(monorepoRoot, "packages/runner/src/index.ts"),
  "@etalon/web-path": path.resolve(monorepoRoot, "src/lib/path.ts"),
  "@etalon/web-answer": path.resolve(monorepoRoot, "src/lib/answer.ts"),
  "@etalon/web-stats": path.resolve(monorepoRoot, "src/lib/stats.ts"),
  "@etalon/web-highlight": path.resolve(monorepoRoot, "src/lib/highlight.ts"),
  "@etalon/web-snippets": path.resolve(monorepoRoot, "src/lib/snippets.ts"),
  "@etalon/web-catalog": path.resolve(monorepoRoot, "src/lib/catalog.ts"),
};

const upstream = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "vm" ||
    moduleName === "node:vm" ||
    moduleName.startsWith("node:fs") ||
    moduleName.startsWith("node:test") ||
    moduleName.startsWith("node:assert")
  ) {
    return { type: "empty" };
  }
  const aliased = aliases[moduleName];
  if (aliased) return { type: "sourceFile", filePath: aliased };
  const name =
    moduleName.endsWith(".ts") || moduleName.endsWith(".tsx")
      ? moduleName.replace(/\.tsx?$/, "")
      : moduleName;
  if (upstream) return upstream(context, name, platform);
  return context.resolveRequest(context, name, platform);
};

module.exports = config;
