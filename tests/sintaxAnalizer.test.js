var lexerjs = require("js-lexer");
var rules = require("../rules.js");
var analize = require("../sintaxAnalizer.js");
var lexer = lexerjs.lexer;

test("empty code", function () {
    var sourceCode = ``;
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual([]);
});

test("single variable declaration", function () {
    var sourceCode = `var a = 2.1`;
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual([{
        type: 'variable_declaration',
        variables: [
            {name: 'a', value: '2.1'}
        ]
    }]);
});

test("multiple variable in one declaration", function () {
    var sourceCode = 'var a = 2.1, b = true, c';
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual([{
        type: 'variable_declaration',
        variables: [
            {name: 'a', value: '2.1'},
            {name: 'b', value: 'true'},
            {name: 'c', value: null},
        ]
    }]);
});

test("multiple variable declaration", function () {
    var sourceCode = `
        var a = 2.1
        var b = true
    `;
    var tokens = lexer(sourceCode, rules);
    const syntaxTree = analize(tokens);

    expect(syntaxTree).toEqual([{
        type: 'variable_declaration',
        variables: [{name: 'a', value: '2.1'}]
    },
        {
            type: 'variable_declaration',
            variables: [{name: 'b', value: 'true'}]
        }
        ]
    );
});