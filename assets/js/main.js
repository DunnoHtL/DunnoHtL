
(function(){
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.querySelector('.sidebar__toggle');
  const closeBtn = document.querySelector('.sidebar__close');
  const mobileHamburger = document.querySelector('.hamburger-mobile');
  const overlay = document.querySelector('[data-overlay]');
  const mql = window.matchMedia('(max-width: 980px)');
  const STORAGE_KEY = 'rw_sidebar_collapsed';
  const isMobile = () => mql.matches;

  function applyDesktopPreference(){
    try{
      const val = localStorage.getItem(STORAGE_KEY);
      if(val === 'true'){ sidebar.classList.add('collapsed'); }
      else{ sidebar.classList.remove('collapsed'); }
    }catch{}
  }
  function toggleDesktopCollapse(){
    sidebar.classList.toggle('collapsed');
    try{ localStorage.setItem(STORAGE_KEY, sidebar.classList.contains('collapsed')); }catch{}
  }
  function openMobileMenu(){
    sidebar.classList.add('open');
    mobileHamburger?.setAttribute('aria-expanded','true');
    overlay.hidden = false;
    sidebar.querySelector('a, button')?.focus();
  }
  function closeMobileMenu(){
    sidebar.classList.remove('open');
    mobileHamburger?.setAttribute('aria-expanded','false');
    overlay.hidden = true;
  }
  function handleToggleClick(){
    if(isMobile()) openMobileMenu(); else toggleDesktopCollapse();
  }

  applyDesktopPreference();
  toggleBtn?.addEventListener('click', handleToggleClick);
  mobileHamburger?.addEventListener('click', openMobileMenu);
  closeBtn?.addEventListener('click', closeMobileMenu);
  overlay?.addEventListener('click', closeMobileMenu);
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && isMobile()){ closeMobileMenu(); }
    if(e.key === '\\' && (e.ctrlKey || e.metaKey) && !isMobile()){ e.preventDefault(); toggleDesktopCollapse(); }
  });
  mql.addEventListener('change', ()=>{
    if(isMobile()){ sidebar.classList.remove('collapsed'); }
    else{ closeMobileMenu(); applyDesktopPreference(); }
  });

  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(a=>{
    if(a.getAttribute('href') === current){
      a.classList.add('active');
      a.setAttribute('aria-current','page');
    }
  });
})();
