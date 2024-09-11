import GameNetMgr from "#game/net/GameNetMgr.js";
import Protocol from "#game/net/Protocol.js";
import logger from "#utils/logger.js";


export default class ActivityMgr {
    constructor() { }

    static get inst() {
        if (!this._instance) {
            this._instance = new ActivityMgr();
        }
        return this._instance;
    }

    async SyncData(t) {
        try {
            for (const i of t.mainConfig) {
                GameNetMgr.inst.sendPbMsg(Protocol.S_ACTIVITY_GET_DATA, { activityId: i.activityId }, null);
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        } catch (error) {
            logger.error(`[MsgRecvMgr] 活动通用数据同步 ${error}`);
        }
    }

    // 1002 1007 
    getReward(t) {
        const acts = t.activity.conditionDataList;
        if (acts) {
            const activityId = t.activity.activityId;

            // 黑名单会跳过
            const blackList = [9211906, 9295167, 9269555]
            if (blackList.includes(activityId)) {
                logger.info(`[活动管理] ${activityId} 被跳过`);
                return;
            }

            for (const i of acts) {
                if (!i.isGetReward && i.completeTime.toString() !== "0") {
                    logger.info(`[活动管理] ${activityId} 满足条件领取奖励: ${i.conditionId}`);
                    GameNetMgr.inst.sendPbMsg(Protocol.S_ACTIVITY_GET_CONDITION_REWARD, { activityId: activityId, conditionId: i.conditionId}, null);
                }
            }
        }
    }

    // 1003
    buyFree(t) {
        const acts = t.activityDataList;
        if (!acts) return;

        acts.forEach(i => {
            const mallConfig = i.detailConfig?.commonConfig?.mallConfig || [];
            mallConfig.filter(item => item.mallTempMsg.price === "100000=0").forEach(item => {
                const activityId = item.activityId;
                const { id, buyLimit, name } = item.mallTempMsg;

                const logAndBuy = (remaining) => {
                    logger.info(`[活动管理] ${activityId} 购买 ${name} ${remaining}次`);
                    for (let i = 0; i < remaining; i++) {
                        GameNetMgr.inst.sendPbMsg(Protocol.S_ACTIVITY_BUY_MALL_GOODS, { activityId, mallId: id, count: "1" }, null);
                    }
                };

                if (!i.mallBuyCountList || i.mallBuyCountList.length === 0) {
                    logAndBuy(buyLimit);
                } else {
                    const boughtItem = i.mallBuyCountList.find(j => j.mallId === id);
                    const boughtCount = boughtItem ? boughtItem.count.toNumber() : 0;
                    if (boughtCount < buyLimit) {
                        logAndBuy(buyLimit - boughtCount);
                    }
                }
            });
        });
    }
}
