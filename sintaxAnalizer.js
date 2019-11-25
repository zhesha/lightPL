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

  for (var token of tokens) {
    const entity = stack[stack.length - 1];
    if (entity.machine.canTransite(token)) {
      entity.machine.go(token);
    } else {
      entity.processors && entity.processors();
      stack.pop();
      stack[stack.length - 1].machine.go(token);
    }
  }
  for (var entity of stack) {
    entity.processors && entity.processors();
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
            to("assignStatement", is("identifier"), () => ({
              machine: assignStatement(),
              processors: processToStatement,
              data: {
                type: "assign",
                target: null,
                value: null
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
            })),
          ],
          { initial: true }
        ),
        State("variableDeclaration", [nextStatement]),
        State("assignStatement", [nextStatement]),
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
        State(null, [_var], {initial: true}),
        State("_var", [identifier(value => {
          stack[stack.length - 1].data.variables.push({
            name: value,
            value: null
          });
        })]),
        State("identifier", [assign, comma]),
        State("comma", [identifier(value => {
          stack[stack.length - 1].data.variables.push({
            name: value,
            value: null
          });
        })]),
        State("assign", [value(value => {
          const data = stack[stack.length - 1].data;
          data.variables[data.variables.length - 1].value = value;
        })]),
        State("value", [comma])
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("variableDeclaration")
      }
    );
  }

  function assignStatement(){
    return Machine(
      [
        State(null, [identifier(value => {
          stack[stack.length - 1].data.target = value;
        })], { initial: true }),
        State("identifier", [assign]),
        State("assign", [value(value => {
          stack[stack.length - 1].data.value = value;
        })]),
        State("value")
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
        State("_if", [identifier(value => {
          stack[stack.length - 1].data.condition = value;
        })]),
        State("identifier", [l_brace]),
        State("l_brace", [to("statementList", () => true, () => ({
          machine: statementList(),
          processors: processToIf,
          data: {
            type: "statement_list",
            list: []
          }
        }))]),
        State("statementList", [r_brace]),
        State("r_brace")
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("ifStatement")
      }
    );
  }

  function onUnsupportedTransition (machineName) {
    return (from, to) => {
      const t = to ? to.type : "nothing";
      const f = from ? from.type : "nothing";
      throw `it's error to have ${t} after ${f} in "${machineName}"`;
    }
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

  function value(handler) {
    return Transition({
      to: "value",
      canTransite: tested => {
        return (
          tested.type === "number" ||
          tested.type === "string" ||
          tested.type === "_null" ||
          tested.type === "_false" ||
          tested.type === "_true"
        );
      },
      onTransition(to) {
        handler(to.value);
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
