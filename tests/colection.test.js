var lexerjs = require("js-lexer");
var rules = require("../rules.js");
var analize = require("../sintaxAnalizer.js");
var lexer = lexerjs.lexer;

test("empty array", function() {
  var sourceCode = `a = []`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    list: [
      {
        type: "statement",
        statementType: "assign",
        target: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  value: "a",
                  valueType: "variable"
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        },
        value: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  list: [],
                  valueType: "array"
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        }
      }
    ],
    type: "statement_list"
  });
});

test("array 1 element", function() {
  var sourceCode = `a = [1]`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    list: [
      {
        type: "statement",
        statementType: "assign",
        target: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  value: "a",
                  valueType: "variable"
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        },
        value: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  valueType: "array",
                  list: [
                    {
                      type: "expression",
                      sequence: [
                        {
                          type: "operand",
                          operandType: "value",
                          sequence: [
                            {
                              type: "value",
                              value: "1",
                              valueType: "number"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        }
      }
    ],
    type: "statement_list"
  });
});

test("array multiple element", function() {
  var sourceCode = `a = [1, a, 'test']`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    list: [
      {
        type: "statement",
        statementType: "assign",
        target: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  value: "a",
                  valueType: "variable"
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        },
        value: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  valueType: "array",
                  list: [
                    {
                      type: "expression",
                      sequence: [
                        {
                          type: "operand",
                          operandType: "value",
                          sequence: [
                            {
                              type: "value",
                              value: "1",
                              valueType: "number"
                            }
                          ]
                        }
                      ]
                    },
                    {
                      sequence: [
                        {
                          operandType: "value",
                          sequence: [
                            {
                              type: "value",
                              value: "a",
                              valueType: "variable"
                            }
                          ],
                          type: "operand"
                        }
                      ],
                      type: "expression"
                    },
                    {
                      sequence: [
                        {
                          operandType: "value",
                          sequence: [
                            {
                              type: "value",
                              value: "'test'",
                              valueType: "string"
                            }
                          ],
                          type: "operand"
                        }
                      ],
                      type: "expression"
                    }
                  ]
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        }
      }
    ],
    type: "statement_list"
  });
});

test("array first string element", function() {
  var sourceCode = `a = ['test']`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    list: [
      {
        type: "statement",
        statementType: "assign",
        target: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  value: "a",
                  valueType: "variable"
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        },
        value: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  valueType: "array",
                  list: [
                    {
                      sequence: [
                        {
                          operandType: "value",
                          sequence: [
                            {
                              type: "value",
                              value: "'test'",
                              valueType: "string"
                            }
                          ],
                          type: "operand"
                        }
                      ],
                      type: "expression"
                    }
                  ]
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        }
      }
    ],
    type: "statement_list"
  });
});

test("dictionary empty", function() {
  var sourceCode = `a = [:]`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    list: [
      {
        type: "statement",
        statementType: "assign",
        target: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  value: "a",
                  valueType: "variable"
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        },
        value: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  valueType: "dictionary",
                  list: []
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        }
      }
    ],
    type: "statement_list"
  });
});

test("dictionary single element", function() {
  var sourceCode = `a = ['first': 1]`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    list: [
      {
        type: "statement",
        statementType: "assign",
        target: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  value: "a",
                  valueType: "variable"
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        },
        value: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  valueType: "dictionary",
                  list: [
                    {
                      key: "'first'",
                      value: {
                        sequence: [
                          {
                            operandType: "value",
                            sequence: [
                              {
                                type: "value",
                                value: "1",
                                valueType: "number"
                              }
                            ],
                            type: "operand"
                          }
                        ],
                        type: "expression"
                      }
                    }
                  ]
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        }
      }
    ],
    type: "statement_list"
  });
});

test("dictionary multiple element", function() {
  var sourceCode = `a = ['first': 1, 'second': 2]`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    list: [
      {
        type: "statement",
        statementType: "assign",
        target: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  value: "a",
                  valueType: "variable"
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        },
        value: {
          sequence: [
            {
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  valueType: "dictionary",
                  list: [
                    {
                      key: "'first'",
                      value: {
                        sequence: [
                          {
                            operandType: "value",
                            sequence: [
                              {
                                type: "value",
                                value: "1",
                                valueType: "number"
                              }
                            ],
                            type: "operand"
                          }
                        ],
                        type: "expression"
                      }
                    },
                    {
                      key: "'second'",
                      value: {
                        sequence: [
                          {
                            operandType: "value",
                            sequence: [
                              {
                                type: "value",
                                value: "2",
                                valueType: "number"
                              }
                            ],
                            type: "operand"
                          }
                        ],
                        type: "expression"
                      }
                    }
                  ]
                }
              ],
              type: "operand"
            }
          ],
          type: "expression"
        }
      }
    ],
    type: "statement_list"
  });
});
