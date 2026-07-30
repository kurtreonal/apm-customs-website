
const img = document.getElementById("face");
const output = document.getElementById("ascii");

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=!?";

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

// ---- Auto Language Translate (added) ----
(function () {
  function loadGoogleTranslate() {
    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);
  }

  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement(
      {
        pageLanguage: "en",
        autoDisplay: true,
        includedLanguages: "en,es,fr,de,zh-CN,ja,ko,tl"
      },
      document.body
    );
  };

  const style = document.createElement("style");
  style.textContent = `
    .goog-te-banner-frame, .skiptranslate { display: none !important; }
    body { top: 0px !important; }
  `;
  document.head.appendChild(style);

  loadGoogleTranslate();
})();
