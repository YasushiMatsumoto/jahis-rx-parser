import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const packageJsonPath = resolve(repoRoot, "package.json");

const run = (command, args, options = {}) => {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
};

const fail = (message) => {
  console.error(`preflight: ${message}`);
  process.exit(1);
};

if (!existsSync(packageJsonPath)) {
  fail("package.json が見つかりません。");
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const version = packageJson.version;

if (typeof version !== "string" || version.length === 0) {
  fail("package.json の version が不正です。");
}

try {
  run("git", ["rev-parse", "--is-inside-work-tree"]);
} catch {
  fail("Git 管理下のリポジトリではありません。");
}

const status = run("git", ["status", "--short"]);
if (status.length > 0) {
  fail("作業ツリーが未整理です。commit または stash 後に再実行してください。");
}

try {
  run("gh", ["auth", "status"]);
} catch {
  fail("GitHub CLI の認証状態を確認できません。`gh auth login` を実行してください。");
}

try {
  run("npm", ["whoami"]);
} catch {
  fail("npm にログインしていません。`npm login` を実行してください。");
}

console.log(`preflight: OK (version ${version})`);
