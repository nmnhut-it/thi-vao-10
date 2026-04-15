/**
 * Utility functions for English Grammar Games
 * Shared helper functions used across all exercise types
 */

const Utils = {
  // Test mode flag - set via URL param ?test=true or ?autotest=1
  isTestMode: (() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('test') || urlParams.has('autotest');
  })(),
  /**
   * Normalize text for comparison (lowercase, trim, remove extra spaces, punctuation)
   * @param {string} text - Text to normalize
   * @returns {string} - Normalized text
   */
  normalizeText(text) {
    if (typeof text !== 'string') return '';

    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\u2018\u2019\u201C\u201D`]/g, "'")
      .replace(/[.,!?;:'"]/g, '');
  },

  /**
   * Compare two strings with normalization
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {boolean} - True if strings match
   */
  compareAnswers(str1, str2) {
    return this.normalizeText(str1) === this.normalizeText(str2);
  },

  /**
   * Check if user answer matches any accepted answer
   * @param {string} userAnswer - User's answer
   * @param {Array<string>} acceptedAnswers - Array of accepted answers
   * @returns {boolean} - True if answer is correct
   */
  validateAnswer(userAnswer, acceptedAnswers) {
    if (!Array.isArray(acceptedAnswers)) {
      acceptedAnswers = [acceptedAnswers];
    }

    const normalized = this.normalizeText(userAnswer);
    return acceptedAnswers.some(answer =>
      this.normalizeText(answer) === normalized
    );
  },

  /**
   * Shuffle array (Fisher-Yates algorithm)
   * @param {Array} array - Array to shuffle
   * @returns {Array} - Shuffled array (new array, doesn't mutate original)
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * Create HTML element with attributes and content
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes {class, id, etc.}
   * @param {string|HTMLElement|Array} content - Element content
   * @returns {HTMLElement} - Created element
   */
  createElement(tag, attributes = {}, content = null) {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });

    if (content !== null) {
      if (typeof content === 'string') {
        element.textContent = content;
      } else if (Array.isArray(content)) {
        content.forEach(child => {
          if (child instanceof HTMLElement) {
            element.appendChild(child);
          }
        });
      } else if (content instanceof HTMLElement) {
        element.appendChild(content);
      }
    }

    return element;
  },

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} - Debounced function
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Format time in seconds to MM:SS
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted time string
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Calculate percentage
   * @param {number} value - Current value
   * @param {number} total - Total value
   * @returns {number} - Percentage (0-100)
   */
  calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  },

  /**
   * Get star rating based on score percentage
   * @param {number} percentage - Score percentage (0-100)
   * @returns {number} - Number of stars (0-3)
   */
  getStarRating(percentage) {
    if (percentage >= 90) return 3;
    if (percentage >= 70) return 2;
    if (percentage >= 50) return 1;
    return 0;
  },

  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type of toast (success, error, info)
   * @param {number} duration - Duration in ms (default 3000)
   */
  showToast(message, type = 'info', duration = 3000) {
    // Skip toasts in test mode
    if (this.isTestMode) return;

    const toast = this.createElement('div', {
      class: `toast toast--${type} fade-in`
    }, message);

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Deep clone object (simple implementation)
   * @param {Object} obj - Object to clone
   * @returns {Object} - Cloned object
   */
  cloneObject(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Generate unique ID
   * @returns {string} - Unique ID
   */
  generateId() {
    return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Check if string is empty or whitespace only
   * @param {string} str - String to check
   * @returns {boolean} - True if empty
   */
  isEmpty(str) {
    return !str || str.trim().length === 0;
  },

  /**
   * Highlight text in a string (wrap in span)
   * @param {string} text - Full text
   * @param {string} highlight - Text to highlight
   * @returns {string} - HTML string with highlighted text
   */
  highlightText(text, highlight) {
    if (!highlight || !text) return this.escapeHTML(text);

    const escapedText = this.escapeHTML(text);
    const escapedHighlight = this.escapeHTML(highlight);
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');

    return escapedText.replace(regex, '<mark>$1</mark>');
  },

  /**
   * Play sound effect
   * @param {string} soundName - Name of sound file (correct, wrong, complete)
   */
  playSound(soundName) {
    // Skip sounds in test mode
    if (this.isTestMode) return;

    const SOUND_ENABLED_KEY = 'soundEnabled';
    const soundEnabled = localStorage.getItem(SOUND_ENABLED_KEY);

    if (soundEnabled === 'false') return;

    try {
      const audio = new Audio(`../sound/${soundName}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    } catch (error) {
      // Silently fail if sound file doesn't exist
    }
  },

  /**
   * Animate element with CSS class
   * @param {HTMLElement} element - Element to animate
   * @param {string} animationClass - CSS animation class
   * @param {Function} callback - Callback after animation
   */
  animate(element, animationClass, callback = null) {
    element.classList.add(animationClass);

    const handleAnimationEnd = () => {
      element.classList.remove(animationClass);
      element.removeEventListener('animationend', handleAnimationEnd);
      if (callback) callback();
    };

    element.addEventListener('animationend', handleAnimationEnd);
  },

  /**
   * Scroll to element smoothly
   * @param {HTMLElement} element - Element to scroll to
   * @param {number} offset - Offset in pixels
   */
  scrollToElement(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  },

  /**
   * Check if element is in viewport
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} - True if in viewport
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Parse template string with placeholders
   * Template: "Hello _1_, you are _2_ years old"
   * Data: ['John', 25]
   * Result: "Hello John, you are 25 years old"
   * @param {string} template - Template string with _1_, _2_, etc.
   * @param {Array} data - Array of values to replace
   * @returns {string} - Parsed string
   */
  parseTemplate(template, data) {
    let result = template;
    data.forEach((value, index) => {
      const placeholder = `_${index + 1}_`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });
    return result;
  },

  /**
   * Show tooltip with content
   * @param {string} content - HTML content for tooltip
   * @param {HTMLElement} targetElement - Element to attach tooltip to
   * @param {number} duration - Duration to show tooltip (0 = manual close)
   */
  showTooltip(content, targetElement, duration = 0) {
    // Remove existing tooltips
    const existing = document.querySelectorAll('.vocabulary-tooltip');
    existing.forEach(tip => tip.remove());

    // Create tooltip element
    const tooltip = this.createElement('div', {
      class: 'vocabulary-tooltip fade-in'
    });
    tooltip.innerHTML = content;

    // Position tooltip
    document.body.appendChild(tooltip);

    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Calculate position (try to show below, if no space show above)
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);

    // Check if tooltip goes off screen
    if (top + tooltipRect.height > window.innerHeight + window.scrollY) {
      // Show above instead
      top = rect.top + window.scrollY - tooltipRect.height - 8;
      tooltip.classList.add('vocabulary-tooltip--above');
    }

    // Ensure tooltip doesn't go off left/right edges
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    // Auto-hide if duration is specified
    if (duration > 0) {
      setTimeout(() => {
        this.hideTooltip(tooltip);
      }, duration);
    }

    // Add click handler to close
    const closeBtn = this.createElement('button', {
      class: 'vocabulary-tooltip-close',
      type: 'button'
    }, '✕');
    closeBtn.onclick = () => this.hideTooltip(tooltip);
    tooltip.appendChild(closeBtn);

    return tooltip;
  },

  /**
   * Hide tooltip with animation
   * @param {HTMLElement} tooltip - Tooltip element to hide
   */
  hideTooltip(tooltip) {
    tooltip.style.opacity = '0';
    setTimeout(() => {
      if (tooltip && tooltip.parentElement) {
        tooltip.remove();
      }
    }, 300);
  },

  /**
   * Highlight difficult words in text and make them interactive
   * @param {string} text - Text to process
   * @param {Array} difficultWords - Array of difficult words to highlight
   * @param {Object} vocabularyData - Vocabulary data for tooltips
   * @returns {string} - HTML with highlighted words
   */
  highlightDifficultWords(text, difficultWords, vocabularyData) {
    if (!difficultWords || difficultWords.length === 0) return text;

    let result = text;

    // Sort by length (longest first) to avoid partial matches
    const sortedWords = difficultWords.sort((a, b) => b.length - a.length);

    sortedWords.forEach(word => {
      // Create case-insensitive regex with word boundaries
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');

      result = result.replace(regex, (match) => {
        return `<span class="difficult-word" data-word="${match.toLowerCase()}">${match}</span>`;
      });
    });

    return result;
  },

  /**
   * Initialize difficult word tooltips
   * @param {HTMLElement} container - Container element
   * @param {Object} vocabularyData - Vocabulary data
   */
  initDifficultWordTooltips(container, vocabularyData) {
    if (!vocabularyData) return;

    const difficultWordElements = container.querySelectorAll('.difficult-word');

    difficultWordElements.forEach(element => {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        const word = element.dataset.word;

        // Search for word in vocabulary data
        const allVocab = [
          ...(vocabularyData.grammarTerms || []),
          ...(vocabularyData.difficultWords || []),
        ];

        const found = allVocab.find(item =>
          item.word && item.word.toLowerCase() === word
        );

        if (found) {
          const tooltipContent = `
            <div class="vocabulary-tooltip-content">
              <strong>${found.word}</strong>
              ${found.pronunciation ? `<div class="vocab-pronunciation">${found.pronunciation}</div>` : ''}
              <div class="vocab-vietnamese">${found.vietnamese}</div>
              <div class="vocab-definition">${found.definition}</div>
              <div class="vocab-example"><em>${found.example}</em></div>
            </div>
          `;
          this.showTooltip(tooltipContent, element);
        }
      });
    });
  },

  /**
   * Keyboard navigation helper for exercises
   * Maps key presses to option selection and submission
   */
  KeyboardHelper: {
    // Key mappings for option selection
    KEY_OPTION_MAP: {
      '1': 0, '2': 1, '3': 2, '4': 3,
      'a': 0, 'b': 1, 'c': 2, 'd': 3,
      'A': 0, 'B': 1, 'C': 2, 'D': 3
    },

    // TRUE/FALSE key mappings
    KEY_TF_MAP: {
      't': 'TRUE', 'T': 'TRUE', '1': 'TRUE',
      'f': 'FALSE', 'F': 'FALSE', '2': 'FALSE'
    },

    // Active keyboard handler reference (for cleanup)
    activeHandler: null,

    /**
     * Attach keyboard handler to container for multiple choice
     * @param {HTMLElement} container - Exercise container
     * @param {Object} options - Configuration options
     * @param {Function} options.onSelect - Called when option selected (index)
     * @param {Function} options.onSubmit - Called when Enter pressed
     * @param {number} options.optionCount - Number of options (default 4)
     */
    attachMultipleChoice(container, options) {
      this.cleanup();

      const { onSelect, onSubmit, optionCount = 4 } = options;

      const handler = (e) => {
        // Ignore if typing in input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }

        const key = e.key;

        // Check for option selection
        if (this.KEY_OPTION_MAP.hasOwnProperty(key)) {
          const index = this.KEY_OPTION_MAP[key];
          if (index < optionCount) {
            e.preventDefault();
            onSelect(index);
          }
        }

        // Check for submit
        if (key === 'Enter') {
          e.preventDefault();
          onSubmit();
        }
      };

      document.addEventListener('keydown', handler);
      this.activeHandler = handler;

      // Show keyboard hint
      this.showKeyboardHint(container, 'mc', optionCount);
    },

    /**
     * Attach keyboard handler for TRUE/FALSE questions
     * @param {HTMLElement} container - Exercise container
     * @param {Object} options - Configuration options
     */
    attachTrueFalse(container, options) {
      this.cleanup();

      const { onSelect, onSubmit } = options;

      const handler = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }

        const key = e.key;

        // Check for T/F selection
        if (this.KEY_TF_MAP.hasOwnProperty(key)) {
          e.preventDefault();
          onSelect(this.KEY_TF_MAP[key]);
        }

        // Check for submit
        if (key === 'Enter') {
          e.preventDefault();
          onSubmit();
        }
      };

      document.addEventListener('keydown', handler);
      this.activeHandler = handler;

      this.showKeyboardHint(container, 'tf');
    },

    /**
     * Attach global navigation (arrow keys for prev/next)
     * @param {Object} options - { onPrev, onNext }
     */
    attachNavigation(options) {
      const { onPrev, onNext } = options;

      const handler = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }

        if (e.key === 'ArrowLeft' && onPrev) {
          e.preventDefault();
          onPrev();
        }

        if (e.key === 'ArrowRight' && onNext) {
          e.preventDefault();
          onNext();
        }
      };

      document.addEventListener('keydown', handler);

      // Return cleanup function
      return () => document.removeEventListener('keydown', handler);
    },

    /**
     * Show keyboard shortcut hint below exercise
     * @param {HTMLElement} container - Container element
     * @param {string} type - 'mc' for multiple choice, 'tf' for true/false
     * @param {number} optionCount - Number of options
     */
    showKeyboardHint(container, type, optionCount = 4) {
      // Remove existing hint
      const existing = container.querySelector('.keyboard-hint');
      if (existing) existing.remove();

      let hintText = '';
      if (type === 'mc') {
        const keys = ['1', '2', '3', '4'].slice(0, optionCount).join('/');
        const letters = ['A', 'B', 'C', 'D'].slice(0, optionCount).join('/');
        hintText = `⌨️ Phím tắt: ${keys} hoặc ${letters} chọn đáp án | Enter nộp bài | ← → chuyển câu`;
      } else if (type === 'tf') {
        hintText = '⌨️ Phím tắt: T/1 = TRUE | F/2 = FALSE | Enter nộp bài | ← → chuyển câu';
      }

      const hint = Utils.createElement('div', {
        class: 'keyboard-hint'
      }, hintText);

      container.appendChild(hint);
    },

    /**
     * Cleanup active handler
     */
    cleanup() {
      if (this.activeHandler) {
        document.removeEventListener('keydown', this.activeHandler);
        this.activeHandler = null;
      }
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
