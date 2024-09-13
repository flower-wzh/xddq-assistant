import GameNetMgr from "#game/net/GameNetMgr.js";
import Protocol from "#game/net/Protocol.js";
import logger from "#utils/logger.js";
import LoopMgr from "#game/common/LoopMgr.js";
import BagMgr from "#game/mgr/BagMgr.js";

export default class YueBaoMgr {
    constructor() {
        this.isProcessing = false;
        this.lastEnterTime = 0;
        this.enterInterval = 5 * 60 * 1000;
        this.hasDeposited = false; // 标记存款操作是否已执行

        LoopMgr.inst.add(this);
    }

    static get inst() {
        if (!this._instance) {
            this._instance = new YueBaoMgr();
        }
        return this._instance;
    }

    clear() {
        LoopMgr.inst.remove(this);
    }

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
                    GameNetMgr.inst.sendPbMsg(Protocol.S_YUE_BAO_INTERACTE, { activityId: 10004986 }, null);
                    this.hasDeposited = false;  // 重置存款状态
                }

                // 当 playerData.endTime == "0", playerData.index == 0, playerData.depositNum == 0 且仙玉大于3000，执行存钱操作
                const xianYu = BagMgr.inst.getGoodsNum(100004) || 0;

                if (!this.hasDeposited && parseInt(playerData.endTime) == 0 && playerData.index == 0 && playerData.depositNum == 0 && xianYu > 3000) {
                    logger.info(`[余额宝管理] 执行存款操作`);
                    GameNetMgr.inst.sendPbMsg(Protocol.S_YUE_BAO_DEPOSIT, {
                        activityId: 10004986,
                        index: 1,
                        depositNum: 3000
                    }, null);
                    this.hasDeposited = true; // 存款操作已执行，标记为 true
                }
            }
        }

        this.isProcessing = false;
    }

    async loopUpdate() {
        const currentTime = Date.now();

        // 如果正在处理或者30分钟内已经调用过 enter，则直接返回
        if (this.isProcessing || currentTime - this.lastEnterTime < this.enterInterval) return;

        this.isProcessing = true;

        try {
            GameNetMgr.inst.sendPbMsg(Protocol.S_YUE_BAO_ENTER, { activityId: 10004986 }, null);

            // 更新最后一次调用 enter 的时间
            this.lastEnterTime = currentTime;
        } catch (error) {
            logger.error(`[余额宝管理] loopUpdate error: ${error}`);
        } finally {
            this.isProcessing = false;
        }
    }
}
