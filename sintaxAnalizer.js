var fsm = require("@sasha-z/fsm_js");
var { Machine, State, Transition } = fsm;

module.exports = function(tokens) {
  let variableDeclarationData;
  let statementListData = [];
  let assignStatementData;
  let ifStatementData;
  const machines = [];
  const processors = [];

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
      variableDeclaration.restart();
      variableDeclarationData = [];
      variableDeclaration.go(to);
    }
  });

  const stayVariableDeclaration = Transition({
    to: "variableDeclaration",
    canTransite(to) {
      return variableDeclaration.canTransite(to);
    },
    onTransition(to) {
      variableDeclaration.go(to);
    }
  });

  const leaveVariableDeclaration = Transition({
    to: "statementList",
    canTransite(to) {
      return !variableDeclaration.canTransite(to);
    },
    onTransition(to) {
      statementListData[statementListData.length - 1].list.push({
        type: "variable_declaration",
        variables: variableDeclarationData
      });
    }
  });

  const identifier = Transition({
    to: "identifier",
    canTransite: tested => tested.type === "identifier",
    onTransition(to) {
      variableDeclarationData.push({
        name: to.value,
        value: null
      });
    }
  });

  const ifIdentifier = Transition({
    to: "identifier",
    canTransite: tested => tested.type === "identifier",
    onTransition(to) {
      ifStatementData.condition = to.value;
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
      variableDeclarationData[variableDeclarationData.length - 1].value =
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
      machines.push(ifStatement());
      processors.push(ifProcessor);
      ifStatementData = {
        type: "if",
        condition: null,
        statements: []
      };
      machines[machines.length - 1].go(to);
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
      machines.push(getStatementList());
      processors.push(statementListProcessor);
      statementListData.push({
        type: "statement_list",
        list: []
      });
      machines[machines.length - 1].go(to);
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
      statementListData[statementListData.length - 1].list.push(
        assignStatementData
      );
    }
  });

  const leaveIfStatement = Transition({
    to: "statementList",
    canTransite(to) {
      return true;
    }
  });

  const leaveStatementsList = Transition({
    to: "r_brace",
    canTransite(to) {
      return true
    }
  });

  var variableDeclaration = Machine(
    [
      State(null, [_var], { initial: true }),
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

  machines.push(getStatementList());
  processors.push(null);
  statementListData.push({
    type: "statement_list",
    list: []
  });

  for (var token of tokens) {
    if (machines[machines.length - 1].canTransite(token)) {
      machines[machines.length - 1].go(token);
    } else {
      machines.pop();
      const process = processors.pop();
      process && process();
      machines[machines.length - 1].go(token);
    }
  }
  for (var process of processors) {
    process && process();
  }
  machines[0].go({ type: "eol" });
  return statementListData[statementListData.length - 1];

  function getStatementList() {
    return Machine(
      [
        State(
          "statementList",
          [nextStatement, toVariableDeclaration, toAssignStatement, toIf],
          { initial: true }
        ),
        State("variableDeclaration", [
          stayVariableDeclaration,
          leaveVariableDeclaration
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

  function ifProcessor() {
    statementListData[statementListData.length - 1].list.push(
      ifStatementData
    );
  }

  function statementListProcessor() {
    ifStatementData.statements = statementListData.pop();
  }
};
