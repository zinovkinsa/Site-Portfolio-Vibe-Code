/**
 * Animated cards stack — vanilla port (scroll-driven testimonials)
 */
const REVIEWS_DATA = [
  {
    id: "review-1",
    name: "Анна К.",
    role: "эксперт, личный бренд",
    rating: 5,
    text: "Собрал сайт так, что он ощущается живым — не шаблон, а характер. Быстро, стильно и с пониманием, как это читает человек.",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&q=80",
  },
  {
    id: "review-2",
    name: "Дмитрий М.",
    role: "основатель digital-продукта",
    rating: 4.5,
    text: "Сильный первый экран, логика блоков и визуал — всё на месте. Запустили лендинг без месяцев согласований, конверсия выросла.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80",
  },
  {
    id: "review-3",
    name: "Елена С.",
    role: "креатор / UX",
    rating: 5,
    text: "Редко когда разработчик думает про подачу и вайб, а не только про вёрстку. Проект хотелось показывать и пересылать.",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80",
  },
  {
    id: "review-4",
    name: "Игорь П.",
    role: "digital-студия",
    rating: 4.5,
    text: "Чёткая структура, аккуратный UI и ощущение «дороже, чем стоит». Отличный партнёр для спецпроектов и AI-first страниц.",
    avatar:
      "https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?w=200&h=200&fit=crop&q=80",
  },
];

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  if (value <= inMin) return outMin;
  if (value >= inMax) return outMax;
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

function renderStars(rating, uid) {
  const max = 5;
  const filled = Math.floor(rating);
  const half = rating - filled > 0;
  const empty = max - filled - (half ? 1 : 0);
  const starPath =
    "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z";

  let html = '<div class="review-stars" aria-label="Оценка ' + rating + ' из 5">';
  for (let i = 0; i < filled; i++) {
    html += `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="${starPath}"/></svg>`;
  }
  if (half) {
    const pct = (rating - filled) * 100;
    html += `<svg viewBox="0 0 20 20" aria-hidden="true"><defs><linearGradient id="half-${uid}"><stop offset="${pct}%" stop-color="currentColor"/><stop offset="${pct}%" stop-color="rgba(154,150,140,0.45)"/></linearGradient></defs><path fill="url(#half-${uid})" d="${starPath}"/></svg>`;
  }
  for (let i = 0; i < empty; i++) {
    html += `<svg class="review-stars__empty" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="${starPath}"/></svg>`;
  }
  html += "</div>";
  return html;
}

function buildReviewCard(item, index) {
  const initials = item.name
    .split(" ")
    .map((p) => p[0])
    .join("");
  const card = document.createElement("article");
  card.className = "review-card cursor-target";
  card.dataset.index = String(index + 2);
  card.setAttribute("role", "article");
  card.innerHTML = `
    <div class="review-card__top">
      ${renderStars(item.rating, item.id)}
      <div class="review-card__quote">
        <blockquote cite="#">${item.text}</blockquote>
      </div>
    </div>
    <div class="review-card__footer">
      <img class="review-card__avatar" src="${item.avatar}" alt="Фото ${item.name}" width="48" height="48" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="review-card__avatar-fallback" style="display:none" aria-hidden="true">${initials}</span>
      <div>
        <span class="review-card__name">${item.name}</span>
        <span class="review-card__role">${item.role}</span>
      </div>
    </div>
  `;
  return card;
}

function getScrollProgress(container) {
  const rect = container.getBoundingClientRect();
  const vh = window.innerHeight;
  const start = vh * 0.5;
  const range = container.offsetHeight - start;
  if (range <= 0) return 0;
  const scrolled = start - rect.top;
  return clamp(scrolled / range, 0, 1);
}

function updateCards(scrollProgress, cards, arrayLength) {
  const incrementY = 10;
  const incrementZ = 10;

  cards.forEach((card) => {
    const index = parseInt(card.dataset.index, 10);
    const start = index / (arrayLength + 1);
    const end = (index + 1) / (arrayLength + 1);
    const rotateStart = start - 1.5;
    const rotateEnd = end / 1.5;
    const incrementRotation = -index + 90;

    const yPct = mapRange(scrollProgress, start, end, 0, -180);
    const rotate = mapRange(scrollProgress, rotateStart, rotateEnd, incrementRotation, 0);
    const filterBlur = mapRange(scrollProgress, rotateStart, rotateEnd, 2, 24);
    const filterAlpha = mapRange(scrollProgress, rotateStart, rotateEnd, 0.15, 0.2);
    const dx = mapRange(scrollProgress, rotateStart, rotateEnd, 4, 0);
    const dy = mapRange(scrollProgress, rotateStart, rotateEnd, 4, 12);

    card.style.top = `${index * incrementY}px`;
    card.style.zIndex = String((arrayLength - index) * incrementZ);
    card.style.transform = `translateZ(${index * incrementZ}px) translateY(${yPct}%) rotate(${rotate}deg)`;
    card.style.filter = `drop-shadow(${dx}px ${dy}px ${filterBlur}px rgba(0,0,0,${filterAlpha}))`;
  });
}

function initReviewsStack() {
  const root = document.getElementById("reviews");
  const scrollEl = document.getElementById("reviews-scroll");
  const cardsWrap = document.getElementById("reviews-cards");
  if (!root || !scrollEl || !cardsWrap) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.innerWidth <= 768;

  REVIEWS_DATA.forEach((item, i) => {
    cardsWrap.appendChild(buildReviewCard(item, i));
  });

  const cards = [...cardsWrap.querySelectorAll(".review-card")];
  const arrayLength = REVIEWS_DATA.length;

  if (prefersReduced || isMobile) {
    root.classList.add("reviews--static");
    return;
  }

  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        updateCards(getScrollProgress(scrollEl), cards, arrayLength);
        ticking = false;
      });
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initReviewsStack);
} else {
  initReviewsStack();
}
