var fsm = require("@sasha-z/fsm_js");
var {Machine, State, Transition} = fsm;

module.exports = function (tokens) {
    let variableDeclarationData;
    let statementListData = [];

    const toVariableDeclaration = Transition({
        to: 'variableDeclaration',
        canTransite: tested => {
            return tested.type === '_var';
        },
        onTransition() {
            variableDeclaration.restart();
            variableDeclarationData = []
        }
    });

    const stayVariableDeclaration = Transition({
        to: 'variableDeclaration',
        canTransite (to) {
            return variableDeclaration.canTransite(to);
        },
        onTransition(to) {
            variableDeclaration.go(to);
        }
    });

    const leaveVariableDeclaration = Transition({
        to: 'statementList',
        canTransite (to) {
            return !variableDeclaration.canTransite(to);
        },
        onTransition(to) {
            statementListData.push({
                type: 'variable_declaration',
                variables: variableDeclarationData
            });
        }
    });

    const identifier = Transition({
        to: 'identifier',
        canTransite: tested => tested.type === 'identifier',
        onTransition(to) {
            variableDeclarationData.push({
                name: to.value,
                value: null,
            })
        }
    });

    const assign = Transition({
        to: 'assign',
        canTransite: tested => tested.type === 'assign'
    });
    const comma = Transition({
        to: 'comma',
        canTransite: tested => tested.type === 'comma'
    });
    const newStatement = Transition({
        to: 'statementList',
        canTransite: tested => tested.type === 'eol'
    });

    const varDeclarationValue = Transition({
        to: 'varDeclarationValue',
        canTransite: tested => {
            return tested.type === 'number' ||
                tested.type === 'string' ||
                tested.type === '_null' ||
                tested.type === '_false' ||
                tested.type === '_true';
        },
        onTransition(to) {
            variableDeclarationData[variableDeclarationData.length - 1].value = to.value
        }
    });

    var variableDeclaration = Machine(
        [
            State(null, [identifier], {initial: true}),
            State('identifier', [assign, comma]),
            State('comma', [identifier]),
            State('assign', [varDeclarationValue]),
            State('varDeclarationValue', [comma]),
        ],
        {
            onUnsupportedTransition(from, to) {
                const t = to ? to.type : 'nothing';
                const f = from ? from.type : 'nothing';
                throw `it's error to have ${t} after ${f} in "variableDeclaration"`
            },
        }
    );

    var statementList = Machine(
        [
            State('statementList', [newStatement, toVariableDeclaration], {initial: true}),
            State('variableDeclaration', [stayVariableDeclaration, leaveVariableDeclaration]),
        ],
        {
            onUnsupportedTransition(from, to) {
                const t = to ? to.type : 'nothing';
                const f = from ? from.type : 'nothing';
                throw `it's error to have ${t} after ${f} in "statementList"`
            }
        }
    );

    for (var token of tokens) {
        statementList.go(token);
    }
    statementList.go({type: 'eol'});
    return statementListData;
};
