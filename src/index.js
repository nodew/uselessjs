const fs = require("fs");
const path = require("path");
const babylon = require("babylon");
const traverse = require("babel-traverse").default;
const _diff = require("lodash/difference");

const parseFile = filename => {
  const content = fs.readFileSync(filename, "utf-8");

  return babylon.parse(content, {
    sourceType: "module"
  });
};

const getDependencies = ast => {
  const dependencies = [];
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    },
    CallExpression: ({ node }) => {
      if (node.callee.name === "require") {
        dependencies.push(node.arguments[0].value);
      }
    }
  });
  return dependencies;
};

const addJsExt = filename => {
  return !/\.js$/.test(filename) ? filename + ".js" : filename;
};

const parse = filename => {
  const filePath = addJsExt(filename);
  const dirname = path.dirname(filename);
  const ast = parseFile(filePath);
  const dependencies = getDependencies(ast)
    .filter(p => p.startsWith("./"))
    .map(p => path.join(dirname, p));
  return {
    dirname,
    filePath,
    dependencies
  };
};

const walk = main => {
  const queue = [main];
  const files = new Set();
  files.add(main.filePath);
  for (const asset of queue) {
    asset.dependencies.forEach(dep => {
      const filePath = addJsExt(dep);
      if (!files.has(filePath)) {
        const child = parse(dep);
        queue.push(child);
        files.add(filePath);
      }
    });
  }
  return Array.from(files);
};

const getUsedJs = entry => {
  if (!entry.startsWith("/")) {
    throw new Error("require absolute path");
  }
  const entryFile = parse(entry);
  return walk(entryFile);
};

const getAllFiles = (dirname, ext) => {
  const files = [];
  const traverseDir = dir => {
    fs.readdirSync(dir).forEach(name => {
      const filename = path.join(dir, name);
      const stat = fs.statSync(filename);
      if (stat.isDirectory()) {
        traverseDir(filename);
      } else if (path.extname(filename) === ext) {
        files.push(filename);
      }
    });
  };
  traverseDir(dirname);
  return files;
};

const getUnUsedJs = (allFiles, usedJs) => {
  return _diff(allFiles, usedJs);
};

module.exports = {
  getUsedJs,
  getAllFiles,
  getUnUsedJs
};
