importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB4QHJUX4lGaB208gYa5LpvJ4i-dzYObf0",
  authDomain: "shaikhaabed-103c6.firebaseapp.com",
  projectId: "shaikhaabed-103c6",
  messagingSenderId: "595755962068",
  appId: "1:595755962068:web:205fe2507e07a996b4b541",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "New Notification";
  const body = payload.notification?.body || "";

  self.registration.showNotification(title, {
    body,
    icon: "/logo192.png",
      requireInteraction: true,   // ✅ important
    data: payload.data || {}, // ✅ store backend data
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const token = data.autoLoginToken || "";
  const type = data.type || "CREATE_TASK";

  const url = token
    ? `/auto-login?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`
    : `/auto-login?type=${encodeURIComponent(type)}`;

  event.waitUntil(clients.openWindow(url));
});
