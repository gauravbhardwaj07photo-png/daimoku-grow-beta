const CACHE_NAME = 'daimoku-grow-v31';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './plant.js',
  './app.js',
  './manifest.json',
  './sounds/gong.mp3',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS.map((asset) => {
          return cache.add(asset).catch((err) => {
            console.warn(`Failed to cache asset: ${asset}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Skip cross-origin schemes (e.g. chrome-extension)
  if (!e.request.url.startsWith(self.location.origin) && !e.request.url.startsWith('https://cdnjs.cloudflare.com')) {
    return;
  }
  
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return res;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});

// Listen for messages from the app to show notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Try to open/focus the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('./index.html');
    })
  );
});

// Check decay and show background notifications
async function checkDecayAndShowNotification() {
  try {
    const cache = await caches.open('daimoku-state-cache');
    const response = await cache.match('/notifications-state.json');
    if (!response) return;
    
    const data = await response.json();
    const lastChanted = new Date(data.lastChantedDate);
    const now = new Date();
    const diffMs = now - lastChanted;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // 1. Check Decay notifications
    let title = "";
    let message = "";
    let tag = "";
    
    if (diffHours >= 720) { // 30 days
      title = "A dormant seed awaits you...";
      message = "One month has passed. I am completely withered, but my roots remember your voice. 🌱";
      tag = "decay-30d";
    } else if (diffHours >= 360) { // 15 days
      title = "Save my life!";
      message = "15 days of silence. I have withered away. Let's bring this garden back! ❤️";
      tag = "decay-15d";
    } else if (diffHours >= 168) { // 7 days
      title = "I am about to die...";
      message = "A whole week without Daimoku! I am drying up. Please water me with your chanting! 🥀";
      tag = "decay-7d";
    } else if (diffHours >= 72) { // 72 hours
      title = "Oh no! I am weakening...";
      message = "It has been 72 hours. I am beginning to droop. Let's chant together and restore my vitality! 💧";
      tag = "decay-72h";
    } else if (diffHours >= 24) { // 24 hours
      title = "Water me, please!";
      message = "It has been 24 hours. My leaves are getting thirsty. I miss the sound of your Daimoku! 🌿";
      tag = "decay-24h";
    }
    
    if (title && message) {
      // Check if we already showed this tag recently or if it was dismissed in state
      const isDismissed = data.dismissedAlerts && data.dismissedAlerts.includes(tag);
      if (!isDismissed) {
        await self.registration.showNotification(title, {
          body: message,
          icon: "icons/icon-192.png",
          vibrate: [300, 100, 300],
          tag: tag,
          renotify: true
        });
      }
    }
    
    // 2. Check Daily Reminders
    const hours = now.getHours();
    const dateTodayStr = now.toISOString().split('T')[0];
    
    if (data.settings && data.settings.morningReminder && hours >= 12 && hours < 21) {
      const chantedToday = data.sessions && data.sessions.some(s => s.date.split('T')[0] === dateTodayStr);
      if (!chantedToday) {
        await self.registration.showNotification("Morning Chant Reminder", {
          body: "It's past 12:00 PM! Don't forget to water your plant with morning chanting. 🌸",
          icon: "icons/icon-192.png",
          vibrate: [300, 100, 300],
          tag: `morning-reminder-${dateTodayStr}`,
          renotify: true
        });
      }
    } else if (data.settings && data.settings.eveningReminder && hours >= 21) {
      const chantedSinceNoon = data.sessions && data.sessions.some(s => {
        const sDate = new Date(s.date);
        return sDate.toISOString().split('T')[0] === dateTodayStr && sDate.getHours() >= 12;
      });
      if (!chantedSinceNoon) {
        await self.registration.showNotification("Evening Chant Reminder", {
          body: "It's evening! Water your plant with evening chanting to keep it healthy. 🌙",
          icon: "icons/icon-192.png",
          vibrate: [300, 100, 300],
          tag: `evening-reminder-${dateTodayStr}`,
          renotify: true
        });
      }
    }

    // 3. Check Calendar Event Reminders (Eve of meeting at 7:00 PM / 19:00 onwards)
    if (hours >= 19 && data.calendarActivities) {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const event = data.calendarActivities[tomorrowStr];
      if (event && event.type === 'meeting') {
        const tag = `event-reminder-${tomorrowStr}`;
        const isDismissed = data.dismissedAlerts && data.dismissedAlerts.includes(tag);
        if (!isDismissed) {
          await self.registration.showNotification(`Meeting Reminder: ${event.title}`, {
            body: `Reminder: You have a scheduled ${event.title} tomorrow! 📅`,
            icon: "icons/icon-192.png",
            vibrate: [300, 100, 300],
            tag: tag,
            renotify: true
          });
        }
      }
    }
  } catch (e) {
    console.error("Error checking decay in service worker:", e);
  }
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-decay-and-reminders') {
    event.waitUntil(checkDecayAndShowNotification());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'check-decay-and-reminders-sync') {
    event.waitUntil(checkDecayAndShowNotification());
  }
});
