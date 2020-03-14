const interpreter = require("./interpreter.js");

function getBackend(identifier) {
  if (identifier === "interpreter") {
    return interpreter;
  } else {
    return function() {
      console.log("Unknown backend identifier");
    };
  }
}

module.exports = { getBackend };
