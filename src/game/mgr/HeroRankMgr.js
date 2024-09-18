import GameNetMgr from "#game/net/GameNetMgr.js";
import Protocol from "#game/net/Protocol.js";
import logger from "#utils/logger.js";
import SystemUnlockMgr from "#game/mgr/SystemUnlockMgr.js";
import LoopMgr from "#game/common/LoopMgr.js";
import RegistMgr from '#game/common/RegistMgr.js';

export default class HeroRankMgr {
    constructor() {
        this.isProcessing = false;
        this.enabled = global.account.switch.herorank || false;  // 是否开启光速群英榜
        this.buyNumDaily = 0;   // 当天已买数量
        this.energy = 0;        // 当前剩余体力
        this.rank = null;       // 当前排名
        LoopMgr.inst.add(this);
        RegistMgr.inst.add(this);
    }

    static get inst() {
        if (!SystemUnlockMgr.HERORANK) {
            logger.warn(`[群英榜管理] ${global.colors.red}系统未解锁${global.colors.reset}`);
            return null;
        }

        if (!this._instance) {
            this._instance = new HeroRankMgr();
        }
        return this._instance;
    }

    reset() {
        this._instance = null;
    }

    clear() {
        LoopMgr.inst.remove(this);
    }

    getBuyNumMax() {
        const dayIndex = new Date().getDay();
        const configNum = global.account.switch.herorankBuyNumMax[dayIndex] ?? 0;
        // 限制为10以内
        return Math.max(Math.min(parseInt(configNum), 10), 0);
    }

    SyncData(t) {
        try {
            logger.debug("[群英榜管理] 初始化");
            this.energy = t.energy || 0;
            this.buyNumDaily = t.buyNumDaily || 0;

            const buyNumMax = this.getBuyNumMax();
            if (this.enabled && this.buyNumDaily < buyNumMax && this.energy <= 50) {
                const num = buyNumMax - this.buyNumDaily;
                logger.info(`[群英榜管理] 购买体力 ${num}次`);
                GameNetMgr.inst.sendPbMsg(Protocol.S_HERORANK_BUY_ENERGY, { num: num });
                this.buyNumDaily = buyNumMax;
            }
        } catch (error) {
            logger.error(`[群英榜管理] SyncData error: ${error}`);
        }
    }

    findFirstHeroRankPlayer(body) {
        try {
            return (
                body.fightPlayerList.canFightPlayerInfoList.find((player) => player.showInfo.nickName.startsWith("HeroRank_Name")) ||
                body.fightPlayerList.canFightPlayerInfoList[0]
            );
        } catch (error) {
            logger.error(`[群英榜管理] findFirstHeroRankPlayer error: ${error}`);
            return null;
        }
    }

    getFightList(t) {
        this.isProcessing = true;
        try {
            logger.debug(`[群英榜管理] 收到群英榜列表${JSON.stringify(t, null, 2)}`);
            if (t.ret === 0) {
                this.rank = t.rank || null;

                if (t.rank === 1) {
                    logger.info("[群英榜管理] 当前排名第一, 不需要再打了");
                    return;
                }

                const player = this.findFirstHeroRankPlayer(t);
                if (player) {
                    logger.info(`[群英榜管理] 找到玩家 ${player.showInfo.nickName} 准备攻击...`);
                    GameNetMgr.inst.sendPbMsg(Protocol.S_HERORANK_FIGHT, {
                        targetId: "0",
                        targetRank: player.rank,
                        masterId: player.masterId,
                        masterLv: player.masterLv,
                        appearanceId: player.showInfo.appearanceId,
                        cloudId: player.showInfo.equipCloudId,
                    }, null);
                }
            }
        } catch (error) {
            logger.error(`[群英榜管理] getFightList error: ${error}`);
        } finally {
            this.isProcessing = false;
        }
    }

    async doFight(t) {
        this.isProcessing = true;
        try {
            logger.debug(`[群英榜] 收到群英榜战斗结果${JSON.stringify(t, null, 2)}`);
            if (t.ret === 0) {
                this.energy = t.playerInfo.energy;
                if (t.allBattleRecord.isWin) {
                    logger.info(`[群英榜] 当前排名: ${t.rank} 战斗胜利, 再次请求列表...`);
                    await new Promise((resolve) => setTimeout(resolve, 2000));  // 延迟 2 秒后继续请求列表
                }
            }
        } catch (error) {
            logger.error(`[群英榜] doFight error: ${error}`);
        } finally {
            this.isProcessing = false;
        }
    }

    isLoopActive() {
        if (!this.enabled) {
            logger.info("[群英榜管理] 停止循环。未开启速通群英榜");
            this.clear();
            return false;
        }
        if (this.energy < 1) {
            logger.info("[群英榜管理] 停止循环。体力不足");
            this.clear();
            return false;
        }
        if (this.rank === 1) {
            logger.info("[群英榜管理] 停止循环。当前排名第一, 不需要再打了");
            this.clear();
            return false;
        }
        return true;
    }

    shouldStartFight(now) {
        const isMonday = now.getDay() === 1;
        const isZeroFive = now.getHours() === 0 && now.getMinutes() >= 5 && now.getMinutes() <= 10;
        return isMonday && isZeroFive && this.energy > 0;
    }

    async loopUpdate() {
        if (this.isProcessing || !this.isLoopActive()) return;

        this.isProcessing = true;
        try {
            const now = new Date();
            if (this.shouldStartFight(now)) {
                logger.info("[群英榜管理] 开始快速打群英榜");
                GameNetMgr.inst.sendPbMsg(Protocol.S_HERORANK_GET_FIGHT_LIST, { type: 0 });
            }
        } catch (error) {
            logger.error(`[群英榜管理] loopUpdate error: ${error}`);
        } finally {
            this.isProcessing = false;
        }
    }
}
