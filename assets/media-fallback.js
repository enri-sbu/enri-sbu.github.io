(() => {
  document.querySelectorAll('[data-source-image]').forEach(image => {
    const figure = image.closest('.source-media');
    const fallback = () => {
      image.hidden = true;
      if (image.parentElement?.tagName === 'A') image.parentElement.hidden = true;
      figure?.classList.add('is-unavailable');
      const status = figure?.querySelector('.source-image-error');
      if (status) status.hidden = false;
    };
    image.addEventListener('error', fallback, { once: true });
    if (image.complete && image.naturalWidth === 0) fallback();
  });
})();
