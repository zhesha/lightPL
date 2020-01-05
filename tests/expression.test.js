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
      "statementType": "call",
      "type": "statement",
      "called": {
        "sequence": [
          {
            "operandType": "value",
            "sequence": [
              {
                "type": "value",
                "value": "print",
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
    }]
  });
});

test("function call with one param", function () {
  var sourceCode = `print('Hello')`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    "type": "statement_list",
    "list": [
      {
        "type": "statement",
        "statementType": "call",
        "called": {
          "type": "expression",
          "sequence": [
            {
              "operandType": "value",
              "type": "operand",
              "sequence": [
                {
                  "type": "value",
                  "value": "print",
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
                              "value": "'Hello'",
                              "valueType": "string"
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
              ]
            }
          ]
        }
      }
    ]
  });
});

test("operator", function () {
  var sourceCode = `a = 2 + 2`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    type: 'statement_list',
    list: [
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
              "type": "operand",
              "sequence": [
                {
                  "type": "value",
                  "value": "2",
                  "valueType": "number"
                }
              ]
            },
            {
              "operator": "+",
              "type": "operator"
            },
            {
              "operandType": "value",
              "type": "operand",
              "sequence": [
                {
                  "type": "value",
                  "value": "2",
                  "valueType": "number"
                }
              ]
            }
          ],
          "type": "expression"
        }
      }
    ],
  });
});

test("unary operator", function () {
  var sourceCode = `a = - 2`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    type: 'statement_list',
    list: [{
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
            "operator": "-",
            "type": "unary_operator"
          },
          {
            "operandType": "value",
            "type": "operand",
            "sequence": [
              {
                "type": "value",
                "value": "2",
                "valueType": "number"
              }
            ]
          }
        ],
        "type": "expression"
      }
    }]
  });
});

test("multiple operator", function () {
  var sourceCode = `a = 2 + 2 * 2`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    type: 'statement_list',
    list: [{
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
            "type": "operand",
            "sequence": [
              {
                "type": "value",
                "value": "2",
                "valueType": "number"
              }
            ]
          },
          {
            "operator": "+",
            "type": "operator"
          },
          {
            "operandType": "value",
            "type": "operand",
            "sequence": [
              {
                "type": "value",
                "value": "2",
                "valueType": "number"
              }
            ]
          },
          {
            "operator": "*",
            "type": "operator"
          },
          {
            "operandType": "value",
            "type": "operand",
            "sequence": [
              {
                "type": "value",
                "value": "2",
                "valueType": "number"
              }
            ]
          }
        ],
        "type": "expression"
      }
    }]
  });
});

test("parenting", function () {
  var sourceCode = `a = (2 + 2) * 2`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    type: 'statement_list',
    list: [{
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
            "operandType": "parenting",
            "type": "operand",
            "value": {
              "sequence": [
                {
                  "operandType": "value",
                  "type": "operand",
                  "sequence": [
                    {
                      "type": "value",
                      "value": "2",
                      "valueType": "number"
                    }
                  ]
                },
                {
                  "operator": "+",
                  "type": "operator"
                },
                {
                  "operandType": "value",
                  "type": "operand",
                  "sequence": [
                    {
                      "type": "value",
                      "value": "2",
                      "valueType": "number"
                    }
                  ]
                }
              ],
              "type": "expression"
            }
          },
          {
            "operator": "*",
            "type": "operator"
          },
          {
            "operandType": "value",
            "type": "operand",
            "sequence": [
              {
                "type": "value",
                "value": "2",
                "valueType": "number"
              }
            ]
          }
        ],
        "type": "expression"
      }
    }]
  });
});