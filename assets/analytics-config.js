/* Cloudflare Web Analytics: anonymisierte Besuche, keine Logins. */
window.LERNSAFARI_CF_BEACON_TOKEN = "7dc96a68bcb04c199df5d58a65d0933c";
if (window.LERNSAFARI_CF_BEACON_TOKEN && !document.querySelector('script[data-cf-beacon]')) {
  const beacon = document.createElement('script');
  beacon.type = 'module';
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.setAttribute('data-cf-beacon', JSON.stringify({token:window.LERNSAFARI_CF_BEACON_TOKEN}));
  document.head.appendChild(beacon);
}
