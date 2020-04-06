const interpreter = require("./interpreter.js");
const translator = require("./translator.js");

function getBackend(identifier) {
  if (identifier === "interpreter") {
    return interpreter;
  } else if (identifier === "js") {
    return translator;
  } else {
    return function() {
      console.log("Unknown backend identifier");
    };
  }
}

module.exports = { getBackend };
