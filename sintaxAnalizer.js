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
  const toVariableDeclaration = to("variableDeclaration", is("_var"), () => ({
    machine: variableDeclaration(),
    processors: processPush("list"),
    data: {
      type: "variable_declaration",
      variables: []
    }
  }));
  const toIfStatement = to("ifStatement", is("_if"), () => ({
    machine: ifStatement(),
    processors: processPush("list"),
    data: {
      type: "if",
      condition: null,
      statements: []
    }
  }));
  const toStatement = to("statement", is("identifier"), () => ({
    machine: statement(),
    processors: processPush("list"),
    data: {
      type: "statement",
      statementType: null
    }
  }));
  const toIdentifier = identifier(value => {
    stack[stack.length - 1].data.variables.push({
      name: value,
      value: null
    });
  });
  const toValue = to(
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
  );
  const toStart = to(
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
  );
  const toAssign = Transition({
    to: "assign",
    canTransite: tested => {
      if (stack[stack.length - 1].data.statementType !== "assign") {
        return false;
      }
      return tested.type === "assign";
    }
  });
  // TODO change toValue
  const toValue2 = to(
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
  );
  const toCondition = to(
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
  );
  const toStatementList = to(
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
  );
  const toUnaryOperator = Transition({
    to: "unary_operator",
    canTransite: to =>
      to.type === "operator" && (to.value === "-" || to.value === "!"),
    onTransition: to =>
      stack[stack.length - 1].data.sequence.push({
        type: "unary_operator",
        operator: to.value
      })
  });
  const toParenting = Transition({
    to: "parenting",
    canTransite: to => to.type === "l_bracket",
    onTransition: () =>
      stack[stack.length - 1].data.sequence.push({
        type: "operand",
        operandType: "parenting",
        value: null
      })
  });
  const toOperand = to(
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
  );
  const toExpression = to(
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
  );
  const toOperator = Transition({
    to: "operator",
    canTransite: to => to.type === "operator",
    onTransition: to =>
      stack[stack.length - 1].data.sequence.push({
        type: "operator",
        operator: to.value
      })
  });
  // TODO
  const toOperand2 = Transition({
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
  });
  const toNumber = Transition({
    to: "number",
    canTransite: to => to.type === "number",
    onTransition: to =>
      stack[stack.length - 1].data.sequence.push({
        type: "value",
        valueType: "number",
        value: to.value
      })
  });
  const toString = Transition({
    to: "string",
    canTransite: to => to.type === "string",
    onTransition: to =>
      stack[stack.length - 1].data.sequence.push({
        type: "value",
        valueType: "string",
        value: to.value
      })
  });
  const toNull = Transition({
    to: "_null",
    canTransite: to => to.type === "_null",
    onTransition: to =>
      stack[stack.length - 1].data.sequence.push({
        type: "value",
        valueType: "_null",
        value: to.value
      })
  });
  const toTrue = Transition({
    to: "_true",
    canTransite: to => to.type === "_true",
    onTransition: to =>
      stack[stack.length - 1].data.sequence.push({
        type: "value",
        valueType: "_true",
        value: to.value
      })
  });
  const toFalse = Transition({
    to: "_false",
    canTransite: to => to.type === "_false",
    onTransition: to =>
      stack[stack.length - 1].data.sequence.push({
        type: "value",
        valueType: "_false",
        value: to.value
      })
  });
  const toVariable = Transition({
    to: "variable",
    canTransite: to => to.type === "identifier",
    onTransition: to =>
      stack[stack.length - 1].data.sequence.push({
        type: "value",
        valueType: "variable",
        value: to.value
      })
  });
  const toCollectionStart = Transition({
    to: "collection_start",
    canTransite: to => to.type === "l_square_bracket",
    onTransition: () =>
      stack[stack.length - 1].data.sequence.push({
        type: "value",
        valueType: "collection",
        tmp: null
      })
  });
  const toCollectionEnd = Transition({
    to: "collection_end",
    canTransite: to => to.type === "r_square_bracket",
    onTransition: () => {
      const sequence = stack[stack.length - 1].data.sequence;
      const last = sequence[sequence.length - 1];
      last.valueType = "array";
      last.list = [];
      delete last.tmp;
    }
  });
  const toCollectionDictionaryDescriptor = Transition({
    to: "collection_dictionary_descriptor",
    canTransite: to => to.type === "colon",
    onTransition: () => {
      const sequence = stack[stack.length - 1].data.sequence;
      const last = sequence[sequence.length - 1];
      last.valueType = "dictionary";
      last.list = [];
      delete last.tmp;
    }
  });
  const toFirstCollectionEntry = Transition({
    to: "first_collection_entry",
    canTransite: to => to.type === "string",
    onTransition: to => {
      const sequence = stack[stack.length - 1].data.sequence;
      sequence[sequence.length - 1].tmp = to.value;
    }
  });
  const toArrayValue = to(
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
  );
  // TODO
  const toCollectionEnd2 = Transition({
    to: "collection_end",
    canTransite: to => to.type === "r_square_bracket"
  });
  const toCollectionEnd3 = Transition({
    to: "collection_end",
    canTransite: to => to.type === "r_square_bracket",
    onTransition: () => {
      const sequence = stack[stack.length - 1].data.sequence;
      const last = sequence[sequence.length - 1];
      last.valueType = "array";
      last.list = [stringAsExpression(last.tmp)];
      delete last.tmp;
    }
  });
  const toArrayComma = Transition({
    to: "array_comma",
    canTransite: to => to.type === "comma",
    onTransition: () => {
      const sequence = stack[stack.length - 1].data.sequence;
      const last = sequence[sequence.length - 1];
      last.valueType = "array";
      last.list = [last.tmp];
      delete last.tmp;
    }
  });
  const toDictionaryColon = Transition({
    to: "dictionary_colon",
    canTransite: to => to.type === "colon",
    onTransition: () => {
      const sequence = stack[stack.length - 1].data.sequence;
      const last = sequence[sequence.length - 1];
      last.valueType = "dictionary";
      last.list = [];
    }
  });
  const toDictionaryValue = to(
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
  );
  const toArrayComma2 = Transition({
    to: "array_comma",
    canTransite: to => to.type === "comma"
  });
  const toDictionaryComma = Transition({
    to: "dictionary_comma",
    canTransite: to => to.type === "comma"
  });
  const toDictionaryKey = Transition({
    to: "dictionary_key",
    canTransite: to => to.type === "string",
    onTransition: to => {
      const sequence = stack[stack.length - 1].data.sequence;
      sequence[sequence.length - 1].tmp = to.value;
    }
  });
  const toDictionaryColon2 = Transition({
    to: "dictionary_colon",
    canTransite: to => to.type === "colon"
  });
  const toDot = Transition({
    to: "dot",
    canTransite: to => to.type === "dot",
    onTransition: () => {
      const sequence = stack[stack.length - 1].data.sequence;
      sequence.push({
        type: "refinement",
        refinementType: "dot"
      });
    }
  });
  const toCollectionRefinement = Transition({
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
  });
  const toCall = Transition({
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
  });
  const toCollectionKey = to(
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
  );
  const toCollectionRefinementEnd = Transition({
    to: "collection_refinement_end",
    canTransite: to => to.type === "r_square_bracket"
  });
  const toCallEnd = Transition({
    to: "call_end",
    canTransite: to => to.type === "r_bracket"
  });
  const toParameter = to(
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
  );
  const toCall2 = Transition({
    to: "call",
    canTransite: to => to.type === "comma"
  });

  // States
  // statement list
  const statementListState = State(
    "statementList",
    [nextStatement, toVariableDeclaration, toIfStatement, toStatement],
    { initial: true }
  );
  const variableDeclarationState = State("variableDeclaration", [
    nextStatement
  ]);
  const statementState = State("statement", [nextStatement]);
  const ifStatementState = State("ifStatement", [nextStatement]);
  //var declaration
  const varStart = State(null, [_var], { initial: true });
  const varState = State("_var", [toIdentifier]);
  const identifierState = State("identifier", [assign, comma]);
  const commaState = State("comma", [toIdentifier]);
  const assignState = State("assign", [toValue]);
  const valueState = State("value", [comma]);
  //statement
  const statementFirstState = State(null, [toStart]);
  const startState = State("start", [toAssign]);
  const statementAssignState = State("assign", [toValue2]);
  const statementLastState = State("value");
  // if
  const ifStartState = State(null, [_if], { initial: true });
  const ifState = State("_if", [toCondition]);
  const conditionState = State("condition", [l_brace]);
  const ifLbraceState = State("l_brace", [toStatementList]);
  const ifStatementListState = State("statementList", [r_brace]);
  const ifRbraceState = State("r_brace");
  // expression
  const expressionStart = State(
    null,
    [toUnaryOperator, toParenting, toOperand],
    {
      initial: true
    }
  );
  const unaryOperatorState = State("unary_operator", [toParenting, toOperand]);
  const parentingState = State("parenting", [toExpression]);
  const operandState = State("operand", [toOperator]);
  const expressionState = State("expression", [toOperand2]);
  const operatorState = State("operator", [
    toUnaryOperator,
    toParenting,
    toOperand
  ]);
  //refinement
  const refinementStartState = State(
    null,
    [
      toNumber,
      toString,
      toNull,
      toTrue,
      toFalse,
      toVariable,
      toCollectionStart
    ],
    { initial: true }
  );
  const collectionStartState = State("collection_start", [
    toCollectionEnd,
    toCollectionDictionaryDescriptor,
    toFirstCollectionEntry,
    toArrayValue
  ]);
  const collectionDictionaryDescriptorState = State(
    "collection_dictionary_descriptor",
    [toCollectionEnd2]
  );
  const firstCollectionEntryState = State("first_collection_entry", [
    toCollectionEnd3,
    toArrayComma,
    toDictionaryColon
  ]);
  const arrayCommaState = State("array_comma", [toArrayValue]);
  const dictionaryColonState = State("dictionary_colon", [toDictionaryValue]);
  const arrayValueState = State("array_value", [
    toArrayComma2,
    toCollectionEnd2
  ]);
  const dictionaryValueState = State("dictionary_value", [
    toDictionaryComma,
    toCollectionEnd2
  ]);
  const dictionaryCommaState = State("dictionary_comma", [toDictionaryKey]);
  const dictionaryKeyState = State("dictionary_key", [toDictionaryColon2]);
  const numberState = State("number", [toDot]);
  const stringState = State("string", [toDot]);
  const nullState = State("_null", [toDot]);
  const falseState = State("_false", [toDot]);
  const trueState = State("_true", [toDot]);
  const collectionEndState = State("collection_end", [toDot]);
  const variableState = State("variable", [
    toDot,
    toCollectionRefinement,
    toCall
  ]);
  const dotState = State("dot", [toVariable]);
  const collectionRefinementState = State("collection_refinement", [
    toCollectionKey
  ]);
  const collectionKeyState = State("collection_key", [
    toCollectionRefinementEnd
  ]);
  const collectionRefinementEndState = State("collection_refinement_end", [
    toDot,
    toCollectionRefinement
  ]);
  const callState = State("call", [toCallEnd, toParameter]);
  const callEndState = State("call_end", [toDot, toCollectionRefinement]);
  const parameterState = State("parameter", [toCallEnd, toCall2]);

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
