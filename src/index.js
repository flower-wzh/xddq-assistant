import initialize from "#loaders/index.js";
// import fs from 'fs';

async function start() {
    // const data = fs.readFileSync('../account.json', 'utf8');
    // const account = JSON.parse(data)[0]; // 获取账户信息

    const account = JSON.parse(process.env.ACCOUNT); // 获取传递的账户信息
    const { username, password, serverId, token, uid } = account;
    global.account = account; // 设置 global.account
    global.configFile = "account.json";
    await initialize(username, password, serverId, token, uid);
}

start();