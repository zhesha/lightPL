var fsm = require("@sasha-z/fsm_js");
var { Machine, State, Transition } = fsm;

module.exports = function(tokens) {
  const stack = [];

  const assign = literal("assign");
  const comma = literal("comma");
  const _if = literal("_if");
  const _var = literal("_var");
  const l_brace = literal("l_brace");
  const r_brace = literal("r_brace");
  const nextStatement = literal("statementList", "eol");

  stack.push({
    machine: statementList(),
    processors: null,
    data: {
      type: "statement_list",
      list: []
    }
  });

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const entity = stack[stack.length - 1];
    if (entity.machine.canTransite(token)) {
      entity.machine.go(token);
    } else {
      entity.processors && entity.processors();
      stack.pop();
      i--;
    }
  }
  while (stack.length > 1) {
    const entity = stack[stack.length - 1];
    entity.processors && entity.processors();
    stack.pop();
  }
  return stack[0].data;

  function statementList() {
    return Machine(
      [
        State(
          "statementList",
          [
            nextStatement,
            to("variableDeclaration", is("_var"), () => ({
              machine: variableDeclaration(),
              processors: processToStatement,
              data: {
                type: "variable_declaration",
                variables: []
              }
            })),
            to("statement", is("identifier"), () => ({
              machine: statement(),
              processors: processToStatement,
              data: {
                type: "statement"
              }
            })),
            to("ifStatement", is("_if"), () => ({
              machine: ifStatement(),
              processors: processToStatement,
              data: {
                type: "if",
                condition: null,
                statements: []
              }
            }))
          ],
          { initial: true }
        ),
        State("variableDeclaration", [nextStatement]),
        State("statement", [nextStatement]),
        State("ifStatement", [nextStatement])
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("StatementList")
      }
    );
  }

  function variableDeclaration() {
    return Machine(
      [
        State(null, [_var], { initial: true }),
        State("_var", [
          identifier(value => {
            stack[stack.length - 1].data.variables.push({
              name: value,
              value: null
            });
          })
        ]),
        State("identifier", [assign, comma]),
        State("comma", [
          identifier(value => {
            stack[stack.length - 1].data.variables.push({
              name: value,
              value: null
            });
          })
        ]),
        State("assign", [
          to(
            "value",
            () => true,
            () => ({
              machine: expression(),
              processors: processToVarDeclaration,
              data: {
                type: "expression",
                value: null
              }
            })
          )
        ]),
        State("value", [comma])
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("variableDeclaration")
      }
    );
  }

  function statement() {
    const toParams = to(
      "params",
      () => true,
      () => ({
        machine: expression(),
        processors: processToCallParams,
        data: {
          type: "expression",
          value: null
        }
      })
    );
    return Machine(
      [
        State(
          null,
          [
            identifier(value => {
              stack[stack.length - 1].data.tmp = value;
            })
          ],
          { initial: true }
        ),
        State("identifier", [
          Transition({
            to: "assign",
            canTransite: tested => tested.type === "assign",
            onTransition: () =>
              (stack[stack.length - 1].data = {
                type: "assign",
                target: stack[stack.length - 1].data.tmp,
                value: null
              })
          }),
          Transition({
            to: "l_bracket",
            canTransite: tested => tested.type === "l_bracket",
            onTransition: () =>
              (stack[stack.length - 1].data = {
                type: "call",
                called: stack[stack.length - 1].data.tmp,
                params: []
              })
          })
        ]),
        State("assign", [
          to(
            "value",
            () => true,
            () => ({
              machine: expression(),
              processors: processToAssign,
              data: {
                type: "expression",
                value: null
              }
            })
          )
        ]),
        State("value"),
        State("l_bracket", [literal("r_bracket"), toParams]),
        State("comma", [toParams]),
        State("params", [literal("r_bracket"), comma]),
        State("r_bracket")
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("assignStatement")
      }
    );
  }

  function ifStatement() {
    return Machine(
      [
        State(null, [_if], { initial: true }),
        State("_if", [
          to(
            "condition",
            () => true,
            () => ({
              machine: expression(),
              processors: processToCondition,
              data: {
                type: "expression",
                value: null
              }
            })
          )
        ]),
        State("condition", [l_brace]),
        State("l_brace", [
          to(
            "statementList",
            () => true,
            () => ({
              machine: statementList(),
              processors: processToIf,
              data: {
                type: "statement_list",
                list: []
              }
            })
          )
        ]),
        State("statementList", [r_brace]),
        State("r_brace")
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("ifStatement")
      }
    );
  }

  function expression() {
    return Machine(
      [
        State(
          null,
          [
            val("number", 'value'),
            val("string", 'value'),
            val("_null", 'value'),
            val("_false", 'value'),
            val("_true", 'value'),
            val("identifier", 'variable')
          ],
          { initial: true }
        ),
        State("number"),
        State("string"),
        State("_null"),
        State("_false"),
        State("_true"),
        State("identifier")
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("expression")
      }
    );
  }

  function onUnsupportedTransition(machineName) {
    return (from, to) => {
      const t = to ? to.type : "nothing";
      const f = from ? from.type : "nothing";
      throw `it's error to have ${t} after ${f} in "${machineName}"`;
    };
  }

  function identifier(handler) {
    return Transition({
      to: "identifier",
      canTransite: tested => tested.type === "identifier",
      onTransition(to) {
        handler(to.value);
      }
    });
  }

  function val(type, valueType) {
    return Transition({
      to: type,
      canTransite: tested => tested.type === type,
      onTransition(to) {
        stack[stack.length - 1].data.value = {
          type: valueType,
          valueType: to.type,
          value: to.value
        };
      }
    });
  }

  function literal(to, test) {
    return Transition({
      to: to,
      canTransite: tested => tested.type === (test || to)
    });
  }

  function processToStatement() {
    stack[stack.length - 2].data.list.push(stack[stack.length - 1].data);
  }

  function processToIf() {
    stack[stack.length - 2].data.statements = stack[stack.length - 1].data;
  }

  function processToAssign() {
    stack[stack.length - 2].data.value = stack[stack.length - 1].data;
  }

  function processToVarDeclaration() {
    var variable = stack[stack.length - 2].data.variables;
    variable[variable.length - 1].value = stack[stack.length - 1].data;
  }

  function processToCondition() {
    stack[stack.length - 2].data.condition = stack[stack.length - 1].data;
  }

  function processToCallParams() {
    stack[stack.length - 2].data.params.push(stack[stack.length - 1].data);
  }

  function to(entity, canTransite, entry) {
    return Transition({
      to: entity,
      canTransite: canTransite,
      onTransition(to) {
        stack.push(entry());
        stack[stack.length - 1].machine.go(to);
      }
    });
  }

  function is(type) {
    return tested => {
      return tested.type === type;
    };
  }
};
