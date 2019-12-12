var lexerjs = require("js-lexer");
var rules = require("../rules.js");
var analize = require("../sintaxAnalizer.js");
var lexer = lexerjs.lexer;

test("refinement", function () {
  var sourceCode = `a = 1.1.to`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    "list": [
      {
        "target": "a",
        "type": "assign",
        "value": {
          "sequence": [
            {
              "operandType": "value",
              "sequence": [
                {
                  "type": "value",
                  "value": "1.1",
                  "valueType": "number"
                },
                {
                  "refinementType": "dot",
                  "type": "refinement"
                }
              ],
              "type": "operand"
            }
          ],
          "type": "expression"
        }
      }
    ],
    "type": "statement_list"
  });
});

test("refinement collection element", function () {
  var sourceCode = `a = b[0]`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    "list": [
      {
        "target": "a",
        "type": "assign",
        "value": {
          "sequence": [
            {
              "operandType": "value",
              "sequence": [
                {
                  "type": "value",
                  "value": "b",
                  "valueType": "variable"
                },
                {
                  "key": {
                    "sequence": [
                      {
                        "operandType": "value",
                        "sequence": [
                          {
                            "type": "value",
                            "value": "0",
                            "valueType": "number"
                          }
                        ],
                        "type": "operand"
                      }
                    ],
                    "type": "expression"
                  },
                  "refinementType": "collection_refinement",
                  "type": "refinement"
                }
              ],
              "type": "operand"
            }
          ],
          "type": "expression"
        }
      }
    ],
    "type": "statement_list"
  });
});