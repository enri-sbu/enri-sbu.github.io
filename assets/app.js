(() => {
  'use strict';
  const root = document.documentElement;
  const en = root.lang === 'en', current = root.dataset.page || 'home';
  const base = root.dataset.siteRoot || '';
  const home = base + (en ? 'en.html' : 'index.html');
  const page = id => `${base}${en ? 'en-' : ''}${id}.html`;
  const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  const storage = {
    get(k, fallback=null) { try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; } },
    set(k,v) { try { localStorage.setItem(k,v); } catch {} }
  };
  const digits = v => en ? String(v) : String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  const normalize = v => String(v).normalize('NFKC').toLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک')
    .replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[\u200c-\u200f]/g,' ').replace(/\s+/g,' ').trim();
  const compact = v => normalize(v).replace(/\s/g,'');
  root.dataset.siteVersion = '23';
  // Restored from v16: show the branded loader only briefly and only once per session at full duration.
  const siteLoader = q('[data-site-loader]');
  if(siteLoader){
    root.classList.add('site-is-loading');document.body.classList.add('site-is-loading');
    const startedAt=performance.now();let firstLoad=true,hidden=false;
    try{firstLoad=sessionStorage.getItem('enri-loader-seen')!=='1';sessionStorage.setItem('enri-loader-seen','1');}catch{}
    const minimumVisible=firstLoad?950:260;
    const hideLoader=()=>{if(hidden)return;hidden=true;siteLoader.classList.add('is-hidden');siteLoader.setAttribute('aria-hidden','true');root.classList.remove('site-is-loading');document.body.classList.remove('site-is-loading');setTimeout(()=>siteLoader.remove(),650);};
    const finishLoader=()=>setTimeout(hideLoader,Math.max(0,minimumVisible-(performance.now()-startedAt)));
    if(document.readyState==='complete')finishLoader();else addEventListener('load',finishLoader,{once:true});
    setTimeout(hideLoader,3200);
  }


  const syncTheme = () => {
    const dark = root.dataset.theme === 'dark';
    q('meta[name="theme-color"]')?.setAttribute('content',dark?'#080c11':'#0b3158');
    qa('.theme-toggle').forEach(b=>{
      b.setAttribute('aria-pressed',String(dark));
      b.setAttribute('aria-label',en?(dark?'Enable light mode':'Enable dark mode'):(dark?'فعال‌سازی حالت روشن':'فعال‌سازی حالت تیره'));
      const icon=b.querySelector('span');if(icon)icon.textContent=dark?'☀':'☾';
    });
  };
  if(!['dark','light'].includes(root.dataset.theme))root.dataset.theme='light';
  syncTheme();
  qa('.theme-toggle').forEach(b=>b.addEventListener('click',()=>{
    root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';storage.set('enri-theme',root.dataset.theme);syncTheme();
  }));
  const date=q('#todayDate'),clock=q('#liveClock');
  const updateTime=()=>{
    const now=new Date();
    try{
      if(date)date.textContent=new Intl.DateTimeFormat(en?'en-GB':'fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now);
      if(clock){clock.textContent=new Intl.DateTimeFormat(en?'en-GB':'fa-IR',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);clock.setAttribute('datetime',now.toISOString());}
    }catch{if(date)date.textContent=now.toLocaleDateString();if(clock)clock.textContent=now.toLocaleTimeString();}
  };
  updateTime();if(clock)setInterval(updateTime,1000);

  // V16 compatibility: restore card/panel activation without loading the old site.js twice.
  // The merged build already contains the V16 site.js byte-for-byte, while app.js implements
  // the newer overlay/search/filter logic. Only the missing clickable-card behavior is restored here.
  const interactiveSelector='a,button,input,textarea,select,summary,[contenteditable="true"]';
  qa('[data-detail-link]').forEach(card=>{
    const href=card.getAttribute('data-detail-link');if(!href)return;
    if(!card.hasAttribute('role'))card.setAttribute('role','link');
    if(!card.hasAttribute('tabindex'))card.tabIndex=0;
    const activate=()=>{window.location.href=/^(?:https?:|mailto:|tel:)/i.test(href)?href:base+href;};
    card.addEventListener('click',e=>{if(e.target.closest(interactiveSelector))return;activate();});
    card.addEventListener('keydown',e=>{
      if(e.target.closest(interactiveSelector))return;
      if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}
    });
  });
  root.dataset.v16Compat='true';

  // One overlay manager keeps keyboard focus and background interaction consistent.
  const drawer=q('#mobileDrawer'),mask=q('.drawer-mask'),menuButton=q('[data-menu-open]');
  const search=q('.search-modal'),input=q('#siteSearch'),results=q('#searchResults');
  let overlay=null,returnFocus=null,inertState=[];
  if(mask)mask.hidden=true;
  const focusable=el=>[...el.querySelectorAll('a[href],button,summary,input,select,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter(n=>!n.disabled&&!n.closest('[hidden],[inert]')&&n.getClientRects().length);
  const close=(restore=true)=>{
    if(!overlay)return;
    const old=overlay;
    old.classList.remove('open');old.setAttribute('aria-hidden','true');old.inert=true;
    if(old===search)old.hidden=true;
    if(mask){mask.classList.remove('open');mask.hidden=true;}
    menuButton?.setAttribute('aria-expanded','false');
    inertState.forEach(([el,state])=>{el.inert=state;});inertState=[];
    document.body.classList.remove('no-scroll');overlay=null;
    if(old===search){if(input)input.value='';results?.replaceChildren();}
    if(restore&&returnFocus?.isConnected)returnFocus.focus();returnFocus=null;
  };
  const open=(target,trigger)=>{
    if(!target)return;
    close(false);returnFocus=trigger||document.activeElement;overlay=target;
    target.hidden=false;target.inert=false;target.classList.add('open');target.setAttribute('aria-hidden','false');
    if(target===drawer){menuButton?.setAttribute('aria-expanded','true');if(mask){mask.hidden=false;mask.classList.add('open');}}
    inertState=[...document.body.children].filter(el=>el!==target&&el!==mask&&!['SCRIPT','STYLE'].includes(el.tagName))
      .map(el=>{const previous=el.inert;el.inert=true;return[el,previous];});
    document.body.classList.add('no-scroll');(target===search?input:focusable(target)[0])?.focus();
  };
  menuButton?.addEventListener('click',e=>open(drawer,e.currentTarget));
  qa('[data-menu-close],[data-search-close]').forEach(b=>b.addEventListener('click',()=>close()));
  qa('[data-search-open]').forEach(b=>b.addEventListener('click',e=>open(search,e.currentTarget)));
  search?.addEventListener('click',e=>{if(e.target===search)close();});
  drawer?.addEventListener('click',e=>{if(e.target.closest('a'))close(false);});
  qa('.search-shortcuts [data-search-result]').forEach(a=>a.addEventListener('click',()=>close(false)));
  const index=(Array.isArray(window.ENRI_CONTENT)?window.ENRI_CONTENT:[]).filter(i=>i.lang===root.lang)
    .map(i=>({...i,haystack:compact(`${i.title} ${i.summary} ${i.text}`),titleKey:compact(i.title)}));
  const renderSearch=()=>{
    if(!results)return;results.replaceChildren();
    const value=normalize(input?.value||'');if(value.length<2)return;
    const tokens=value.split(' ').filter(Boolean).map(compact);
    const matches=index.filter(i=>tokens.every(t=>i.haystack.includes(t)))
      .sort((a,b)=>Number(b.titleKey.includes(compact(value)))-Number(a.titleKey.includes(compact(value))));
    const status=document.createElement('p');status.className=matches.length?'search-count':'search-empty';
    status.textContent=matches.length?(en?`${matches.length} results${matches.length>12?' · First 12 shown':''}`:`${digits(matches.length)} نتیجه${matches.length>12?' · نمایش ۱۲ نتیجهٔ اول':''}`)
      :(en?'No matching page. Try a shorter or different term.':'صفحه‌ای پیدا نشد. عبارت کوتاه‌تر یا واژهٔ دیگری را امتحان کنید.');
    results.append(status);
    matches.slice(0,12).forEach(i=>{
      const a=document.createElement('a'),title=document.createElement('strong'),hint=document.createElement('small');
      a.href=base+i.url;a.dataset.searchResult='';title.textContent=i.title;hint.textContent=i.category;a.append(title,hint);results.append(a);
    });
  };
  input?.addEventListener('input',renderSearch);
  input?.addEventListener('keydown',e=>{
    const first=results?.querySelector('a');
    if(e.key==='ArrowDown'){e.preventDefault();first?.focus();}
    if(e.key==='Enter'&&first){e.preventDefault();first.click();}
  });
  results?.addEventListener('click',e=>{if(e.target.closest('a'))close(false);});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&overlay){e.preventDefault();close();return;}
    if(e.key==='Tab'&&overlay){
      const all=focusable(overlay),first=all[0],last=all[all.length-1];
      if(!first){e.preventDefault();return;}
      if(e.shiftKey&&(document.activeElement===first||!overlay.contains(document.activeElement))){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&(document.activeElement===last||!overlay.contains(document.activeElement))){e.preventDefault();first.focus();}
      return;
    }
    const typing=e.target.closest('input,textarea,select,[contenteditable="true"]');
    if((e.key==='/'&&!typing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')){
      if(search){e.preventDefault();open(search,document.activeElement);}
    }
  });
  window.addEventListener('resize',()=>{if(innerWidth>1180&&overlay===drawer)close();});

  const bindFilter=kind=>{
    const buttons=qa(`[data-${kind}-filter]`),cards=qa(`[data-${kind}-card]`),status=q(`[data-${kind}-status]`);
    if(!buttons.length)return;
    const apply=button=>{
      const selected=button.getAttribute(`data-${kind}-filter`);let count=0;
      buttons.forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
      cards.forEach(card=>{card.hidden=selected!=='all'&&card.getAttribute(`data-${kind}-card`)!==selected;if(!card.hidden)count++;});
      if(status)status.textContent=en?`${count} ${kind==='project'?'projects':'research areas'} shown.`:`${digits(count)} ${kind==='project'?'پروژه':'حوزهٔ پژوهشی'} نمایش داده می‌شود.`;
      if(kind==='project'){
        const heading=q('.other-projects')?.previousElementSibling;
        if(heading?.classList.contains('subsection-title'))heading.hidden=selected!=='all'&&selected!=='other';
        const training=q('#training-project');if(training)training.hidden=selected!=='all'&&selected!=='tavanir';
      }
    };
    buttons.forEach(b=>b.addEventListener('click',()=>apply(b)));apply(buttons.find(b=>b.getAttribute('aria-pressed')==='true')||buttons[0]);
  };
  bindFilter('research');bindFilter('project');root.dataset.filtersReady='true';
  qa('.faq-list details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)qa('.faq-list details').forEach(other=>{if(other!==d)other.open=false;});}));

  const sections={about:en?'Institute profile':'معرفی پژوهشکده',fields:en?'Research areas':'حوزه‌های تخصصی',objectives:en?'Objectives':'اهداف کلان',
    collaboration:en?'Collaboration':'مسیرهای همکاری',activities:en?'Activities':'فعالیت‌ها',projects:en?'Projects':'پروژه‌ها',contact:en?'Contact':'تماس'};
  let visits={};
  try{const s=JSON.parse(storage.get('enri-section-visits','{}'));if(s&&!Array.isArray(s)&&typeof s==='object')visits=s;}catch{}
  const parent=current.startsWith('field-')?'fields':current.startsWith('project-')?'projects':current.startsWith('activity-')?'activities':current.startsWith('service-')?'collaboration':current;
  if(sections[parent]){visits[parent]=(Number(visits[parent])||0)+1;storage.set('enri-section-visits',JSON.stringify(visits));}
  const popular=q('#popularList');
  const renderPopular=()=>{
    if(!popular)return;popular.replaceChildren();
    Object.entries(sections).sort((a,b)=>(Number(visits[b[0]])||0)-(Number(visits[a[0]])||0)).slice(0,5).forEach(([id,title])=>{
      const li=document.createElement('li'),a=document.createElement('a'),span=document.createElement('span'),small=document.createElement('small');
      a.href=current==='home'?`#${id==='collaboration'?'collaborate':id}`:page(id);a.dataset.popularId=id;span.textContent=title;
      const count=Number(visits[id])||0;small.textContent=count?(en?`${count} visits`:`${digits(count)} بازدید`):(en?'Main section':'بخش اصلی');
      a.append(span,small);li.append(a);popular.append(li);
    });
  };
  renderPopular();
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href^="#"]');if(!a)return;
    let id=a.dataset.popularId||a.getAttribute('href').slice(1);if(id==='collaborate')id='collaboration';
    if(sections[id]){visits[id]=(Number(visits[id])||0)+1;storage.set('enri-section-visits',JSON.stringify(visits));renderPopular();}
  });
  const navLinks=qa('[data-nav]');
  if(current!=='home')navLinks.forEach(a=>{
    const active=a.dataset.nav===(parent==='collaboration'?'collaborate':parent);a.classList.toggle('active',active);
    if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  if('IntersectionObserver'in window&&current==='home'){
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!visible)return;
      navLinks.forEach(a=>{const active=a.dataset.nav===visible.target.dataset.section;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    },{rootMargin:'-15% 0px -60%',threshold:[0,.1,.3]});
    qa('[data-section]').forEach(section=>observer.observe(section));
  }
  const menu=q('.main-menu'),row=menu?.querySelector('.menu-row');
  if(row&&!row.querySelector('.sticky-nav-logo')){
    const a=document.createElement('a'),im=document.createElement('img');a.className='sticky-nav-logo';a.href=home;a.setAttribute('aria-label',en?'Institute home':'صفحه اصلی پژوهشکده');
    im.src=base+'assets/enri-logo.png';im.alt='';im.width=819;im.height=456;a.append(im);row.insertBefore(a,row.querySelector('.desktop-nav'));
  }
  const progress=q('.reading-progress span'),topButton=q('.back-to-top'),quickContact=q('.quick-contact');
  let menuStart=menu?menu.getBoundingClientRect().top+scrollY:0,queued=false;
  const updateScroll=()=>{
    queued=false;const max=Math.max(1,root.scrollHeight-innerHeight);
    if(progress)progress.style.width=`${Math.max(0,Math.min(100,scrollY/max*100))}%`;
    topButton?.classList.toggle('show',scrollY>650);menu?.classList.toggle('is-stuck',scrollY>=menuStart);quickContact?.classList.toggle('is-scroll-hidden',scrollY>180);
  };
  window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateScroll);}},{passive:true});
  window.addEventListener('load',()=>{menuStart=menu?menu.offsetTop:0;updateScroll();},{once:true});
  topButton?.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
  updateScroll();root.dataset.uiReady='true';
})();
