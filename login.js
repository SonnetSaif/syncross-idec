const axios = require('axios');
const vscode = require('vscode');
const credentialsData = require('./credentials');

async function login(workspaceFolderPath) {
    try {
        const credentials = await credentialsData(workspaceFolderPath);
        const loginUrl = credentials.loginUrl;
        const loginData = {
            username: credentials.username,
            password: credentials.password,
        };

        const response = await axios.post(loginUrl, loginData);
        const { token, refreshToken } = response.data;

        return token;
    } catch (error) {
        vscode.window.showErrorMessage(`Login Error, Try Again`);
        console.error('Login error:', error);
        return null;
    }
}

module.exports = login;