// assets/js/include-partials.js
const MOBILE_BREAKPOINT = 980;
let lastIsMobile = window.innerWidth <= MOBILE_BREAKPOINT;
(function () {
  const LS_COLLAPSED_KEY = "sidebar:collapsed";

  // Fallback: if the user clicks the mobile hamburger before the
  // sidebar partial has been injected/wired, provide a minimal handler
  // to toggle the real `#sidebar` so the overlay doesn't show alone.
  document.addEventListener('click', (e) => {
    const hb = e.target.closest('.hamburger-mobile');
    if (!hb) return;
    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;
    // If sidebar was already wired, let the normal initSidebar handlers run
    if (sidebarEl.dataset.wired === '1') return;

    // Ensure overlay exists
    let overlay = document.querySelector('[data-overlay]');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.setAttribute('data-overlay', '');
      overlay.hidden = true;
      document.body.appendChild(overlay);
    }

    const willOpen = !sidebarEl.classList.contains('open');
    sidebarEl.classList.toggle('open', willOpen);
    overlay.hidden = !willOpen;
    document.body.classList.toggle('menu-open', willOpen);
    hb.setAttribute('aria-expanded', String(!!willOpen));
    const closeBtn = sidebarEl.querySelector('.sidebar__close');
    if (closeBtn) closeBtn.setAttribute('aria-expanded', String(!!willOpen));
  });

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
        // Only initialise the real sidebar element. Some pages include
        // other partials (footer, datetable) and we must not wire the
        // mobile hamburger to those hosts — otherwise the hamburger may
        // toggle an unrelated element and leave the real sidebar hidden.
        const sidebarEl = host.closest("#sidebar");
        if (sidebarEl) initSidebar(sidebarEl);
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

    // If the aside already has .open (for example the user clicked the
    // hamburger before the partial finished injecting), ensure the
    // overlay and aria attributes are synced to reflect the open state.
    if (sidebar.classList.contains('open')) {
      // Ensure overlay is visible and body locked
      overlay.hidden = false;
      document.body.classList.add('menu-open');
      if (externalHamburger) externalHamburger.setAttribute('aria-expanded', 'true');
      const closeBtnExisting = sidebar.querySelector('.sidebar__close');
      if (closeBtnExisting) closeBtnExisting.setAttribute('aria-expanded', 'true');
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
      // restore persisted desktop collapsed state (if any)
      try {
        const saved = localStorage.getItem(LS_COLLAPSED_KEY);
        if (saved === "1") setCollapsed(true, true);
        else setCollapsed(false, true);
      } catch (_) {}
    } else {
      // entering mobile: temporarily clear collapsed appearance
      // (do not overwrite the persisted preference)
      setCollapsed(false, false);
      // entering mobile: if body says menu-open but the drawer isn't open, sync it
      if (document.body.classList.contains("menu-open") && !sidebar.classList.contains("open")) {
        setMobileOpen(true);
      }
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
    // setCollapsed(collapsed, persist = true)
    // When `persist` is false the visual state is changed without writing
    // the preference to localStorage. This is used to temporarily neutralise
    // the desktop 'collapsed' mode while on narrow (mobile) screens.
    function setCollapsed(collapsed, persist = true) {
      sidebar.classList.toggle("collapsed", collapsed);
      document.body.classList.toggle("sidebar-collapsed", collapsed);
      if (desktopToggle) desktopToggle.setAttribute("aria-pressed", String(!!collapsed));
      if (persist) {
        try {
          localStorage.setItem(LS_COLLAPSED_KEY, collapsed ? "1" : "0");
        } catch (_) {}
      }
    }

    // Restore persisted collapsed state. If we're on mobile, neutralise
    // the collapsed visual state without overwriting the saved preference.
    try {
      const saved = localStorage.getItem(LS_COLLAPSED_KEY);
      if (saved === "1") setCollapsed(true);
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        // Temporarily clear collapsed mode on mobile (do NOT persist)
        setCollapsed(false, false);
      }
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

  // -------- Sidebar resize handle --------
  const LS_WIDTH_KEY = 'sidebar:width';
  const RESIZE_MIN = 160;
  const RESIZE_MAX = 620;

  function initResizeHandle() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Restore saved width (applied as inline style; collapsed !important overrides it when needed)
    try {
      const saved = parseInt(localStorage.getItem(LS_WIDTH_KEY), 10);
      if (saved >= RESIZE_MIN && saved <= RESIZE_MAX) {
        sidebar.style.width = saved + 'px';
        sidebar.style.flexBasis = saved + 'px';
      }
    } catch (_) {}

    // Create and insert the handle between sidebar and content-area
    const handle = document.createElement('div');
    handle.className = 'sidebar-resize-handle';
    handle.setAttribute('role', 'separator');
    handle.title = 'Drag to resize · Double-click to reset';
    sidebar.after(handle);

    let startX = 0, startWidth = 0, dragging = false;

    handle.addEventListener('mousedown', e => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) return;
      if (sidebar.classList.contains('collapsed')) return;
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startWidth = sidebar.getBoundingClientRect().width;
      sidebar.style.transition = 'none';
      handle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const w = Math.min(RESIZE_MAX, Math.max(RESIZE_MIN, startWidth + (e.clientX - startX)));
      sidebar.style.width = w + 'px';
      sidebar.style.flexBasis = w + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('dragging');
      sidebar.style.transition = '';
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        const w = parseInt(sidebar.style.width, 10);
        if (w) localStorage.setItem(LS_WIDTH_KEY, String(w));
      } catch (_) {}
    });

    // Double-click resets to default width
    handle.addEventListener('dblclick', () => {
      sidebar.style.width = '';
      sidebar.style.flexBasis = '';
      try { localStorage.removeItem(LS_WIDTH_KEY); } catch (_) {}
    });
  }

  function run() {
    injectPartials();
    initResizeHandle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
