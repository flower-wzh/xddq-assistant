import GameNetMgr from "#game/net/GameNetMgr.js";
import Protocol from "#game/net/Protocol.js";
import logger from "#utils/logger.js";
import PlayerAttributeMgr from "./PlayerAttributeMgr.js";
import SystemUnlockMgr from "#game/mgr/SystemUnlockMgr.js";
import LoopMgr from "#game/common/LoopMgr.js";
import RegistMgr from '#game/common/RegistMgr.js';

export default class InvadeMgr {
    constructor() {
        this.isProcessing = false;
        this.enabled = global.account.switch.invade || false;
        this.maxCount = 5;
        this.battleNum = 0;

        LoopMgr.inst.add(this);
        RegistMgr.inst.add(this);
    }

    static get inst() {
        if (!SystemUnlockMgr.INVADE) {
            logger.warn(`[异兽入侵] ${global.colors.red}系统未解锁${global.colors.reset}`);
            return null;
        }

        if (!this._instance) {
            this._instance = new InvadeMgr();
        }
        return this._instance;
    }

    reset() {
        this._instance = null;
    }

    clear() {
        LoopMgr.inst.remove(this);
    }

    InvadeDataMsg(t) {
        this.battleNum = t.count;
        this.curInvadeId = t.curInvadeId;
    }

    InvadeChallengeResp(t) {
        if (t.ret == 0) {
            logger.info(`[异兽入侵] 挑战成功`);
        }
    }

    async loopUpdate() {
        if (!this.enabled) return;
        if (this.isProcessing) return;
        this.isProcessing = true;
        try {
            if (this.battleNum >= this.maxCount) {
                logger.info(`[异兽入侵] 任务完成`);
                // 任务完成后切换为默认分身
                const defaultIdx = global.account.switch.defaultIndex || 0; //默认分身
                PlayerAttributeMgr.inst.setSeparationIdx(defaultIdx);

                this.clear();
                return;
            }
            logger.debug("[异兽入侵] 初始化");
            logger.info(`[异兽入侵] 当前次数:${this.battleNum}`);
            // 切换到分身
            const idx = global.account.switch.invadeIndex || 0;
            PlayerAttributeMgr.inst.setSeparationIdx(idx);
            // 挑战
            GameNetMgr.inst.sendPbMsg(Protocol.S_INVADE_CHALLENGE, {});
            this.battleNum++;
        } catch (error) {
            logger.error(`[异兽入侵] InvadeDataMsg error: ${error}`);
        } finally {
            this.isProcessing = false;
        }
    }
}
