// Push Notifications and PWA Utility

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      console.log('Tracktainer Service Worker registered:', reg.scope);
      return reg;
    } catch (err) {
      console.warn('Service Worker registration failed:', err);
    }
  }
  return null;
};

export const getNotificationPermission = () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'unsupported';
  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      sendShipmentNotification('Tracktainer Notifications Active', {
        body: 'You will receive real-time alerts whenever shipment status, ETA, or delays update.',
      });
    }
    return perm;
  } catch (err) {
    console.warn('Notification permission error:', err);
    return 'denied';
  }
};

// Subtle Web Audio chime for instant mobile audio feedback
export const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
};

// Send Push Notification
export const sendShipmentNotification = async (title, options = {}) => {
  playNotificationChime();

  const body = options.body || 'Shipment status updated.';
  const icon = './icon-192.png';
  const tag = options.tag || 'shipment-alert-' + Date.now();

  // 1. Try Service Worker showNotification (works in background & PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body: body,
          icon: icon,
          badge: './favicon.svg',
          vibrate: [120, 80, 120],
          tag: tag,
          data: { url: window.location.href },
        });
        return true;
      }
    } catch (e) {}
  }

  // 2. Fallback to standard Window Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body,
        icon: icon,
        tag: tag,
      });
      return true;
    } catch (e) {}
  }

  return false;
};
