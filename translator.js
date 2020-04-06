const predefined = {
  print: "console.log"
};

const operations = {
  operator: {
    "+": '+',
    "-": '-',
    "*": '*',
    "/": '/',
    "==": '===',
    "!=": '!==',
    ">=": '>=',
    "<=": '<=',
    "&&": '&&',
    "||": '||',
    ">": '>',
    "<": '<'
  },
  unary_operator: {
    "-": '-',
    "!": '!'
  }
};

const processors = {
  statement_list: node => {
    return node.list.map(node => execute(node)).join("");
  },
  statement: node => {
    if (node.statementType === "call") {
      return execute(node.called);
    } else if (node.statementType === "assign") {
      return assign(node);
    } else {
      throw `Unknown statementType: ${node.statementType}`;
    }
  },
  expression: node => {
    return expressionSequence(node.sequence);
  },
  operand: node => {
    if (node.operandType === "value") {
      return operandValue(node);
    } else if (node.operandType === "parenting") {
      return operandParenting(node);
    } else {
      throw `Unknown operandType: ${node.operandType}`;
    }
  },
  value: node => {
    if (node.valueType === "number") {
      return node.value;
    } else if (node.valueType === "string") {
      return node.value;
    } else if (node.valueType === "_true") {
      return true;
    } else if (node.valueType === "_false") {
      return false;
    } else if (node.valueType === "null") {
      return null;
    } else if (node.valueType === "variable") {
      return node.value;
    } else if (node.valueType === "array") {
      return "[" + node.list.map(i => execute(i)) + "]";
    } else if (node.valueType === "dictionary") {
      let obj = [];
      for (let i of node.list) {
        obj.push(i.key + ":" + execute(i.value));
      }
      return "{" + obj.join(",") + "}";
    } else {
      throw "Unknown value type";
    }
    return null;
  },
  variable_declaration: node => {
    return (
      "var " +
      node.variables
        .map(variable => {
          return variable.name + "=" + execute(variable.value);
        })
        .join(",") +
      ";"
    );
  },
  if: node => {
    let result =
      "if(" + execute(node.condition) + "){" + execute(node.statements) + "}";

    if (node.alternative) {
      result += "else{" + execute() + "}";
    }

    return result;
  },
  while: node => {
    return (
      "while(" + execute(node.condition) + "){" + execute(node.statements) + "}"
    );
  },
  for: node => {
    return "let _it = " +
      execute(node.iterable) +
      ";" +
      (node.defineIterator ? "let " + node.iterator + ";" : "") +
      "for(let _key in _it){" +
      node.iterator +
      "=_it[_key];" +
      execute(node.statements) +
      "}";
  }
};

function assign(node) {
  if (node.target.sequence.length !== 1) {
    throw `Assign error`;
  }
  const target = execute(node.target);
  return `${target}=${execute(node.value)};`;
}

function expressionSequence(sequence) {
  return sequence
    .map(i => {
      if (i.type === "operand") {
        return execute(i);
      } else if (i.type === "operator") {
        return operations.operator[i.operator];
      } else if (i.type === "unary_operator") {
        return operations.unary_operator[i.operator];
      } else {
        throw "Unknown expression sequence entry";
      }
    })
    .join("");
}

function operandValue(node) {
  if (node.sequence.length === 1) {
    return execute(node.sequence[0]);
  } else {
    return refinementSequence(node.sequence);
  }
}

function refinementSequence(sequence) {
  let result = "";
  if (
    sequence[0].type === "value" &&
    sequence[0].valueType === "variable" &&
    predefined[sequence[0].value]
  ) {
    sequence[0].value = predefined[sequence[0].value];
  }
  for (let item of sequence) {
    if (item.type === "value" && item.valueType === "variable") {
      result += item.value;
    } else if (item.type === "refinement" && item.refinementType === "call") {
      result += "(" + item.params.map(param => execute(param)).join(",") + ")";
    } else if (
      item.type === "refinement" &&
      item.refinementType === "collection_refinement"
    ) {
      result += "[" + execute(item.key) + "]";
    } else if (item.type === "refinement" && item.refinementType === "dot") {
      result += ".";
    } else {
      throw "Unknown sequence type";
    }
  }
  return result;
}

function operandParenting(node) {
  return "(" + execute(node.value) + ")";
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

module.exports = execute;
