/* ---------- Analytics: Google Analytics 4 ----------
   It doesn't run on localhost or previews, and it loads only after the page has finished and gone idle, so it never slows the castle down.
   (CausalFunnel, my own click tracker, is loaded separately in the HTML.) */
(() => {
  const GA4 = 'G-2DYT0EG502';
  const LIVE = ['sakshamagrawal.me', 'www.sakshamagrawal.me', 'devsaksham.github.io'];
  if (!LIVE.includes(location.hostname)) return;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === '1') return; // visitors who asked not to be tracked

  const add = src => document.head.append(Object.assign(document.createElement('script'), { src, async: true }));
  const pendingEvents = [];
  function track(name, params = {}) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
    else pendingEvents.push([name, params]);
  }

  // Custom portfolio events. Enhanced Measurement handles standard page views and outbound clicks.
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (!target) return;

    const dossier = target.closest('[data-dossier]');
    if (dossier) {
      track('project_view', {
        project_id: dossier.getAttribute('data-dossier')?.replace(/^d-/, '') || 'unknown',
        interaction_type: 'daily_prophet_open'
      });
    }

    if (target.closest('[data-send-owl]')) track('contact_click', { contact_method: 'owl_form' });

    const link = target.closest('a[href]');
    if (!link) return;

    const href = link.href;
    let url;
    try { url = new URL(href, location.href); } catch { return; }
    const linkText = (link.innerText || link.getAttribute('aria-label') || '').trim().slice(0, 100);

    if (url.protocol === 'mailto:') {
      track('contact_click', { contact_method: 'email', link_text: linkText });
    } else if ((url.hostname === 'drive.google.com' || url.hostname.endsWith('.drive.google.com')) && /resume/i.test(linkText)) {
      track('resume_download', { link_url: url.href, link_text: linkText });
    } else if (url.hostname === 'github.com' || url.hostname.endsWith('.github.com')) {
      track('github_click', { link_url: url.href, link_text: linkText });
    } else if (url.hostname === 'linkedin.com' || url.hostname.endsWith('.linkedin.com')) {
      track('linkedin_click', { link_url: url.href, link_text: linkText });
    } else if (url.origin !== location.origin && url.protocol.startsWith('http')) {
      track('external_project_click', { link_url: url.href, link_domain: url.hostname, link_text: linkText });
    }
  });

  function start() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA4);
    pendingEvents.splice(0).forEach(([name, params]) => gtag('event', name, params));
    add('https://www.googletagmanager.com/gtag/js?id=' + GA4);
  }
  const idle = () => (window.requestIdleCallback ? requestIdleCallback(start, { timeout: 4000 }) : setTimeout(start, 1500));
  if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
})();
