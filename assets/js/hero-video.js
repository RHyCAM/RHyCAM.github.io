// Homepage hero: static poster by default, looping video as an enhancement.
//
// The <video> has no source in the HTML (preload="none"), so nothing is
// downloaded unless every check in eligible() passes. The video stays
// transparent over the poster until it is actually playing, then fades in.
// Any failure (blocked autoplay, network/decoding error) leaves the poster.
(function () {
  const video = document.querySelector("[data-hero-video]");
  if (!video) return;

  const src = video.dataset.src;
  const wide = window.matchMedia("(min-width: 900px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection; // Network Information API (not in all browsers)
  const canPlayMp4 = video.canPlayType('video/mp4; codecs="avc1.640028"') !== "";

  let attached = false; // source assigned (download started)
  let failed = false;   // gave up after an error; never retry on this page view

  function eligible() {
    if (failed || !canPlayMp4) return false;
    if (!wide.matches || reducedMotion.matches) return false;
    if (connection) {
      if (connection.saveData) return false;
      if (/2g$/.test(connection.effectiveType || "")) return false; // "slow-2g" or "2g"
    }
    return true;
  }

  function showPoster() {
    video.classList.remove("is-playing");
    video.pause();
  }

  function play() {
    if (!attached) {
      video.muted = true; // required for autoplay; set as a property too
      video.src = src;
      video.load();
      attached = true;
    }
    const attempt = video.play();
    if (attempt) attempt.catch(showPoster); // autoplay blocked etc.: keep the poster
  }

  function update() {
    if (document.hidden) {
      if (attached) video.pause(); // keep the current frame; resume when visible
    } else if (eligible()) {
      play();
    } else if (attached) {
      showPoster();
    }
  }

  // Reveal only once frames are actually being presented.
  video.addEventListener("playing", () => video.classList.add("is-playing"));
  video.addEventListener("error", () => {
    failed = true;
    showPoster();
  });

  wide.addEventListener("change", update);
  reducedMotion.addEventListener("change", update);
  if (connection && connection.addEventListener) connection.addEventListener("change", update);
  document.addEventListener("visibilitychange", update);

  // Let the poster, fonts and page finish first; then consider the video.
  if (document.readyState === "complete") update();
  else window.addEventListener("load", update, { once: true });
})();
