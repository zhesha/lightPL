var lexerjs = require("js-lexer");
var rules = require("../rules.js");
var analize = require("../sintaxAnalizer.js");
var lexer = lexerjs.lexer;

test("simple while", function() {
  var sourceCode = `while isShown {
      show()
    }`;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
    type: "statement_list",
    list: [
      {
        type: "while",
        condition: {
          type: "expression",
          sequence: [
            {
              type: "operand",
              operandType: "value",
              sequence: [
                {
                  type: "value",
                  valueType: "variable",
                  value: "isShown"
                }
              ]
            }
          ]
        },
        statements: {
          type: "statement_list",
          list: [
            {
              type: "statement",
              statementType: "call",
              called: {
                type: "expression",
                sequence: [
                  {
                    type: "operand",
                    operandType: "value",
                    sequence: [
                      {
                        type: "value",
                        value: "show",
                        valueType: "variable"
                      },
                      {
                        params: [],
                        refinementType: "call",
                        type: "refinement"
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  });
});
