import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
const version = packageJson.version;
const tag = `v${version}`;

try {
  execFileSync(
    "gh",
    ["release", "create", tag, "--generate-notes", "--verify-tag", "--title", tag],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );
} catch {
  process.exit(1);
}
