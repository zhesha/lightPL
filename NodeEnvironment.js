const fs = require("fs");

const version = "0.1.0";
function composeOptionsForNodeEnv() {
  const fileName = process.argv[2];
  const flag = process.argv[3];
  if (!fileName) {
    console.log(
      `LightPL version: ${version}\nTo start program run "light <file_name>"`
    );
    return;
  }

  const sourceCode = fs.readFileSync(fileName, "utf-8");

  let backendIdentifier;
  let postProcessor;
  if (flag && flag === "-js") {
    backendIdentifier = "js";
    postProcessor = function(data) {
      fs.writeFile(`${fileName}.js`, data, function(err) {
        console.log(err);
      });
    };
  } else {
    backendIdentifier = "interpreter";
    postProcessor = function() {};
  }

  return { sourceCode, backendIdentifier, postProcessor };
}
module.exports = { composeOptionsForNodeEnv };
