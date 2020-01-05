var lexerjs = require("js-lexer");
var rules = require("../rules.js");
var analize = require("../sintaxAnalizer.js");
var lexer = lexerjs.lexer;

test("refinement", function () {
  var sourceCode = `a = 1.1.toString`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    "list": [
      {
        "type": "statement",
        "statementType": "assign",
        "target": {
          "sequence": [
            {
              "operandType": "value",
              "sequence": [
                {
                  "type": "value",
                  "value": "a",
                  "valueType": "variable"
                }
              ],
              "type": "operand"
            }
          ],
          "type": "expression"
        },
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
                },
                {
                  "type": "value",
                  "value": "toString",
                  "valueType": "variable"
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
        "type": "statement",
        "statementType": "assign",
        "target": {
          "sequence": [
            {
              "operandType": "value",
              "sequence": [
                {
                  "type": "value",
                  "value": "a",
                  "valueType": "variable"
                }
              ],
              "type": "operand"
            }
          ],
          "type": "expression"
        },
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

test("refinement call empty params", function () {
  var sourceCode = `a = b()`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    "list": [
      {
        "type": "statement",
        "statementType": "assign",
        "target": {
          "sequence": [
            {
              "operandType": "value",
              "sequence": [
                {
                  "type": "value",
                  "value": "a",
                  "valueType": "variable"
                }
              ],
              "type": "operand"
            }
          ],
          "type": "expression"
        },
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
                  "params": [],
                  "refinementType": "call",
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

test("refinement call with params", function () {
  var sourceCode = `a = b(1, 2)`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    "list": [
      {
        "type": "statement",
        "statementType": "assign",
        "target": {
          "sequence": [
            {
              "operandType": "value",
              "sequence": [
                {
                  "type": "value",
                  "value": "a",
                  "valueType": "variable"
                }
              ],
              "type": "operand"
            }
          ],
          "type": "expression"
        },
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
                  "params": [
                    {
                      "sequence": [
                        {
                          "operandType": "value",
                          "sequence": [
                            {
                              "type": "value",
                              "value": "1",
                              "valueType": "number"
                            }
                          ],
                          "type": "operand"
                        }
                      ],
                      "type": "expression"
                    },
                    {
                      "sequence": [
                        {
                          "operandType": "value",
                          "sequence": [
                            {
                              "type": "value",
                              "value": "2",
                              "valueType": "number"
                            }
                          ],
                          "type": "operand"
                        }
                      ],
                      "type": "expression"
                    }
                  ],
                  "refinementType": "call",
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