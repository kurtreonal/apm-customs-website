(function () {
  const COMBO_READY_TIMEOUT_MS = 5000;   // waiting for .goog-te-combo to populate
  const COMBO_POLL_INTERVAL_MS = 100;
  const APPLY_TIMEOUT_MS = 6000;         // absolute cap on waiting for translation to settle

  function loadGoogleTranslate() {
    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.onerror = () => console.error("Google Translate script failed to load.");
    document.body.appendChild(script);
  }

  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement(
      { pageLanguage: "en", autoDisplay: false },
      "google_translate_element"
    );
  };

  function waitForCombo() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(() => {
        const combo = document.querySelector(".goog-te-combo");
        if (combo && combo.options && combo.options.length > 1) {
          clearInterval(interval);
          resolve(combo);
          return;
        }
        attempts++;
        if (attempts * COMBO_POLL_INTERVAL_MS >= COMBO_READY_TIMEOUT_MS) {
          clearInterval(interval);
          reject(new Error("Google Translate never became ready"));
        }
      }, COMBO_POLL_INTERVAL_MS);
    });
  }

  const SETTLE_QUIET_MS = 400;

  function waitForTranslationSettle() {
    return new Promise((resolve) => {
      let settled = false;
      let observer = null;
      let quietTimer = null;
      let overallTimer = null;

      function finish() {
        if (settled) return;
        settled = true;
        if (observer) observer.disconnect();
        if (quietTimer) clearTimeout(quietTimer);
        if (overallTimer) clearTimeout(overallTimer);
        resolve();
      }

      observer = new MutationObserver(() => {

        if (quietTimer) clearTimeout(quietTimer);
        quietTimer = setTimeout(finish, SETTLE_QUIET_MS);
      });
      observer.observe(document.body, {
        characterData: true,
        childList: true,
        subtree: true
      });

      overallTimer = setTimeout(finish, APPLY_TIMEOUT_MS);
    });
  }

  function setupButtons() {
    const buttons = document.querySelectorAll(".lang-opt");
    const thumb = document.querySelector(".lang-slider-thumb");
    const switcher = document.getElementById("lang-switcher");
    const statusEl = document.getElementById("lang-switch-status");
    let busy = false;

    function moveThumb(btn) {
      if (!thumb) return;
      const index = Array.from(buttons).indexOf(btn);
      thumb.style.transform = `translateX(${index * 100}%)`;
    }

    function setLoading(isLoading, btn) {
      if (switcher) switcher.classList.toggle("is-loading", isLoading);
      if (switcher) switcher.setAttribute("aria-busy", String(isLoading));
      btn.classList.toggle("is-pending", isLoading);
      if (statusEl) statusEl.textContent = isLoading ? "Translating page…" : "";
    }

    function activate(btn) {
      buttons.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      moveThumb(btn);
    }

    const RESET_GAP_MS = 80;

    async function switchLanguage(lang, btn) {
      busy = true;
      setLoading(true, btn);
      try {
        const combo = await waitForCombo();

        const settlePromise = waitForTranslationSettle();

        combo.value = "";
        combo.dispatchEvent(new Event("change"));
        await new Promise(resolve => setTimeout(resolve, RESET_GAP_MS));

        combo.value = lang;
        combo.dispatchEvent(new Event("change"));

        await settlePromise;
      } catch (err) {
        //Translation didn't come through in time — the switcher still
        console.error("Google Translate never became ready — translation unavailable, but the UI stays responsive.", err);
      } finally {
        setLoading(false, btn);
        activate(btn);
        busy = false;
      }
    }

    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        if (busy || btn.classList.contains("active")) return;
        const lang = btn.getAttribute("data-lang");
        switchLanguage(lang, btn);
      });
    });

    // Position the thumb under whichever option starts active
    const initiallyActive = document.querySelector(".lang-opt.active") || buttons[0];
    if (initiallyActive) moveThumb(initiallyActive);
  }

  // Attach listeners + position the thumb as soon as the DOM is ready —
  // independent of when (or whether) Google Translate finishes loading.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupButtons);
  } else {
    setupButtons();
  }

const style = document.createElement("style");
  style.textContent = `
    .goog-te-banner-frame, .skiptranslate { display: none !important; }
    body { top: 0px !important; }
  `;
  document.head.appendChild(style);

  loadGoogleTranslate();
})();

// scroll-triggered Fade-Up for sections and their children
(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return; // respect user preference

  const sections = Array.from(document.querySelectorAll("section"));
  if (!sections.length) return;

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const sec = entry.target;

        //reveal section and stagger immediate children
        sec.classList.add("in-view");

        const children = Array.from(sec.children).filter((c) => c.nodeType === 1);
        children.forEach((el, i) => {
          el.classList.add("in-view");
          el.style.setProperty("--delay", `${i * 90}ms`);
        });

        obs.unobserve(sec);
      });
    },
    { threshold: 0.16 }
  );

  //initialize: mark all sections & immediate children as animate-up
  sections.forEach((sec) => {
    if (sec.classList.contains("no-animate")) return;
    sec.classList.add("animate-up");
    const children = Array.from(sec.children).filter((c) => c.nodeType === 1);
    children.forEach((el, i) => {
      el.classList.add("animate-up", "staggered");
      el.style.setProperty("--delay", `${i * 90}ms`);
    });
    io.observe(sec);
  });
})();

let isSendmailActive = false;

//contact form validation
(function () {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const successBox = document.getElementById("contact-success");

  function fieldsOf(formEl) {
    return Array.from(formEl.querySelectorAll("input, select, textarea"));
  }

  function showError(field) {
    field.classList.add("is-invalid");
    const feedback = field.nextElementSibling;
    if (feedback && feedback.classList.contains("invalid-feedback-custom")) {
      feedback.classList.add("show");
    }
  }

  function clearError(field) {
    field.classList.remove("is-invalid");
    const feedback = field.nextElementSibling;
    if (feedback && feedback.classList.contains("invalid-feedback-custom")) {
      feedback.classList.remove("show");
    }
  }


  function validateField(field) {
    const valid = field.checkValidity();
    if (valid) {
      clearError(field);
    } else {
      showError(field);
    }
    return valid;
  }

  fieldsOf(form).forEach(field => {

    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) validateField(field);
    });
    field.addEventListener("change", () => {
      if (field.classList.contains("is-invalid")) validateField(field);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (successBox) successBox.hidden = true;

    const fields = fieldsOf(form);
    //validates every field (no early-exit) so all errors are shown at once, then checks if all are valid
    const allValid = fields
      .map(field => validateField(field))
      .every(Boolean);

    if (!allValid) {
      const firstInvalid = form.querySelector(".is-invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const botField = document.getElementById("bot-field");
    if (botField && botField.value.trim() !== "") {
      console.warn("Spam bot detected — form submission blocked.");
      return;
    }

    if (isSendmailActive) {
      return;
    }

    //This is a static site with no backend (per the project brief)
    //EmailJS send happens here instead of a server endpoint.
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    isSendmailActive = true;

    sendMail()
      .then(() => {
        if (successBox) successBox.hidden = false;
        form.reset();
        fields.forEach(clearError);
      })
      .catch((err) => {
        console.error("EmailJS send error:", err);
        alert("Failed to send request. Please try again later.");
      })
      .finally(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Send Request";
        }
        isSendmailActive = false;
      });
  });
})();

function sendMail(){
  const params = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    service: document.getElementById("service").value,
    message: document.getElementById("message").value.trim(),
    submittedAt: new Date().toISOString(),
  };

  if (!window.emailjs || typeof window.emailjs.send !== "function") {
    return Promise.reject(new Error("EmailJS is not loaded yet."));
  }

  return emailjs.send("service_4qsk5kd", "template_tmtb9gb", params);
}

// WORKFLOW — SCROLL
(function () {
  const section = document.querySelector(".workflow-section");
  if (!section) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const entranceObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add("wf-in-view");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  entranceObserver.observe(section);

  const steps = Array.from(section.querySelectorAll("[data-wf-step]"));
  if (steps.length === 0) return;

  let activeIndex = 0;

  function applyState(index) {
    activeIndex = index;
    steps.forEach((step, i) => {
      step.classList.remove("is-active", "is-past", "is-upcoming");
      if (i === index) {
        step.classList.add("is-active");
      } else if (i < index) {
        step.classList.add("is-past");
      } else {
        step.classList.add("is-upcoming");
      }
      const node = step.querySelector("[data-wf-node]");
      if (node) {
        if (i === index) node.setAttribute("aria-current", "step");
        else node.removeAttribute("aria-current");
      }
    });
  }

  steps.forEach((step) => step.classList.add("is-upcoming"));

  const ratios = new Map(steps.map((s) => [s, 0]));

  const stepObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio));

      let bestStep = null;
      let bestRatio = 0;
      ratios.forEach((ratio, step) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestStep = step;
        }
      });

      if (bestStep) {
        const idx = steps.indexOf(bestStep);
        if (idx !== activeIndex) applyState(idx);
      }
    },
    {
      root: null,
      rootMargin: "-42% 0px -42% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    }
  );
  steps.forEach((step) => stepObserver.observe(step));

  const railFill = section.querySelector("[data-wf-rail-fill]");
  const stepsWrap = section.querySelector("[data-wf-steps]");

  let ticking = false;

  function updateRail() {
    ticking = false;
    if (!railFill || !stepsWrap) return;

    const rect = stepsWrap.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const total = rect.height;
    if (total <= 0) return;

    const traveled = viewportCenter - rect.top;
    const progress = Math.max(0, Math.min(1, traveled / total));
    railFill.style.height = progress * 100 + "%";
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateRail);
    }
  }

  if (!prefersReducedMotion) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateRail();
  } else if (railFill) {
    railFill.style.height = "100%";
  }
})();

/*MOBILE NAV TOGGLE */
(function () {
  const toggleBtn = document.getElementById("navToggleBtn");
  const mobileMenu = document.getElementById("mainNav");
  if (!toggleBtn || !mobileMenu) return;

  const closeMenu = () => {
    mobileMenu.classList.remove("is-open");
    toggleBtn.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    mobileMenu.classList.add("is-open");
    toggleBtn.setAttribute("aria-expanded", "true");
  };

  toggleBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.contains("is-open");
    isOpen ? closeMenu() : openMenu();
  });

  // Close after picking a link (mobile UX expectation).
  mobileMenu.addEventListener("click", (e) => {
    if (e.target.closest(".nav-link-custom")) closeMenu();
  });

  // Close if the menu is left open and the viewport grows back to desktop,
  // where the panel becomes a static, always-visible element again.
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 992) closeMenu();
  });

  // Close on outside click.
  document.addEventListener("click", (e) => {
    if (!mobileMenu.classList.contains("is-open")) return;
    if (mobileMenu.contains(e.target) || toggleBtn.contains(e.target)) return;
    closeMenu();
  });
})();

