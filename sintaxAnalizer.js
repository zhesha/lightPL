const fsm = require("@sasha-z/fsm_js");
const { Machine, State, Transition } = fsm;

module.exports = function(tokens) {
  const stack = [];

  const assign = literal("assign");
  const comma = literal("comma");
  const _if = literal("_if");
  const _var = literal("_var");
  const l_brace = literal("l_brace");
  const r_brace = literal("r_brace");
  const nextStatement = literal("statementList", "eol");

  // States
  // statement list
  const statementListState = State(
    "statementList",
    [
      nextStatement,
      to("variableDeclaration", is("_var"), () => ({
        machine: variableDeclaration(),
        processors: processPush("list"),
        data: {
          type: "variable_declaration",
          variables: []
        }
      })),
      to("ifStatement", is("_if"), () => ({
        machine: ifStatement(),
        processors: processPush("list"),
        data: {
          type: "if",
          condition: null,
          statements: []
        }
      })),
      to("statement", is("identifier"), () => ({
        machine: statement(),
        processors: processPush("list"),
        data: {
          type: "statement",
          statementType: null
        }
      }))
    ],
    { initial: true }
  );
  const variableDeclarationState = State("variableDeclaration", [
    nextStatement
  ]);
  const statementState = State("statement", [nextStatement]);
  const ifStatementState = State("ifStatement", [nextStatement]);
  //var declaration
  const varStart = State(null, [_var], { initial: true });
  const varState = State("_var", [
    identifier(value => {
      stack[stack.length - 1].data.variables.push({
        name: value,
        value: null
      });
    })
  ]);
  const identifierState = State("identifier", [assign, comma]);
  const commaState = State("comma", [
    identifier(value => {
      stack[stack.length - 1].data.variables.push({
        name: value,
        value: null
      });
    })
  ]);
  const assignState = State("assign", [
    to(
      "value",
      () => true,
      () => ({
        machine: expression(),
        processors: processToLast("variables"),
        data: {
          type: "expression",
          sequence: []
        }
      })
    )
  ]);
  const valueState = State("value", [comma]);
  //statement
  const statementFirstState = State(null, [
    to(
      "start",
      () => true,
      () => ({
        machine: expression(),
        processors: processToStatementStart,
        data: {
          type: "expression",
          sequence: []
        }
      })
    )
  ]);
  const startState = State("start", [
    Transition({
      to: "assign",
      canTransite: tested => {
        if (stack[stack.length - 1].data.statementType !== "assign") {
          return false;
        }
        return tested.type === "assign";
      }
    })
  ]);
  const statementAssignState = State("assign", [
    to(
      "value",
      () => true,
      () => ({
        machine: expression(),
        processors: processTo("value"),
        data: {
          type: "expression",
          sequence: []
        }
      })
    )
  ]);
  const statementLastState = State("value");
  // if
  const ifStartState = State(null, [_if], { initial: true });
  const ifState = State("_if", [
    to(
      "condition",
      () => true,
      () => ({
        machine: expression(),
        processors: processTo("condition"),
        data: {
          type: "expression",
          sequence: []
        }
      })
    )
  ]);
  const conditionState = State("condition", [l_brace]);
  const ifLbraceState = State("l_brace", [
    to(
      "statementList",
      () => true,
      () => ({
        machine: statementList(),
        processors: processTo("statements"),
        data: {
          type: "statement_list",
          list: []
        }
      })
    )
  ]);
  const ifStatementListState = State("statementList", [r_brace]);
  const ifRbraceState = State("r_brace");
  // expression
  const expressionStart = State(null, createOperandTransitions(), {
    initial: true
  });
  const unaryOperatorState = State("unary_operator", [
    Transition({
      to: "parenting",
      canTransite: to => to.type === "l_bracket",
      onTransition: () =>
        stack[stack.length - 1].data.sequence.push({
          type: "operand",
          operandType: "parenting",
          value: null
        })
    }),
    to(
      "operand",
      () => true,
      () => ({
        machine: refinement(),
        processors: processPush("sequence"),
        data: {
          type: "operand",
          operandType: "value",
          sequence: []
        }
      })
    )
  ]);
  const parentingState = State("parenting", [
    to(
      "expression",
      () => true,
      () => ({
        machine: expression(),
        processors: processToLast("sequence"),
        data: {
          type: "expression",
          sequence: []
        }
      })
    )
  ]);
  const operandState = State("operand", [
    Transition({
      to: "operator",
      canTransite: to => to.type === "operator",
      onTransition: to =>
        stack[stack.length - 1].data.sequence.push({
          type: "operator",
          operator: to.value
        })
    })
  ]);
  const expressionState = State("expression", [
    Transition({
      to: "operand",
      canTransite: to => {
        const sequence = stack[stack.length - 1].data.sequence;
        const last = sequence[sequence.length - 1];
        return (
          to.type === "r_bracket" &&
          last.type === "operand" &&
          last.operandType === "parenting"
        );
      }
    })
  ]);
  const operatorState = State("operator", createOperandTransitions());
  //refinement
  const refinementStartState = State(
    null,
    [
      Transition({
        to: "number",
        canTransite: to => to.type === "number",
        onTransition: to =>
          stack[stack.length - 1].data.sequence.push({
            type: "value",
            valueType: "number",
            value: to.value
          })
      }),
      Transition({
        to: "string",
        canTransite: to => to.type === "string",
        onTransition: to =>
          stack[stack.length - 1].data.sequence.push({
            type: "value",
            valueType: "string",
            value: to.value
          })
      }),
      Transition({
        to: "_null",
        canTransite: to => to.type === "_null",
        onTransition: to =>
          stack[stack.length - 1].data.sequence.push({
            type: "value",
            valueType: "_null",
            value: to.value
          })
      }),
      Transition({
        to: "_true",
        canTransite: to => to.type === "_true",
        onTransition: to =>
          stack[stack.length - 1].data.sequence.push({
            type: "value",
            valueType: "_true",
            value: to.value
          })
      }),
      Transition({
        to: "_false",
        canTransite: to => to.type === "_false",
        onTransition: to =>
          stack[stack.length - 1].data.sequence.push({
            type: "value",
            valueType: "_false",
            value: to.value
          })
      }),
      Transition({
        to: "variable",
        canTransite: to => to.type === "identifier",
        onTransition: to =>
          stack[stack.length - 1].data.sequence.push({
            type: "value",
            valueType: "variable",
            value: to.value
          })
      }),
      Transition({
        to: "collection_start",
        canTransite: to => to.type === "l_square_bracket",
        onTransition: () =>
          stack[stack.length - 1].data.sequence.push({
            type: "value",
            valueType: "collection",
            tmp: null
          })
      })
    ],
    { initial: true }
  );
  const collectionStartState = State("collection_start", [
    Transition({
      to: "collection_end",
      canTransite: to => to.type === "r_square_bracket",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        const last = sequence[sequence.length - 1];
        last.valueType = "array";
        last.list = [];
        delete last.tmp;
      }
    }),
    Transition({
      to: "collection_dictionary_descriptor",
      canTransite: to => to.type === "colon",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        const last = sequence[sequence.length - 1];
        last.valueType = "dictionary";
        last.list = [];
        delete last.tmp;
      }
    }),
    Transition({
      to: "first_collection_entry",
      canTransite: to => to.type === "string",
      onTransition: to => {
        const sequence = stack[stack.length - 1].data.sequence;
        sequence[sequence.length - 1].tmp = to.value;
      }
    }),
    to(
      "array_value",
      () => true,
      () => ({
        machine: expression(),
        processors: processToArray,
        data: {
          type: "expression",
          sequence: []
        }
      })
    )
  ]);
  const collectionDictionaryDescriptorState = State(
    "collection_dictionary_descriptor",
    [
      Transition({
        to: "collection_end",
        canTransite: to => to.type === "r_square_bracket"
      })
    ]
  );
  const firstCollectionEntryState = State("first_collection_entry", [
    Transition({
      to: "collection_end",
      canTransite: to => to.type === "r_square_bracket",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        const last = sequence[sequence.length - 1];
        last.valueType = "array";
        last.list = [stringAsExpression(last.tmp)];
        delete last.tmp;
      }
    }),
    Transition({
      to: "array_comma",
      canTransite: to => to.type === "comma",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        const last = sequence[sequence.length - 1];
        last.valueType = "array";
        last.list = [last.tmp];
        delete last.tmp;
      }
    }),
    Transition({
      to: "dictionary_colon",
      canTransite: to => to.type === "colon",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        const last = sequence[sequence.length - 1];
        last.valueType = "dictionary";
        last.list = [];
      }
    })
  ]);
  const arrayCommaState = State("array_comma", [
    to(
      "array_value",
      () => true,
      () => ({
        machine: expression(),
        processors: processToArray,
        data: {
          type: "expression",
          sequence: []
        }
      })
    )
  ]);
  const dictionaryColonState = State("dictionary_colon", [
    to(
      "dictionary_value",
      () => true,
      () => ({
        machine: expression(),
        processors: processToDictionary,
        data: {
          type: "expression",
          sequence: []
        }
      })
    )
  ]);
  const arrayValueState = State("array_value", [
    Transition({
      to: "array_comma",
      canTransite: to => to.type === "comma"
    }),
    Transition({
      to: "collection_end",
      canTransite: to => to.type === "r_square_bracket"
    })
  ]);
  const dictionaryValueState = State("dictionary_value", [
    Transition({
      to: "dictionary_comma",
      canTransite: to => to.type === "comma"
    }),
    Transition({
      to: "collection_end",
      canTransite: to => to.type === "r_square_bracket"
    })
  ]);
  const dictionaryCommaState = State("dictionary_comma", [
    Transition({
      to: "dictionary_key",
      canTransite: to => to.type === "string",
      onTransition: to => {
        const sequence = stack[stack.length - 1].data.sequence;
        sequence[sequence.length - 1].tmp = to.value;
      }
    })
  ]);
  const dictionaryKeyState = State("dictionary_key", [
    Transition({
      to: "dictionary_colon",
      canTransite: to => to.type === "colon"
    })
  ]);
  const numberState = State("number", [
    Transition({
      to: "dot",
      canTransite: to => to.type === "dot",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        sequence.push({
          type: "refinement",
          refinementType: "dot"
        });
      }
    })
  ]);
  const stringState = State("string", [
    Transition({
      to: "dot",
      canTransite: to => to.type === "dot",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        sequence.push({
          type: "refinement",
          refinementType: "dot"
        });
      }
    })
  ]);
  const nullState = State("_null", [
    Transition({
      to: "dot",
      canTransite: to => to.type === "dot",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        sequence.push({
          type: "refinement",
          refinementType: "dot"
        });
      }
    })
  ]);
  const falseState = State("_false", [
    Transition({
      to: "dot",
      canTransite: to => to.type === "dot",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        sequence.push({
          type: "refinement",
          refinementType: "dot"
        });
      }
    })
  ]);
  const trueState = State("_true", [
    Transition({
      to: "dot",
      canTransite: to => to.type === "dot",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        sequence.push({
          type: "refinement",
          refinementType: "dot"
        });
      }
    })
  ]);
  const collectionEndState = State("collection_end", [
    Transition({
      to: "dot",
      canTransite: to => to.type === "dot",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        sequence.push({
          type: "refinement",
          refinementType: "dot"
        });
      }
    })
  ]);
  const variableState = State("variable", [
    Transition({
      to: "dot",
      canTransite: to => to.type === "dot",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        sequence.push({
          type: "refinement",
          refinementType: "dot"
        });
      }
    }),
    Transition({
      to: "collection_refinement",
      canTransite: to => to.type === "l_square_bracket",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        sequence.push({
          type: "refinement",
          refinementType: "collection_refinement",
          key: null
        });
      }
    }),
    Transition({
      to: "call",
      canTransite: to => to.type === "l_bracket",
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        sequence.push({
          type: "refinement",
          refinementType: "call",
          params: []
        });
      }
    })
  ]);
  const dotState = State("dot", [
    Transition({
      to: "variable",
      canTransite: to => to.type === "identifier",
      onTransition: to =>
        stack[stack.length - 1].data.sequence.push({
          type: "value",
          valueType: "variable",
          value: to.value
        })
    })
  ]);
  const collectionRefinementState = State("collection_refinement", [
    to(
      "collection_key",
      () => true,
      () => ({
        machine: expression(),
        processors: processToCollectionRefinement,
        data: {
          type: "expression",
          sequence: []
        }
      })
    )
  ]);
  const collectionKeyState = State("collection_key", [
    Transition({
      to: "collection_refinement_end",
      canTransite: to => to.type === "r_square_bracket"
    })
  ]);
  const collectionRefinementEndState = createRefAndCallEnd(
    "collection_refinement_end"
  );
  const callState = State("call", [
    Transition({
      to: "call_end",
      canTransite: to => to.type === "r_bracket"
    }),
    to(
      "parameter",
      () => true,
      () => ({
        machine: expression(),
        processors: processToCallParamsList,
        data: {
          type: "expression",
          sequence: []
        }
      })
    )
  ]);
  const callEndState = createRefAndCallEnd("call_end");
  const parameterState = State("parameter", [
    Transition({
      to: "call_end",
      canTransite: to => to.type === "r_bracket"
    }),
    Transition({
      to: "call",
      canTransite: to => to.type === "comma"
    })
  ]);

  // main
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
        statementListState,
        variableDeclarationState,
        statementState,
        ifStatementState
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("StatementList")
      }
    );
  }

  function variableDeclaration() {
    return Machine(
      [
        varStart,
        varState,
        identifierState,
        commaState,
        assignState,
        valueState
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("variableDeclaration")
      }
    );
  }

  function statement() {
    return Machine(
      [
        statementFirstState,
        startState,
        statementAssignState,
        statementLastState
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("statement")
      }
    );
  }

  function ifStatement() {
    return Machine(
      [
        ifStartState,
        ifState,
        conditionState,
        ifLbraceState,
        ifStatementListState,
        ifRbraceState
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("ifStatement")
      }
    );
  }

  function expression() {
    return Machine(
      [
        expressionStart,
        unaryOperatorState,
        parentingState,
        operandState,
        expressionState,
        operatorState
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("expression")
      }
    );
  }

  function refinement() {
    return Machine(
      [
        refinementStartState,
        collectionStartState,
        collectionDictionaryDescriptorState,
        firstCollectionEntryState,
        arrayCommaState,
        dictionaryColonState,
        arrayValueState,
        dictionaryValueState,
        dictionaryCommaState,
        dictionaryKeyState,
        numberState,
        stringState,
        nullState,
        falseState,
        trueState,
        collectionEndState,
        variableState,
        dotState,
        collectionRefinementState,
        collectionKeyState,
        collectionRefinementEndState,
        callState,
        callEndState,
        parameterState
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("refinement")
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

  function literal(to, test) {
    return Transition({
      to: to,
      canTransite: tested => tested.type === (test || to)
    });
  }

  function to(entity, canTransite, createEntry) {
    return Transition({
      to: entity,
      canTransite: canTransite,
      onTransition(to) {
        stack.push(createEntry());
        stack[stack.length - 1].machine.go(to);
      }
    });
  }

  function is(type) {
    return tested => tested.type === type;
  }

  function stringAsExpression(str) {
    return {
      type: "expression",
      sequence: [
        {
          type: "operand",
          operandType: "value",
          sequence: [
            {
              type: "value",
              value: str,
              valueType: "string"
            }
          ]
        }
      ]
    };
  }

  function createOperandTransitions() {
    return [
      Transition({
        to: "unary_operator",
        canTransite: to =>
          to.type === "operator" && (to.value === "-" || to.value === "!"),
        onTransition: to =>
          stack[stack.length - 1].data.sequence.push({
            type: "unary_operator",
            operator: to.value
          })
      }),
      Transition({
        to: "parenting",
        canTransite: to => to.type === "l_bracket",
        onTransition: () =>
          stack[stack.length - 1].data.sequence.push({
            type: "operand",
            operandType: "parenting",
            value: null
          })
      }),
      to(
        "operand",
        () => true,
        () => ({
          machine: refinement(),
          processors: processPush("sequence"),
          data: {
            type: "operand",
            operandType: "value",
            sequence: []
          }
        })
      )
    ];
  }

  function createRefAndCallEnd(identifier) {
    return State(identifier, [
      Transition({
        to: "dot",
        canTransite: to => to.type === "dot",
        onTransition: () => {
          const sequence = stack[stack.length - 1].data.sequence;
          sequence.push({
            type: "refinement",
            refinementType: "dot"
          });
        }
      }),
      Transition({
        to: "collection_refinement",
        canTransite: to => to.type === "l_square_bracket",
        onTransition: () => {
          const sequence = stack[stack.length - 1].data.sequence;
          sequence.push({
            type: "refinement",
            refinementType: "collection_refinement",
            key: null
          });
        }
      })
    ]);
  }

  function processTo(field) {
    return () =>
      (stack[stack.length - 2].data[field] = stack[stack.length - 1].data);
  }

  function processPush(field) {
    return () =>
      stack[stack.length - 2].data[field].push(stack[stack.length - 1].data);
  }

  function processToLast(field) {
    return () => {
      const lastField = stack[stack.length - 2].data[field];
      lastField[lastField.length - 1].value = stack[stack.length - 1].data;
    };
  }

  function processToCollectionRefinement() {
    const sequence = stack[stack.length - 2].data.sequence;
    const last = sequence[sequence.length - 1];
    last.key = stack[stack.length - 1].data;
  }

  function processToCallParamsList() {
    const sequence = stack[stack.length - 2].data.sequence;
    const last = sequence[sequence.length - 1];
    last.params.push(stack[stack.length - 1].data);
  }

  function processToArray() {
    const sequence = stack[stack.length - 2].data.sequence;
    const data = sequence[sequence.length - 1];
    if (data.valueType === "collection") {
      data.valueType = "array";
      data.list = [stack[stack.length - 1].data];
      delete data.tmp;
    } else {
      data.list.push(stack[stack.length - 1].data);
    }
  }

  function processToDictionary() {
    const sequence = stack[stack.length - 2].data.sequence;
    const data = sequence[sequence.length - 1];
    data.list.push({
      key: data.tmp,
      value: stack[stack.length - 1].data
    });
    delete data.tmp;
  }

  function processToStatementStart() {
    const expSequence = stack[stack.length - 1].data.sequence;
    const opSequence = expSequence[expSequence.length - 1].sequence;
    const lastOp = opSequence[opSequence.length - 1];
    const st = stack[stack.length - 2].data;
    if (lastOp.type === "refinement" && lastOp.refinementType === "call") {
      st.statementType = "call";
      st.called = stack[stack.length - 1].data;
    } else if (
      (lastOp.type === "refinement" &&
        lastOp.refinementType === "collection_refinement") ||
      (lastOp.type === "value" && lastOp.valueType === "variable") ||
      lastOp.type === "variable"
    ) {
      st.statementType = "assign";
      st.target = stack[stack.length - 1].data;
    }
  }
};
