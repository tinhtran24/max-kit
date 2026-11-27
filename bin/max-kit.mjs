#!/usr/bin/env node
import { run } from "../src/cli/index.mjs";

run(process.argv.slice(2)).then(
  (code) => process.exit(code ?? 0),
  (err) => {
    console.error(`max-kit: ${err.message}`);
    process.exit(1);
  }
);
