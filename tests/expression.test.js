var lexerjs = require("js-lexer");
var rules = require("../rules.js");
var analize = require("../sintaxAnalizer.js");
var lexer = lexerjs.lexer;

test("function call without params", function () {
  var sourceCode = `print()`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    type: 'statement_list',
    list: [{
      "called": "print",
      "params": [],
      "type": "call"
    }]
  });
});

test("function call with one param", function () {
  var sourceCode = `print('Hello')`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    type: 'statement_list',
    list: [{
      "called": "print",
      "params": [{
        "type": "expression",
        "value": {
          "type": "value",
          "valueType": "string",
          "value": "'Hello'"
        }
      }],
      "type": "call"
    }]
  });
});