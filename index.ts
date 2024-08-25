import glob from "glob";
import fs from "fs";
import { COMPRESSION_LEVEL, zip } from "zip-a-folder";
import axios from "axios";
import FormData from "form-data";
import Configstore from "configstore";
import prompt from "prompts";
import chalk from "chalk";

import packageJson from "./package.json";
import * as process from "node:process";

const appConfig = require("require-module")("./kokateam-deploy-config.json");

const vault = new Configstore(packageJson.name, {});

const generateError = (message: string) => {
  throw new Error(message);
};

const start = async () => {
  if (!appConfig) generateError("❌ Create kokateam-deploy-config.json first!");

  if (!appConfig.app_id)
    generateError("❌ Enter a valid app_id in kokateam-deploy-config.json!");

  let access_token: string = vault.get("access_token");

  if (process.env.KOKATEAM_DEPLOY_TOKEN)
    access_token = process.env.KOKATEAM_DEPLOY_TOKEN;

  if (!access_token) {
    const promptRequest = await prompt({
      type: "text",
      name: "token",
      message: chalk.magenta(
        "🔑 Please, enter your token (usually starts with KOKA): "
      ),
    });

    if (promptRequest.token) access_token = promptRequest.token;

    vault.set("access_token", access_token);
  }

  if (!fs.existsSync("./" + appConfig.static_path))
    generateError(
      "📦 Build your project first (or change static_path in config)"
    );

  const excludedFiles: string[] = glob.sync(
    "./" + appConfig.static_path + "/**/*.txt"
  );

  excludedFiles.forEach((file: string) => fs.rmSync(file));

  await zip("./" + appConfig.static_path, "app.zip", {
    compression: COMPRESSION_LEVEL.high,
  });

  const formData = new FormData();

  formData.append("app", fs.createReadStream("app.zip"));
  formData.append(
    "app_id",
    String(process.env.KOKATEAM_DEPLOY_APP_ID) || String(appConfig.app_id)
  );

  try {
    const uploadAction = await axios.post(
      `https://deploy-backend-production.koka.team/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer " + access_token,
        },
      }
    );

    if (uploadAction.data.errorCode) {
      switch (uploadAction.data.errorCode) {
        case 2:
          generateError("❌ Bad request!");
          break;

        case 5:
          generateError("❌ Bad app_id!");
          break;

        case 0:
          vault.set("access_token", access_token);

          generateError("❌ Access denied!");
          break;

        default:
          generateError(`❌ Error caught! Code: ${uploadAction.data.message}`);
          break;
      }

      return;
    }

    if (uploadAction.data.data.url) {
      console.log(`\n✅ Deployed to ${uploadAction.data.data.url}`);

      fs.rmSync("app.zip");
    }
  } catch (err: any) {
    console.error(err?.response?.data || err);
  }
};

export default start;
