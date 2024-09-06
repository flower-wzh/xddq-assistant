import Protocol from "#game/net/Protocol.js";
import logger from "#utils/logger.js";
import LoopMgr from "#game/common/LoopMgr.js";
import GameNetMgr from "#game/net/GameNetMgr.js";
import AdRewardMgr from "#game/mgr/AdRewardMgr.js";

export default class PetsMgr {
    constructor() {
        this.FREE_NUM = 2; //免费内胆上限
        this.isProcessing = false;

        LoopMgr.inst.add(this);
    }

    static get inst() {
        if (!this._instance) {
            this._instance = new PetsMgr();
        }
        return this._instance;
    }

    clear() {
        LoopMgr.inst.remove(this);
    }

    //同步玩家灵兽数据
    SyncPlayerPetDataMsg(t) {
        this.isProcessing = true;

        this.freeDrawTimes = t.kernelData.freeDrawTimes || 2;
        // //如果没解锁就说明不能抽取-1已解锁,未解锁赋值MAX任务自动终止
        // if (t.forceUnlockTime != "-1") {
        //     this.freeDrawTimes = 2;
        // }

        this.isProcessing = false;
    }

    //抽取免费内丹
    processReward() {
        if (this.freeDrawTimes < this.FREE_NUM) {
            logger.info(`[灵兽内丹] 还剩 ${this.FREE_NUM - this.freeDrawTimes} 次免费次数`);
            GameNetMgr.inst.sendPbMsg(Protocol.S_PET_KERNEL_DRAW, { isTen: false }, null);
            this.freeDrawTimes++;
        }
    }

    async loopUpdate() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        try {
            if (this.freeDrawTimes == 2) {
                logger.info(`[灵兽内丹] 达到每日最大领取次数，停止奖励领取`);
                this.clear();
                return;
            }

            this.processReward();
        } catch (error) {
            logger.error(`[灵兽内丹] loopUpdate error: ${error}`);
        } finally {
            this.isProcessing = false;
        }
    }
}
