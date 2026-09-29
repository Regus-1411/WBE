import { useState, useEffect } from "react";
import {
  subscribeInstallPrompt,
  subscribeNetworkStatus,
  promptPWAInstall,
  isStandalonePWA,
  requestNotificationPermission,
} from "../services/pwa";
import "./PWAInstallBanner.css";

export function PWAInstallBanner() {
  const [canInstall, setCanInstall] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    if (sessionStorage.getItem("drop_pwa_dismissed") === "true") {
      setDismissed(true);
    }

    const unsubInstall = subscribeInstallPrompt((ready) => {
      setCanInstall(ready && !isStandalonePWA());
    });

    const unsubNetwork = subscribeNetworkStatus((online) => {
      setIsOnline(online);
    });

    return () => {
      unsubInstall();
      unsubNetwork();
    };
  }, []);

  const handleInstallClick = async () => {
    const res = await promptPWAInstall();
    if (res.outcome === "accepted") {
      setInstalledSuccess(true);
      setCanInstall(false);
      setTimeout(() => setInstalledSuccess(false), 5000);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("drop_pwa_dismissed", "true");
  };

  return (
    <>
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="pwa-offline-bar">
          <div className="pwa-offline-content">
            <span className="pwa-offline-pulse"></span>
            <span>📡 <strong>Offline Mode:</strong> Viewing cached water telemetry & local database. Network sync will resume automatically once connected.</span>
          </div>
        </div>
      )}

      {/* Installed Success Toast */}
      {installedSuccess && (
        <div className="pwa-installed-toast">
          <span>🎉 <strong>DROP App Installed!</strong> Launch from your home screen or desktop anytime.</span>
        </div>
      )}

      {/* In-App Floating Install Banner */}
      {canInstall && !dismissed && (
        <div className="pwa-install-banner">
          <div className="pwa-install-banner__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <div className="pwa-install-banner__text">
            <div className="pwa-install-banner__title">Install DROP Web App</div>
            <div className="pwa-install-banner__desc">
              Get instant offline access, fast desktop launch, and real-time leakage alerts.
            </div>
          </div>
          <div className="pwa-install-banner__actions">
            <button className="btn-pwa-install" onClick={handleInstallClick}>
              📲 Install App
            </button>
            <button className="btn-pwa-dismiss" onClick={handleDismiss} title="Dismiss">
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default PWAInstallBanner;
