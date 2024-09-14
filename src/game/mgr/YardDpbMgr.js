import Protocol from "#game/net/Protocol.js";
import logger from "#utils/logger.js";
import LoopMgr from "#game/common/LoopMgr.js";
import GameNetMgr from "#game/net/GameNetMgr.js";
import UserMgr from "#game/mgr/UserMgr.js";

export default class YardDpbMgr {
    constructor() {
        this.pieceShopOpen = false;
        this.grassNum = 0;
        this.freeDrawTimes = 0;//免费次数
        this.FREE_NUM = 1; //免费次数上限
        this.adCount = 0;//广告次数
        this.AD_NUM = 2;//广告次数上限
        this.danNum = 0; //丹数
        this.grassNum = 0;//草数
        this.YardCropMsg = [];//灵池
        this.buildingMsg = []//要收取的
        this.GainRewardCD = 60 * 1000 * 10;// 每次间隔时间
        this.lastGainRewardTime = 0;          // 上次领取时间


        this.isProcessing = false;
        this.lock = false;
        this.retLock = false;


        LoopMgr.inst.add(this);
    }

    static get inst() {
        if (!this._instance) {
            this._instance = new YardDpbMgr();
        }
        return this._instance;
    }

    clear() {
        LoopMgr.inst.remove(this);
    }

    //仙居登录同步
    YardLoginSync(t) {
        this.grassNum = t.grassNum;
        this.pieceShopOpen = t.pieceShopOpen;
    }

    //进入仙居结果
    YardEnterResp(t) {
        this.freeDrawTimes = t.drawData.freeDrawTimes || 0;
        this.adCount = t.drawData.adCount || 0;
        this.buildingMsg = t.areaInfo[0].buildingMsg || [];
        this.retLock = true;
    }

    //仙居管理 广告
    processReward() {
        if (!this.retLock) return;
        if (this.adCount < this.AD_NUM) {
            logger.info(`[仙居管理] 还剩 ${this.AD_NUM - this.adCount} 次广告激励`);
            GameNetMgr.inst.sendPbMsg(Protocol.S_YARDPB_BUILD_DRAW, { isTen: false, isUseADTime: false, isADType: true }, null);
            this.adCount++;
        }
        if (this.freeDrawTimes < this.FREE_NUM) {
            logger.info(`[仙居管理] 还剩 ${this.FREE_NUM - this.freeDrawTimes} 次免费次数`);
            GameNetMgr.inst.sendPbMsg(Protocol.S_YARDPB_BUILD_DRAW, { isTen: false, isUseADTime: false, isADType: false, poolId: 0 }, null);
            this.freeDrawTimes++;
        }
    }

    //生产数量同步
    YardMakeMsgSync(t) {
        this.danNum = t.danNum
        this.grassNum = t.grassNum
        this.YardCropMsg = t.YardCropMsg
    }

    //收菜
    YardBuildGainReward() {
        if (!this.retLock) return;
        const now = Date.now();
        if (this.lastGainRewardTime == 0 || now - this.lastGainRewardTime >= this.GainRewardCD) {
            for (const i of this.buildingMsg) {
                logger.info(`[仙居管理] 开始收菜： ${i.yardCellMsg.buildId}`);
                GameNetMgr.inst.sendPbMsg(Protocol.S_YARDPB_BUILD_GAIN_REWARD, { uniqueId: i.yardCellMsg.uniqueId, buildId: i.yardCellMsg.buildId }, null);
            }
            this.lastGainRewardTime = now;
        }
    }

    async loopUpdate() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        try {
            if (!this.lock) {
                GameNetMgr.inst.sendPbMsg(Protocol.S_YARDPB_ENTER, { targetPlayerId: UserMgr.playerId }, null);
                this.lock = true
            }
            //抽奖
            this.processReward();
            //收菜
            this.YardBuildGainReward();

        } catch (error) {
            logger.error(`[仙居管理] loopUpdate error: ${error}`);
        } finally {
            this.isProcessing = false;
        }
    }
}
