(() => {
  document.documentElement.dataset.siteVersion = "10";
  const storage = {
    get(key, fallback = null) {
      try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch { /* device storage is optional */ }
    },
  };

  const siteLoader = document.querySelector("[data-site-loader]");
  if (siteLoader) {
    document.documentElement.classList.add("site-is-loading");
    document.body.classList.add("site-is-loading");
    const startedAt = performance.now();
    let firstLoad = true;
    try {
      firstLoad = window.sessionStorage.getItem("enri-loader-seen") !== "1";
      window.sessionStorage.setItem("enri-loader-seen", "1");
    } catch { /* session storage is optional */ }
    const minimumVisible = firstLoad ? 950 : 260;
    let hidden = false;
    const hideLoader = () => {
      if (hidden) return;
      hidden = true;
      siteLoader.classList.add("is-hidden");
      siteLoader.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("site-is-loading");
      document.body.classList.remove("site-is-loading");
      window.setTimeout(() => siteLoader.remove(), 650);
    };
    const finishLoader = () => {
      const remaining = Math.max(0, minimumVisible - (performance.now() - startedAt));
      window.setTimeout(hideLoader, remaining);
    };
    if (document.readyState === "complete") finishLoader();
    else window.addEventListener("load", finishLoader, { once: true });
    window.setTimeout(hideLoader, 3200);
  }

  const detailPage = document.querySelector("[data-detail-page]");
  const detailParams = new URLSearchParams(window.location.search);
  if (detailPage && detailParams.get("lang") === "en") {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    document.body.classList.add("english-page");
  }

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
  } : {
    defaultSearchTitle: "اطلاعات پژوهشکده",
    searchResultHint: "مشاهده در همین صفحه",
    searchEmpty: "نتیجه‌ای برای این عبارت پیدا نشد.",
    researchCount: (count) => `${toPersianDigits(count)} حوزه پژوهشی نمایش داده می‌شود.`,
    projectCount: (count) => `${toPersianDigits(count)} پروژه مستند نمایش داده می‌شود.`,
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

  const detailCatalog = {
    about: ["معرفی پژوهشکده شبکه‌های برق", "Electrical Networks Research Institute profile", "پژوهشکده شبکه‌های برق در سال ۱۴۰۰ در دانشگاه شهید بهشتی و دانشکدگان فنی شهید عباسپور فعالیت خود را آغاز نمود.", "The Institute began its activities in 1400 SH at Shahid Beheshti University’s Shahid Abbaspour Technical Campus.", "enri-building.png", "معرفی پژوهشکده", "Institute profile"],
    fields: ["حوزه‌های تخصصی پژوهشکده", "Institute research areas", "هوش مصنوعی و شبکه‌های هوشمند، تجدید ساختار صنعت برق، انرژی‌های تجدیدپذیر، حفاظت و کنترل شبکه و بهره‌برداری و برنامه‌ریزی سیستم‌های قدرت.", "Artificial intelligence and smart grids, power-industry restructuring, renewable energy, grid protection and control, and power-system operation and planning.", "photos/smart-grid-control.webp", "حوزه‌های تخصصی", "Research areas"],
    objectives: ["اهداف کلان پژوهشکده", "Institute objectives", "پژوهش، خدمات فنی و مهندسی، انتقال دانش، حمایت از پژوهش‌های تحصیلات تکمیلی و آموزش تخصصی.", "Research, technical and engineering services, knowledge transfer, postgraduate research support and specialist education.", "photos/power-substation.webp", "جهت‌گیری پژوهشکده", "Institute direction"],
    collaboration: ["همکاری دانشگاه و صنعت", "University–industry collaboration", "مسیرهای همکاری شامل پژوهش مشترک، خدمات فنی و مهندسی، انتقال دانش فنی، حمایت از پایان‌نامه و آموزش تخصصی است.", "Collaboration pathways include joint research, engineering services, technical-knowledge transfer, thesis support and specialist education.", "photos/transmission-lines.webp", "همکاری با پژوهشکده", "Work with the Institute"],
    activities: ["فعالیت‌ها و همکاری‌های پژوهشکده", "Institute activities and collaborations", "انتشارات علمی، آموزش تخصصی، کنفرانس و سمینار، همکاری بین‌المللی و خدمات مهندسی.", "Scientific publishing, specialist education, conferences and seminars, international collaboration and engineering services.", "photos/power-substation.webp", "فعالیت‌ها", "Activities"],
    projects: ["پروژه‌های صنعت برق", "Power-industry projects", "پروژه‌های معرفی‌شده پژوهشکده در زمینه پایش، پایداری، حفاظت، بازار برق، آموزش تخصصی و بهره‌برداری شبکه.", "Documented projects in monitoring, stability, protection, electricity markets, specialist education and grid operation.", "photos/system-operation.webp", "پروژه‌ها", "Projects"],
    people: ["اعضای علمی پژوهشکده", "Academic members", "اعضای علمی معرفی‌شده پژوهشکده شبکه‌های برق دانشگاه شهید بهشتی.", "Academic members introduced by the Electrical Networks Research Institute.", "enri-building.png", "اعضای علمی", "People"],
    contracts: ["قراردادهای مستند پژوهشکده", "Documented Institute contracts", "ارزش قراردادهای مستند معرفی‌شده در اطلاعات پژوهشکده ۲۳٫۲ میلیارد ریال است.", "The documented contract value presented in the Institute information is IRR 23.2 billion.", "photos/transmission-lines.webp", "پروژه‌ها", "Projects"],
    "field-ai": ["هوش مصنوعی و شبکه‌های هوشمند", "Artificial intelligence and smart grids", "یکی از پنج زمینه تخصصی رسمی پژوهشکده شبکه‌های برق.", "One of the Institute’s five official specialist fields.", "photos/smart-grid-control.webp", "حوزه‌های تخصصی", "Research area"],
    "field-market": ["تجدید ساختار در صنعت برق", "Power-industry restructuring", "یکی از پنج زمینه تخصصی رسمی پژوهشکده شبکه‌های برق.", "One of the Institute’s five official specialist fields.", "photos/transmission-lines.webp", "حوزه‌های تخصصی", "Research area"],
    "field-renewable": ["انرژی‌های تجدیدپذیر", "Renewable energy", "یکی از پنج زمینه تخصصی رسمی پژوهشکده شبکه‌های برق.", "One of the Institute’s five official specialist fields.", "photos/renewable-energy.webp", "حوزه‌های تخصصی", "Research area"],
    "field-protection": ["حفاظت و کنترل شبکه‌های برق", "Electrical-network protection and control", "یکی از پنج زمینه تخصصی رسمی پژوهشکده شبکه‌های برق.", "One of the Institute’s five official specialist fields.", "photos/grid-protection.webp", "حوزه‌های تخصصی", "Research area"],
    "field-operation": ["بهره‌برداری و برنامه‌ریزی سیستم‌های قدرت", "Power-system operation and planning", "یکی از پنج زمینه تخصصی رسمی پژوهشکده شبکه‌های برق.", "One of the Institute’s five official specialist fields.", "photos/system-operation.webp", "حوزه‌های تخصصی", "Research area"],
    "service-research": ["پروژه‌های تحقیقاتی صنعت برق", "Power-industry research projects", "همکاری در پروژه‌های تحقیقاتی مرتبط با نیازهای صنعت برق.", "Cooperation on research projects responding to power-industry needs.", "photos/transmission-lines.webp", "پژوهش مشترک", "Joint research"],
    "service-engineering": ["خدمات فنی و مهندسی", "Technical and engineering services", "ارائه خدمات فنی و مهندسی به بخش‌های مختلف صنعت برق.", "Services for different sectors of the power industry.", "photos/grid-protection.webp", "خدمات تخصصی", "Specialist services"],
    "service-transfer": ["بومی‌سازی و انتقال دانش فنی", "Localization and knowledge transfer", "همکاری در انتقال و بومی‌سازی دانش فنی مورد نیاز کشور.", "Transferring and localizing technical knowledge required by the country.", "photos/smart-grid-control.webp", "توسعه فناوری", "Technology development"],
    "service-thesis": ["حمایت از رساله و پایان‌نامه", "Thesis and dissertation support", "جهت‌دهی به پژوهش‌های تحصیلات تکمیلی مفید برای صنعت برق.", "Directing graduate research toward useful power-industry outcomes.", "photos/power-substation.webp", "دانشگاه و صنعت", "University and industry"],
    "service-training": ["آموزش تخصصی", "Specialist education", "تربیت نیروی متخصص و برگزاری آموزش‌های تخصصی کوتاه‌مدت.", "Training skilled personnel and holding short specialist courses.", "enri-building.png", "توسعه مهارت", "Skills development"],
    "activity-journal": ["نشریه علمی پژوهشی", "Scientific-research journal", "نشریه «تحقیقات و فناوری در صنعت برق» برای انتشار تحقیقات مؤثر در صنعت و دانشگاه‌ها.", "The journal ‘Research and Technology in the Power Industry’ publishes relevant industry and university research.", "photos/smart-grid-control.webp", "انتشارات", "Publishing"],
    "activity-market": ["کارگاه‌های بازار برق", "Electricity-market workshops", "کارگاه‌های آموزشی بازار برق برای کارشناسان شرکت‌های توزیع و برق منطقه‌ای.", "Electricity-market workshops for distribution and regional-electricity specialists.", "photos/transmission-lines.webp", "آموزش", "Education"],
    "activity-renewable": ["کنفرانس انرژی‌های تجدیدپذیر", "Renewable-energy conference", "مشارکت در هفتمین کنفرانس بین‌المللی انرژی‌های تجدیدپذیر و تولید پراکنده ایران.", "Participation in Iran’s seventh International Conference on Renewable Energy and Distributed Generation.", "photos/renewable-energy.webp", "کنفرانس", "Conference"],
    "activity-smart-cities": ["سمینار شهرهای هوشمند", "Smart-cities seminar", "سمینار بین‌المللی چالش‌های حمل‌ونقل در شهرهای هوشمند آینده ایران با همکاری دانشگاه صنعتی برلین.", "An international seminar on transportation challenges in Iran’s future smart cities with the Technical University of Berlin.", "enri-building.png", "همکاری بین‌المللی", "International collaboration"],
    "activity-companies": ["همکاری با شرکت‌ها", "Company collaboration", "همکاری‌های آموزشی، پژوهشی و خدمات مهندسی و اجرایی با شرکت‌های صنعت برق.", "Educational, research, engineering and implementation collaboration with power-industry companies.", "photos/power-substation.webp", "صنعت", "Industry"],
    "activity-engineering": ["خدمات فنی و مهندسی", "Technical and engineering services", "تست رلیاژ و بازبینی حفاظت نیروگاه شهید رجایی ساری.", "Relay testing and protection review at Shahid Rajaee Power Plant in Sari.", "photos/grid-protection.webp", "خدمات مهندسی", "Engineering"],
    "project-low-frequency": ["بررسی بهره‌برداری شبکه در فرکانس کاهش‌یافته", "Reduced-frequency grid-operation assessment", "بررسی اثر شرایط فرکانس کاهش‌یافته بر تجهیزات و امنیت سیستم.", "Assessment of reduced-frequency conditions on equipment and system security.", "photos/grid-protection.webp", "پروژه صنعت برق", "Power-industry project"],
    "project-phasor": ["مصورسازی داده‌های فازوری و تحلیل پایداری ولتاژ", "Phasor-data visualization and voltage stability", "مصورسازی داده‌های فازوری، تخمین حالت و تحلیل پایداری ولتاژ برای پایش شبکه انتقال.", "Phasor-data visualization, state estimation and voltage-stability analysis for transmission monitoring.", "photos/smart-grid-control.webp", "پروژه صنعت برق", "Power-industry project"],
    "project-frequency-control": ["کنترل فرکانس ثانویه در بازار برق", "Secondary frequency control in the electricity market", "طراحی سازوکار مشارکت واحدهای نیروگاهی در خدمات جانبی کنترل فرکانس ثانویه.", "A participation mechanism for generating units in secondary frequency-control ancillary services.", "photos/system-operation.webp", "پروژه صنعت برق", "Power-industry project"],
    "project-training": ["آموزش تخصصی بخش انتقال با رویکرد مدیریت دانش", "Specialist transmission education with knowledge management", "بازنگری و تعریف دوره‌های آموزش تخصصی بخش انتقال و طرح و توسعه.", "Reviewing and defining specialist transmission and development courses.", "enri-building.png", "پروژه آموزشی", "Education project"],
    "project-wind": ["نرم‌افزار برنامه‌ریزی تعمیرات توربین‌های بادی", "Wind-turbine maintenance-planning software", "نرم‌افزار برنامه‌ریزی تعمیرات و نگهداری توربین‌های بادی ۲٫۵ مگاواتی مپنا.", "Maintenance-planning software for MAPNA 2.5 MW wind turbines.", "photos/renewable-energy.webp", "پروژه دیگر", "Other project"],
    "project-relay": ["تست رلیاژ نیروگاه شهید رجایی", "Relay testing at Shahid Rajaee Power Plant", "تست رلیاژ و بازبینی حفاظت نیروگاه شهید رجایی ساری.", "Relay testing and protection review at Shahid Rajaee Power Plant in Sari.", "photos/grid-protection.webp", "پروژه دیگر", "Other project"],
    "project-distributed-protection": ["تنظیمات حفاظتی شبکه با منابع تولید پراکنده", "Protection settings with distributed generation", "ارزیابی و تعیین تنظیمات حفاظتی شبکه با نصب منابع تولید پراکنده.", "Assessment of network-protection settings with distributed-generation resources.", "photos/power-substation.webp", "پروژه دیگر", "Other project"],
    "project-losses": ["محاسبه سهم تلفات تجهیزات شبکه توزیع هرمزگان", "Hormozgan distribution-network losses", "بررسی سهم تلفات تجهیزات شبکه توزیع برق هرمزگان با توجه به شرایط محیطی و اندازه‌گیری.", "Measurement-based assessment of equipment losses in the Hormozgan distribution network.", "photos/transmission-lines.webp", "پروژه دیگر", "Other project"],
    "person-ameli": ["دکتر محمدتقی عاملی", "Dr Mohammad-Taghi Ameli", "عضو علمی معرفی‌شده پژوهشکده شبکه‌های برق. ارتباط مستقیم از طریق رایانامه دانشگاهی امکان‌پذیر است.", "Academic member introduced by the Institute. Direct contact is available through the university email address.", "enri-building.png", "عضو علمی", "Academic member"],
    "person-mohammadi": ["دکتر رضا محمدی", "Dr Reza Mohammadi", "عضو علمی معرفی‌شده پژوهشکده شبکه‌های برق.", "Academic member introduced by the Institute.", "enri-building.png", "عضو علمی", "Academic member"],
    "person-saboohi": ["دکتر علیرضا سبوحی", "Dr Alireza Saboohi", "عضو علمی معرفی‌شده پژوهشکده شبکه‌های برق.", "Academic member introduced by the Institute.", "enri-building.png", "عضو علمی", "Academic member"],
    "person-rafiei": ["دکتر منصور رفیعی", "Dr Mansour Rafiei", "عضو علمی معرفی‌شده پژوهشکده شبکه‌های برق.", "Academic member introduced by the Institute.", "enri-building.png", "عضو علمی", "Academic member"],
    "person-rahmati": ["دکتر ایمان رحمتی", "Dr Iman Rahmati", "عضو علمی معرفی‌شده پژوهشکده شبکه‌های برق.", "Academic member introduced by the Institute.", "enri-building.png", "عضو علمی", "Academic member"],
  };

  document.querySelectorAll("[data-detail-id]").forEach((card) => {
    if (!card.hasAttribute("tabindex")) card.tabIndex = 0;
    if (!card.hasAttribute("role")) card.setAttribute("role", "link");
    const openDetail = () => {
      const language = isEnglish ? "&lang=en" : "";
      window.location.href = `detail.html?id=${encodeURIComponent(card.dataset.detailId)}${language}`;
    };
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button, input, summary")) return;
      openDetail();
    });
    card.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !event.target.closest("a, button, input, summary")) {
        event.preventDefault();
        openDetail();
      }
    });
  });

  if (detailPage) {
    const id = detailParams.get("id") || "about";
    const item = detailCatalog[id] || detailCatalog.about;
    const languageIndex = isEnglish ? 1 : 0;
    const summaryIndex = isEnglish ? 3 : 2;
    const sectionIndex = isEnglish ? 6 : 5;
    const title = item[languageIndex];
    const summary = item[summaryIndex];
    const section = item[sectionIndex];
    const image = item[4];
    const setText = (selector, value) => {
      const element = document.querySelector(selector);
      if (element) element.textContent = value;
    };
    setText("[data-detail-title]", title);
    setText("[data-detail-summary]", summary);
    setText("[data-detail-kicker]", section);
    setText("[data-detail-section]", section);
    const detailImage = document.querySelector("[data-detail-image]");
    if (detailImage) {
      detailImage.src = `assets/${image}`;
      detailImage.alt = title;
    }
    const homeUrl = isEnglish ? "en.html" : "index.html";
    document.querySelectorAll("[data-detail-home], [data-detail-back]").forEach((link) => { link.href = homeUrl; });
    if (isEnglish) {
      setText("[data-detail-home]", "Home");
      setText("[data-detail-back]", "Back to the home page");
      setText("[data-detail-contact]", "Contact Dr Ameli");
      setText("[data-detail-label-one]", "Page status");
      setText("[data-detail-value-one]", "Ready for additional information");
      setText("[data-detail-text-one]", "This page provides a dedicated destination for the selected section.");
      setText("[data-detail-label-two]", "Direct contact");
      setText("[data-detail-text-two]", "Email the Institute for additional information, a research proposal or specialist collaboration.");
    }
    document.title = `${title} | ${isEnglish ? "Electrical Networks Research Institute" : "پژوهشکده شبکه‌های برق"}`;
  }

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
