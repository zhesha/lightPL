const fs = require("fs");

const version = "0.1.0";
function composeOptionsForNodeEnv() {
  const fileName = process.argv[2];
  if (!fileName) {
    console.log(
      `LightPL version: ${version}\nTo start program run "light <file_name>"`
    );
    return;
  }

  const sourceCode = fs.readFileSync(fileName, "utf-8");
  const backendIdentifier = "interpreter";

  function emptyPostProcessor() {}

  return { sourceCode, backendIdentifier, postProcessor: emptyPostProcessor };
}
module.exports = { composeOptionsForNodeEnv };
