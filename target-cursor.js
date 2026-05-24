/**
 * TargetCursor — vanilla-порт @react-bits/TargetCursor (GSAP)
 */
class TargetCursor {
  constructor(options = {}) {
    this.targetSelector = options.targetSelector || ".cursor-target";
    this.spinDuration = options.spinDuration ?? 2;
    this.hideDefaultCursor = options.hideDefaultCursor ?? true;
    this.hoverDuration = options.hoverDuration ?? 0.2;
    this.parallaxOn = options.parallaxOn ?? true;

    this.constants = { borderWidth: 3, cornerSize: 12 };

    this.isMobile = this._detectMobile();
    this.prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (this.isMobile || this.prefersReduced || typeof gsap === "undefined") {
      return;
    }

    this._build();
    this._bind();
    document.body.classList.add("has-target-cursor");
  }

  _detectMobile() {
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const small = window.innerWidth <= 768;
    const ua = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      (navigator.userAgent || "").toLowerCase()
    );
    return (hasTouch && small) || ua;
  }

  _build() {
    const wrapper = document.createElement("div");
    wrapper.className = "target-cursor-wrapper";
    wrapper.innerHTML = `
      <div class="target-cursor-dot"></div>
      <div class="target-cursor-corner corner-tl"></div>
      <div class="target-cursor-corner corner-tr"></div>
      <div class="target-cursor-corner corner-br"></div>
      <div class="target-cursor-corner corner-bl"></div>
    `;
    document.body.appendChild(wrapper);

    this.cursor = wrapper;
    this.dot = wrapper.querySelector(".target-cursor-dot");
    this.corners = wrapper.querySelectorAll(".target-cursor-corner");
    this.spinTl = null;

    this.isActive = false;
    this.targetCornerPositions = null;
    this.tickerFn = null;
    this.activeStrength = { current: 0 };

    this.activeTarget = null;
    this.currentLeaveHandler = null;
    this.resumeTimeout = null;
  }

  _moveCursor(x, y) {
    if (!this.cursor) return;
    gsap.to(this.cursor, {
      x,
      y,
      duration: 0.1,
      ease: "power3.out",
    });
  }

  _createSpinTimeline() {
    if (this.spinTl) this.spinTl.kill();
    this.spinTl = gsap
      .timeline({ repeat: -1 })
      .to(this.cursor, { rotation: "+=360", duration: this.spinDuration, ease: "none" });
  }

  _bind() {
    this.originalCursor = document.body.style.cursor;
    if (this.hideDefaultCursor) {
      document.body.style.cursor = "none";
    }

    gsap.set(this.cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    this._createSpinTimeline();

    const { borderWidth, cornerSize } = this.constants;

    this.tickerFn = () => {
      if (!this.targetCornerPositions || !this.cursor || !this.corners.length) return;
      const strength = this.activeStrength.current;
      if (strength === 0) return;

      const cursorX = gsap.getProperty(this.cursor, "x");
      const cursorY = gsap.getProperty(this.cursor, "y");

      this.corners.forEach((corner, i) => {
        const currentX = gsap.getProperty(corner, "x");
        const currentY = gsap.getProperty(corner, "y");
        const targetX = this.targetCornerPositions[i].x - cursorX;
        const targetY = this.targetCornerPositions[i].y - cursorY;
        const finalX = currentX + (targetX - currentX) * strength;
        const finalY = currentY + (targetY - currentY) * strength;
        const duration = strength >= 0.99 ? (this.parallaxOn ? 0.2 : 0) : 0.05;

        gsap.to(corner, {
          x: finalX,
          y: finalY,
          duration,
          ease: duration === 0 ? "none" : "power1.out",
          overwrite: "auto",
        });
      });
    };

    this._moveHandler = (e) => this._moveCursor(e.clientX, e.clientY);
    window.addEventListener("mousemove", this._moveHandler);

    this._scrollHandler = () => {
      if (!this.activeTarget || !this.cursor) return;
      const mouseX = gsap.getProperty(this.cursor, "x");
      const mouseY = gsap.getProperty(this.cursor, "y");
      const under = document.elementFromPoint(mouseX, mouseY);
      const stillOver =
        under &&
        (under === this.activeTarget ||
          under.closest(this.targetSelector) === this.activeTarget);
      if (!stillOver && this.currentLeaveHandler) {
        this.currentLeaveHandler();
      }
    };
    window.addEventListener("scroll", this._scrollHandler, { passive: true });

    this._mouseDownHandler = () => {
      gsap.to(this.dot, { scale: 0.7, duration: 0.3 });
      gsap.to(this.cursor, { scale: 0.9, duration: 0.2 });
    };
    this._mouseUpHandler = () => {
      gsap.to(this.dot, { scale: 1, duration: 0.3 });
      gsap.to(this.cursor, { scale: 1, duration: 0.2 });
    };
    window.addEventListener("mousedown", this._mouseDownHandler);
    window.addEventListener("mouseup", this._mouseUpHandler);

    this._enterHandler = (e) => {
      let current = e.target;
      let target = null;
      while (current && current !== document.body) {
        if (current.matches(this.targetSelector)) {
          target = current;
          break;
        }
        current = current.parentElement;
      }
      if (!target || !this.cursor) return;
      if (this.activeTarget === target) return;

      if (this.activeTarget) this._cleanupTarget(this.activeTarget);
      if (this.resumeTimeout) {
        clearTimeout(this.resumeTimeout);
        this.resumeTimeout = null;
      }

      this.activeTarget = target;
      this.corners.forEach((c) => gsap.killTweensOf(c));
      gsap.killTweensOf(this.cursor, "rotation");
      this.spinTl?.pause();
      gsap.set(this.cursor, { rotation: 0 });

      const rect = target.getBoundingClientRect();
      const cursorX = gsap.getProperty(this.cursor, "x");
      const cursorY = gsap.getProperty(this.cursor, "y");

      this.targetCornerPositions = [
        { x: rect.left - borderWidth, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
        {
          x: rect.right + borderWidth - cornerSize,
          y: rect.bottom + borderWidth - cornerSize,
        },
        { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize },
      ];

      this.isActive = true;
      gsap.ticker.add(this.tickerFn);

      gsap.to(this.activeStrength, {
        current: 1,
        duration: this.hoverDuration,
        ease: "power2.out",
      });

      this.corners.forEach((corner, i) => {
        gsap.to(corner, {
          x: this.targetCornerPositions[i].x - cursorX,
          y: this.targetCornerPositions[i].y - cursorY,
          duration: 0.2,
          ease: "power2.out",
        });
      });

      const leaveHandler = () => {
        gsap.ticker.remove(this.tickerFn);
        this.isActive = false;
        this.targetCornerPositions = null;
        gsap.set(this.activeStrength, { current: 0, overwrite: true });
        this.activeTarget = null;

        gsap.killTweensOf(this.corners);
        const positions = [
          { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: cornerSize * 0.5 },
          { x: -cornerSize * 1.5, y: cornerSize * 0.5 },
        ];
        const tl = gsap.timeline();
        this.corners.forEach((corner, index) => {
          tl.to(
            corner,
            { x: positions[index].x, y: positions[index].y, duration: 0.3, ease: "power3.out" },
            0
          );
        });

        this.resumeTimeout = setTimeout(() => {
          if (!this.activeTarget && this.cursor && this.spinTl) {
            const currentRotation = gsap.getProperty(this.cursor, "rotation");
            const normalizedRotation = currentRotation % 360;
            this.spinTl.kill();
            this.spinTl = gsap
              .timeline({ repeat: -1 })
              .to(this.cursor, {
                rotation: "+=360",
                duration: this.spinDuration,
                ease: "none",
              });
            gsap.to(this.cursor, {
              rotation: normalizedRotation + 360,
              duration: this.spinDuration * (1 - normalizedRotation / 360),
              ease: "none",
              onComplete: () => this.spinTl?.restart(),
            });
          }
          this.resumeTimeout = null;
        }, 50);

        this._cleanupTarget(target);
      };

      this.currentLeaveHandler = leaveHandler;
      target.addEventListener("mouseleave", leaveHandler);
    };

    window.addEventListener("mouseover", this._enterHandler, { passive: true });
  }

  _cleanupTarget(target) {
    if (this.currentLeaveHandler) {
      target.removeEventListener("mouseleave", this.currentLeaveHandler);
    }
    this.currentLeaveHandler = null;
  }

  destroy() {
    if (!this.cursor) return;
    if (this.tickerFn) gsap.ticker.remove(this.tickerFn);
    window.removeEventListener("mousemove", this._moveHandler);
    window.removeEventListener("mouseover", this._enterHandler);
    window.removeEventListener("scroll", this._scrollHandler);
    window.removeEventListener("mousedown", this._mouseDownHandler);
    window.removeEventListener("mouseup", this._mouseUpHandler);
    if (this.activeTarget) this._cleanupTarget(this.activeTarget);
    this.spinTl?.kill();
    document.body.style.cursor = this.originalCursor || "";
    this.cursor.remove();
  }
}

function markCursorTargets() {
  const selector = [
    "a",
    "button",
    ".btn",
    "#skills .card",
    ".project",
    ".badge",
    ".audience li",
    ".footer__link",
    ".footer__social a",
    ".about__list li",
    ".hero__photo-frame",
    ".hero__card",
    ".hero__metrics div",
    ".review-card",
  ].join(", ");

  document.querySelectorAll(selector).forEach((el) => {
    el.classList.add("cursor-target");
  });
}

function initTargetCursor() {
  markCursorTargets();
  window.targetCursor = new TargetCursor({
    targetSelector: ".cursor-target",
    spinDuration: 2,
    hideDefaultCursor: true,
    parallaxOn: true,
    hoverDuration: 0.2,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTargetCursor);
} else {
  initTargetCursor();
}

window.TargetCursor = TargetCursor;
