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
   * Resolve student name from StudentInfo (preferred) or legacy storage.
   */
  _resolveName() {
    if (typeof StudentInfo !== 'undefined') {
      const info = StudentInfo.get();
      if (info && info.name) return info.name;
    }
    return this.studentName || 'Hoc sinh';
  },

  /**
   * Send a photo to the Telegram group.
   * @param {string} photoDataUrl - JPEG data URL (base64)
   * @param {string} caption - caption (supports HTML parse mode)
   * @returns {Promise<boolean>}
   */
  async sendPhoto(photoDataUrl, caption) {
    if (!this.isConfigured() || !photoDataUrl) return false;

    const url = TELEGRAM_API + this.botToken + '/sendPhoto';
    try {
      // Convert data URL -> Blob
      const resp0 = await fetch(photoDataUrl);
      const blob = await resp0.blob();

      const form = new FormData();
      form.append('chat_id', this.chatId);
      form.append('caption', caption || '');
      form.append('parse_mode', 'HTML');
      form.append('photo', blob, 'student.jpg');

      const resp = await fetch(url, { method: 'POST', body: form });
      return resp.ok;
    } catch (e) {
      return false;
    }
  },

  /**
   * Send progress report for a completed topic/test.
   * Attaches the student's stored photo if available.
   */
  async sendProgress(topicTitle, correct, total, stars) {
    const pct = total > 0 ? Math.round(correct / total * 100) : 0;
    const starIcons = '\u2B50'.repeat(stars) + '\u2606'.repeat(3 - stars);
    const name = this._resolveName();

    const lines = [
      '<b>' + name + '</b> vua hoan thanh:',
      '',
      '\uD83D\uDCD6 <b>' + topicTitle + '</b>',
      '\u2705 Ket qua: <b>' + correct + '/' + total + '</b> (' + pct + '%)',
      starIcons,
      '',
      '\uD83D\uDD52 ' + new Date().toLocaleString('vi-VN')
    ];
    const caption = lines.join('\n');

    // Prefer photo message; fall back to text-only if no photo.
    const info = (typeof StudentInfo !== 'undefined') ? StudentInfo.get() : null;
    if (info && info.photo) {
      const ok = await this.sendPhoto(info.photo, caption);
      if (ok) return;
    }
    await this.sendMessage(caption);
  },

  async sendAttendance() {
    const name = this._resolveName();
    const msg = '\uD83D\uDCCB <b>' + name + '</b> da bat dau hoc luc ' +
      new Date().toLocaleString('vi-VN');
    await this.sendMessage(msg);
  },

  /**
   * Send an in-progress check-in photo (silent capture during test).
   * @param {string} photoDataUrl - JPEG data URL from Camera.capture()
   * @param {number} questionNumber - 1-based
   * @param {string} topicTitle
   * @param {{correct:number,answered:number,total:number}} progress
   */
  async sendCheckIn(photoDataUrl, questionNumber, topicTitle, progress) {
    if (!photoDataUrl) return;
    const name = this._resolveName();
    const pct = progress.answered > 0 ? Math.round(progress.correct / progress.answered * 100) : 0;
    const lines = [
      '\uD83D\uDCF8 <b>' + name + '</b> dang lam bai',
      '\uD83D\uDCD6 ' + topicTitle,
      '\u23F1\uFE0F Cau ' + questionNumber + '/' + progress.total +
        ' \u2014 \u2705 ' + progress.correct + '/' + progress.answered + ' (' + pct + '%)',
      '\uD83D\uDD52 ' + new Date().toLocaleString('vi-VN')
    ];
    await this.sendPhoto(photoDataUrl, lines.join('\n'));
  }
};
