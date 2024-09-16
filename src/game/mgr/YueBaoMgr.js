import GameNetMgr from "#game/net/GameNetMgr.js";
import Protocol from "#game/net/Protocol.js";
import logger from "#utils/logger.js";
import BagMgr from "#game/mgr/BagMgr.js";
import SystemUnlockMgr from "#game/mgr/SystemUnlockMgr.js";
import RegistMgr from '#game/common/RegistMgr.js';

export default class YueBaoMgr {
    constructor() {
        this.isProcessing = false;
        this.lastEnterTime = 0;
        this.enterInterval = 60 * 1000;

        RegistMgr.inst.add(this);
    }

    static get inst() {
        if (!SystemUnlockMgr.YUE_BAO) {
            logger.warn(`[余额宝管理] ${global.colors.red}系统未解锁${global.colors.reset}`);
            return null;
        }
        
        if (!this._instance) {
            this._instance = new YueBaoMgr();
        }
        return this._instance;
    }

    reset() {
        this._instance = null;
    }

    clear() {}

    // 处理消息，判定取款或存钱
    checkStatus(t) {
        this.isProcessing = true;

        if (t.ret == 0) {
            const playerData = t.playerData;

            if (playerData) {
                const currentTime = Date.now();
                const endTime = parseInt(playerData.endTime);

                // 当前时间大于结束时间且 endTime 不为0，执行取款操作
                if (endTime > 0 && currentTime > endTime) {
                    logger.info("[余额宝管理] 执行取款操作");
                    GameNetMgr.inst.sendPbMsg(Protocol.S_YUE_BAO_INTERACTE, { activityId: 10004986 });
                }

                // 当 playerData.endTime == "0", playerData.index == 0, playerData.depositNum == 0 且仙玉大于3000，执行存钱操作
                const xianYu = BagMgr.inst.getGoodsNum(100000) || 0;

                if (parseInt(playerData.endTime) == 0 && playerData.index == 0 && playerData.depositNum == 0 && xianYu > 3000) {
                    logger.info(`[余额宝管理] 执行存款操作`);
                    GameNetMgr.inst.sendPbMsg(Protocol.S_YUE_BAO_DEPOSIT, { activityId: 10004986, index: 1, depositNum: 3000 });
                }
            }
        }

        this.isProcessing = false;
    }
}
