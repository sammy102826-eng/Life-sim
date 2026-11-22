const offlineSupported = window.isSecureContext && 'serviceWorker' in navigator;
const offlineStandalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
let offlineStatus = 'Downloading the game for offline play…';
let offlineInstallPrompt = null;
let offlineRegistration = null;
let offlineReloadPending = false;
let offlineController = offlineSupported ? navigator.serviceWorker.controller : null;
let offlineBuild = '';
let offlineUpdateMessage = '';

function offlineUpdateView() {
  if (!offlineSupported) return '';
  return `<section class="card" aria-label="Game updates">
    <p id="offline-status" role="status">${offlineStatus}</p>
    <p class="d" id="offline-build" ${offlineBuild ? '' : 'hidden'}>${offlineBuild}</p>
    <p class="d" id="offline-update-message" role="status" ${offlineUpdateMessage ? '' : 'hidden'}>${offlineUpdateMessage}</p>
    <button class="b" onclick="offlineCheckUpdate()">Check for game updates</button>
    <button class="b" id="offline-apply" onclick="offlineApplyUpdate()" ${scr === 'title' && offlineRegistration?.waiting ? '' : 'hidden'}>Install update and reload</button>
  </section>`;
}

function offlineInstallView() {
  if (!offlineSupported) return '';
  return offlineUpdateView() + (offlineStandalone ? '' : `<section class="card"><button class="b big" id="offline-install" onclick="offlineInstall()" ${offlineInstallPrompt ? '' : 'hidden'}>Install Born to Run</button>
    <details><summary>Install on your phone</summary>
      <p><b>iPhone</b> · In Safari, choose Share, then Add to Home Screen. Turn on Open as Web App if it appears.</p>
      <p><b>Android</b> · In Chrome, tap Install Born to Run above, or choose Add to Home screen or Install app from the menu.</p>
      <p>Open the game from its icon while you’re online and wait for “Ready to play offline.”</p>
    </details>
  </section>`);
}

function offlineRefresh() {
  const status = document.getElementById('offline-status');
  if (status) status.textContent = offlineStatus;
  const build = document.getElementById('offline-build');
  if (build) {build.hidden = !offlineBuild;build.textContent = offlineBuild;}
  const message = document.getElementById('offline-update-message');
  if (message) {message.hidden = !offlineUpdateMessage;message.textContent = offlineUpdateMessage;}
  const apply = document.getElementById('offline-apply');
  if (apply) apply.hidden = !offlineRegistration?.waiting || scr !== 'title';
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

function offlineShowUpdate() {
  if (!offlineRegistration?.waiting || !navigator.serviceWorker.controller) return;
  offlineUpdateMessage = scr === 'title' ? 'An update is ready to install.' :
    'An update is ready. Save your game and return to the title screen to install it.';
  offlineRefresh();
}

async function offlineCheckUpdate() {
  if (!offlineSupported || !offlineRegistration) return;
  offlineUpdateMessage = 'Checking for an update…';
  offlineRefresh();
  try {
    await offlineRegistration.update();
    if (offlineRegistration.waiting) return offlineShowUpdate();
    offlineUpdateMessage = offlineRegistration.installing ? 'Downloading the update…' : 'The downloaded build is up to date.';
  } catch {
    offlineUpdateMessage = 'An update check needs a connection. Your downloaded game is still available.';
  }
  offlineRefresh();
}

function offlineApplyUpdate() {
  const worker = offlineRegistration?.waiting;
  if (scr !== 'title' || !worker) return;
  offlineReloadPending = true;
  offlineUpdateMessage = 'Installing the update…';
  offlineRefresh();
  worker.postMessage('activate-release');
}

if (offlineSupported) {
  const workers = navigator.serviceWorker;
  function offlineReady() {
    if (!workers.controller) return;
    offlineStatus = 'Ready to play offline.';
    offlineRefresh();
    const channel = new MessageChannel();
    const replyTimeout = setTimeout(() => channel.port1.close(), 4000);
    channel.port1.onmessage = event => {
      clearTimeout(replyTimeout);
      if (typeof event.data === 'string' && /^[a-f0-9]{20}$/.test(event.data)){
        offlineBuild = 'Downloaded build ' + event.data.slice(0, 12);
        offlineRefresh();
      }
      channel.port1.close();
    };
    workers.controller.postMessage('release-version', [channel.port2]);
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

  workers.addEventListener('controllerchange', () => {
    if (offlineReloadPending) return location.reload();
    if (offlineController && workers.controller !== offlineController) {
      offlineUpdateMessage = 'An update was installed. Save before reopening the game to use it.';
    }
    offlineController = workers.controller;
    offlineReady();
  });
  offlineReady();
  workers.register('./offline-worker.js', {updateViaCache: 'none'}).then(registration => {
    offlineRegistration = registration;
    const watchInstall = () => {
      const worker = registration.installing;
      if (!worker) return;
      const check = () => {
        if (worker.state === 'installed') offlineShowUpdate();
        if (worker.state === 'redundant') {
          if (!workers.controller) offlineStatus = 'Offline download did not finish. Reload while online to try again.';
          else offlineUpdateMessage = 'The update did not finish downloading. Try again when online.';
          offlineRefresh();
        }
      };
      worker.addEventListener('statechange', check);
      check();
    };
    registration.addEventListener('updatefound', watchInstall);
    watchInstall();
    offlineShowUpdate();
    if (workers.controller && !registration.waiting) registration.update().catch(() => {});
  }).catch(() => {
    if (workers.controller) return;
    offlineStatus = 'Offline download is unavailable. Reload while online to try again.';
    offlineRefresh();
  });
}
