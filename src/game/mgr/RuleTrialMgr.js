import GameNetMgr from "#game/net/GameNetMgr.js";
import Protocol from "#game/net/Protocol.js";
import logger from "#utils/logger.js";
import LoopMgr from "#game/common/LoopMgr.js";

export default class RuleTrialMgr {
    constructor() {
        this.isProcessing = false;
        this.isRepeated = false
        LoopMgr.inst.add(this);
    }

    static get inst() {
        if (!this._instance) {
            this._instance = new RuleTrialMgr();
        }
        return this._instance;
    }

    static reset() {
        this._instance = null;
    }

    clear() {
        LoopMgr.inst.remove(this);
    }

    RuleTrialDataSync(t) {
        this.isRepeated = t.isRepeated
    }

    async loopUpdate() {
        if (this.isProcessing) return
        this.isProcessing = true
        try {
            if (this.isRepeated) {
                logger.info(`[法则试练]速战已完成,终止任务`)
                this.clear()
                return
            }
            logger.info(`[法则试练]速战开始`)
            GameNetMgr.inst.sendPbMsg(Protocol.S_RULE_ONE_KEY_TRIAL_REPEAT, {});
        } catch (error) {
            logger.error(`[法则试练] loopUpdate error: ${error}`);
        } finally {
            this.isProcessing = false
        }
    }
}
