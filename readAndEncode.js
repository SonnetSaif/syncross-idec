const path = require('path');
const vscode = require('vscode');
const fs = require('fs').promises;

async function readAndEncodeFiles(directoryPath) {
  try {
    const files = await fs.readdir(directoryPath);
    const encodedContents = await Promise.all(
      files.map(async (fileName) => {
        if (fileName != '.default.json' && fileName != '.default1.json') {
          const filePath = path.join(directoryPath, fileName);
          const { name: baseName } = path.parse(fileName);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          return { [baseName]: fileContent };
        }
        else {
          return;
        }
      })
    );
    return Object.assign({}, ...encodedContents);
  }
  catch (error) {
    vscode.window.showErrorMessage(`Error Reading and Encoding Files`);
    console.error(`Error reading and encoding files: ${error.message}`);
    return false;
  }
}

async function writeToJsonFile(jsonData, outputPath) {
  try {
    const jsonString = JSON.stringify(jsonData, null, 2);
    await fs.writeFile(outputPath, jsonString, 'utf-8');
    vscode.window.showInformationMessage(`File Encoded Successfully!: ${outputPath}`);
    console.log(`File encoded successfully!: ${outputPath}`);
  }
  catch (error) {
    vscode.window.showErrorMessage(`Error Writing to ${outputPath}`);
    console.error(`Error writing to JSON file: ${error.message}`);
    return false;
  }
}

async function readAndEncode(workspaceFolderPath, bundleAlias, alias) {
  let sourceDirectory = path.join(workspaceFolderPath, `/bundles/${bundleAlias}/${alias}/`);
  let outputJsonPath = path.join(workspaceFolderPath, `/bundles/${bundleAlias}/${alias}/.default1.json`);
  try {
    const encodedData = await readAndEncodeFiles(sourceDirectory);
    if (encodedData == false) {
      return false;
    }
    if (encodedData !== undefined && Object.keys(encodedData).length !== 0) {
      const returnFrom = await writeToJsonFile(encodedData, outputJsonPath);
      if (returnFrom == false) {
        vscode.window.showErrorMessage(`Error Writing Files into JSON`);
      }
    }
  }
  catch (error) {
    vscode.window.showErrorMessage(`Error Encoding Files into ${outputJsonPath}`);
    console.error(`Error encoding files into JSON: ${error.message}`);
    return false;
  }
}

module.exports = readAndEncode;