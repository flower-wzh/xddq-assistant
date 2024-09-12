
## 免责声明
	
本仓库仅供技术学习交流使用，如有下载相关文件，请在学习后24小时内删除相关内容。

切勿在 tb/pdd 等商城的非法渠道付费此软件。

如将本仓库教程/文件用于获利，那么：你妈死了。

请勿将本项目内容用于非法用途，使用者在使用时即视为对行为可能产生的任何不良后果负责。
	
由于传播、利用此工具所提供的信息而造成的任何直接或者间接的后果及损失，均由使用者本人负责，作者不为此承担任何责任。

## 使用方法

### 1. 生成固定账号密码

使用手机微信打开 [这个链接](https://wxshare1.37.com/dist/dzg/zzb-20220512/?hd_referer=jsb&game_id=784)，生成账号和密码。

### 2. 配置`account.json`

- 重命名 `account.json.sample` 为 `account.json`。
- 根据注释提示修改配置内容，例如设置 `username`、`password`、`serverId` 等信息。

### 3. 安装Docker

- 参考[此链接](https://blog.csdn.net/qq_60308100/article/details/135117638)进行Docker安装。

### 4. 使用Docker单账户方案

- 使用以下命令运行Docker单账户方案：

```bash
docker run -v <目录>/account.json:/app/account.json genchsusu/xddq:latest
```

### 5. 多账户方案（使用`node appBatch.js`）

#### 5.1 全局安装pm2

```bash
npm install pm2 -g
```

#### 5.2 准备多账户配置文件

- 将多个账户的配置文件（JSON 格式）放置在项目根目录下的 `data` 目录中，每个文件一个账户配置，例如：
    - `data/account1.json`
    - `data/account2.json`
    - `data/account3.json`

#### 5.3 启动批量账户

使用批量启动脚本 `appBatch.js`，它将自动遍历 `data` 目录中的所有 `.json` 配置文件，并使用 `pm2` 启动每个账户。

执行命令如下：

```bash
node appBatch.js
```

`pm2` 会为每个账户配置启动一个进程，并根据 `serverId` 和 `username` 动态生成进程名称。

#### 5.4 管理进程

- 查看所有进程状态：

```bash
pm2 list
```

- 停止某个进程：

```bash
pm2 stop <process_name>
```

- 重启某个进程：

```bash
pm2 restart <process_name>
```

- 停止所有进程：

```bash
pm2 stop all
```

- 重启所有进程：

```bash
pm2 restart all
```

- 查看日志：

```bash
pm2 logs
```