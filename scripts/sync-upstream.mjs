// Copies the upstream gno sources that codegen reads, pinned to one commit,
// then regenerates from them. Usage: pnpm upstream:sync [ref] (default master)
import {
  writeFileSync,
} from "node:fs";
import process from "node:process";
import {
  URL,
} from "node:url";

import {
  generate, writeStdErrors,
} from "./generate-errors.mjs";

const files = ["tm2/pkg/std/errors.go", "tm2/pkg/std/package.go"];

const fetchOk = async (url) => {
  const response = await globalThis.fetch(url);
  if (!response.ok) {
    throw new Error(`${url}: ${response.status} ${response.statusText}`);
  }
  return response;
};

const ref = process.argv[2] ?? "master";
const {
  sha,
} = await (await fetchOk(`https://api.github.com/repos/gnolang/gno/commits/${ref}`)).json();
const commit = sha.slice(0, 10);

// Fetch and check everything before writing, so a failed request or an
// unparsable upstream change leaves the copies untouched.
const sources = await Promise.all(files.map(async file => (await fetchOk(`https://raw.githubusercontent.com/gnolang/gno/${sha}/${file}`)).text()));
generate(...sources);

files.forEach((file, i) => {
  const header = `// Copied from gnolang/gno@${commit} ${file} by scripts/sync-upstream.mjs.\n// Do not edit: run \`pnpm upstream:sync [ref]\` instead.\n\n`;
  writeFileSync(new URL(`./upstream/${file}`, import.meta.url), header + sources[i]);
});

writeStdErrors();
process.stdout.write(`synced ${files.join(", ")} from gnolang/gno@${commit}\n`);
