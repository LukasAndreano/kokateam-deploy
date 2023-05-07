#!/usr/bin/env node

const configFilePath = "./kokateam-deploy-config.json";
import fs from "fs-extra";

async function run() {
  const isConfigFileExists = await fs.pathExists(configFilePath);

  if (!isConfigFileExists) {
    console.error(configFilePath + " is missing");
    return false;
  }

  const configJSON = require("require-module")(configFilePath);

  if (!configJSON) {
    console.error(configFilePath + " is missing");
    return false;
  }

  const deploy = require("../index").default;

  await deploy();

  process.exit();
}

run().then((r) => console.log(r));
