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
                "condition": "open",
                "statements": {
                    "type": "statement_list",
                    "list": [
                        {
                            "target": "c",
                            "type": "assign",
                            "value": {
                              "type": "expression",
                              "value": {
                                "type": "value",
                                "valueType": "number",
                                "value": "1"
                              }
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
                          "value": {
                            "type": "value",
                            "valueType": "_true",
                            "value": "true"
                          }
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
                          "value": {
                            "type": "value",
                            "valueType": "number",
                            "value": "1"
                          }
                        }
                    }
                ]
            },
            {
                "type": "if",
                "condition": "a",
                "statements": {
                    "type": "statement_list",
                    "list": [
                        {
                            "target": "a",
                            "type": "assign",
                            "value": {
                              "type": "expression",
                              "value": {
                                "type": "value",
                                "valueType": "_false",
                                "value": "false"
                              }
                            }
                        },
                        {
                            "target": "b",
                            "type": "assign",
                            "value": {
                              "type": "expression",
                              "value": {
                                "type": "value",
                                "valueType": "number",
                                "value": "2"
                              }
                            }
                        }
                    ]
                }
            }
        ]
    });
});
