import GameNetMgr from "#game/net/GameNetMgr.js";
import Protocol from "#game/net/Protocol.js";
import logger from "#utils/logger.js";
import LoopMgr from "#game/common/LoopMgr.js";

export default class InvadeMgr {
    constructor() {
        this.isProcessing = false;
        this.idx = global.account.switch.invade_index || 0;
        this.enabled = global.account.switch.invade || false;
        this.maxCount = 5
        this.battleNum = 0;

        LoopMgr.inst.add(this);
    }
    static get inst() {
        if (!this._instance) {
            this._instance = new InvadeMgr();
        }
        return this._instance;
    }
    clear() {
        LoopMgr.inst.remove(this);
    }
    InvadeDataMsg(t) {
        this.battleNum = t.count
        this.curInvadeId = t.curInvadeId
    }

    InvadeChallengeResp(t) {
        if (t.ret == 0) {
            logger.info(`[异兽入侵]挑战成功`);
        }
    }
    async loopUpdate() {
        if (!this.enabled) return
        if (this.isProcessing) return
        this.isProcessing = true
        try {
            if (this.battleNum >= this.maxCount) {
                logger.info(`[异兽入侵] 任务完成`)
                this.clear()
                return
            }
            logger.debug("[异兽入侵] 初始化");
            logger.info(`[异兽入侵]当前次数:${this.battleNum}`);
            //切换到分身
            GameNetMgr.inst.sendPbMsg(Protocol.S_ATTRIBUTE_SWITCH_SEPARATION_REQ, { separationIdx: this.idx }, null);
            GameNetMgr.inst.sendPbMsg(Protocol.S_ATTRIBUTE_GET_SEPARATION_DATAA_MSG_LIST_REQ, {}, null);
            //挑战
            GameNetMgr.inst.sendPbMsg(Protocol.S_INVADE_CHALLENGE, {}, null);
            this.battleNum++
        } catch (error) {
            logger.error(`[异兽入侵] InvadeDataMsg error: ${error}`);
        } finally {
            this.isProcessing = false
        }
    }
}
