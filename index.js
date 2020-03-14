#!/usr/bin/env node

const { composeOptionsForNodeEnv } = require("./NodeEnvironment.js");
const lightPL = require("./lightPL.js");

const environmentOptions = composeOptionsForNodeEnv();
if (environmentOptions) {
  lightPL(environmentOptions);
}
