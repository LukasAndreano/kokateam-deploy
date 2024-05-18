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

  if (!appConfig.app_id || isNaN(parseInt(appConfig.app_id, 10)))
    generateError("❌ Enter a valid app_id in kokateam-deploy-config.json!");

  let access_token: string = vault.get("access_token");
  let user_token: string = vault.get("user_token");

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

  if (process.env.KOKATEAM_DEPLOY_USER_TOKEN)
    user_token = process.env.KOKATEAM_DEPLOY_USER_TOKEN;

  if (!user_token) {
    const promptRequest = await prompt({
      type: "text",
      name: "token",
      message: chalk.magenta(
        "🔐 Please, enter your VK token (u can get it from: https://oauth.vk.com/authorize?client_id=7598768&scope=65536&redirect_uri=https://oauth.vk.com/blank.html&display=page&response_type=token&revoke=1). Token will be saved in your local storage: "
      ),
    });

    if (promptRequest.token) user_token = promptRequest.token;

    vault.set("user_token", user_token);
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

  const platforms =
    process.env.KOKATEAM_DEPLOY_PLATFORMS || appConfig.platforms;

  const requestPlatforms = [];

  if (platforms) {
    const keys = Object.keys(platforms);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = platforms[key];

      if (value) {
        requestPlatforms.push(key);
      }
    }
  }

  const formData = new FormData();

  formData.append("app", fs.createReadStream("app.zip"));
  formData.append("user_token", user_token);
  formData.append(
    "app_id",
    process.env.KOKATEAM_DEPLOY_APP_ID || String(appConfig.app_id)
  );
  formData.append(
    "send_odr_to_moderation",
    `${
      process.env.KOKATEAM_DEPLOY_SEND_ODR_TO_MODERATION ||
      appConfig.send_odr_to_moderation ||
      false
    }`
  );
  formData.append(
    "disable_dev_mode",
    `${
      process.env.KOKATEAM_DEPLOY_DISABLE_DEV_MODE ||
      appConfig.disable_dev_mode ||
      false
    }`
  );
  formData.append(
    "upload_odr",
    `${process.env.KOKATEAM_DEPLOY_UPLOAD_ODR || appConfig.upload_odr || false}`
  );

  formData.append("platforms", requestPlatforms.join(","));

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

        case 4:
          generateError("❌ Invalid platforms!");
          break;

        case 5:
          generateError("❌ Bad app_id!");
          break;

        case 0:
          vault.set("access_token", access_token);

          generateError("❌ Access denied!");
          break;

        case 6:
          generateError("❌ Bad VK Token!");
          break;

        default:
          generateError(`❌ Error catched! Code: ${uploadAction.data.message}`);
          break;
      }

      return;
    }

    if (uploadAction.data.data.url) {
      let additionalData = "\n\n";

      requestPlatforms.forEach((platform) => {
        additionalData += `+ Replaced URL for ${platform}\n`;
      });

      if (uploadAction.data.data.odr_version) {
        additionalData += `${
          requestPlatforms.length ? "\n" : ""
        }🆕 ODR version: ${uploadAction.data.data.odr_version} ${
          uploadAction.data.data.sent_to_moderation
            ? "(+ sent to moderation)"
            : ""
        }\n`;
      }

      if (uploadAction.data.data.disable_dev_mode) {
        additionalData += `${
          requestPlatforms.length || uploadAction.data.data.odr_version
            ? "\n"
            : ""
        }💤 And also dev mode has been is disabled for all platforms\n`;
      }

      console.log(
        `\n✅ Deployed to ${uploadAction.data.data.url}${additionalData}`
      );

      fs.rmSync("app.zip");
    }
  } catch (err: any) {
    console.error(err?.response?.data || err);
  }
};

export default start;
