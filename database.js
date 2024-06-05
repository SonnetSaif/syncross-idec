const fs = require('fs');
const { Client } = require('pg');
let client;

async function databaseConfig(configFilePath){
    if (fs.existsSync(configFilePath)) {
        console.log(`The file exists at ${configFilePath}`);
        try{
            const configData = fs.readFileSync(configFilePath, 'utf8');
            const config = JSON.parse(configData);
            client = new Client({
                host: config.host,
                port: config.port,
                database: config.database,
                user: config.user,
                password: config.password
            });
    
            async function connectToPostgreSQL() {
                try {
                    await client.connect();
                    console.log('Connected to PostgreSQL database!');
                    return client;
                } catch (error) {
                    console.error('Connection error:', error.stack);
                    throw error;
                }
            }
            return await connectToPostgreSQL()
        }
        catch (error) {
            console.error('Error reading or parsing the file:', error);
        }
    }
    else{
        console.error(`The file does not exist at ${configFilePath}`);
    }
}

module.exports =  databaseConfig;