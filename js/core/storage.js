/**
 * LocalStorage wrapper for English Grammar Games
 * Handles saving/loading game progress, scores, and settings
 */

const Storage = {
  STORAGE_KEY_PREFIX: 'grammar-game-',
  PROGRESS_KEY: 'progress',
  SETTINGS_KEY: 'settings',

  /**
   * Save data to LocalStorage
   * @param {string} key - Storage key
   * @param {*} data - Data to save
   * @returns {boolean} - True if successful
   */
  save(key, data) {
    try {
      const fullKey = this.STORAGE_KEY_PREFIX + key;
      localStorage.setItem(fullKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Storage save error:', error);
      return false;
    }
  },

  /**
   * Load data from LocalStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} - Retrieved data or default value
   */
  load(key, defaultValue = null) {
    try {
      const fullKey = this.STORAGE_KEY_PREFIX + key;
      const data = localStorage.getItem(fullKey);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('Storage load error:', error);
      return defaultValue;
    }
  },

  /**
   * Remove data from LocalStorage
   * @param {string} key - Storage key
   * @returns {boolean} - True if successful
   */
  remove(key) {
    try {
      const fullKey = this.STORAGE_KEY_PREFIX + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },

  /**
   * Clear all game data
   * @returns {boolean} - True if successful
   */
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },

  /**
   * Get all unit progress data
   * @returns {Object} - Progress data for all units
   */
  getAllProgress() {
    return this.load(this.PROGRESS_KEY, {});
  },

  /**
   * Get progress for specific unit
   * @param {string} unitId - Unit ID (e.g., 'unit-3-carnival')
   * @returns {Object|null} - Unit progress data
   */
  getUnitProgress(unitId) {
    const allProgress = this.getAllProgress();
    return allProgress[unitId] || null;
  },

  /**
   * Save progress for specific unit
   * @param {string} unitId - Unit ID
   * @param {Object} progressData - Progress data to save
   * @returns {boolean} - True if successful
   */
  saveUnitProgress(unitId, progressData) {
    const allProgress = this.getAllProgress();

    const unitProgress = {
      unitId: unitId,
      bestScore: progressData.score || 0,
      lastScore: progressData.score || 0,
      correctAnswers: progressData.correctAnswers || 0,
      totalQuestions: progressData.totalQuestions || 0,
      stars: progressData.stars || 0,
      completed: progressData.completed || false,
      attempts: (allProgress[unitId]?.attempts || 0) + 1,
      lastPlayed: new Date().toISOString(),
      timeSpent: progressData.timeSpent || 0
    };

    if (allProgress[unitId]) {
      unitProgress.bestScore = Math.max(
        allProgress[unitId].bestScore,
        progressData.score || 0
      );
      unitProgress.stars = Math.max(
        allProgress[unitId].stars,
        progressData.stars || 0
      );
    }

    allProgress[unitId] = unitProgress;
    return this.save(this.PROGRESS_KEY, allProgress);
  },

  /**
   * Get unit statistics
   * @param {string} unitId - Unit ID
   * @returns {Object} - Unit statistics
   */
  getUnitStats(unitId) {
    const progress = this.getUnitProgress(unitId);

    if (!progress) {
      return {
        played: false,
        bestScore: 0,
        lastScore: 0,
        stars: 0,
        attempts: 0,
        completed: false,
        percentage: 0
      };
    }

    const percentage = progress.totalQuestions > 0
      ? Math.round((progress.correctAnswers / progress.totalQuestions) * 100)
      : 0;

    return {
      played: true,
      bestScore: progress.bestScore,
      lastScore: progress.lastScore,
      stars: progress.stars,
      attempts: progress.attempts,
      completed: progress.completed,
      percentage: percentage,
      lastPlayed: progress.lastPlayed,
      timeSpent: progress.timeSpent
    };
  },

  /**
   * Get overall statistics across all units
   * @returns {Object} - Overall statistics
   */
  getOverallStats() {
    const allProgress = this.getAllProgress();
    const units = Object.values(allProgress);

    const stats = {
      totalUnits: units.length,
      completedUnits: units.filter(u => u.completed).length,
      totalAttempts: units.reduce((sum, u) => sum + u.attempts, 0),
      totalStars: units.reduce((sum, u) => sum + u.stars, 0),
      averageScore: 0,
      totalTimeSpent: units.reduce((sum, u) => sum + (u.timeSpent || 0), 0)
    };

    if (units.length > 0) {
      const totalScore = units.reduce((sum, u) => sum + u.bestScore, 0);
      stats.averageScore = Math.round(totalScore / units.length);
    }

    return stats;
  },

  /**
   * Get user settings
   * @returns {Object} - User settings
   */
  getSettings() {
    return this.load(this.SETTINGS_KEY, {
      soundEnabled: true,
      showHints: true,
      showTimer: true,
      theme: 'light'
    });
  },

  /**
   * Save user settings
   * @param {Object} settings - Settings to save
   * @returns {boolean} - True if successful
   */
  saveSettings(settings) {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    return this.save(this.SETTINGS_KEY, newSettings);
  },

  /**
   * Get specific setting value
   * @param {string} settingName - Setting name
   * @param {*} defaultValue - Default value if not found
   * @returns {*} - Setting value
   */
  getSetting(settingName, defaultValue = null) {
    const settings = this.getSettings();
    return settings[settingName] !== undefined
      ? settings[settingName]
      : defaultValue;
  },

  /**
   * Toggle boolean setting
   * @param {string} settingName - Setting name
   * @returns {boolean} - New setting value
   */
  toggleSetting(settingName) {
    const currentValue = this.getSetting(settingName, false);
    const newValue = !currentValue;
    this.saveSettings({ [settingName]: newValue });
    return newValue;
  },

  /**
   * Export all data as JSON
   * @returns {string} - JSON string of all data
   */
  exportData() {
    const data = {
      progress: this.getAllProgress(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },

  /**
   * Import data from JSON
   * @param {string} jsonString - JSON string to import
   * @returns {boolean} - True if successful
   */
  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      if (data.progress) {
        this.save(this.PROGRESS_KEY, data.progress);
      }

      if (data.settings) {
        this.save(this.SETTINGS_KEY, data.settings);
      }

      return true;
    } catch (error) {
      console.error('Import data error:', error);
      return false;
    }
  },

  /**
   * Check if LocalStorage is available
   * @returns {boolean} - True if available
   */
  isAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get storage usage info
   * @returns {Object} - Storage usage information
   */
  getStorageInfo() {
    let totalSize = 0;
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_KEY_PREFIX)) {
        const value = localStorage.getItem(key);
        totalSize += key.length + (value?.length || 0);
      }
    });

    return {
      itemCount: keys.filter(k => k.startsWith(this.STORAGE_KEY_PREFIX)).length,
      sizeInBytes: totalSize,
      sizeInKB: (totalSize / 1024).toFixed(2)
    };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
