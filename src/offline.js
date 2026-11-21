const offlineSupported = window.isSecureContext && 'serviceWorker' in navigator;
const offlineStandalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
let offlineStatus = 'Downloading the game for offline play…';
let offlineInstallPrompt = null;

function offlineInstallView() {
  if (!offlineSupported) return '';
  return `<section class="card">
    <p id="offline-status" role="status">${offlineStatus}</p>
    ${offlineStandalone ? '' : `<button class="b big" id="offline-install" onclick="offlineInstall()" ${offlineInstallPrompt ? '' : 'hidden'}>Install Born to Run</button>
    <details><summary>Install on your phone</summary>
      <p><b>iPhone</b> · In Safari, choose Share, then Add to Home Screen. Turn on Open as Web App if it appears.</p>
      <p><b>Android</b> · In Chrome, tap Install Born to Run above, or choose Add to Home screen or Install app from the menu.</p>
      <p>Open the game from its icon while you’re online and wait for “Ready to play offline.”</p>
    </details>`}
  </section>`;
}

function offlineRefresh() {
  const status = document.getElementById('offline-status');
  if (status) status.textContent = offlineStatus;
  const install = document.getElementById('offline-install');
  if (install) install.hidden = !offlineInstallPrompt;
}

async function offlineInstall() {
  if (!offlineInstallPrompt) return;
  const prompt = offlineInstallPrompt;
  offlineInstallPrompt = null;
  offlineRefresh();
  await prompt.prompt().catch(() => {});
}

if (offlineSupported) {
  const workers = navigator.serviceWorker;
  function offlineReady() {
    if (!workers.controller) return;
    offlineStatus = 'Ready to play offline.';
    offlineRefresh();
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    offlineInstallPrompt = event;
    offlineRefresh();
  });
  window.addEventListener('appinstalled', () => {
    offlineInstallPrompt = null;
    offlineRefresh();
  });

  workers.addEventListener('controllerchange', offlineReady);
  offlineReady();
  workers.register('./offline-worker.js', {updateViaCache: 'none'}).then(registration => {
    const worker = registration.installing;
    if (!worker) return;
    function checkInstall() {
      if (worker.state === 'redundant' && !workers.controller) {
        offlineStatus = 'Offline download did not finish. Reload while online to try again.';
        offlineRefresh();
      }
    }
    worker.addEventListener('statechange', checkInstall);
    checkInstall();
  }).catch(() => {
    if (workers.controller) return;
    offlineStatus = 'Offline download is unavailable. Reload while online to try again.';
    offlineRefresh();
  });
}
