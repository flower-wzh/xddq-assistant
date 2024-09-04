import initialize from "#loaders/index.js";
// import fs from 'fs';

async function start() {
    // const data = fs.readFileSync('../account.json', 'utf8');
    // const account = JSON.parse(data)[0]; // 获取账户信息

    const account = JSON.parse(process.env.ACCOUNT); // 获取传递的账户信息
    const { username, password, serverId, token, uid } = account;
    global.account = account; // 设置 global.account
    global.colors = {
        reset: "\x1b[0m",       // 重置颜色

        // 常见前景色
        black: "\x1b[30m",      // 黑色
        red: "\x1b[31m",        // 红色
        green: "\x1b[32m",      // 绿色
        yellow: "\x1b[33m",     // 黄色
        blue: "\x1b[34m",       // 蓝色
        magenta: "\x1b[35m",    // 品红（洋红）
        cyan: "\x1b[36m",       // 青色
        white: "\x1b[37m",      // 白色
    };
    global.configFile = "account.json";
    await initialize(username, password, serverId, token, uid);
}

start();