var lexerjs = require("js-lexer");
var lexerResults = lexerjs.lexerResults;

function str(s) {
  return function (tested) {
    if (s == tested) {
      return lexerResults.exact;
    } else if (s.startsWith(tested)) {
      return lexerResults.start;
    } else {
      return lexerResults.none;
    }
  }
}

function char(c) {
  return function (tested) {
    if (tested == c) {
      return lexerResults.exact;
    } else {
      return lexerResults.none;
    }
  }
}

var rules = [
  {
    name: '_var',
    tester: str('var')
  },
  {
    name: '_function',
    tester: str('function')
  },
  {
    name: '_if',
    tester: str('if')
  },
  {
    name: '_else',
    tester: str('else')
  },
  {
    name: '_while',
    tester: str('while')
  },
  {
    name: '_for',
    tester: str('for')
  },
  {
    name: '_in',
    tester: str('in')
  },
  {
    name: '_true',
    tester: str('true')
  },
  {
    name: '_false',
    tester: str('false')
  },
  {
    name: '_null',
    tester: str('null')
  },
  {
    name: 'assign',
    tester: char('=')
  },
  {
    name: 'dot',
    tester: char('.')
  },
  {
    name: 'colon',
    tester: char(':')
  },
  {
    name: 'comma',
    tester: char(',')
  },
  {
    name: 'l_brace',
    tester: char('{')
  },
  {
    name: 'r_brace',
    tester: char('}')
  },
  {
    name: 'l_bracket',
    tester: char('(')
  },
  {
    name: 'r_bracket',
    tester: char(')')
  },
  {
    name: 'l_square_bracket',
    tester: char('[')
  },
  {
    name: 'r_square_bracket',
    tester: char(']')
  },
  {
    name: 'identifier',
    tester: function (tested) {
      if(/^[a-zA-Z][a-zA-Z0-9]*$/.test(tested)) {
        return lexerResults.possible;
      }
      return lexerResults.none;
    }
  },
  {
    name: 'number',
    tester: function (tested) {
      if(/^\d+\.$/.test(tested)) {
        return lexerResults.start;
      }
      if(/^\d+(\.\d+)?$/.test(tested)) {
        return lexerResults.possible;
      }
      return lexerResults.none;
    }
  },
  {
    name: 'string',
    tester: function (tested) {
      if (tested[0] !== '\'') {
        return lexerResults.none;
      }
      if (tested.length === 1) {
        return lexerResults.start;
      }
      for (var i = 1; i < tested.length - 1; i++) {
        if (tested[i] === '\\') {
          i++;
        }
        if (tested[i] === '\'') {
          return lexerResults.none;
        }
      }
      if (tested[tested.length - 1] === '\'') {
        return lexerResults.exact;
      } else {
        return lexerResults.start;
      }
    }
  },
  {
    name: 'comment',
    tester: function (tested) {
      if (tested[0] !== '/') {
        return lexerResults.none;
      }
      if (tested.length === 1) {
        return lexerResults.start;
      }
      if (tested[1] !== '/') {
        return lexerResults.none;
      }
      if (tested.length === 2) {
        return lexerResults.start;
      }
      for (var i = 2; i < tested.length - 2; i++) {
        if (tested[i] === '\n') {
          return lexerResults.none;
        }
      }
      if (tested[tested.length - 1] == '\n') {
        return lexerResults.exact;
      } else {
        return lexerResults.start;
      }
    }
  },
  {
    name: 'operator',
    tester: function (tested) {
      if (['==','!=','>=','<=','&&','||','+', '-', '*', '/'].includes(tested)) {
        return lexerResults.exact;
      }
      if (['>', '<', '!'].includes(tested)) {
        return lexerResults.possible;
      }
      return lexerResults.none;
    }
  },
  {
    name: "whitespace",
    tester: function(tested) {
      if (tested == ' ' || tested == '\n') {
        return lexerResults.skip;
      } else {
        return lexerResults.none;
      }
    }
  }
];

module.exports = rules;
