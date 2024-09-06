import Protocol from "#game/net/Protocol.js";
import logger from "#utils/logger.js";
import LoopMgr from "#game/common/LoopMgr.js";
import AdRewardMgr from "#game/mgr/AdRewardMgr.js";

export default class PetsMgr {
    constructor() {
        this.isProcessing = false;
        this.freeDrawTimes = 0 //免费内胆数量
        this.AD_REWARD_DAILY_DRAW_MAX_NUM = 2 //免费内胆上限
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
        this.freeDrawTimes = t.kernelData.freeDrawTimes;
        if (t.forceUnlockTime != "-1") { this.freeDrawTimes = 2 }//如果没解锁就说明不能抽取-1已解锁,未解锁赋值MAX任务自动终止
    }

    //抽取灵兽内丹结果同步
    PetKernelDrawResp(t) {
        //同步存在延迟可能会导致已经加入队列的数据再次追加
        if (this.freeDrawTimes == 2) return
        this.freeDrawTimes = t.freeDrawTimes
    }

    //抽取免费内丹
    PetKernelDraw() {
        const logContent = `[灵兽内丹] 还剩 ${this.AD_REWARD_DAILY_DRAW_MAX_NUM - this.freeDrawTimes} 次广告激励`;
        AdRewardMgr.inst.AddAdRewardTask({ protoId: Protocol.S_PET_KERNEL_DRAW, data: { isTen: false }, logStr: logContent });
    }

    async loopUpdate() {
        if (this.isProcessing) return
        this.isProcessing = true
        try {
            if (this.freeDrawTimes == 2) {
                logger.info(`[灵兽内丹] 达到每日最大领取次数，停止奖励领取`)
                this.clear()
                return
            }

            this.PetKernelDraw()
            this.freeDrawTimes += 1
        } catch (error) {
            logger.error(`[灵兽内丹] loopUpdate error: ${error}`);
        } finally {
            this.isProcessing = false
        }
    }
}
