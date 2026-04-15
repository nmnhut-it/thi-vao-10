/**
 * Telegram Bot Integration
 * Sends student progress to a Telegram group via Bot API
 *
 * Config is passed via URL params or localStorage:
 *   ?tg_bot=BOT_TOKEN&tg_chat=CHAT_ID&student=StudentName
 *
 * Once set via URL, values are saved to localStorage for future visits.
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

const Telegram = {
  botToken: null,
  chatId: null,
  studentName: null,

  /**
   * Initialize from URL params or localStorage
   */
  init() {
    const params = new URLSearchParams(window.location.search);

    // URL params take priority, then localStorage
    this.botToken = params.get('tg_bot') || Storage.load('tg-bot-token', null);
    this.chatId = params.get('tg_chat') || Storage.load('tg-chat-id', null);
    this.studentName = params.get('student') || Storage.load('student-name', null);

    // Save to localStorage if from URL
    if (params.get('tg_bot')) Storage.save('tg-bot-token', this.botToken);
    if (params.get('tg_chat')) Storage.save('tg-chat-id', this.chatId);
    if (params.get('student')) Storage.save('student-name', this.studentName);
  },

  /**
   * Check if Telegram is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!(this.botToken && this.chatId);
  },

  /**
   * Send a text message to the Telegram group
   * @param {string} text - message text (supports HTML parse mode)
   * @returns {Promise<boolean>} true if sent successfully
   */
  async sendMessage(text) {
    if (!this.isConfigured()) return false;

    const url = TELEGRAM_API + this.botToken + '/sendMessage';

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: text,
          parse_mode: 'HTML'
        })
      });
      return resp.ok;
    } catch (e) {
      return false;
    }
  },

  /**
   * Send progress report for a completed topic/test
   * @param {string} topicTitle
   * @param {number} correct
   * @param {number} total
   * @param {number} stars
   */
  async sendProgress(topicTitle, correct, total, stars) {
    const pct = total > 0 ? Math.round(correct / total * 100) : 0;
    const starIcons = '\u2B50'.repeat(stars) + '\u2606'.repeat(3 - stars);
    const name = this.studentName || 'Hoc sinh';

    const lines = [
      '<b>' + name + '</b> vua hoan thanh:',
      '',
      '\uD83D\uDCD6 <b>' + topicTitle + '</b>',
      '\u2705 Ket qua: <b>' + correct + '/' + total + '</b> (' + pct + '%)',
      starIcons,
      '',
      '\uD83D\uDD52 ' + new Date().toLocaleString('vi-VN')
    ];

    await this.sendMessage(lines.join('\n'));
  },

  /**
   * Send attendance check-in
   */
  async sendAttendance() {
    const name = this.studentName || 'Hoc sinh';
    const msg = '\uD83D\uDCCB <b>' + name + '</b> da bat dau hoc luc ' +
      new Date().toLocaleString('vi-VN');
    await this.sendMessage(msg);
  }
};
