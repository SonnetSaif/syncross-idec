const fs = require('fs');
const path = require('path');
const axios = require('axios');
const login = require('./login');
const vscode = require('vscode');
const credentialsData = require('./credentials');

async function fetch(getUrl, token) {
    try {
        const response = await axios.get(getUrl, {
            headers: {
                "X-Authorization": `Bearer ${token}`
            }
        })
        return response;
    }
    catch (error) {
        vscode.window.showErrorMessage(`GET API request error`);
        console.error(`GET request error: ${error.message}`);
        return null;
    }
}

async function fetchAndCreateFolders(workspaceFolderPath, bundleAlias, alias) {
    const credentials = await credentialsData(workspaceFolderPath);
    if (credentials == null) return;
    if (bundleAlias == null && alias == null) {
        try {
            const token = await login(workspaceFolderPath);
            if (token == null) return;
            const data = await fetch(credentials.getWidgetsBundles, token);
            if (data == null) return;
            let aliasList = [];
            data.data.forEach(row => {
                aliasList.push(row.alias);
            })
            const bundlesParentFolder = path.join(workspaceFolderPath, 'bundles');
            if (!fs.existsSync(bundlesParentFolder)) {
                fs.mkdirSync(bundlesParentFolder);
            }
            for (let element of aliasList) {
                const getUrl = credentials.getWidgetTypesFalse + element;
                const data = await fetch(getUrl, token);
                if (data == null) return;
                data.data.forEach(row => {
                    const bundleAlias = row.bundleAlias;
                    const alias = row.alias;
                    const descriptor = row.descriptor;

                    // Create main folder (bundle_alias)
                    const bundleFolderPath = path.join(bundlesParentFolder, bundleAlias);
                    if (!fs.existsSync(bundleFolderPath)) {
                        fs.mkdirSync(bundleFolderPath);
                    }

                    // Create subfolder (alias) inside the main folder
                    const aliasFolderPath = path.join(bundleFolderPath, alias);
                    if (!fs.existsSync(aliasFolderPath)) {
                        fs.mkdirSync(aliasFolderPath);
                    }

                    // Write content to .json file inside the subfolder
                    const jsonFilePath = path.join(aliasFolderPath, '.default.json');
                    const jsonContent = JSON.stringify(descriptor, null, 2);
                    fs.writeFileSync(jsonFilePath, jsonContent, 'utf-8');
                });
            }
            vscode.window.showInformationMessage(`Successfully Completed Fetching and Creating Folders!`);
            console.log('Successfully completed fetching and creating folders!');
            return true;
        }
        catch (error) {
            vscode.window.showErrorMessage(`Connection Error`);
            console.error(`Connection error: ${error.message}`);
            return false;
        }
    }
    else {
        if (bundleAlias !== "" && alias == "") {
            try {
                const getUrl = credentials.getWidgetTypesFalse + bundleAlias;
                const token = await login(workspaceFolderPath);
                if (token == null) return;
                const data = await fetch(getUrl, token);
                if (data == null) return;
                const bundlesParentFolder = path.join(workspaceFolderPath, 'bundles');
                if (!fs.existsSync(bundlesParentFolder)) {
                    fs.mkdirSync(bundlesParentFolder);
                }
                data.data.forEach(row => {
                    const bundleAlias = row.bundleAlias;
                    const alias = row.alias;
                    const descriptor = row.descriptor;

                    // Create main folder (bundle_alias)
                    const bundleFolderPath = path.join(bundlesParentFolder, bundleAlias);
                    if (!fs.existsSync(bundleFolderPath)) {
                        fs.mkdirSync(bundleFolderPath);
                    }

                    // Create subfolder (alias) inside the main folder
                    const aliasFolderPath = path.join(bundleFolderPath, alias);
                    if (!fs.existsSync(aliasFolderPath)) {
                        fs.mkdirSync(aliasFolderPath);
                    }

                    // Write content to .json file inside the subfolder
                    const jsonFilePath = path.join(aliasFolderPath, '.default.json');
                    const jsonContent = JSON.stringify(descriptor, null, 2);
                    fs.writeFileSync(jsonFilePath, jsonContent, 'utf-8');
                });
                vscode.window.showInformationMessage(`Successfully Completed Fetching and Creating Folders!`);
                console.log('Successfully completed fetching and creating folders!');
                return true;
            }
            catch (error) {
                vscode.window.showErrorMessage(`Connection Error`);
                console.error(`Connection error: ${error.message}`);
                return false;
            }
        }
        else {
            const getUrl = credentials.getWidgetTypesFalse + bundleAlias;
            const token = await login(workspaceFolderPath);
            if (token == null) return;
            const data = await fetch(getUrl, token);
            if (data == null) return;
            let id; let descriptor;
            data.data.forEach(row => {
                if (bundleAlias == row.bundleAlias && alias == row.alias) {
                    try {
                        id = row.id.id;
                    }
                    catch (error) {
                        vscode.window.showErrorMessage(`Bundle or Widget Not Matched`);
                        console.error(`Bundle or Widget not matched: ${error.message}`);
                        return false;
                    }
                }
            });
            const getUrl2 = credentials.getWidgetType + id;
            const token2 = await login(workspaceFolderPath);
            if (token2 == null) return;
            const data2 = await fetch(getUrl2, token2);
            if (data2 == null) return;
            const bundlesParentFolder = path.join(workspaceFolderPath, 'bundles');
            if (!fs.existsSync(bundlesParentFolder)) {
                fs.mkdirSync(bundlesParentFolder);
            }
            for (const [key, value] of Object.entries(data2.data)) {
                if (key == "descriptor") {
                    descriptor = value;
                }
                // Create main folder (bundle_alias)
                const bundleFolderPath = path.join(bundlesParentFolder, bundleAlias);
                if (!fs.existsSync(bundleFolderPath)) {
                    fs.mkdirSync(bundleFolderPath);
                }

                // Create subfolder (alias) inside the main folder
                const aliasFolderPath = path.join(bundleFolderPath, alias);
                if (!fs.existsSync(aliasFolderPath)) {
                    fs.mkdirSync(aliasFolderPath);
                }

                // Write content to .json file inside the subfolder
                const jsonFilePath = path.join(aliasFolderPath, '.default.json');
                if (descriptor) {
                    const jsonContent = JSON.stringify(descriptor, null, 2);
                    fs.writeFileSync(jsonFilePath, jsonContent, 'utf-8');
                }
            }
            vscode.window.showInformationMessage(`Successfully Completed Fetching and Creating Folders!`);
            console.log('Successfully completed fetching and creating folders!');
            return true;
        }
    }
}

module.exports = fetchAndCreateFolders;