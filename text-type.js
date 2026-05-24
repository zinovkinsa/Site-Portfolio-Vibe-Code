/**
 * TextType — vanilla-порт @react-bits/TextType (без React и GSAP)
 */
class TextType {
  constructor(element, options = {}) {
    if (!element) return;

    this.root = element;
    this.text = Array.isArray(options.text) ? options.text : [options.text || ""];
    this.typingSpeed = options.typingSpeed ?? 50;
    this.initialDelay = options.initialDelay ?? 0;
    this.pauseDuration = options.pauseDuration ?? 2000;
    this.deletingSpeed = options.deletingSpeed ?? 30;
    this.loop = options.loop ?? true;
    this.showCursor = options.showCursor ?? true;
    this.hideCursorWhileTyping = options.hideCursorWhileTyping ?? false;
    this.cursorCharacter = options.cursorCharacter ?? "|";
    this.cursorBlinkDuration = options.cursorBlinkDuration ?? 0.5;
    this.highlightWord = options.highlightWord ?? null;
    this.startOnVisible = options.startOnVisible ?? false;
    this.reverseMode = options.reverseMode ?? false;
    this.variableSpeed = options.variableSpeed ?? null;
    this.onSentenceComplete = options.onSentenceComplete ?? null;
    this.onComplete = options.onComplete ?? null;

    this.displayedText = "";
    this.currentCharIndex = 0;
    this.isDeleting = false;
    this.currentTextIndex = 0;
    this.isVisible = !this.startOnVisible;
    this.timeoutId = null;
    this.observer = null;

    this._mount();
    this._updateCursorVisibility();
    if (this.startOnVisible) {
      this._observeVisibility();
    } else {
      this.isVisible = true;
      if (this.initialDelay > 0) {
        this._schedule(() => this._tick(), this.initialDelay);
      } else {
        this._tick();
      }
    }
  }

  _mount() {
    this.root.classList.add("text-type");
    this.root.style.setProperty("--cursor-blink-duration", `${this.cursorBlinkDuration}s`);

    this.contentEl =
      this.root.querySelector(".text-type__content") ||
      (() => {
        const el = document.createElement("span");
        el.className = "text-type__content";
        el.setAttribute("aria-live", "polite");
        this.root.appendChild(el);
        return el;
      })();

    if (this.showCursor) {
      this.cursorEl =
        this.root.querySelector(".text-type__cursor") ||
        (() => {
          const el = document.createElement("span");
          el.className = "text-type__cursor";
          el.setAttribute("aria-hidden", "true");
          el.textContent = this.cursorCharacter;
          this.root.appendChild(el);
          return el;
        })();
    }
  }

  _observeVisibility() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.isVisible) {
            this.isVisible = true;
            this._tick();
          }
        });
      },
      { threshold: 0.1 }
    );
    this.observer.observe(this.root);
  }

  _getRandomSpeed() {
    if (!this.variableSpeed) return this.typingSpeed;
    const { min, max } = this.variableSpeed;
    return Math.random() * (max - min) + min;
  }

  _getCurrentText() {
    const raw = this.text[this.currentTextIndex] || "";
    return this.reverseMode ? raw.split("").reverse().join("") : raw;
  }

  _escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  _renderContent(str) {
    const word = this.highlightWord;
    if (!word) {
      this.contentEl.textContent = str;
      return;
    }

    const i = str.indexOf(word);
    if (i !== -1 && str.length >= i + word.length) {
      const before = this._escapeHtml(str.slice(0, i));
      const after = this._escapeHtml(str.slice(i + word.length));
      this.contentEl.innerHTML = `${before}<span class="highlight">${word}</span>${after}`;
    } else {
      this.contentEl.textContent = str;
    }
  }

  _updateCursorVisibility() {
    if (!this.cursorEl) return;
    const current = this._getCurrentText();
    const hideEmpty = this.displayedText.length === 0 && !this.isDeleting;
    const hideWhileTyping =
      this.hideCursorWhileTyping &&
      (this.currentCharIndex < current.length || this.isDeleting);
    this.cursorEl.classList.toggle(
      "text-type__cursor--hidden",
      hideEmpty || hideWhileTyping
    );
  }

  _schedule(fn, delay) {
    this.timeoutId = window.setTimeout(fn, delay);
  }

  _clearSchedule() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  _tick() {
    this._clearSchedule();
    if (!this.isVisible) return;

    const currentText = this._getCurrentText();

    if (this.isDeleting) {
      if (this.displayedText === "") {
        this.isDeleting = false;

        if (this.onSentenceComplete) {
          this.onSentenceComplete(this.text[this.currentTextIndex], this.currentTextIndex);
        }

        if (this.currentTextIndex === this.text.length - 1 && !this.loop) {
          this.root.classList.add("is-complete");
          if (this.onComplete) this.onComplete();
          this._updateCursorVisibility();
          return;
        }

        this.currentTextIndex = (this.currentTextIndex + 1) % this.text.length;
        this.currentCharIndex = 0;
        this._schedule(() => this._tick(), this.pauseDuration);
      } else {
        this._schedule(() => {
          this.displayedText = this.displayedText.slice(0, -1);
          this._renderContent(this.displayedText);
          this._updateCursorVisibility();
          this._tick();
        }, this.deletingSpeed);
      }
      return;
    }

    if (this.currentCharIndex < currentText.length) {
      const speed = this.variableSpeed
        ? this._getRandomSpeed()
        : this.typingSpeed;

      this._schedule(() => {
        this.displayedText += currentText[this.currentCharIndex];
        this.currentCharIndex += 1;
        this._renderContent(this.displayedText);
        this._updateCursorVisibility();
        this._tick();
      }, speed);
      return;
    }

    if (!this.loop && this.currentTextIndex === this.text.length - 1) {
      this.root.classList.add("is-complete");
      if (this.onComplete) this.onComplete();
      this._updateCursorVisibility();
      return;
    }

    this._schedule(() => {
      this.isDeleting = true;
      this._updateCursorVisibility();
      this._tick();
    }, this.pauseDuration);
  }

  start() {
    this.isVisible = true;
    this._tick();
  }

  destroy() {
    this._clearSchedule();
    if (this.observer) this.observer.disconnect();
  }

  /** Показать полный текст сразу (reduced motion / fallback) */
  showFull() {
    this._clearSchedule();
    const full = this.text[this.text.length - 1] || this.text[0] || "";
    this.displayedText = full;
    this._renderContent(full);
    this.root.classList.add("is-complete");
    if (this.cursorEl) this.cursorEl.classList.add("text-type__cursor--hidden");
  }
}

window.TextType = TextType;
