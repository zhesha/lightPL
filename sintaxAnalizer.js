var fsm = require("@sasha-z/fsm_js");
var { Machine, State, Transition } = fsm;

module.exports = function(tokens) {
  let variableDeclarationData;
  let statementListData = [];
  let assignStatementData;
  let ifStatementData;
  const statementList = [];

  const toVariableDeclaration = Transition({
    to: "variableDeclaration",
    canTransite: tested => {
      return tested.type === "_var";
    },
    onTransition() {
      variableDeclaration.restart();
      variableDeclarationData = [];
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

  const assign = Transition({
    to: "assign",
    canTransite: tested => tested.type === "assign"
  });
  const comma = Transition({
    to: "comma",
    canTransite: tested => tested.type === "comma"
  });
  const emptyStatement = Transition({
    to: "statementList",
    canTransite: tested => tested.type === "eol"
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
      ifStatement.restart();
      ifStatementData = {
        type: "if",
        condition: null,
        statements: []
      };
    }
  });

  const toStatementList = Transition({
    to: "statementList",
    canTransite: tested => {
      return tested.type === "l_brace";
    },
    onTransition(to) {
      statementList.push(getStatementList());
      statementListData.push({
        type: "statement_list",
        list: []
      });
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

  const stayIfStatement = Transition({
    to: "ifStatement",
    canTransite(to) {
      return ifStatement.canTransite(to);
    },
    onTransition(to) {
      ifStatement.go(to);
    }
  });

  const leaveIfStatement = Transition({
    to: "statementList",
    canTransite(to) {
      return !ifStatement.canTransite(to);
    },
    onTransition(to) {
      statementListData[statementListData.length - 1].list.push(
        ifStatementData
      );
    }
  });

  const stayStatementsList = Transition({
    to: "statementList",
    canTransite(to) {
      return statementList[statementList.length - 1].canTransite(to);
    },
    onTransition(to) {
      statementList[statementList.length - 1].go(to);
    }
  });

  const leaveStatementsList = Transition({
    to: "r_brace",
    canTransite(to) {
      return !statementList[statementList.length - 1].canTransite(to);
    },
    onTransition(to) {
      statementList.pop();
      ifStatementData.statements = statementListData.pop();
    }
  });

  var variableDeclaration = Machine(
    [
      State(null, [identifier], { initial: true }),
      State("identifier", [assign, comma]),
      State("comma", [identifier]),
      State("assign", [varDeclarationValue]),
      State("varDeclarationValue", [comma])
    ],
    {
      onUnsupportedTransition(from, to) {
        const t = to ? to.type : "nothing";
        const f = from ? from.type : "nothing";
        throw `it's error to have ${t} after ${f} in "variableDeclaration"`;
      }
    }
  );

  const assignStatement = Machine(
    [
      State("identifier", [assign], { initial: true }),
      State("assign", [assignValue]),
      State("assignValue")
    ],
    {
      onUnsupportedTransition(from, to) {
        const t = to ? to.type : "nothing";
        const f = from ? from.type : "nothing";
        throw `it's error to have ${t} after ${f} in "variableDeclaration"`;
      }
    }
  );

  const ifStatement = Machine(
    [
      State("_if", [ifIdentifier], { initial: true }),
      State("identifier", [toStatementList]),
      State("statementList", [stayStatementsList, leaveStatementsList]),
      State("r_brace")
    ],
    {
      onUnsupportedTransition(from, to) {
        const t = to ? to.type : "nothing";
        const f = from ? from.type : "nothing";
        throw `it's error to have ${t} after ${f} in "variableDeclaration"`;
      }
    }
  );

  statementList.push(getStatementList());
  statementListData.push({
    type: "statement_list",
    list: []
  });

  for (var token of tokens) {
    statementList[0].go(token);
  }
  statementList[0].go({ type: "eol" });
  return statementListData[statementListData.length - 1];

  function getStatementList() {
    return Machine(
      [
        State(
          "statementList",
          [emptyStatement, toVariableDeclaration, toAssignStatement, toIf],
          { initial: true }
        ),
        State("variableDeclaration", [
          stayVariableDeclaration,
          leaveVariableDeclaration
        ]),
        State("assignStatement", [stayAssignStatement, leaveAssignStatement]),
        State("ifStatement", [stayIfStatement, leaveIfStatement])
      ],
      {
        onUnsupportedTransition(from, to) {
          const t = to ? to.type : "nothing";
          const f = from ? from.type : "nothing";
          throw `it's error to have ${t} after ${f} in "statementList"`;
        }
      }
    );
  }
};
