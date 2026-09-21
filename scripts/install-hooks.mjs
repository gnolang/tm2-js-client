#!/usr/bin/env node

// Points git at .githooks/, so `pnpm install` is the only setup step a
// contributor needs for the pre-commit codegen check.
//
// Every failure here is silent on purpose: a missing git, a source tarball with
// no .git, or a read-only git config should not fail an install.

import {
  execFileSync,
} from "node:child_process";
import {
  existsSync,
} from "node:fs";

const git = (...args) => execFileSync("git", args, {
  stdio: "ignore",
});

try {
  git("rev-parse", "--git-dir");
  if (existsSync(".githooks")) {
    git("config", "core.hooksPath", ".githooks");
  }
}
catch {
  // Not a git work tree, or git is unavailable. Nothing to install.
}
