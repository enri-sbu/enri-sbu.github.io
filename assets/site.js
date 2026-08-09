(() => {
  document.documentElement.dataset.siteVersion = "8";
  const storage = {
    get(key, fallback = null) {
      try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch { /* device storage is optional */ }
    },
  };

  const savedTheme = storage.get("enri-theme");
  const preferredTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = savedTheme || preferredTheme;

  const toPersianDigits = (value) => String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
  const isEnglish = document.documentElement.lang === "en";
  const ui = isEnglish ? {
    defaultSearchTitle: "Institute information",
    searchResultHint: "View on this page",
    searchEmpty: "No results were found for this query.",
    researchCount: (count) => `${count} research ${count === 1 ? "area is" : "areas are"} shown.`,
    projectCount: (count) => `${count} documented ${count === 1 ? "project is" : "projects are"} shown.`,
    shareCopied: "Page link copied.",
    shareFailed: "The page link could not be copied.",
  } : {
    defaultSearchTitle: "اطلاعات پژوهشکده",
    searchResultHint: "مشاهده در همین صفحه",
    searchEmpty: "نتیجه‌ای برای این عبارت پیدا نشد.",
    researchCount: (count) => `${toPersianDigits(count)} حوزه پژوهشی نمایش داده می‌شود.`,
    projectCount: (count) => `${toPersianDigits(count)} پروژه مستند نمایش داده می‌شود.`,
    shareCopied: "پیوند صفحه کپی شد.",
    shareFailed: "کپی پیوند صفحه امکان‌پذیر نبود.",
  };

  const updateDateTime = () => {
    const now = new Date();
    const date = document.querySelector("#todayDate");
    const clock = document.querySelector("#liveClock");
    if (date) {
      date.textContent = new Intl.DateTimeFormat(isEnglish ? "en-GB" : "fa-IR-u-ca-persian", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now);
    }
    if (clock) {
      const value = new Intl.DateTimeFormat(isEnglish ? "en-GB" : "fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);
      clock.textContent = isEnglish ? value : toPersianDigits(value);
    }
  };

  updateDateTime();
  window.setInterval(updateDateTime, 1000);

  const themeButtons = document.querySelectorAll(".theme-toggle");
  const syncThemeButtons = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#080c11" : "#121820");
    themeButtons.forEach((button) => {
      button.setAttribute("aria-label", isEnglish
        ? (dark ? "Enable light mode" : "Enable dark mode")
        : (dark ? "فعال‌سازی حالت روشن" : "فعال‌سازی حالت تیره"));
      const icon = button.querySelector("span");
      if (icon) icon.textContent = dark ? "☀" : "☾";
    });
  };
  syncThemeButtons();
  themeButtons.forEach((button) => button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    storage.set("enri-theme", next);
    syncThemeButtons();
  }));

  const drawer = document.querySelector(".mobile-drawer");
  const drawerMask = document.querySelector(".drawer-mask");
  const menuButton = document.querySelector("[data-menu-open]");
  const setDrawer = (open) => {
    if (!drawer || !drawerMask) return;
    drawer.classList.toggle("open", open);
    drawerMask.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    menuButton?.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("no-scroll", open);
  };
  menuButton?.addEventListener("click", () => setDrawer(true));
  document.querySelectorAll("[data-menu-close]").forEach((button) => button.addEventListener("click", () => setDrawer(false)));
  drawer?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setDrawer(false)));

  const searchModal = document.querySelector(".search-modal");
  const searchInput = document.querySelector("#siteSearch");
  const searchResults = document.querySelector("#searchResults");
  let searchReturnFocus = null;

  const searchItems = [...document.querySelectorAll("[data-search]")].map((element) => {
    const section = element.closest("section[id]") || element.closest("article[id]");
    return {
      title: element.dataset.searchTitle || element.querySelector("h2, h3")?.textContent?.trim() || ui.defaultSearchTitle,
      text: element.textContent?.replace(/\s+/g, " ").trim() || "",
      target: section?.id ? `#${section.id}` : "#home",
    };
  }).filter((item, index, items) => items.findIndex((candidate) => candidate.title === item.title && candidate.target === item.target) === index);

  const renderSearch = (query = "") => {
    if (!searchResults) return;
    const normalized = query.trim().toLocaleLowerCase(isEnglish ? "en" : "fa");
    if (normalized.length < 2) {
      searchResults.innerHTML = "";
      return;
    }
    const matches = searchItems.filter((item) => `${item.title} ${item.text}`.toLocaleLowerCase(isEnglish ? "en" : "fa").includes(normalized)).slice(0, 10);
    searchResults.innerHTML = matches.length
      ? matches.map((item) => `<a href="${item.target}" data-search-result><strong>${item.title}</strong><small>${ui.searchResultHint}</small></a>`).join("")
      : `<p class="search-empty">${ui.searchEmpty}</p>`;
  };

  const setSearch = (open, trigger = null) => {
    if (!searchModal) return;
    if (open) searchReturnFocus = trigger || document.activeElement;
    searchModal.classList.toggle("open", open);
    searchModal.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("no-scroll", open);
    if (open) window.setTimeout(() => searchInput?.focus(), 80);
    else {
      if (searchInput) searchInput.value = "";
      renderSearch("");
      searchReturnFocus?.focus?.();
    }
  };

  document.querySelectorAll("[data-search-open]").forEach((button) => button.addEventListener("click", () => setSearch(true, button)));
  document.querySelector("[data-search-close]")?.addEventListener("click", () => setSearch(false));
  searchModal?.addEventListener("click", (event) => { if (event.target === searchModal) setSearch(false); });
  searchInput?.addEventListener("input", (event) => renderSearch(event.target.value));
  searchResults?.addEventListener("click", (event) => { if (event.target.closest("[data-search-result]")) setSearch(false); });

  const popularSections = isEnglish ? {
    about: { title: "Institute profile", href: "#about" },
    fields: { title: "Research areas", href: "#fields" },
    objectives: { title: "Institute objectives", href: "#objectives" },
    collaborate: { title: "Ways to collaborate", href: "#collaborate" },
    activities: { title: "Outputs and activities", href: "#activities" },
    projects: { title: "Power-industry projects", href: "#projects" },
    people: { title: "Academic members", href: "#people" },
    contact: { title: "Contact information", href: "#contact" },
  } : {
    about: { title: "معرفی پژوهشکده", href: "#about" },
    fields: { title: "حوزه‌های تخصصی", href: "#fields" },
    objectives: { title: "اهداف کلان", href: "#objectives" },
    collaborate: { title: "مسیرهای همکاری", href: "#collaborate" },
    activities: { title: "فعالیت‌ها و همکاری‌ها", href: "#activities" },
    projects: { title: "پروژه‌های صنعت برق", href: "#projects" },
    people: { title: "اعضای علمی", href: "#people" },
    contact: { title: "اطلاعات تماس", href: "#contact" },
  };
  const readPopular = () => {
    try { return JSON.parse(storage.get("enri-section-visits", "{}")); } catch { return {}; }
  };
  const popularCounts = readPopular();
  const popularList = document.querySelector("#popularList");
  const renderPopular = () => {
    if (!popularList) return;
    const ranked = Object.entries(popularSections).sort((a, b) => (popularCounts[b[0]] || 0) - (popularCounts[a[0]] || 0)).slice(0, 5);
    popularList.innerHTML = ranked.map(([id, item]) => {
      const count = popularCounts[id] || 0;
      const countLabel = count
        ? (isEnglish ? `${count} visits` : `${toPersianDigits(count)} بازدید`)
        : (isEnglish ? "Main section" : "بخش اصلی");
      return `<li><a href="${item.href}" data-popular-id="${id}"><span>${item.title}</span><small>${countLabel}</small></a></li>`;
    }).join("");
  };
  renderPopular();

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='#']");
    if (!link) return;
    const id = link.dataset.popularId || link.getAttribute("href").slice(1);
    if (popularSections[id]) {
      popularCounts[id] = (popularCounts[id] || 0) + 1;
      storage.set("enri-section-visits", JSON.stringify(popularCounts));
      renderPopular();
    }
  });

  const navLinks = [...document.querySelectorAll("[data-nav]")];
  const observedSections = [...document.querySelectorAll("[data-section]")];
  if ("IntersectionObserver" in window && navLinks.length && observedSections.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => link.classList.toggle("active", link.dataset.nav === visible.target.dataset.section));
    }, { rootMargin: "-22% 0px -62%", threshold: [0, .12, .3] });
    observedSections.forEach((section) => observer.observe(section));
  }

  const progress = document.querySelector(".reading-progress span");
  const backToTop = document.querySelector(".back-to-top");
  const updateScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progress) progress.style.width = `${Math.min(100, (window.scrollY / max) * 100)}%`;
    backToTop?.classList.toggle("show", window.scrollY > 650);
  };
  updateScroll();
  window.addEventListener("scroll", updateScroll, { passive: true });
  backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  const bindFilter = ({ buttonSelector, cardSelector, statusSelector, countLabel }) => {
    const buttons = [...document.querySelectorAll(buttonSelector)];
    const cards = [...document.querySelectorAll(cardSelector)];
    const status = document.querySelector(statusSelector);
    if (!buttons.length || !cards.length) return;
    buttons.forEach((button) => button.addEventListener("click", () => {
      const selected = button.dataset.researchFilter ?? button.dataset.projectFilter ?? "all";
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      let visibleCount = 0;
      cards.forEach((card) => {
        const group = card.dataset.researchCard ?? card.dataset.projectCard;
        const visible = selected === "all" || selected === group;
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      if (status) status.textContent = countLabel(visibleCount);
    }));
  };

  bindFilter({
    buttonSelector: "[data-research-filter]",
    cardSelector: "[data-research-card]",
    statusSelector: "[data-research-status]",
    countLabel: ui.researchCount,
  });
  bindFilter({
    buttonSelector: "[data-project-filter]",
    cardSelector: "[data-project-card]",
    statusSelector: "[data-project-status]",
    countLabel: ui.projectCount,
  });
  document.documentElement.dataset.filtersReady = "true";

  const pageToolStatus = document.querySelector("#pageToolStatus");
  const setPageToolStatus = (message) => {
    if (!pageToolStatus) return;
    pageToolStatus.textContent = message;
    window.setTimeout(() => { pageToolStatus.textContent = ""; }, 3500);
  };

  document.querySelectorAll("[data-page-print]").forEach((button) => button.addEventListener("click", () => window.print()));
  document.querySelectorAll("[data-page-share]").forEach((button) => button.addEventListener("click", async () => {
    const shareData = { title: document.title, url: window.location.href.split("#")[0] };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(shareData.url);
      setPageToolStatus(ui.shareCopied);
    } catch (error) {
      if (error?.name !== "AbortError") setPageToolStatus(ui.shareFailed);
    }
  }));

  document.querySelectorAll(".faq-list details").forEach((details) => details.addEventListener("toggle", () => {
    if (!details.open) return;
    document.querySelectorAll(".faq-list details").forEach((other) => { if (other !== details) other.open = false; });
  }));

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
    if ((event.key === "/" && !typing) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
      event.preventDefault();
      setSearch(true, document.activeElement);
      return;
    }
    if (event.key === "Escape") {
      setDrawer(false);
      if (searchModal?.classList.contains("open")) setSearch(false);
    }
  });
  document.documentElement.dataset.uiReady = "true";
})();
