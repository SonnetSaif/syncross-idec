const fs = require('fs').promises;
const path = require('path');
const vscode = require('vscode');

async function processConfigFile(workspaceFolderPath) {
    try {
        const credentialsFilePath = path.join(workspaceFolderPath, 'credentials.json');
        const credentialsData = await fs.readFile(credentialsFilePath, 'utf8');
        const credentials = JSON.parse(credentialsData);
        
        const loginUrlRegex = /^(https?):\/\/[^\s/$.?#].[^\s]*$/;
        if (!loginUrlRegex.test(credentials.loginUrl)) {
            vscode.window.showErrorMessage("Invalid loginUrl");
            console.log("Invalid loginUrl");
            return null;
        }

        const urls = {
            username: credentials.username,
            password: credentials.password,
            version: credentials.version,
            loginUrl: `${credentials.loginUrl}/api/auth/login`,
            getWidgetTypesFalse: `${credentials.loginUrl}/api/widgetTypes?isSystem=false&bundleAlias=`,
            getWidgetsBundles: `${credentials.loginUrl}/api/widgetsBundles`,
            getWidgetType: `${credentials.loginUrl}/api/widgetType/`,
            postUrl: `${credentials.loginUrl}/api/widgetType`,
            
            getWidgetsBundle: `${credentials.loginUrl}/api/widgetsBundle/`,
            getWidgetTypesInfos: `${credentials.loginUrl}/api/widgetTypesInfos?pageSize=1024&page=0&widgetsBundleId=`, // currently working for all widgets and all bundles
            // getWidgetBundleTemp1: `${credentials.loginUrl}/api/widgetType/`
        };
        return urls;
    } catch (error) {
        console.error('Error processing config file:', error.message || error);
        return null;
    }
}

module.exports = processConfigFile;