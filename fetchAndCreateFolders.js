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
                aliasList.push(row.id.id);
            })
            const bundlesParentFolder = path.join(workspaceFolderPath, 'bundles');
            if (!fs.existsSync(bundlesParentFolder)) {
                fs.mkdirSync(bundlesParentFolder);
            }
            for (let element of aliasList) {
                const getUrl = credentials.getWidgetsBundle + element + `?inlineImages=true`;
                const data = await fetch(getUrl, token);
                if (data == null) return;
                const name = data.data.name;
                const id = data.data.id.id;
                const getUrl2 = credentials.getWidgetTypesInfos + id + `&fullSearch=false&deprecatedFilter=ALL`;
                const data2 = await fetch(getUrl2, token);
                
                data2.data.data.forEach(async id => {
                    const widgetId = id.id.id;
                    const getUrl3 = credentials.getWidgetType + widgetId + `?inlineImages=true`;
                    const data4 = await fetch(getUrl3, token);
                    
                    let bundleAlias = name;
                    let alias = data4.data.fqn;
                    let descriptor = data4.data.descriptor;

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
                })
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
                const token = await login(workspaceFolderPath);
                if (token == null) return;
                const data = await fetch(credentials.getWidgetsBundles, token);
                if (data == null) return;
                let widgetBundleId = "";
                data.data.forEach(id => {
                    if(id.name == bundleAlias){
                        widgetBundleId = id.id.id;
                    }
                })
                
                const getUrl = credentials.getWidgetTypesInfos + widgetBundleId + `&fullSearch=false&deprecatedFilter=ALL`;
                const data1 = await fetch(getUrl, token);
                
                const bundlesParentFolder = path.join(workspaceFolderPath, 'bundles');
                if (!fs.existsSync(bundlesParentFolder)) {
                    fs.mkdirSync(bundlesParentFolder);
                }
                data1.data.data.forEach( async id => {
                    const widgetId = id.id.id;
                    const getUrl3 = credentials.getWidgetType + widgetId + `?inlineImages=true`;
                    const data2 = await fetch(getUrl3, token);

                    let alias = data2.data.fqn;
                    let descriptor = data2.data.descriptor;

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

                })
            
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
            const token = await login(workspaceFolderPath);
            if (token == null) return;
            const data = await fetch(credentials.getWidgetsBundles, token);
            if (data == null) return;
            let widgetBundleId = "";
            data.data.forEach(id => {
                if (id.name === bundleAlias) {
                    widgetBundleId = id.id.id;
                }
            })

            const getUrl = credentials.getWidgetTypesInfos + widgetBundleId + `&fullSearch=false&deprecatedFilter=ALL`;
            const data1 = await fetch(getUrl, token);
            let widgetId = "";
            data1.data.data.forEach(row => {
                if(row.name === alias){
                    widgetId = row.id.id;
                }
            })

            const bundlesParentFolder = path.join(workspaceFolderPath, 'bundles');
            if (!fs.existsSync(bundlesParentFolder)) {
                fs.mkdirSync(bundlesParentFolder);
            }

            const getUrl1 = credentials.getWidgetType + widgetId + `?inlineImages=true`;
            const data2 = await fetch(getUrl1, token);
            
            let descriptor = data2.data.descriptor;

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

            vscode.window.showInformationMessage(`Successfully Completed Fetching and Creating Folders!`);
            console.log('Successfully completed fetching and creating folders!');
            return true;
        }
    }
}

module.exports = fetchAndCreateFolders;