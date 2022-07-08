const glob = require("glob");
const fs = require("fs");
const { zip } = require("zip-a-folder");
const axios = require("axios").default;
const FormData = require("form-data");
const Configstore = require("configstore");
const prompt = require("prompts");
const chalk = require("chalk");

const packageJson = require("./package.json");
const appConfig = require("require-module")("./kokateam-deploy-config.json");

const vault = new Configstore(packageJson.name, {});

const start = async () => {
  if (!appConfig) throw new Error("Create kokateam-deploy-config.json first!");

  if (!appConfig.app_id || isNaN(parseInt(appConfig.app_id, 10)))
    throw new Error("Enter a valid app_id in kokateam-deploy-config.json!");

  let access_token = vault.get("access_token");

  if (!access_token) {
    const get = await prompt({
      type: "text",
      name: "token",
      message: chalk.magenta("Please, enter your token (starts with KOKA): ")
    });

    if (get.token) access_token = get.token;

    vault.set("access_token", access_token);
  }

  if (!fs.existsSync("./" + appConfig.static_path))
    throw new Error(
      "Build your project first (or change static_path in config)!"
    );

  const excludedFiles = await glob.sync(
    "./" + appConfig.static_path + "/**/*.txt"
  );

  await excludedFiles.forEach((file) => fs.rmSync(file));

  await zip("./" + appConfig.static_path, "build.zip");

  const formData = new FormData();

  formData.append("file", fs.createReadStream("build.zip"));

  try {
    const uploadAction = await axios.post(
      `https://deploy.nbalin.dev/v1/upload?app_id=${appConfig.app_id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer " + access_token
        }
      }
    );

    if (uploadAction.data.response)
      console.log(`Deployed to ${uploadAction.data.url}`);
  } catch (err) {
    if (err?.data?.error?.code) {
      switch (err.data.error.code) {
        case 0:
          console.log("Invalid token! Run command again to enter a new token.");
          vault.delete("access_token");
          break;
      }
    } else {
      console.error(`Error catched!\n\n${err}`);
    }
  }
};

module.exports = start;
