(() => {
  'use strict';
  const groups = [...document.querySelectorAll('[data-menu-group]')];
  const setExpanded = group => group.querySelector('summary')?.setAttribute('aria-expanded', String(group.open));
  const close = group => { group.open = false; setExpanded(group); };
  groups.forEach(group => {
    const summary = group.querySelector('summary');
    setExpanded(group);
    group.addEventListener('toggle', () => {
      setExpanded(group);
      if (group.open) groups.filter(other => other !== group && other.parentElement === group.parentElement).forEach(close);
    });
    group.addEventListener('keydown', event => {
      const links = [...group.querySelectorAll('.nav-submenu a')];
      if (!links.length) return;
      if (event.target === summary && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault(); group.open = true; setExpanded(group);
        links[event.key === 'ArrowDown' ? 0 : links.length - 1].focus();
        return;
      }
      const index = links.indexOf(event.target);
      if (index < 0 || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links[target].focus();
    });
    group.addEventListener('click', event => { if (event.target.closest('a')) close(group); });
  });
  document.addEventListener('pointerdown', event => groups.forEach(group => {
    if (group.open && !group.contains(event.target)) close(group);
  }));
  // Handle an open submenu before the drawer's Escape handler.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = groups.filter(group => group.open && !group.closest('[inert],[hidden]') && group.getClientRects().length);
    if (!open.length) return;
    const focused = open.find(group => group.contains(document.activeElement));
    open.forEach(close); event.preventDefault(); event.stopImmediatePropagation();
    focused?.querySelector('summary')?.focus();
  }, true);
  document.addEventListener('focusin', event => groups.forEach(group => {
    if (group.open && group.closest('.desktop-nav') && !group.contains(event.target)) close(group);
  }));
  window.addEventListener('resize', () => groups.forEach(close));
})();
