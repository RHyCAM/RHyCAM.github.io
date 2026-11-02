// Publications page: Theme / Project / Year / keyword filtering with URL deep links.
//
// Each <li class="pub"> carries data-themes, data-projects, data-year and
// data-search. Valid theme/project values are the <option>s rendered from the
// _research and _projects collections, so there is no second list to maintain.
//
//   /publications/?theme=hydroclimate-extremes
//   /publications/?project=hyperfacets
//   /publications/?theme=hydroclimate-extremes&year=2023&q=atmospheric+river
(function () {
  const root = document.querySelector("[data-pub-browser]");
  if (!root) return;

  const form = root.querySelector("[data-pub-filters]");
  const fields = {
    q: form.elements.q,
    theme: form.elements.theme,
    project: form.elements.project, // absent when no project has papers yet
    year: form.elements.year,
  };
  // Every filter is mirrored in the address bar. Dropdown changes add a
  // history entry (Back undoes them); typing in the search box only updates
  // the current entry, so Back doesn't step through it letter by letter.
  const SELECT_KEYS = ["theme", "project", "year"];
  const URL_KEYS = [...SELECT_KEYS, "q"];
  const count = root.querySelector("[data-pub-count]");
  const empty = root.querySelector("[data-pub-empty]");
  const resetBtn = form.querySelector("[data-pub-reset]");
  const groups = [...root.querySelectorAll("[data-pub-group]")];

  const words = (s) => (s || "").split(/\s+/).filter(Boolean);
  const pubs = [...root.querySelectorAll("[data-pub-results] .pub")].map((el) => ({
    el,
    year: el.dataset.year,
    themes: words(el.dataset.themes),
    projects: words(el.dataset.projects),
    text: el.dataset.search + " " + el.dataset.year,
  }));

  // --- filtering logic (no DOM) -------------------------------------------
  // Different dimensions combine with AND; within a paper's own multi-valued
  // tags, any match is enough.
  function matches(pub, f) {
    if (f.theme && !pub.themes.includes(f.theme)) return false;
    if (f.project && !pub.projects.includes(f.project)) return false;
    if (f.year && pub.year !== f.year) return false;
    return f.terms.every((t) => pub.text.includes(t));
  }

  // --- state <-> controls <-> URL -----------------------------------------
  const isValid = (select, value) =>
    !!select && [...select.options].some((o) => o.value === value);

  function readFilters() {
    return {
      theme: fields.theme.value,
      project: fields.project ? fields.project.value : "",
      year: fields.year.value,
      terms: words(fields.q.value.toLowerCase()),
    };
  }

  // Set the controls from the URL; unknown dropdown values fall back to "All".
  // Returns true if the URL asked for at least one valid filter.
  function applyUrl() {
    const params = new URLSearchParams(location.search);
    let any = false;
    SELECT_KEYS.forEach((key) => {
      const select = fields[key];
      const value = params.get(key) || "";
      const ok = value !== "" && isValid(select, value);
      if (select) select.value = ok ? value : "";
      any = any || ok;
    });
    fields.q.value = (params.get("q") || "").trim();
    return any || fields.q.value !== "";
  }

  function syncUrl({ replace = false } = {}) {
    const url = new URL(location.href);
    URL_KEYS.forEach((key) => {
      const value = fields[key] ? fields[key].value.trim() : "";
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key); // keeps any unrelated parameters
    });
    if (url.href === location.href) return;
    if (replace) history.replaceState(null, "", url);
    else history.pushState(null, "", url);
  }

  // --- rendering ------------------------------------------------------------
  function render() {
    const f = readFilters();
    let shown = 0;
    pubs.forEach((pub) => {
      const ok = matches(pub, f);
      pub.el.hidden = !ok;
      if (ok) shown++;
    });
    groups.forEach((g) => {
      g.hidden = !g.querySelector(".pub:not([hidden])");
    });

    const active = !!(f.theme || f.project || f.year || f.terms.length);
    count.textContent = active
      ? `Showing ${shown} of ${pubs.length} publications`
      : `${pubs.length} publications`;
    empty.hidden = shown > 0;
    resetBtn.hidden = !active;
    Object.values(fields).forEach((el) => el && el.classList.toggle("is-active", !!el.value));
  }

  // --- events -------------------------------------------------------------------
  let typing;
  form.addEventListener("submit", (e) => {
    e.preventDefault(); // Enter in the search box: update the address right away
    clearTimeout(typing);
    syncUrl({ replace: true });
  });
  form.addEventListener("input", (e) => {
    render();
    if (e.target === fields.q) {
      clearTimeout(typing);
      typing = setTimeout(() => syncUrl({ replace: true }), 400);
    } else if (SELECT_KEYS.includes(e.target.name)) {
      syncUrl();
    }
  });
  root.querySelectorAll("[data-pub-reset]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      form.reset();
      render();
      syncUrl();
      fields.q.focus();
    })
  );
  window.addEventListener("popstate", () => {
    applyUrl();
    render();
  });

  // --- initial load ---------------------------------------------------------------
  const deepLinked = applyUrl();
  render();
  document.documentElement.classList.remove("pub-pending");

  // Arriving from a filtered link (e.g. a Research Theme page): if other
  // content pushes the list below the fold, jump to it. Re-align once
  // fonts/images settle, unless the visitor has started scrolling.
  if (deepLinked && !location.hash && root.getBoundingClientRect().top > window.innerHeight * 0.6) {
    let userMoved = false;
    ["wheel", "touchstart", "keydown"].forEach((ev) =>
      window.addEventListener(ev, () => (userMoved = true), { once: true, passive: true })
    );
    const jump = () => !userMoved && root.scrollIntoView({ behavior: "instant", block: "start" });
    jump();
    if (document.fonts) document.fonts.ready.then(jump);
    window.addEventListener("load", jump, { once: true });
  }
})();
