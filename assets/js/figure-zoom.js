// Figure enlargement: links marked [data-zoom] (wrapping an <img>) open their
// target image in a modal <dialog> instead of navigating. Without JavaScript,
// or without <dialog> support, the link just opens the image itself.
// The enlarged view reuses the same image URL as the inline figure, so the
// browser serves it from cache; nothing extra is preloaded.
(function () {
  const triggers = document.querySelectorAll("a[data-zoom]");
  if (!triggers.length || typeof HTMLDialogElement !== "function") return;

  let dialog, img, full, opener;

  function build() {
    dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Close">' +
      '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 3l10 10M13 3L3 13"/></svg></button>' +
      '<img class="lightbox-img" alt="">' +
      '<a class="lightbox-full" target="_blank" rel="noopener">Open full-resolution image' +
      '<span class="sr-only"> (opens in a new tab)</span></a>';
    document.body.appendChild(dialog);
    img = dialog.querySelector(".lightbox-img");
    full = dialog.querySelector(".lightbox-full");

    dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
    // The dialog fills the viewport; a click that lands on it directly (not on
    // the image, button or link) is a click on the dark area around the image.
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("lightbox-open");
      if (opener) opener.focus();
    });
  }

  function open(trigger) {
    if (!dialog) build();
    const source = trigger.querySelector("img");
    opener = trigger;
    img.src = trigger.href;
    img.alt = source ? source.alt : "";
    full.href = trigger.href;
    dialog.setAttribute("aria-label", (source && source.alt ? source.alt.split(":")[0] : "Figure") + ", enlarged");
    document.documentElement.classList.add("lightbox-open");
    dialog.showModal();
  }

  triggers.forEach((t) =>
    t.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let "open in new tab" work
      e.preventDefault();
      open(t);
    })
  );
})();
