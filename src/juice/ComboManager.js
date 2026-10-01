import { COMBO_RANKS } from '../engine/Constants.js';
import { sounds } from '../audio/SoundEffects.js';

export class ComboManager {
  constructor() {
    this.comboCount = 0;
    this.timer = 0;
    this.maxTimer = 3.5;
    this.isActive = false;
    this.activeRank = null;
    this.onComboChange = null;
    this.onComboEnd = null;
  }

  // Called when landing after skipping floors or eliminating an enemy in mid-air
  addCombo(count, isEnemyKill = false) {
    if (count < 2 && !this.isActive && !isEnemyKill) {
      return; // Need at least 2 floors or an enemy kill to trigger a combo
    }

    this.isActive = true;
    this.comboCount += isEnemyKill ? 2 : count;
    this.timer = Math.min(this.maxTimer, this.timer + (isEnemyKill ? 1.4 : 1.0));

    // Check rank
    const newRank = this.getRank(this.comboCount);
    if (newRank && (!this.activeRank || newRank.minCount > this.activeRank.minCount)) {
      this.activeRank = newRank;
      sounds.playComboFanfare(newRank.badgeIndex);
    }

    if (this.onComboChange) {
      this.onComboChange({
        count: this.comboCount,
        timerPct: this.timer / this.maxTimer,
        rank: this.activeRank,
        isActive: true
      });
    }
  }

  getRank(count) {
    for (const rank of COMBO_RANKS) {
      if (count >= rank.minCount) {
        return rank;
      }
    }
    return null;
  }

  update(dt) {
    if (!this.isActive) return;

    this.timer -= dt;

    if (this.timer <= 0) {
      this.finishCombo();
    } else if (this.onComboChange) {
      this.onComboChange({
        count: this.comboCount,
        timerPct: Math.max(0, this.timer / this.maxTimer),
        rank: this.activeRank,
        isActive: true
      });
    }
  }

  finishCombo() {
    if (!this.isActive) return;

    const finalCount = this.comboCount;
    const finalRank = this.activeRank;
    const bonusMultiplier = finalRank ? finalRank.pointsMultiplier : 1.0;
    const bonusScore = Math.floor(finalCount * finalCount * 15 * bonusMultiplier);

    this.isActive = false;
    this.comboCount = 0;
    this.timer = 0;
    this.activeRank = null;

    if (this.onComboEnd) {
      this.onComboEnd({
        count: finalCount,
        bonusScore,
        rank: finalRank
      });
    }
  }

  reset() {
    this.isActive = false;
    this.comboCount = 0;
    this.timer = 0;
    this.activeRank = null;
    if (this.onComboChange) {
      this.onComboChange({
        count: 0,
        timerPct: 0,
        rank: null,
        isActive: false
      });
    }
  }
}
