import glob from "glob";
import fs from "fs";
import { zip } from "zip-a-folder";
import axios from "axios";
import FormData from "form-data";
import Configstore from "configstore";
import prompt from "prompts";
import chalk from "chalk";

import packageJson from "./package.json";

const appConfig = require("require-module")("./kokateam-deploy-config.json");

const vault = new Configstore(packageJson.name, {});

const generateError = (message: string) => {
  throw new Error(message);
};

const start = async () => {
  if (!appConfig) generateError("Create kokateam-deploy-config.json first!");

  if (!appConfig.app_id || isNaN(parseInt(appConfig.app_id, 10)))
    generateError("Enter a valid app_id in kokateam-deploy-config.json!");

  let access_token: string = vault.get("access_token");

  if (process.env.KOKATEAM_DEPLOY_TOKEN)
    access_token = process.env.KOKATEAM_DEPLOY_TOKEN;

  if (!access_token) {
    const promptRequest = await prompt({
      type: "text",
      name: "token",
      message: chalk.magenta("Please, enter your token (starts with KOKA): "),
    });

    if (promptRequest.token) access_token = promptRequest.token;

    vault.set("access_token", access_token);
  }

  if (!fs.existsSync("./" + appConfig.static_path))
    generateError(
      "Build your project first (or change static_path in config)!"
    );

  const excludedFiles: string[] = glob.sync(
    "./" + appConfig.static_path + "/**/*.txt"
  );

  excludedFiles.forEach((file: string) => fs.rmSync(file));

  await zip("./" + appConfig.static_path, "build.zip");

  const formData = new FormData();

  formData.append("file", fs.createReadStream("build.zip"));

  try {
    const uploadAction = await axios.post(
      `https://deploy.koka.team/upload?app_id=${
        appConfig.app_id
      }&use_random_prefix=${false}&disable_dev_mode=${
        appConfig.disable_dev_mode || false
      }&web=${appConfig.web}&mvk=${appConfig.mvk}&mobile=${appConfig.mobile}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer " + access_token,
        },
      }
    );

    if (uploadAction.data.response)
      console.log(`Deployed to ${uploadAction.data.url}`);
  } catch (err) {
    console.error(`Error catched! ${err}`);
  }

  if (appConfig.purge_access_token) {
    vault.delete("access_token");
    console.log(`Access token purged!`);
  }
};

export default start;
