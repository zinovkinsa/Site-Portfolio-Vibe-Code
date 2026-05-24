(function () {
  const modal = document.getElementById("contact-modal");
  const form = document.getElementById("contact-form");
  const formWrap = document.getElementById("contact-modal-form-wrap");
  const successView = document.getElementById("contact-modal-success");
  const errorEl = document.getElementById("contact-form-error");

  if (!modal || !form) return;

  const openTriggers = document.querySelectorAll(".js-open-contact");
  const closeTriggers = document.querySelectorAll(".js-close-contact");
  let lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    document.body.classList.add("modal-open");

    const firstInput = form.querySelector("input:not([type='checkbox'])");
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  }

  function resetModal() {
    form.reset();
    form.hidden = false;
    formWrap.hidden = false;
    successView.hidden = true;
    errorEl.hidden = true;
    errorEl.textContent = "";
    form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    window.setTimeout(() => {
      modal.hidden = true;
      resetModal();
      if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus();
      }
    }, 300);
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function validateForm() {
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const consent = form.consent.checked;

    form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
    errorEl.hidden = true;

    if (!name) {
      form.name.classList.add("is-invalid");
      showError("Укажите имя.");
      form.name.focus();
      return false;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.email.classList.add("is-invalid");
      showError("Укажите корректную почту.");
      form.email.focus();
      return false;
    }

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      form.phone.classList.add("is-invalid");
      showError("Укажите номер телефона.");
      form.phone.focus();
      return false;
    }

    if (!consent) {
      showError("Нужно согласие на обработку персональных данных.");
      form.consent.focus();
      return false;
    }

    return true;
  }

  openTriggers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  });

  closeTriggers.forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
    };

    const subject = encodeURIComponent("Заявка с портфолио Vibe Coder");
    const body = encodeURIComponent(
      `Имя: ${data.name}\nПочта: ${data.email}\nТелефон: ${data.phone}\n\nСогласие на обработку ПДн: да`
    );

    /* Открываем почтовый клиент как простой способ передачи без бэкенда */
    window.location.href = `mailto:hello@yourmail.com?subject=${subject}&body=${body}`;

    formWrap.hidden = true;
    form.hidden = true;
    successView.hidden = false;
    errorEl.hidden = true;
  });
})();
