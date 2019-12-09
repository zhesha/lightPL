var lexerjs = require("js-lexer");
var rules = require("../rules.js");
var analize = require("../sintaxAnalizer.js");
var lexer = lexerjs.lexer;

test("simple if", function () {
    var sourceCode = `if open {
      c = 1
    }`;
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual({
        "type": "statement_list",
        "list": [
            {
                "type": "if",
                "condition": {
                  "type": "expression",
                  "sequence": [
                    {
                      "operandType": "value",
                      "type": "operand",
                      "sequence": [
                        {
                          "type": "value",
                          "value": "open",
                          "valueType": "variable"
                        }
                      ]
                    }
                  ],
                },
                "statements": {
                    "type": "statement_list",
                    "list": [
                        {
                            "target": "c",
                            "type": "assign",
                            "value": {
                              "type": "expression",
                              "sequence": [
                                {
                                  "operandType": "value",
                                  "type": "operand",
                                  "sequence": [
                                    {
                                      "type": "value",
                                      "value": "1",
                                      "valueType": "number"
                                    }
                                  ]
                                }
                              ],
                            }
                        }
                    ]
                }
            }
        ]
    });
});

test("complicate if", function () {
    var sourceCode = `var a = true
    var b = 1
    if a {
      a = false
      b = 2
    }`;
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual({
        "type": "statement_list",
        "list": [
            {
                "type": "variable_declaration",
                "variables": [
                    {
                        "name": "a",
                        "value": {
                          "type": "expression",
                          "sequence": [
                            {
                              "operandType": "value",
                              "type": "operand",
                              "sequence": [
                                {
                                  "type": "value",
                                  "value": "true",
                                  "valueType": "_true"
                                }
                              ]
                            }
                          ],
                        }
                    }
                ]
            },
            {
                "type": "variable_declaration",
                "variables": [
                    {
                        "name": "b",
                        "value": {
                          "type": "expression",
                          "sequence": [
                            {
                              "operandType": "value",
                              "type": "operand",
                              "sequence": [
                                {
                                  "type": "value",
                                  "value": "1",
                                  "valueType": "number"
                                }
                              ]
                            }
                          ],
                        }
                    }
                ]
            },
            {
                "type": "if",
                "condition": {
                  "type": "expression",
                  "sequence": [
                    {
                      "operandType": "value",
                      "type": "operand",
                      "sequence": [
                        {
                          "type": "value",
                          "value": "a",
                          "valueType": "variable"
                        }
                      ]
                    }
                  ],
                },
                "statements": {
                    "type": "statement_list",
                    "list": [
                        {
                            "target": "a",
                            "type": "assign",
                            "value": {
                              "type": "expression",
                              "sequence": [
                                {
                                  "operandType": "value",
                                  "type": "operand",
                                  "sequence": [
                                    {
                                      "type": "value",
                                      "value": "false",
                                      "valueType": "_false"
                                    }
                                  ]
                                }
                              ],
                            }
                        },
                        {
                            "target": "b",
                            "type": "assign",
                            "value": {
                              "type": "expression",
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
                                }
                              ],
                            }
                        }
                    ]
                }
            }
        ]
    });
});
