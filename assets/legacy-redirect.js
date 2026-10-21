(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const requestedPage = params.get('id') || 'about';
  const languagePrefix = params.get('lang') === 'en' ? 'en-' : '';

  const supportedPages = new Set([
    'about', 'fields', 'objectives', 'collaboration', 'activities', 'projects',
    'field-ai', 'field-market', 'field-renewable', 'field-protection', 'field-operation',
    'service-research', 'service-engineering', 'service-transfer', 'service-thesis', 'service-training',
    'activity-journal', 'activity-market', 'activity-renewable', 'activity-smart-cities',
    'activity-companies', 'activity-engineering', 'project-low-frequency', 'project-phasor',
    'project-frequency-control', 'project-training', 'project-wind', 'project-relay',
    'project-distributed-protection', 'project-losses', 'contact', 'faq', 'people',
    'news-economics', 'news-dispatch', 'news-ev-germany', 'news-ev-sustainable',
    'news-education', 'news-transport', 'news-workshop', 'archive', 'archive-event',
    'archive-ann', 'resources', 'quick-links', 'boss', 'history', 'goals', 'chart',
    'research', 'research-groups', 'newsletter', 'login', 'institute-contact'
  ]);

  const destination = supportedPages.has(requestedPage)
    ? `${languagePrefix}${requestedPage}.html`
    : '404.html';

  window.location.replace(destination);
})();
