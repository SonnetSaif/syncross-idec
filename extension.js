// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const fs = require('fs');
const path = require('path');
const util = require('util');
const vscode = require('vscode');
const postApi = require('./postApi');
const statAsync = util.promisify(fs.stat);
const postApiOld = require('./postApi-3.3');
const jsonOverride = require('./jsonOverride');
const readAndEncode = require('./readAndEncode');
const credentialsData = require('./credentials');
const separateAndFormat = require('./separateAndFormat');
const fetchAndCreateFolders = require('./fetchAndCreateFolders');
const fetchAndCreateFoldersOld = require('./fetchAndCreateFolders-3.3');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */
const additionalDirectory = 'bundles';
const oldVersion = '3.3.1'

async function processDirectories(workspaceFolderPath, bundleAlias, alias) {
	if (bundleAlias == null && alias == null) {
		const additionalDirectoryPath = path.join(workspaceFolderPath, additionalDirectory);
		const additionalDirectories = fs.readdirSync(additionalDirectoryPath);
		for (let directory of additionalDirectories) {
			const directoryContents = fs.readdirSync(path.join(workspaceFolderPath, additionalDirectory, directory));
			for (let content of directoryContents) {
				try {
					const returnFrom = await separateAndFormat(workspaceFolderPath, directory, content);
					if (returnFrom == false) return false;
					console.log(`Processing ${directory}/${content} completed successfully`);
				} catch (error) {
					console.error(`Error processing ${directory}/${content}:`, error);
				}
			}
		}
		return true;
	}
	else if (bundleAlias !== "" && alias == "") {
		const directoryContents = fs.readdirSync(path.join(workspaceFolderPath, additionalDirectory, bundleAlias));
		for (let content of directoryContents) {
			try {
				const returnFrom = await separateAndFormat(workspaceFolderPath, bundleAlias, content);
				if (returnFrom == false) return false;
				console.log(`Processing ${bundleAlias}/${content} completed successfully`);
			} catch (error) {
				console.error(`Error processing ${bundleAlias}/${content}:`, error);
			}
		}
		return true;
	}
}

async function WidgetDropdown(workspaceFolderPath) {
	const additionalDirectoryPath = path.join(workspaceFolderPath, additionalDirectory);
	const additionalDirectories = fs.readdirSync(additionalDirectoryPath);
	let selectedDirectory;
	if (Object.entries(additionalDirectories).length !== 0) {
		selectedDirectory = await vscode.window.showQuickPick(additionalDirectories, {
			placeHolder: 'Select a Bundle'
		});
	}

	const directoryContents = fs.readdirSync(path.join(workspaceFolderPath, additionalDirectory, selectedDirectory));
	const subDirectories = directoryContents.filter(item => {
		const fullPath = path.join(workspaceFolderPath, additionalDirectory, selectedDirectory, item);
		return fs.statSync(fullPath).isDirectory();
	});

	const selectedSubDirectory = await vscode.window.showQuickPick(subDirectories, {
		placeHolder: 'Select a Widget'
	});
	let bundleAlias = selectedDirectory;
	let alias = selectedSubDirectory;
	const bundlePath = path.join(workspaceFolderPath, `/bundles`, bundleAlias);
	const aliasPath = path.join(bundlePath, alias);
	const bundleExists = fs.existsSync(bundlePath);
	const aliasExists = fs.existsSync(aliasPath);
	return [bundleAlias, alias, bundleExists, aliasExists];
}

async function CheckForEmptyFolderFiles(additionalDirectoryPath) {
	try {
		await statAsync(additionalDirectoryPath);
		console.log('Directory exists.');
		return true;
	}
	catch (err) {
		if (err.code === 'ENOENT') {
			vscode.window.showErrorMessage(`Directory does not exist.`);
			console.log(`Directory does not exist`);
		}
		else {
			console.error(`Error:`, err);
		}
		return false;
	}
}

function activate(context) {
	console.log(`Congratulations, your extension "syncross-idec" is now active!`);

	let command1 = vscode.commands.registerCommand('syncross-idec.pullAllWidgetBundles', async function () {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			vscode.window.showErrorMessage(`No workspace folder found`);
			console.error(`No workspace folder found`);
			return;
		}
		const workspaceFolderPath = workspaceFolders[0].uri.fsPath, bundleAlias = null, alias = null;
		const credentials = await credentialsData(workspaceFolderPath);
		const fetchResult = credentials.version != oldVersion
			? await fetchAndCreateFolders(workspaceFolderPath, bundleAlias, alias)
			: await fetchAndCreateFoldersOld(workspaceFolderPath, bundleAlias, alias);
		// const fetchResult = await fetchAndCreateFolders(workspaceFolderPath, bundleAlias, alias);
		if (!fetchResult) {
			vscode.window.showErrorMessage(`Problem Occurred with Fetching Data and Creating Folders`);
			return;
		}

		const processResult = await processDirectories(workspaceFolderPath, bundleAlias, alias);
		if (!processResult) {
			vscode.window.showErrorMessage(`Problem Occurred with Decoding Files`);
			return;
		}

		vscode.window.showInformationMessage(`Files Decoded Successfully`);
	});

	let command2 = vscode.commands.registerCommand('syncross-idec.pullSingleWidgetBundle', async function () {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			console.error('No workspace folder found.');
			return;
		}

		const workspaceFolderPath = workspaceFolders[0].uri.fsPath;
		const additionalDirectoryPath = path.join(workspaceFolderPath, additionalDirectory);

		const isEmptyFolder = await CheckForEmptyFolderFiles(additionalDirectoryPath);
		if (!isEmptyFolder) {
			return;
		}

		const additionalDirectories = fs.readdirSync(additionalDirectoryPath);
		if (additionalDirectories.length === 0) {
			vscode.window.showErrorMessage(`No Bundles`);
			return;
		}

		const bundleAlias = await vscode.window.showQuickPick(additionalDirectories, {
			placeHolder: 'Select a Bundle'
		});

		if (!bundleAlias) {
			vscode.window.showErrorMessage(`Invalid input. Please try again`);
			return;
		}

		const bundlePath = path.join(workspaceFolderPath, `/bundles`, bundleAlias);
		const bundleExists = fs.existsSync(bundlePath);
		if (!bundleExists) {
			vscode.window.showErrorMessage(`Widget Bundle or Widget Not Exists. Please Try Again`);
			vscode.commands.executeCommand(`syncross-idec.pullSingleWidgetBundle`);
			return;
		}
		const credentials = await credentialsData(workspaceFolderPath);
		const returnFrom = credentials.version != oldVersion
			? await fetchAndCreateFolders(workspaceFolderPath, bundleAlias, "")
			: await fetchAndCreateFoldersOld(workspaceFolderPath, bundleAlias, "");
		// const returnFrom = await fetchAndCreateFolders(workspaceFolderPath, bundleAlias, "");
		if (!returnFrom) {
			vscode.window.showErrorMessage(`Problem Occurred with Fetching Data and Creating Folders`);
			return;
		}

		const returnFrom2 = await processDirectories(workspaceFolderPath, bundleAlias, "");
		if (!returnFrom2) {
			vscode.window.showErrorMessage(`Problem Occurred with Decoding Files`);
			return;
		}

		vscode.window.showInformationMessage(`Files Decoded Successfully`);
	});

	let command3 = vscode.commands.registerCommand('syncross-idec.pullSingleWidget', async function () {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			console.error(`No workspace folder found`);
			return;
		}

		const workspaceFolderPath = workspaceFolders[0].uri.fsPath;
		const [bundleAlias, alias, bundleExists, aliasExists] = await WidgetDropdown(workspaceFolderPath);

		if (!bundleAlias || !alias) {
			vscode.window.showErrorMessage('Invalid Input. Please try again.');
			return;
		}

		if (!bundleExists || !aliasExists) {
			vscode.window.showErrorMessage('Widget Bundle or Widget Not Exists. Please Try Again.');
			vscode.commands.executeCommand('syncross-idec.pullSingleWidget');
			return;
		}
		const credentials = await credentialsData(workspaceFolderPath);
		const returnFrom = credentials.version != oldVersion
			? await fetchAndCreateFolders(workspaceFolderPath, bundleAlias, "")
			: await fetchAndCreateFoldersOld(workspaceFolderPath, bundleAlias, "");
		// const returnFrom = await fetchAndCreateFolders(workspaceFolderPath, bundleAlias, alias);
		if (!returnFrom) {
			vscode.window.showErrorMessage(`Problem Occurred with Fetching Data and Creating Folders`);
			return;
		}

		const returnFrom2 = await separateAndFormat(workspaceFolderPath, bundleAlias, alias);
		if (!returnFrom2) {
			vscode.window.showErrorMessage(`Problem Occurred with Decoding Files`);
			return;
		}

		vscode.window.showInformationMessage(`Files Decoded Successfully`);
	});

	let command4 = vscode.commands.registerCommand('syncross-idec.code', async function () {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			console.error(`No workspace folder found`);
			return;
		}

		const workspaceFolderPath = workspaceFolders[0].uri.fsPath;
		await vscode.workspace.saveAll();

		vscode.workspace.textDocuments.forEach(async document => {
			const filePath = document.fileName;
			if (filePath.endsWith('credentials.json')) {
				return;
			}

			const parentDirectory = path.dirname(path.dirname(filePath));
			const secondLastFolder = path.basename(parentDirectory);
			const lastFolder = path.basename(path.dirname(filePath));
			const bundleAlias = secondLastFolder;
			const alias = lastFolder;

			const returnFrom = await readAndEncode(workspaceFolderPath, bundleAlias, alias);
			if (returnFrom == false) {
				vscode.window.showErrorMessage(`Problem Occurred with Encoding Files`);
				return;
			}

			const returnFrom2 = await jsonOverride(workspaceFolderPath, bundleAlias, alias);
			if (returnFrom2 == false) {
				vscode.window.showErrorMessage(`Problem Occurred with JSON files`);
				return;
			}
			const credentials = await credentialsData(workspaceFolderPath);
			const returnFrom3 = credentials.version != oldVersion
				? await postApi(workspaceFolderPath, bundleAlias, alias)
				: await postApiOld(workspaceFolderPath, bundleAlias, alias);
			// const returnFrom3 = await postApi(workspaceFolderPath, bundleAlias, alias);
			if (returnFrom3 == false) {
				vscode.window.showErrorMessage(`Problem Occurred with Saving Files to Database`);
				return;
			}
		});
	});

	let command5 = vscode.commands.registerCommand('syncross-idec.createCredentials', async function () {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			console.error('No workspace folder found.');
			return;
		}

		const workspaceFolderPath = workspaceFolders[0].uri.fsPath;
		const credentialsFilePath = path.join(workspaceFolderPath, 'credentials.json');

		try {
			await fs.promises.access(credentialsFilePath, fs.constants.F_OK);
			vscode.window.showInformationMessage(`credentials.json file already exists`);
			return;
		} catch (error) {
			const credentials = {
				loginUrl: ``,
				username: ``,
				password: ``,
				version: ``
			};

			try {
				await fs.promises.writeFile(credentialsFilePath, JSON.stringify(credentials, null, 2));
				vscode.window.showInformationMessage(`credentials.json file created successfully`);
			} catch (error) {
				vscode.window.showErrorMessage(`Error writing credentials to file.`);
				console.error(`Error writing credentials to file:`, error);
			}
		}
	});
	context.subscriptions.push(command1, command2, command3, command4, command5);
}

// This method is called when your extension is deactivated
function deactivate() { }
module.exports = {
	activate,
	deactivate
}