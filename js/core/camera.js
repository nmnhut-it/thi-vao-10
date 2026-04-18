/**
 * Camera - Silent periodic webcam capture during tests
 * Runs in the background once initialized; produces JPEG data URLs on demand.
 * Initialization is best-effort: if permission denied, capture() returns null.
 */

const Camera = {
  CAPTURE_INTERVAL: 10,  // capture every N questions
  stream: null,
  video: null,

  /**
   * Request camera permission and start hidden video stream.
   * Safe to call multiple times.
   * @returns {Promise<boolean>} true if active, false otherwise
   */
  async init() {
    if (this.isActive()) return true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false
      });
    } catch (err) {
      return false;
    }

    // Hidden video element to receive stream
    if (!this.video) {
      this.video = document.createElement('video');
      this.video.autoplay = true;
      this.video.playsInline = true;
      this.video.muted = true;
      this.video.style.position = 'fixed';
      this.video.style.left = '-9999px';
      this.video.style.width = '1px';
      this.video.style.height = '1px';
      document.body.appendChild(this.video);
    }
    this.video.srcObject = this.stream;
    try { await this.video.play(); } catch (e) { /* ignore */ }
    return true;
  },

  /** @returns {boolean} */
  isActive() {
    return this.stream !== null && this.stream.active;
  },

  /**
   * Capture a JPEG data URL from the live stream. Returns null if not active.
   * @returns {string|null}
   */
  capture() {
    if (!this.isActive() || !this.video || !this.video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    canvas.getContext('2d').drawImage(this.video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.75);
  },

  /** @param {number} questionNumber 1-based */
  shouldCapture(questionNumber) {
    return questionNumber > 0 && questionNumber % this.CAPTURE_INTERVAL === 0;
  },

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video.remove();
      this.video = null;
    }
  }
};
