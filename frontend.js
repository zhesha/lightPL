const { lexer } = require("js-lexer");
const rules = require("./rules.js");
const analyze = require("./sintaxAnalizer.js");

function frontend(sourceCode) {
  const tokens = lexer(sourceCode, rules);
  return analyze(tokens);
}

module.exports = frontend;
