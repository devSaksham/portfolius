/* ---------- Analytics: Google Analytics 4 and Microsoft Clarity ----------
   Paste the IDs below; an empty one simply isn't loaded. Neither runs on localhost or previews,
   and both load only after the page has finished and gone idle, so they never slow the castle down.
   (CausalFunnel, my own click tracker, is loaded separately in the HTML.) */
(() => {
  const IDS = {
    ga4: '',     // Google Analytics 4 measurement ID, like 'G-AB12CD34EF'
    clarity: '', // Microsoft Clarity project ID, like 'abcd1234ef'
  };
  const LIVE = ['devsaksham.github.io']; // add your own domain here when the site moves to it
  if (!LIVE.includes(location.hostname)) return;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === '1') return; // visitors who asked not to be tracked

  const add = src => document.head.append(Object.assign(document.createElement('script'), { src, async: true }));
  function start() {
    if (IDS.ga4) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date());
      gtag('config', IDS.ga4);
      add('https://www.googletagmanager.com/gtag/js?id=' + IDS.ga4);
    }
    if (IDS.clarity) {
      window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
      add('https://www.clarity.ms/tag/' + IDS.clarity);
    }
  }
  const idle = () => (window.requestIdleCallback ? requestIdleCallback(start, { timeout: 4000 }) : setTimeout(start, 1500));
  if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
})();
