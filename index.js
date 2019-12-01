var lexerjs = require("js-lexer");
var fs = require("fs");
var rules = require("./rules.js");
var analize = require("./sintaxAnalizer.js");
var lexer = lexerjs.lexer;

console.log(process.argv);
// process.argv
// /usr/local/bin

// var sourceCode = fs.readFileSync('index.lpl', 'utf-8');
// var tokens = lexer(sourceCode, rules);
// const ast = analize(tokens);
