var lexerjs = require("js-lexer");
var fs = require("fs");
var rules = require("./rules.js");
var analize = require("./sintaxAnalizer.js");
var lexer = lexerjs.lexer;

const path = process.argv[process.argv.length - 1];
const sourceCode = fs.readFileSync(path, 'utf-8');
const tokens = lexer(sourceCode, rules);
const ast = analize(tokens);

const funcList = {
  print: message => console.log(message)
};

const variables = {};

const processors = {
  'statement_list': node => {
    node.list.forEach(node => execute(node));
  },
  'call': node => {
    funcList[node.called].apply(null, node.params.map(param => execute(param)));
  },
  'expression': node => {
    return execute(node.value);
  },
  'variable': node => {
    return variables[node.value];
  },
  'value': node => {
    if (node.valueType === 'number') {
      return parseFloat(node.value);
    } else if (node.valueType === 'string') {
      return node.value.slice(1, -1);
    } else if (node.valueType === '_true') {
      return true;
    } else if (node.valueType === '_false') {
      return false;
    } else if (node.valueType === 'null') {
      return null;
    }
    return null;
  },
  'variable_declaration': node => {
    node.variables.forEach(variable => {
      variables[variable.name] = execute(variable.value);
    });
  },
  'assign': node => {
    variables[node.target] = execute(node.value);
  },
  'if': node => {
    if (execute(node.condition)) {
      execute(node.statements);
    }
  }
};

function execute(node) {
  if (!node) {
    return null;
  }
  return processors[node.type](node);
}

execute(ast);