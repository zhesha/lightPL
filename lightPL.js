const { getBackend } = require("./backend.js");
const frontend = require("./frontend.js");

function lightPL({ sourceCode, backendIdentifier, postProcessor }) {
  const intermediateRepresentation = frontend(sourceCode);
  const result = getBackend(backendIdentifier)(intermediateRepresentation);
  postProcessor(result);
}

module.exports = lightPL;
