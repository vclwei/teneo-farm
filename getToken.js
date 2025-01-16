const fs = require('fs/promises');
const axios = require('axios');

const reffCode = "OwAG3kib1ivOJG4Y0OCZ8lJETa6ypvsDtGmdhcjA";

async function readAccounts(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const accounts = data.split('\n').map(line => {
            const [email, password] = line.split('|');
            return { email, password };
        });
        return accounts;
    } catch (err) {
        throw new Error(`Error reading accounts file: ${err.message}`);
    }
}

async function login(email, password, proxy) {
    const loginUrl = "https://auth.teneo.pro/api/login";
    const agent = new HttpsProxyAgent(proxy);

    try {
        const response = await axios.post(loginUrl, {
            email: email,
            password: password
        }, {
            headers: {
                'x-api-key': reffCode
            },
            httpsAgent: agent,
            httpAgent: agent
        });

        const access_token = response.data.access_token;
        return access_token;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        return null;
    }
}

async function refreshTokens() {
    console.log('Processing getting token to all accounts...');
    try {
        await fs.access('tokens.txt');
        await fs.unlink('tokens.txt');
        console.log('clear old tokens.txt successfully');
    } catch (error) {
        console.log('file tokens.txt does not exist, creating new file');
    }
    try {
        const accounts = await readAccounts('accounts.txt');
        if (!accounts.length) {
            console.log('No accounts found in the accounts.txt');
            return;
        }
        const proxies = await readFile('proxies.txt');
        for (const [index, account] of accounts.entries()) {
            console.log('Getting access token for:', account.email);
            const proxy = proxies[index % proxies.length] || null;
            const token = await login(account.email, account.password, proxy);
            
            if (token) {
                console.log('Access token:', token);
                await fs.appendFile('tokens.txt', token + '\n', 'utf8');
                console.log('Token saved to file tokens.txt');
            }
        }
    } catch (error) {
        console.error('Error processing accounts:', error.message);
    }
}

refreshTokens();
