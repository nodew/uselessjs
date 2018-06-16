#!/usr/bin/env node

const program = require("commander");
const path = require("path");
const useless = require("../src/index");

program
  .version("1.0.0")
  .option("-d, --dirname [value]", "target folder")
  .option("-f, --filename [value]", "entry files", "index.js")
  .parse(process.argv);

const cwd = process.cwd();

const allFiles = useless.getAllFiles(path.join(cwd, program.dirname), ".js");
const usedJs = useless.getUsedJs(path.join(cwd, program.filename));
const unused = useless.getUnUsedJs(allFiles, usedJs);

unused.map(filename => {
  const file = filename.replace(cwd, "");
  console.log(file);
});
