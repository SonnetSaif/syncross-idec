const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

async function jsonOverride(workspaceFolderPath, bundleAlias, alias) {
    const firstFilePath = path.join(workspaceFolderPath, `/bundles/${bundleAlias}/${alias}/.default.json`);
    const secondFilePath = path.join(workspaceFolderPath, `/bundles/${bundleAlias}/${alias}/.default1.json`);
    const resultFilePath = path.join(workspaceFolderPath, `/bundles/${bundleAlias}/${alias}/.result.json`);
    let firstFileJsonData;
    let secondFileJsonData;
    let newObj;

    fs.readFile(firstFilePath, 'utf8', async (error, data) => {
        if (error) {
            vscode.window.showErrorMessage(`Problem Occured with the ${firstFilePath}`);
            console.error(`Problem occured with the ${firstFilePath}: \n ${error.message}`);
            return false;
        }
        try {
            firstFileJsonData = JSON.parse(data);
            fs.readFile(secondFilePath, 'utf-8', async (error, data1) => {
                if (error) {
                    vscode.window.showErrorMessage(`Problem Occured with the ${secondFilePath}`);
                    console.error(`Problem occured with the ${secondFilePath}: \n ${error.message}`);
                    return false;
                }
                try {
                    secondFileJsonData = JSON.parse(data1);
                    newObj = {
                        type: firstFileJsonData.type,
                        sizeX: firstFileJsonData.sizeX,
                        sizeY: firstFileJsonData.sizeY,
                        resources: JSON.parse(secondFileJsonData.resources),
                        templateHtml: secondFileJsonData.templateHtml,
                        templateCss: secondFileJsonData.templateCss,
                        controllerScript: secondFileJsonData.controllerScript,
                        settingsSchema: secondFileJsonData.settingsSchema,
                        dataKeySettingsSchema: secondFileJsonData.dataKeySettingsSchema,
                        defaultConfig: secondFileJsonData.defaultConfig,
                    }
                    fs.writeFile(resultFilePath, JSON.stringify(newObj, null, 4), (error) => {
                        if (error) {
                            vscode.window.showErrorMessage(`Problem Occured with the ${secondFilePath}`);
                            console.error(`Problem occured with the ${secondFilePath}: \n ${error.message}`);
                            return false;
                        }
                        // vscode.window.showInformationMessage(`File Ready to Push!: ${resultFilePath}`);
                        console.log(`File ready to push!: ${resultFilePath}`);
                    });
                    return true;
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Error Parsing ${secondFilePath}`);
                    console.error(`Error parsing ${secondFilePath}: \n ${error.message}`);
                    return false;
                }
            })
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error Parsing ${firstFilePath}`);
            console.error(`Error parsing ${firstFilePath}: \n ${error.message}`);
            return false;
        }
    });
    return true;
}

module.exports = jsonOverride;