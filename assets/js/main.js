// RHyCAM Lab — small progressive enhancements. The site works without JS.
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  // Navigation: transparent over the dark header, solid after scrolling.
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const onScroll = () => nav.classList.toggle("is-solid", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", open);
    nav.classList.toggle("is-open", open);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) toggle.click();
  });

  // Dropdown menus (e.g. Discoveries). Desktop: open on hover or keyboard
  // focus. Everywhere: the chevron button toggles; Escape closes.
  const desktop = window.matchMedia("(min-width: 961px)");
  document.querySelectorAll("[data-nav-menu]").forEach((menu) => {
    const btn = menu.querySelector("[data-nav-menu-toggle]");
    let quiet = false; // don't reopen when focus returns to the button after Escape
    const setOpen = (open) => {
      menu.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open);
    };
    btn.addEventListener("click", () => setOpen(btn.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("mouseenter", () => desktop.matches && setOpen(true));
    menu.addEventListener("mouseleave", () => desktop.matches && setOpen(false));
    menu.addEventListener("focusin", () => desktop.matches && !quiet && setOpen(true));
    menu.addEventListener("focusout", (e) => {
      if (!menu.contains(e.relatedTarget)) setOpen(false);
    });
    menu.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !menu.classList.contains("is-open")) return;
      e.stopPropagation(); // leave the mobile menu itself open
      setOpen(false);
      quiet = true;
      btn.focus();
      quiet = false;
    });
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target)) setOpen(false);
    });
  });

  // Section entrance reveal.
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("is-visible"));
  }
});
