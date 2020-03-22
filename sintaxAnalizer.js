const fsm = require("@sasha-z/fsm_js");
const { Machine, State, Transition } = fsm;

module.exports = function(tokens) {
  const stack = [];

  const assign = literal("assign");
  const comma = literal("comma");
  const _if = literal("_if");
  const _while = literal("_while");
  const _for = literal("_for");
  const _in = literal("_in");
  const _var = literal("_var");
  const l_brace = literal("l_brace");
  const r_brace = literal("r_brace");
  const nextStatement = literal("statementList", "eol");
  const toCollectionEnd2 = literal("collection_end", "r_square_bracket");
  const toArrayComma2 = literal("array_comma", "comma");
  const toDictionaryComma = literal("dictionary_comma", "comma");
  const toDictionaryColon2 = literal("dictionary_colon", "colon");
  const toCollectionRefinementEnd = literal(
    "collection_refinement_end",
    "r_square_bracket"
  );
  const toCallEnd = literal("call_end", "r_bracket");
  const toCall2 = literal("call", "comma");
  const toElse = literal("_else");
  const toElseLbrace = literal("else_l_brace", "l_brace");
  const toElseRbrace = literal("else_r_brace", "r_brace");
  const toValue = transitionToExpression("value", processToLast("variables"));
  const toStart = transitionToExpression("start", processToStatementStart);
  const toValue2 = transitionToExpression("value", processTo("value"));
  const toCondition = transitionToExpression(
    "condition",
    processTo("condition")
  );
  const toIterable = transitionToExpression("iterable", processTo("iterable"));
  const toExpression = transitionToExpression(
    "expression",
    processToLast("sequence")
  );
  const toArrayValue = transitionToExpression("array_value", processToArray);
  const toDictionaryValue = transitionToExpression(
    "dictionary_value",
    processToDictionary
  );
  const toCollectionKey = transitionToExpression(
    "collection_key",
    processToCollectionRefinement
  );
  const toParameter = transitionToExpression(
    "parameter",
    processToCallParamsList
  );
  const toStatementList = to(
    "statementList",
    () => true,
    () => ({
      machine: statementList(),
      processors: processTo("statements"),
      data: { type: "statement_list", list: [] }
    })
  );
  const toElseStatementList = to(
    "elseStatementList",
    () => true,
    () => ({
      machine: statementList(),
      processors: processTo("alternative"),
      data: { type: "statement_list", list: [] }
    })
  );
  const toVariableDeclaration = to("variableDeclaration", is("_var"), () => ({
    machine: variableDeclaration(),
    processors: processPush("list"),
    data: { type: "variable_declaration", variables: [] }
  }));
  const toIfStatement = to("ifStatement", is("_if"), () => ({
    machine: ifStatement(),
    processors: processPush("list"),
    data: { type: "if", condition: null, statements: [] }
  }));
  const toWhileStatement = to("whileStatement", is("_while"), () => ({
    machine: whileStatement(),
    processors: processPush("list"),
    data: { type: "while", condition: null, statements: [] }
  }));
  const toForStatement = to("forStatement", is("_for"), () => ({
    machine: forStatement(),
    processors: processPush("list"),
    data: {
      type: "for",
      iterable: null,
      iterator: null,
      statements: [],
      defineIterator: false
    }
  }));
  const toStatement = to("statement", is("identifier"), () => ({
    machine: statement(),
    processors: processPush("list"),
    data: { type: "statement", statementType: null }
  }));
  const toOperand = to(
    "operand",
    () => true,
    () => ({
      machine: refinement(),
      processors: processPush("sequence"),
      data: { type: "operand", operandType: "value", sequence: [] }
    })
  );
  const toParenting = transitionToSequence(
    () => ({ type: "operand", operandType: "parenting", value: null }),
    "parenting",
    "l_bracket"
  );
  const toOperator = transitionToSequence(
    v => ({ type: "operator", operator: v }),
    "operator"
  );
  const toNumber = transitionToSequence(
    v => ({ type: "value", valueType: "number", value: v }),
    "number"
  );
  const toString = transitionToSequence(
    v => ({ type: "value", valueType: "string", value: v }),
    "string"
  );
  const toNull = transitionToSequence(
    v => ({ type: "value", valueType: "_null", value: v }),
    "_null"
  );
  const toTrue = transitionToSequence(
    v => ({ type: "value", valueType: "_true", value: v }),
    "_true"
  );
  const toFalse = transitionToSequence(
    v => ({ type: "value", valueType: "_false", value: v }),
    "_false"
  );
  const toVariable = transitionToSequence(
    v => ({ type: "value", valueType: "variable", value: v }),
    "variable",
    "identifier"
  );
  const toCollectionStart = transitionToSequence(
    v => ({ type: "value", valueType: "collection", tmp: null }),
    "collection_start",
    "l_square_bracket"
  );
  const toDot = transitionToSequence(
    v => ({ type: "refinement", refinementType: "dot" }),
    "dot"
  );
  const toCollectionRefinement = transitionToSequence(
    v => ({
      type: "refinement",
      refinementType: "collection_refinement",
      key: null
    }),
    "collection_refinement",
    "l_square_bracket"
  );
  const toCall = transitionToSequence(
    v => ({ type: "refinement", refinementType: "call", params: [] }),
    "call",
    "l_bracket"
  );
  const toCollectionEnd = transitionToCollection(
    "collection_end",
    "r_square_bracket",
    "array",
    () => []
  );
  const toCollectionDictionaryDescriptor = transitionToCollection(
    "collection_dictionary_descriptor",
    "colon",
    "dictionary",
    () => []
  );
  const toCollectionEnd3 = transitionToCollection(
    "collection_end",
    "r_square_bracket",
    "array",
    t => [stringAsExpression(t)]
  );
  const toArrayComma = transitionToCollection(
    "array_comma",
    "comma",
    "array",
    t => [t]
  );
  const toFirstCollectionEntry = transitionToCollectionKey(
    "first_collection_entry"
  );
  const toDictionaryKey = transitionToCollectionKey("dictionary_key");
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
  const toIdentifier = Transition({
    to: "identifier",
    canTransite: tested => tested.type === "identifier",
    onTransition(to) {
      stack[stack.length - 1].data.variables.push({
        name: to.value,
        value: null
      });
    }
  });
  const toForVar = Transition({
    to: "forVar",
    canTransite: to => to.type === "_var",
    onTransition(to) {
      stack[stack.length - 1].data.defineIterator = true;
    }
  });
  const toIterator = Transition({
    to: "iterator",
    canTransite: to => to.type === "identifier",
    onTransition(to) {
      stack[stack.length - 1].data.iterator = to.value;
    }
  });
  const toAssign = Transition({
    to: "assign",
    canTransite: tested => {
      if (stack[stack.length - 1].data.statementType !== "assign") {
        return false;
      }
      return tested.type === "assign";
    }
  });
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

  // States
  // statement list
  const statementListState = State(
    "statementList",
    [
      nextStatement,
      toVariableDeclaration,
      toIfStatement,
      toWhileStatement,
      toForStatement,
      toStatement
    ],
    { initial: true }
  );
  const variableDeclarationState = State("variableDeclaration", [
    nextStatement
  ]);
  const statementState = State("statement", [nextStatement]);
  const ifStatementState = State("ifStatement", [nextStatement]);
  const whileStatementState = State("whileStatement", [nextStatement]);
  const forStatementState = State("forStatement", [nextStatement]);
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
  const whileStartState = State(null, [_while], { initial: true });
  const forStartState = State(null, [_for], { initial: true });
  const ifState = State("_if", [toCondition]);
  const whileState = State("_while", [toCondition]);
  const forState = State("_for", [toForVar, toIterator]);
  const conditionState = State("condition", [l_brace]);
  const whileConditionState = State("condition", [l_brace]);
  const ifLbraceState = State("l_brace", [toStatementList]);
  const whileLbraceState = State("l_brace", [toStatementList]);
  const forLbraceState = State("l_brace", [toStatementList]);
  const ifStatementListState = State("statementList", [r_brace]);
  const whileStatementListState = State("statementList", [r_brace]);
  const forStatementListState = State("statementList", [r_brace]);
  const ifRbraceState = State("r_brace", [toElse]);
  const whileRbraceState = State("r_brace");
  const forRbraceState = State("r_brace");
  const elseState = State("_else", [toElseLbrace]);
  const elseLbraceState = State("else_l_brace", [toElseStatementList]);
  const elseStatementListState = State("elseStatementList", [toElseRbrace]);
  const elseRbraceState = State("else_r_brace");
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
  const forVarState = State("forVar", [toIterator]);
  const forIteratorState = State("iterator", [_in]);
  const forInState = State("_in", [toIterable]);
  const forIterableState = State("iterable", [l_brace]);

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
        ifStatementState,
        whileStatementState,
        forStatementState
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
        ifRbraceState,
        elseState,
        elseLbraceState,
        elseStatementListState,
        elseRbraceState
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("ifStatement")
      }
    );
  }

  function whileStatement() {
    return Machine(
      [
        whileStartState,
        whileState,
        whileConditionState,
        whileLbraceState,
        whileStatementListState,
        whileRbraceState
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("whileStatement")
      }
    );
  }

  function forStatement() {
    return Machine(
      [
        forStartState,
        forState,

        forVarState,
        forIteratorState,
        forInState,
        forIterableState,

        forLbraceState,
        forStatementListState,
        forRbraceState
      ],
      {
        onUnsupportedTransition: onUnsupportedTransition("forStatement")
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
      throw new Error(`it's error to have ${t} after ${f} in "${machineName}"`);
    };
  }

  // Create transitions
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
  function transitionToSequence(createData, transiteTo, type) {
    return Transition({
      to: transiteTo,
      canTransite: to => to.type === (type || transiteTo),
      onTransition: to =>
        stack[stack.length - 1].data.sequence.push(createData(to.value))
    });
  }
  function transitionToCollectionKey(to) {
    return Transition({
      to: to,
      canTransite: to => to.type === "string",
      onTransition: to => {
        const sequence = stack[stack.length - 1].data.sequence;
        sequence[sequence.length - 1].tmp = to.value;
      }
    });
  }
  function transitionToCollection(to, type, valueType, crateList) {
    return Transition({
      to: to,
      canTransite: to => to.type === type,
      onTransition: () => {
        const sequence = stack[stack.length - 1].data.sequence;
        const last = sequence[sequence.length - 1];
        last.valueType = valueType;
        last.list = crateList(last.tmp);
        delete last.tmp;
      }
    });
  }
  function transitionToExpression(name, processor) {
    return to(
      name,
      () => true,
      () => ({
        machine: expression(),
        processors: processor,
        data: {
          type: "expression",
          sequence: []
        }
      })
    );
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

  // Processors
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
