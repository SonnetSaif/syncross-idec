const fs = require('fs');
const path = require('path');
const axios = require('axios');
const vscode = require('vscode');
const login = require('./login');
const credentialsData = require('./credentials');

async function checkFileUpdateTime(workspaceFolderPath, bundleAlias, alias) {
  try {
    const filePath1 = path.join(workspaceFolderPath, `/bundles/${bundleAlias}/${alias}/.result.json`);
    const stats1 = Math.floor((fs.statSync(filePath1)).mtimeMs);
    return [filePath1, stats1];
  }
  catch (error) {
    vscode.window.showErrorMessage(`File Modification Time Error Occurred`);
    console.error(`File Modification Time Error Occurred: ${error.message}`);
    return [null, null];
  }
}

async function comparisonAndPost(getUrl, postUrl, token, alias, filePath, stats) {
  try {
    const getResponse = await axios.get(getUrl, {
      headers: {
        "X-Authorization": `Bearer ${token}`
      }
    })

    for (let i of getResponse.data) {
      if (i.alias == alias && i.createdTime < stats) {
        try {
          let data = await fs.readFileSync(filePath, 'utf8');
          const payLoad =
          {
            "id": {
              "entityType": i.id.entityType,
              "id": i.id.id
            },
            "createdTime": stats,
            "bundleAlias": i.bundleAlias,
            "alias": i.alias,
            "name": i.name,
            "descriptor": JSON.parse(data),
            "description": i.description,
            "image": i.image,
          };
          try {
            await fetch(postUrl, {
              method: `POST`,
              headers: {
                "Content-Type": `application/json`,
                "X-Authorization": `Bearer ${token}`
              },
              body: JSON.stringify(payLoad)
            });
            vscode.window.showInformationMessage(`File Successfully Pushed!: ${filePath}`);
            console.log(`File successfully pushed!: ${filePath}`);
          }
          catch (error) {
            vscode.window.showErrorMessage(`POST API Request Error`);
            console.error(`POST request error: ${error.message}`);
            return false;
          }
        }
        catch (error) {
          vscode.window.showErrorMessage(`Problem Occured with the ${filePath}`);
          console.error(`Problem occured with the ${filePath}: \n ${error.message}`);
          return false;
        }
      }
      else {
        // vscode.window.showWarningMessage(`Modification Time Already Updated! or Wrong Widget`);
        // console.warn("modification time already updated! or Wrong Widget");
      }
    }
  }
  catch (error) {
    vscode.window.showErrorMessage(`GET API Request Error`);
    console.error(`GET request error: ${error.message}`);
    return false;
  }
}

async function postApi(workspaceFolderPath, bundleAlias, alias) {
  try {
    const credentials = await credentialsData(workspaceFolderPath);
    const postUrl = credentials.postUrl;
    const getWidgetTypes = credentials.getWidgetTypesFalse + bundleAlias;
    const token = await login(workspaceFolderPath);
    const [filePath, stats] = await checkFileUpdateTime(workspaceFolderPath, bundleAlias, alias);
    if (filePath !== null && stats !== null) {
      await comparisonAndPost(getWidgetTypes, postUrl, token, alias, filePath, stats);
    }
  }
  catch (error) {
    vscode.window.showErrorMessage(`Connection Error`);
    console.error(`Connection Error: ${error.message}`);
    return false;
  }
}

module.exports = postApi;