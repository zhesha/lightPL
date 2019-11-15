var fsm = require("@sasha-z/fsm_js");
var { Machine, State, Transition } = fsm;

module.exports = function(tokens) {
  let assignStatementData;
  const stack = [];

  const assign = literal("assign");
  const comma = literal("comma");
  const _if = literal("_if");
  const _var = literal("_var");
  const r_brace = literal("r_brace");
  const nextStatement = literal("statementList", "eol");

  const toVariableDeclaration = Transition({
    to: "variableDeclaration",
    canTransite: tested => {
      return tested.type === "_var";
    },
    onTransition(to) {
      stack.push({
        machine: variableDeclaration(),
        processors: processToStatement,
        data: {
          type: "variable_declaration",
          variables: []
        }
      });
      stack[stack.length - 1].machine.go(to);
    }
  });

  const identifier = Transition({
    to: "identifier",
    canTransite: tested => tested.type === "identifier",
    onTransition(to) {
      stack[stack.length - 1].data.variables.push({
        name: to.value,
        value: null
      });
    }
  });

  const ifIdentifier = Transition({
    to: "identifier",
    canTransite: tested => tested.type === "identifier",
    onTransition(to) {
      stack[stack.length - 1].data.condition = to.value;
    }
  });

  const varDeclarationValue = Transition({
    to: "varDeclarationValue",
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
      const data = stack[stack.length - 1].data;
      data.variables[data.variables.length - 1].value =
        to.value;
    }
  });

  const assignValue = Transition({
    to: "assignValue",
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
      assignStatementData.value = to.value;
    }
  });

  const toIf = Transition({
    to: "ifStatement",
    canTransite: tested => {
      return tested.type === "_if";
    },
    onTransition(to) {
      stack.push({
        machine: ifStatement(),
        processors: processToStatement,
        data: {
          type: "if",
          condition: null,
          statements: []
        }
      });
      stack[stack.length - 1].machine.go(to);
    }
  });

  const l_brace = Transition({
    to: "l_brace",
    canTransite: tested => {
      return tested.type === "l_brace";
    }
  });

  const toStatementList = Transition({
    to: "statementList",
    canTransite: tested => {
      return true;
    },
    onTransition(to) {
      stack.push({
        machine: getStatementList(),
        processors: processToIf,
        data: {
          type: "statement_list",
          list: []
        }
      });
      stack[stack.length - 1].machine.go(to);
    }
  });

  const toAssignStatement = Transition({
    to: "assignStatement",
    canTransite: tested => {
      return tested.type === "identifier";
    },
    onTransition(to) {
      assignStatement.restart();
      assignStatementData = {
        type: "assign",
        target: to.value,
        value: null
      };
    }
  });

  const stayAssignStatement = Transition({
    to: "assignStatement",
    canTransite(to) {
      return assignStatement.canTransite(to);
    },
    onTransition(to) {
      assignStatement.go(to);
    }
  });

  const leaveAssignStatement = Transition({
    to: "statementList",
    canTransite(to) {
      return !assignStatement.canTransite(to);
    },
    onTransition(to) {
      stack[stack.length - 1].data.list.push(
        assignStatementData
      );
    }
  });

  function variableDeclaration() {
    return Machine(
      [
        State(null, [_var], {initial: true}),
        State("_var", [identifier]),
        State("identifier", [assign, comma]),
        State("comma", [identifier]),
        State("assign", [varDeclarationValue]),
        State("varDeclarationValue", [comma])
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("variableDeclaration")
      }
    );
  }


  const assignStatement = Machine(
    [
      State("identifier", [assign], { initial: true }),
      State("assign", [assignValue]),
      State("assignValue")
    ],
    {
      onUnsupportedTransition: onUnsupportedTransition("assignStatement")
    }
  );

  function ifStatement() {
    return Machine(
      [
        State(null, [_if], { initial: true }),
        State("_if", [ifIdentifier]),
        State("identifier", [l_brace]),
        State("l_brace", [toStatementList]),
        State("statementList", [r_brace]),
        State("r_brace")
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("ifStatement")
      }
    );
  }

  stack.push({
    machine: getStatementList(),
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
  stack[0].machine.go({ type: "eol" });
  for (var entity of stack) {
    entity.processors && entity.processors();
  }
  return stack[0].data;

  function getStatementList() {
    return Machine(
      [
        State(
          "statementList",
          [nextStatement, toVariableDeclaration, toAssignStatement, toIf],
          { initial: true }
        ),
        State("variableDeclaration", [
          nextStatement
        ]),
        State("assignStatement", [stayAssignStatement, leaveAssignStatement]),
        State("ifStatement", [nextStatement])
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("StatementList")
      }
    );
  }

  function literal(to, test) {
    return Transition({
      to: to,
      canTransite: tested => tested.type === (test || to)
    });
  }

  function onUnsupportedTransition (machineName) {
    return (from, to) => {
      const t = to ? to.type : "nothing";
      const f = from ? from.type : "nothing";
      throw `it's error to have ${t} after ${f} in "${machineName}"`;
    }
  }

  function processToStatement() {
    stack[stack.length - 2].data.list.push(stack[stack.length - 1].data);
  }

  function processToIf() {
    stack[stack.length - 2].data.statements = stack[stack.length - 1].data;
  }
};
