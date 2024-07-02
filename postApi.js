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

async function comparisonAndPost(getUrl, postUrl, token, bundleAlias, alias, filePath, stats, credentials) {
  try {
    const getResponse = await axios.get(getUrl, {
      headers: {
        "X-Authorization": `Bearer ${token}`
      }
    })
    let widgetBundleId = "";
    getResponse.data.forEach(id => {
      if (id.name === bundleAlias) {
        widgetBundleId = id.id.id;
      }
    })

    let widgetId = "";
    const getUrl1 = credentials.getWidgetTypesInfos + widgetBundleId + `&fullSearch=false&deprecatedFilter=ALL`;
    await fetch(getUrl1, {
      "headers": {
        "X-Authorization": `Bearer ${token}`
      }
    }).then(res => {
      return res.json()
    })
      .then(data1 => {
        data1.data.forEach(row => {
          // if (row.name === alias) {
          if (row.fqn === alias) {
            widgetId = row.id.id;
          }
        })
      })

    const getUrl2 = credentials.getWidgetType + widgetId + `?inlineImages=true`;
    // const getUrl2 = credentials.getWidgetType + widgetId;
    await fetch(getUrl2, {
      "headers": {
        "X-Authorization": `Bearer ${token}`
      }
    }).then(res => {
      return res.json()
    })
      .then(async data2 => {
        // if (data2.name == alias && data2.createdTime < stats) {
        if (data2.fqn == alias && data2.createdTime < stats) {

          try {
            let data = await fs.readFileSync(filePath, 'utf8');
            const payLoad =
            {
              "id": {
                "entityType": data2.id.entityType,
                "id": data2.id.id
              },
              "createdTime": stats,
              // "bundleAlias": i.bundleAlias,
              // "alias": i.alias,
              // "name": i.name,
              "deprecated": false,
              "description": data2.description,
              "descriptor": JSON.parse(data),
              "fqn": data2.name,
              "image": data2.image,
              "name": data2.name,
              "tags": null
            };
            try {
              await fetch(postUrl, {
                method: `POST`,
                headers: {
                  "Content-Type": `application/json`,
                  "X-Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payLoad)
              }).then(responseReturn => {
                const statusCode = responseReturn.status;
                if (statusCode === 200) {
                  vscode.window.showInformationMessage(`File Successfully Pushed!: ${filePath}`);
                  console.log(`File successfully pushed!: ${filePath}`);
                } else {
                  vscode.window.showErrorMessage(`Error Pushing File`);
                  console.error(`Error pushing file. Status code: ${statusCode}`);
                }
              })
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
      })
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
    const getWidgetTypes = credentials.getWidgetsBundles;
    const token = await login(workspaceFolderPath);
    const [filePath, stats] = await checkFileUpdateTime(workspaceFolderPath, bundleAlias, alias);
    if (filePath !== null && stats !== null) {
      await comparisonAndPost(getWidgetTypes, postUrl, token, bundleAlias, alias, filePath, stats, credentials);
    }
  }
  catch (error) {
    vscode.window.showErrorMessage(`Connection Error`);
    console.error(`Connection Error: ${error.message}`);
    return false;
  }
}

module.exports = postApi;