import GameNetMgr from "#game/net/GameNetMgr.js";
import Protocol from "#game/net/Protocol.js";
import logger from "#utils/logger.js";
import LoopMgr from "#game/common/LoopMgr.js";

export default class CustomMgr {
    constructor() {
        this.CUSTOM_INTERVAL = 1000 * 60 * 10; // 每次间隔时间(10分钟)
        this.lastExecuteTime = 0;
        this.initialized = false;

        this.isProcessing = false;

        LoopMgr.inst.add(this);
    }

    static get inst() {
        if (!this._instance) {
            this._instance = new CustomMgr();
        }
        return this._instance;
    }

    clear() {
        LoopMgr.inst.remove(this);
    }

    init() {
        if (!this.initialized) {
            logger.info("[自定义管理] 初始化");

            // 聚灵阵状态
            GameNetMgr.inst.sendPbMsg(Protocol.S_GATHER_ENERGY_ENTER_NEW, {}, null);
            // 运势
            GameNetMgr.inst.sendPbMsg(Protocol.S_ACTIVITY_SHARE, { activityId: 0, conditionId: 0 }, null);
            GameNetMgr.inst.sendPbMsg(Protocol.S_ACTIVITY_BBS, { activityId: 0, conditionId: 0 }, null);
            GameNetMgr.inst.sendPbMsg(Protocol.S_ACTIVITY_GAME_CIRCLE, { activityId: 0, conditionId: 0 }, null);
            GameNetMgr.inst.sendPbMsg(Protocol.S_ACTIVITY_BUY_MALL_GOODS, { activityId: 250100, mallId: 400000010, count: 1, }, null);//免费运势
            for (let i = 0; i < 20; i++) {
                GameNetMgr.inst.sendPbMsg(Protocol.S_ACTIVITY_LUCKY_DRAW, { activityId: 250100, times: 1, }, null);//运势抽奖
            }
            // 检查是否有分身
            GameNetMgr.inst.sendPbMsg(Protocol.S_ATTRIBUTE_GET_SEPARATION_DATAA_MSG_LIST_REQ, {}, null);
            // 道友一键 赠送和领取
            GameNetMgr.inst.sendPbMsg(Protocol.S_FRIEND_ONE_KEY, { type: 1 }, null);
            GameNetMgr.inst.sendPbMsg(Protocol.S_FRIEND_ONE_KEY, { type: 2 }, null);
            // 宝华堂
            GameNetMgr.inst.sendPbMsg(Protocol.S_ACTIVITY_BUY_MALL_GOODS, { mallId: 400000003, count: 1, activityId: 9875533 }, null);
            //福泽签到
            GameNetMgr.inst.sendPbMsg(Protocol.S_GOOD_FORTUNE_GET_REWARD_REQ, {activityId: 9295167, conditionId: 10001, type: 1 }, null);
            this.initialized = true;

            // 进入余额宝
            GameNetMgr.inst.sendPbMsg(Protocol.S_YUE_BAO_ENTER, { activityId: 10004986 }, null);
        }
    }

    customLoop() {
        const now = Date.now();
        if (now - this.lastExecuteTime >= this.CUSTOM_INTERVAL) {
            this.lastExecuteTime = now;
            // 进入宗门系统 TODO 判断是否开启宗门系统
            GameNetMgr.inst.sendPbMsg(Protocol.S_PUPIL_ENTER, {}, null);
            if (global.account.switch.pupil) {
                GameNetMgr.inst.sendPbMsg(Protocol.S_PUPIL_TRAIN, { isOneKey: 1 }, null);
            }
            // 仙宫外部数据请求 TODO 判断是否开启仙宫
            GameNetMgr.inst.sendPbMsg(Protocol.S_PALACE_ENTER_OUTER, {}, null);
        }
    }

    async loopUpdate() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            this.customLoop();
        } catch (error) {
            logger.error(`[自定义管理] loopUpdate error: ${error}`);
        } finally {
            this.isProcessing = false;
        }
    }
}
