/**
 * Student Info - Name + photo collection & storage
 * Stored via Storage wrapper under key 'student-info' -> {name, photo, savedAt}
 * Photo is a JPEG data URL (base64). Shown once on first visit per device.
 */

const StudentInfo = {
  STORAGE_KEY: 'student-info',

  /** @returns {{name:string, photo:string, savedAt:string}|null} */
  get() {
    return Storage.load(this.STORAGE_KEY, null);
  },

  save(name, photoDataUrl) {
    const info = {
      name: (name || '').trim(),
      photo: photoDataUrl,
      savedAt: new Date().toISOString()
    };
    Storage.save(this.STORAGE_KEY, info);
    // Sync with Telegram's student-name key for back-compat
    Storage.save('student-name', info.name);
    if (typeof Telegram !== 'undefined') Telegram.studentName = info.name;
    return info;
  },

  clear() {
    Storage.remove(this.STORAGE_KEY);
  },

  /**
   * Ensure info exists; show modal if missing. Resolves with {name, photo}.
   * @returns {Promise<{name:string, photo:string}>}
   */
  ensure() {
    const existing = this.get();
    if (existing && existing.name && existing.photo) return Promise.resolve(existing);
    return new Promise(resolve => this._showModal(resolve));
  },

  /** Force re-entry of info (clears first). */
  change() {
    this.clear();
    return this.ensure();
  },

  _showModal(onComplete) {
    // Build modal DOM programmatically (avoids innerHTML for XSS safety)
    const modal = this._el('div', 'student-info-modal');
    const overlay = this._el('div', 'student-info-overlay');
    const content = this._el('div', 'student-info-content');

    const h2 = this._el('h2', null, 'Thông Tin Học Sinh');
    const desc = this._el('p', 'student-info-desc', 'Nhập tên và chụp ảnh để bắt đầu học');
    const form = this._el('div', 'student-info-form');

    // Name field
    const nameField = this._el('div', 'student-info-field');
    const nameLabel = this._el('label', null, 'Họ và tên:');
    nameLabel.htmlFor = 'si-name';
    const nameInput = this._el('input');
    nameInput.type = 'text';
    nameInput.id = 'si-name';
    nameInput.placeholder = 'Ví dụ: Nguyễn Văn A';
    nameInput.autocomplete = 'name';
    nameField.appendChild(nameLabel);
    nameField.appendChild(nameInput);

    // Photo field
    const photoField = this._el('div', 'student-info-field');
    const photoLabel = this._el('label', null, 'Ảnh đại diện:');
    const photoArea = this._el('div', 'si-photo-area');

    const video = this._el('video');
    video.id = 'si-video';
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;

    const preview = this._el('img');
    preview.id = 'si-preview';
    preview.alt = 'Ảnh đã chụp';

    const placeholder = this._el('div', 'si-placeholder');
    placeholder.id = 'si-placeholder';
    const phIcon = this._el('span', 'si-placeholder-icon', '📷');
    const phText = this._el('span', null, 'Chưa có ảnh');
    placeholder.appendChild(phIcon);
    placeholder.appendChild(phText);

    photoArea.appendChild(video);
    photoArea.appendChild(preview);
    photoArea.appendChild(placeholder);

    const photoButtons = this._el('div', 'si-photo-buttons');
    const captureBtn = this._el('button', 'btn btn--outline btn--sm', '📷 Chụp ảnh');
    captureBtn.type = 'button';
    captureBtn.id = 'si-capture';
    const uploadBtn = this._el('button', 'btn btn--outline btn--sm', '📁 Tải ảnh lên');
    uploadBtn.type = 'button';
    uploadBtn.id = 'si-upload';
    const uploadInput = this._el('input');
    uploadInput.type = 'file';
    uploadInput.id = 'si-upload-input';
    uploadInput.accept = 'image/*';
    uploadInput.hidden = true;

    photoButtons.appendChild(captureBtn);
    photoButtons.appendChild(uploadBtn);
    photoButtons.appendChild(uploadInput);

    photoField.appendChild(photoLabel);
    photoField.appendChild(photoArea);
    photoField.appendChild(photoButtons);

    const submitBtn = this._el('button', 'btn btn--primary btn--block', 'Bắt đầu');
    submitBtn.type = 'button';
    submitBtn.id = 'si-submit';
    submitBtn.disabled = true;

    form.appendChild(nameField);
    form.appendChild(photoField);
    form.appendChild(submitBtn);

    content.appendChild(h2);
    content.appendChild(desc);
    content.appendChild(form);

    modal.appendChild(overlay);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // State
    let photoDataUrl = null;
    let stream = null;
    let capturing = false;

    const setPhotoShown = () => {
      video.style.display = 'none';
      preview.style.display = 'block';
      placeholder.style.display = 'none';
    };
    const setVideoShown = () => {
      video.style.display = 'block';
      preview.style.display = 'none';
      placeholder.style.display = 'none';
    };
    const stopStream = () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
      }
      video.srcObject = null;
    };
    const validate = () => {
      submitBtn.disabled = !(nameInput.value.trim().length > 0 && photoDataUrl);
    };

    // Restore previous name if user clicked "change info"
    const existing = this.get();
    if (existing && existing.name) nameInput.value = existing.name;

    nameInput.addEventListener('input', validate);

    captureBtn.addEventListener('click', async () => {
      if (capturing) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        preview.src = photoDataUrl;
        setPhotoShown();
        stopStream();
        capturing = false;
        captureBtn.textContent = '📷 Chụp lại';
        validate();
      } else {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 640, height: 480 },
            audio: false
          });
          video.srcObject = stream;
          setVideoShown();
          capturing = true;
          captureBtn.textContent = '📸 Chụp ngay';
        } catch (err) {
          alert('Không thể truy cập camera. Vui lòng dùng nút "Tải ảnh lên".');
        }
      }
    });

    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        photoDataUrl = ev.target.result;
        preview.src = photoDataUrl;
        setPhotoShown();
        stopStream();
        capturing = false;
        captureBtn.textContent = '📷 Chụp lại';
        validate();
      };
      reader.readAsDataURL(file);
    });

    const self = this;
    submitBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name || !photoDataUrl) return;
      self.save(name, photoDataUrl);
      stopStream();
      modal.remove();
      onComplete({ name, photo: photoDataUrl });
    });

    nameInput.addEventListener('keypress', e => {
      if (e.key === 'Enter' && !submitBtn.disabled) submitBtn.click();
    });

    setTimeout(() => nameInput.focus(), 50);
  },

  _el(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }
};
