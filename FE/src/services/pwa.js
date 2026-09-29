// DROP PWA Service Worker & Install Management Engine

let deferredInstallPrompt = null;
const installListeners = new Set();
const networkListeners = new Set();

/**
 * Register Service Worker
 */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("🚀 [PWA] Service Worker registered successfully, scope:", reg.scope);

        // Check for updates
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("🔄 [PWA] New version available! Reloading or ready to update.");
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn("⚠️ [PWA] Service Worker registration failed:", err);
      });
  });

  // Listen for BeforeInstallPrompt event (Android, Chrome, Edge)
  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent standard automatic mini-infobar
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log("📲 [PWA] Install prompt captured and ready for custom trigger.");
    notifyInstallListeners(true);
  });

  // Listen for successful installation
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    console.log("🎉 [PWA] DROP App installed successfully to home screen/desktop!");
    notifyInstallListeners(false);
  });

  // Network online/offline listeners
  window.addEventListener("online", () => notifyNetworkListeners(true));
  window.addEventListener("offline", () => notifyNetworkListeners(false));
}

/**
 * Trigger PWA Install Prompt
 */
export async function promptPWAInstall() {
  if (!deferredInstallPrompt) {
    // If standalone or already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return { outcome: "already_installed" };
    }
    return { outcome: "not_supported" };
  }

  try {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    console.log("📲 [PWA] User choice outcome:", outcome);
    deferredInstallPrompt = null;
    notifyInstallListeners(false);
    return { outcome };
  } catch (err) {
    console.error("[PWA] Error during prompt:", err);
    return { outcome: "error", error: err.message };
  }
}

/**
 * Check if app is currently running in standalone PWA mode
 */
export function isStandalonePWA() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
  );
}

/**
 * Check if app is installable right now
 */
export function isPWAInstallable() {
  return !!deferredInstallPrompt;
}

/**
 * Request Notification Permissions
 */
export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// ── LISTENERS SUBSCRIPTIONS ──
export function subscribeInstallPrompt(callback) {
  installListeners.add(callback);
  callback(!!deferredInstallPrompt);
  return () => installListeners.delete(callback);
}

function notifyInstallListeners(isReady) {
  installListeners.forEach((fn) => {
    try {
      fn(isReady);
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeNetworkStatus(callback) {
  networkListeners.add(callback);
  callback(navigator.onLine);
  return () => networkListeners.delete(callback);
}

function notifyNetworkListeners(isOnline) {
  networkListeners.forEach((fn) => {
    try {
      fn(isOnline);
    } catch (e) {
      console.error(e);
    }
  });
}
