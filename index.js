var lexerjs = require("js-lexer");
var fs = require("fs");
var rules = require("./rules.js");
var analize = require("./sintaxAnalizer.js");
var lexer = lexerjs.lexer;

var sourceCode = fs.readFileSync('index.lpl', 'utf-8');
var tokens = lexer(sourceCode, rules);
analize(tokens);
