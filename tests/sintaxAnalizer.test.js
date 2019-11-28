var lexerjs = require("js-lexer");
var rules = require("../rules.js");
var analize = require("../sintaxAnalizer.js");
var lexer = lexerjs.lexer;

test("empty code", function () {
    var sourceCode = ``;
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual({
        type: 'statement_list',
        list: []
    });
});

test("single variable declaration", function () {
    var sourceCode = `var a = 2.1`;
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual({
        type: 'statement_list',
        list: [{
            type: 'variable_declaration',
            variables: [
                {name: 'a', value: '2.1'}
            ]
        }]
    });
});

test("multiple variable in one declaration", function () {
    var sourceCode = 'var a = 2.1, b = true, c';
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual({
        type: 'statement_list',
        list: [{
            type: 'variable_declaration',
            variables: [
                {name: 'a', value: '2.1'},
                {name: 'b', value: 'true'},
                {name: 'c', value: null},
            ]
        }]
    });
});

test("multiple variable declaration", function () {
    var sourceCode = `
        var a = 2.1
        var b = true
    `;
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual({
            type: 'statement_list',
            list: [{
                type: 'variable_declaration',
                variables: [{name: 'a', value: '2.1'}]
            },
                {
                    type: 'variable_declaration',
                    variables: [{name: 'b', value: 'true'}]
                }
            ]
        }
    );
});

test("assign variable as value", function () {
  var sourceCode = `
        var a = 2.1
        var b
        b = a
    `;
  var tokens = lexer(sourceCode, rules);
  const syntaxTree = analize(tokens);

  expect(syntaxTree).toEqual({
      type: 'statement_list',
      list: [{
        type: 'variable_declaration',
        variables: [{name: 'a', value: '2.1'}]
      },
        {
          type: 'variable_declaration',
          variables: [{name: 'b', value: null}]
        },
      {
        target: "b",
        type: "assign",
        value: {
          type: "value",
          value: "a"
        }
      }
      ]
    }
  );
});

test("single assign", function () {
    var sourceCode = `a = 2.1`;
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual({
        type: 'statement_list',
        list: [{
            type: 'assign',
            target:  'a',
            value: {
              "type": "value",
              "value": "2.1"
            }
        }]
    });
});

test("multiple single assign", function () {
    var sourceCode = `a = 2.1
    a = true
    b = null`;
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual({
        type: 'statement_list',
        list: [
        {
            "target": "a",
            "type": "assign",
            "value": {
              "type": "value",
              "value": "2.1"
            }
        },
        {
            "target": "a",
            "type": "assign",
            "value": {
              "type": "value",
              "value": "true"
            }
        },
        {
            "target": "b",
            "type": "assign",
            "value": {
              "type": "value",
              "value": "null"
            }
        }
    ]});
});

test("variable declaration and assign", function () {
    var sourceCode = `
        var a = 2.1
        a = 4.2
    `;
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual({
        type: 'statement_list',
        list: [{
            type: 'variable_declaration',
            variables: [{name: 'a', value: '2.1'}]
        },
            {
                type: 'assign',
                target: 'a',
                value: {
                  "type": "value",
                  "value": '4.2'
                }
            }
        ]
    });
});

test("declaration and assign mix", function () {
    var sourceCode = `
        var a = 2.1
        a = 4.2
        var b = true
        b = false
    `;
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual({
        type: 'statement_list',
        list: [{
            "type": "variable_declaration",
            "variables": [
                {
                    "name": "a",
                    "value": "2.1"
                }
            ]
        },
            {
                "target": "a",
                "type": "assign",
                "value": {
                  "type": "value",
                  "value": "4.2"
                }
            },
            {
                "type": "variable_declaration",
                "variables": [
                    {
                        "name": "b",
                        "value": "true"
                    }
                ]
            },
            {
                "target": "b",
                "type": "assign",
                "value": {
                  "type": "value",
                  "value": "false"
                }
            }
        ]
    });
});