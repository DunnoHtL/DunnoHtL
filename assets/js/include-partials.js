// assets/js/include-partials.js
const MOBILE_BREAKPOINT = 980;
let lastIsMobile = window.innerWidth <= MOBILE_BREAKPOINT;
(function () {
  const LS_COLLAPSED_KEY = "sidebar:collapsed";

  async function injectPartials() {
    const hosts = document.querySelectorAll("[data-include]");
    await Promise.all(
      Array.from(hosts).map(async (host) => {
        const url = host.getAttribute("data-include");
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          console.warn("Failed to fetch partial:", url);
          return;
        }
        host.innerHTML = await res.text();
        initSidebar(host.closest("#sidebar") || host);
      })
    );
  }

  function initSidebar(sidebar) {
    if (!sidebar || sidebar.dataset.wired === "1") return;
    sidebar.dataset.wired = "1";

    // -------- Overlay (for mobile) --------
    let overlay = document.querySelector("[data-overlay]");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.setAttribute("data-overlay", "");
      overlay.hidden = true;
      document.body.appendChild(overlay);
    }

    // -------- Buttons --------
    const desktopToggle = sidebar.querySelector(".sidebar__toggle"); // three-line button (collapse)
    const closeBtn = sidebar.querySelector(".sidebar__close");       // × button (close mobile)

    // Optional external hamburger (e.g., in top bar)
    const externalHamburger =
      document.querySelector(".hamburger-mobile") ||
      sidebar.querySelector(".hamburger-mobile");

    // -------- State helpers --------
    function isMobileOpen() {
      return sidebar.classList.contains("open");
    }
function setMobileOpen(open) {
  sidebar.classList.toggle("open", open);
  overlay.hidden = !open;
  const expanded = String(!!open);
  if (externalHamburger) externalHamburger.setAttribute("aria-expanded", expanded);
  if (closeBtn) closeBtn.setAttribute("aria-expanded", expanded);
  document.body.classList.toggle("menu-open", open); // lock/unlock scroll
}

window.addEventListener("resize", () => {
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  if (isMobile !== lastIsMobile) {
    lastIsMobile = isMobile;
    if (!isMobile) {
      // leaving mobile -> ensure menu is closed and overlay is hidden
      setMobileOpen(false);
    }
  }
});

// (Optional) Close on Escape for accessibility
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sidebar.classList.contains("open")) {
    setMobileOpen(false);
  }
});

    function isCollapsed() {
      return sidebar.classList.contains("collapsed");
    }
    function setCollapsed(collapsed) {
      sidebar.classList.toggle("collapsed", collapsed);
      document.body.classList.toggle("sidebar-collapsed", collapsed);
      if (desktopToggle) desktopToggle.setAttribute("aria-pressed", String(!!collapsed));
      // persist across pages
      try {
        localStorage.setItem(LS_COLLAPSED_KEY, collapsed ? "1" : "0");
      } catch (_) {}
    }

    // Restore persisted collapsed state
    try {
      const saved = localStorage.getItem(LS_COLLAPSED_KEY);
      if (saved === "1") setCollapsed(true);
    } catch (_) {}

    // Wire up buttons (avoid duplicate listeners by marking them)
    if (desktopToggle && !desktopToggle.dataset.wired) {
      desktopToggle.dataset.wired = "1";
      desktopToggle.addEventListener("click", () => setCollapsed(!isCollapsed()));

        // desktopToggle.addEventListener("click", () => {
        // if (window.innerWidth <= MOBILE_BREAKPOINT) {
        //     // MOBILE: close the drawer
        //     setMobileOpen(false);
        // } else {
        //     // DESKTOP: collapse/expand
        //     setCollapsed(!isCollapsed());
        // }
        // });

      desktopToggle.setAttribute("aria-label", "Collapse sidebar");
    }
    if (closeBtn && !closeBtn.dataset.wired) {
      closeBtn.dataset.wired = "1";
      closeBtn.addEventListener("click", () => setMobileOpen(false));
      closeBtn.setAttribute("aria-label", "Close menu");
    }
    if (externalHamburger && !externalHamburger.dataset.wired) {
      externalHamburger.dataset.wired = "1";
      externalHamburger.addEventListener("click", () => setMobileOpen(!isMobileOpen()));
      externalHamburger.setAttribute("aria-controls", "sidebar");
      externalHamburger.setAttribute("aria-expanded", "false");
    }
    if (!overlay.dataset.wired) {
      overlay.dataset.wired = "1";
      overlay.addEventListener("click", () => setMobileOpen(false));
    }

    // Keyboard shortcut: Ctrl+\
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "\\") {
        e.preventDefault();
        setCollapsed(!isCollapsed());
      }
    }, { passive: false });

    // -------- Active / Selected link --------
    setActiveLink(sidebar);
    // Close mobile menu when a link is chosen
    sidebar.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      if (a.classList.contains("nav__link")) {
        setMobileOpen(false);
      }
    });
  }

  function setActiveLink(sidebarRoot) {
    const links = sidebarRoot.querySelectorAll("a.nav__link[href]");
    if (!links.length) return;

    // Normalize current path to a filename for matching
    const curUrl = new URL(window.location.href);
    let current = curUrl.pathname;
    // Treat / and /folder/ as index.html
    if (current.endsWith("/")) current += "index.html";
    const currentFile = current.split("/").pop();

    links.forEach((a) => {
      const href = a.getAttribute("href");
      const url = new URL(href, window.location.href);
      let linkPath = url.pathname;
      if (linkPath.endsWith("/")) linkPath += "index.html";
      const linkFile = linkPath.split("/").pop();

      const isActive = linkFile === currentFile;
      a.classList.toggle("active", isActive);
      if (isActive) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectPartials);
  } else {
    injectPartials();
  }
})();
