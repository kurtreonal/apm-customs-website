const img = document.getElementById("face");
const output = document.getElementById("ascii");

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=!?";

if (img) {
    img.onload = () => {

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const width = 120;
        const height = Math.floor(img.height * (width / img.width) * 0.5);

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img,0,0,width,height);

        const pixels = ctx.getImageData(0,0,width,height).data;

        let text = "";

        for(let y=0;y<height;y++){

            for(let x=0;x<width;x++){

                const i=(y*width+x)*4;

                const r=pixels[i];
                const g=pixels[i+1];
                const b=pixels[i+2];

                const brightness=(r+g+b)/3;

                if(brightness<220){
                    text += chars[Math.floor(Math.random()*chars.length)];
                }else{
                    text += " ";
                }
            }

            text+="\n";
        }

        output.textContent=text;
    };
}

// ---- Manual Language Switcher (button-controlled, Google Translate engine) ----
(function () {
  function loadGoogleTranslate() {
    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.onerror = () => console.error("Google Translate script failed to load.");
    document.body.appendChild(script);
  }

  // googleTranslateElementInit now ONLY sets up the translate engine.
  // It no longer gates the button UI — if this callback is late, blocked,
  // or never fires, the slider still works; translation just waits/retries
  // (see switchLanguage below).
  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement(
      { pageLanguage: "en", autoDisplay: false },
      "google_translate_element"
    );
  };

  // Runs immediately — does not wait on Google Translate at all.
  function setupButtons() {
    const buttons = document.querySelectorAll(".lang-opt");
    const thumb = document.querySelector(".lang-slider-thumb");

    function moveThumb(btn) {
      if (!thumb) return;
      const index = Array.from(buttons).indexOf(btn);
      thumb.style.transform = `translateX(${index * 100}%)`;
    }

    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");

        // UI feedback happens right away, regardless of Google Translate's state.
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        moveThumb(btn);

        switchLanguage(lang);
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

  let switchLanguageInterval = null;
  let switchLanguageAttempts = 0;
  const MAX_SWITCH_ATTEMPTS = 50; // ~5s at 100ms, then give up quietly

  function switchLanguage(lang) {
    if (switchLanguageInterval) clearInterval(switchLanguageInterval);
    switchLanguageAttempts = 0;
    switchLanguageInterval = setInterval(() => {
      const combo = document.querySelector(".goog-te-combo");
      // Google inserts the empty <select> before it fills in the
      // <option> list, so wait for the options too - otherwise the
      // very first click sets a value with no matching option and
      // silently does nothing (the second click "works" only because
      // the options have loaded by then).
      if (combo && combo.options && combo.options.length > 1) {
        clearInterval(switchLanguageInterval);
        switchLanguageInterval = null;
        combo.value = lang;
        combo.dispatchEvent(new Event("change"));
        return;
      }

      switchLanguageAttempts++;
      if (switchLanguageAttempts >= MAX_SWITCH_ATTEMPTS) {
        clearInterval(switchLanguageInterval);
        switchLanguageInterval = null;
        console.error("Google Translate never became ready — translation unavailable, but the UI stays responsive.");
      }
    }, 100);
  }

const style = document.createElement("style");
  style.textContent = `
    .goog-te-banner-frame, .skiptranslate { display: none !important; }
    body { top: 0px !important; }
  `;
  document.head.appendChild(style);

  loadGoogleTranslate();
})();