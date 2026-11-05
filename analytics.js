/* ---------- Analytics: Google Analytics 4 ----------
   It doesn't run on localhost or previews, and it loads only after the page has finished and gone idle, so it never slows the castle down.
   (CausalFunnel, my own click tracker, is loaded separately in the HTML.) */
(() => {
  const GA4 = 'G-LL0V19D2WF';
  const LIVE = ['devsaksham.github.io']; // add your own domain here when the site moves to it
  if (!LIVE.includes(location.hostname)) return;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === '1') return; // visitors who asked not to be tracked

  const add = src => document.head.append(Object.assign(document.createElement('script'), { src, async: true }));
  function start() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA4);
    add('https://www.googletagmanager.com/gtag/js?id=' + GA4);
  }
  const idle = () => (window.requestIdleCallback ? requestIdleCallback(start, { timeout: 4000 }) : setTimeout(start, 1500));
  if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
})();
