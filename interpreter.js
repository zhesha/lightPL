const variables = {
  print: message => console.log(message)
};

const operationPriority = {
  operator: {
    "&&": 0,
    "||": 0,
    "==": 10,
    "!=": 10,
    ">=": 10,
    "<=": 10,
    ">": 10,
    "<": 10,
    "+": 20,
    "-": 20,
    "*": 30,
    "/": 30
  },
  unary_operator: {
    "-": 40,
    "!": 40
  }
};

const operationsList = {
  operator: {
    "+": (l, r) => l + r,
    "-": (l, r) => l - r,
    "*": (l, r) => l * r,
    "/": (l, r) => l / r,
    "==": (l, r) => l === r,
    "!=": (l, r) => l !== r,
    ">=": (l, r) => l >= r,
    "<=": (l, r) => l <= r,
    "&&": (l, r) => l && r,
    "||": (l, r) => l || r,
    ">": (l, r) => l > r,
    "<": (l, r) => l < r
  },
  unary_operator: {
    "-": (l, r) => -r,
    "!": (l, r) => !r
  }
};

const processors = {
  statement_list: node => {
    node.list.forEach(node => execute(node));
  },
  statement: node => {
    if (node.statementType === "call") {
      execute(node.called);
    } else if (node.statementType === "assign") {
      processors.assign(node);
    } else {
      throw `Unknown statementType: ${node.statementType}`;
    }
  },
  expression: node => {
    return processors.expressionSequence(node.sequence);
  },
  operand: node => {
    if (node.operandType === "value") {
      return processors.operandValue(node);
    } else if (node.operandType === "parenting") {
      return processors.operandParenting(node);
    } else {
      throw `Unknown operandType: ${node.operandType}`;
    }
  },
  value: node => {
    if (node.valueType === "number") {
      return parseFloat(node.value);
    } else if (node.valueType === "string") {
      return node.value.slice(1, -1);
    } else if (node.valueType === "_true") {
      return true;
    } else if (node.valueType === "_false") {
      return false;
    } else if (node.valueType === "null") {
      return null;
    } else if (node.valueType === "variable") {
      return variables[node.value];
    } else {
      throw 'Unknown value type'
    }
    return null;
  },
  variable_declaration: node => {
    node.variables.forEach(variable => {
      variables[variable.name] = execute(variable.value);
    });
  },
  if: node => {
    if (execute(node.condition)) {
      execute(node.statements);
    } else {
      execute(node.alternative);
    }
  },
  while: node => {
    while (execute(node.condition)) {
      execute(node.statements);
    }
  },
  for: node => {
    // TODO
  },
  assign: node => {
    if (node.target.sequence.length !== 1) {
      throw `Assign error`;
    }
    const targets = node.target.sequence[0].sequence;

    if (targets.length === 1) {
      variables[targets[0].value] = execute(node.value);
    } else {
      let obj = variables;
      let target;
      for (let i = 0; i < targets.length - 1; i++) {
        target = targets[i];
        if (target.type === "value") {
          obj = obj[target.value];
        } else if (
          target.type === "refinement" &&
          target.refinementType === "dot"
        ) {
          i++;
        } else if (
          target.type === "refinement" &&
          target.refinementType === "collection_refinement"
        ) {
          // TODO it didn't work with variables
          // TODO if it's function return undefined, need to check when functions call will be done
          obj = obj[execute(target.key)];
        } else {
          throw `Incorrect assign target`;
        }
      }
      target = targets[targets.length - 1];
      if (target.type === "value") {
        obj[target.value] = execute(node.value);
      } else if (
        target.type === "refinement" &&
        target.refinementType === "collection_refinement"
      ) {
        obj[execute(target.key)] = execute(node.value);
      } else {
        throw `Incorrect assign target`;
      }
    }
  },
  operandValue: node => {
    if (node.sequence.length === 1) {
      return execute(node.sequence[0]);
    } else {
      return processors.refinementSequence(node.sequence);
    }
  },
  refinementSequence: sequence => {
    let value = variables;
    for (let item of sequence) {
      if (item.type === "value" && item.valueType === "variable") {
        value = value[item.value];
      } else if (item.type === "refinement" && item.refinementType === "call") {
        value = value.apply(null, item.params.map(param => execute(param)));
      } else if (item.type === "refinement" && item.refinementType === "collection_refinement") {
        value = value[execute(item.key)];
      } else if (item.type === "refinement" && item.refinementType === "dot") {
        // Do nothing
      } else {
        throw "Unknown sequence type";
      }
    }
    return value;
  },
  operandParenting: node => {
    return execute(node.value);
  },
  expressionSequence: sequence => {
    if (sequence.length === 1) {
      return execute(sequence[0]);
    } else {
      const index = getMinPriorityOperation(sequence);
      let left;
      if (index !== 0) {
        left = processors.expressionSequence(sequence.slice(0, index));
      }
      const right = processors.expressionSequence(sequence.slice(index + 1));
      return commitOperation(sequence[index], left, right);
    }
  }
};

function getMinPriorityOperation(sequence) {
  let priority = Number.MAX_VALUE,
    index = 0;
  for (let i = 0; i < sequence.length; i++) {
    let item = sequence[i];
    if (item.type !== "operand") {
      let current = operationPriority[item.type][item.operator];
      if (current <= priority) {
        index = i;
        priority = current;
      }
    }
  }
  return index;
}
function commitOperation(operation, left, right) {
  return operationsList[operation.type][operation.operator](left, right);
}

function execute(node) {
  if (!node) {
    return null;
  }
  if (processors[node.type]) {
    return processors[node.type](node);
  } else {
    throw Error(`Unknown node type: ${node.type}`);
  }
}

// execute(ast);
module.exports = execute;
