const path = require('path');
const vscode = require('vscode');
const fs = require('fs').promises;
const prettier = require('prettier');

async function readJsonDataFromFile(filePath) {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error Reading JSON file ${filePath}`);
        console.error(`Error reading JSON file ${filePath}: ${error.message}`);
        return false;
    }
}

async function formatAndWriteFile(parentJsonDataFilePath, key, value) {
    let formattedContent;
    let parser;
    try {
        switch (key) {
            case 'templateHtml':
                parser = 'html';
                break;
            case 'templateCss':
                parser = 'css';
                break;
            case 'controllerScript':
                parser = 'typescript';
                break;
            case 'settingsSchema':
            case 'dataKeySettingsSchema':
            case 'resources':
            case 'defaultConfig':
                parser = 'json';
                break;
        }
        if (parser != undefined) {
            if (parser == 'json' && key == 'resources') {
                formattedContent = await prettier.format(JSON.stringify(value), { parser });
            }
            else {
                formattedContent = await prettier.format(value, { parser });
            }
        }
        else {
            return false;
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error Formatting Content for file-type ${key}`);
        console.error(`Error formatting content for key ${key}: ${error.message}`);
        return false;
    }
    let fileExtension;
    if (parser == 'typescript') {
        fileExtension = 'js';
    }
    else {
        fileExtension = parser;
    }

    const filePath = path.join(parentJsonDataFilePath, `${key}.${fileExtension}`);
    try {
        await fs.writeFile(filePath, formattedContent, 'utf-8');
        console.log(`File decoded successfully: ${filePath}`);
        return true;
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error Writing File ${filePath}`);
        console.error(`Error writing file ${filePath}: ${error.message}`);
        return false;
    }
}

async function separateAndFormat(workspaceFolderPath, bundleAlias, alias) {
    const jsonDataFilePath = path.join(workspaceFolderPath, "bundles", bundleAlias, alias, ".default.json");
    const jsonData = await readJsonDataFromFile(jsonDataFilePath);
    if (jsonData == false) return;
    const parentJsonDataFilePath = path.join(jsonDataFilePath, '..');
    for (const key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            await formatAndWriteFile(parentJsonDataFilePath, key, jsonData[key]);
        }
    }
    return true;
}

module.exports = separateAndFormat;