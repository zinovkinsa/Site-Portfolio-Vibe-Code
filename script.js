(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = document.querySelector(".header");
  const ambient = document.querySelector(".ambient");
  const ambientGrid = document.querySelector(".ambient__grid");
  const ambientOrbs = document.querySelectorAll(".ambient__orb");
  const navLinks = document.querySelectorAll(".nav a[data-nav]");
  const navSections = ["about", "skills", "projects", "reviews", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  let scrollTicking = false;

  function setHeaderState() {
    if (!header) return;
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    header.classList.toggle("is-compact", y > 120);
    document.documentElement.style.setProperty(
      "--header-h",
      y > 120 ? "60px" : "76px"
    );
  }

  function updateParallax() {
    if (prefersReduced || !ambient) return;
    const y = window.scrollY;
    if (ambientGrid) {
      ambientGrid.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
    }
    ambientOrbs.forEach((orb, i) => {
      const factor = 0.06 + i * 0.035;
      orb.style.transform = `translate3d(0, ${y * factor}px, 0)`;
    });
  }

  function onScroll() {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(() => {
        setHeaderState();
        updateParallax();
        scrollTicking = false;
      });
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  setHeaderState();
  updateParallax();

  /* —— Hero title: TextType (печать текста) —— */
  function initHeroTextType() {
    const title = document.getElementById("hero-title");
    if (!title || typeof TextType === "undefined") return;

    const fullText =
      "Я делаю сайты, интерфейсы и digital-проекты, которые выглядят как вайб, а работают как система";

    if (prefersReduced) {
      const instance = new TextType(title, { text: [fullText], loop: false });
      instance.showFull();
      return;
    }

    new TextType(title, {
      text: [fullText],
      typingSpeed: 45,
      initialDelay: 350,
      pauseDuration: 2500,
      deletingSpeed: 28,
      loop: false,
      showCursor: true,
      cursorCharacter: "_",
      cursorBlinkDuration: 0.5,
      hideCursorWhileTyping: false,
      highlightWord: "вайб",
      startOnVisible: false,
    });
  }

  /* —— Counters —— */
  function formatCounter(el, value) {
    const pad = parseInt(el.dataset.pad || "0", 10);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const num = pad > 0 ? String(value).padStart(pad, "0") : String(value);
    return `${prefix}${num}${suffix}`;
  }

  function animateCounter(el, duration = 1400) {
    const target = parseInt(el.dataset.countTo || "0", 10);
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = formatCounter(el, current);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = formatCounter(el, target);
    }

    requestAnimationFrame(tick);
  }

  function initCounters() {
    const metrics = document.getElementById("hero-metrics");
    const counters = document.querySelectorAll(".counter");
    if (!counters.length) return;

    if (prefersReduced) {
      counters.forEach((el) => {
        el.textContent = formatCounter(el, parseInt(el.dataset.countTo || "0", 10));
      });
      return;
    }

    const run = () => counters.forEach((el) => animateCounter(el));

    if (!metrics) {
      run();
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        run();
        obs.disconnect();
      },
      { threshold: 0.5 }
    );
    obs.observe(metrics);
  }

  /* —— Card tilt (skills) —— */
  function initCardTilt() {
    if (prefersReduced || !window.matchMedia("(min-width: 768px)").matches) return;

    const cards = document.querySelectorAll("#skills .card");
    const maxRotate = 7;

    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * maxRotate}deg) rotateX(${-y * maxRotate}deg) translateY(-6px)`;
        card.classList.add("is-tilting");
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
        card.classList.remove("is-tilting");
      });
    });
  }

  /* —— Active nav —— */
  function initNavSpy() {
    if (!navLinks.length || !navSections.length) return;

    const linkMap = new Map(
      [...navLinks].map((link) => [link.getAttribute("href")?.slice(1), link])
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        const id = visible.target.id;
        navLinks.forEach((link) => link.classList.remove("is-active"));
        linkMap.get(id)?.classList.add("is-active");
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.15, 0.4] }
    );

    navSections.forEach((section) => observer.observe(section));
  }

  /* —— Scroll reveal —— */
  function initReveal() {
    if (prefersReduced) {
      document.querySelectorAll(".reveal, .step").forEach((el) => {
        el.classList.add("is-visible");
      });
      return;
    }

    const revealEls = document.querySelectorAll(".reveal");
    const stepEls = document.querySelectorAll(".step");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    revealEls.forEach((el) => {
      if (!el.closest(".hero")) observer.observe(el);
    });
    stepEls.forEach((el) => observer.observe(el));
  }

  initHeroTextType();
  initCounters();
  initCardTilt();
  initNavSpy();
  initReveal();
})();
