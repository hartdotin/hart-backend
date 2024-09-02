const serviceAccount = require("../realeted-firebase-admin.json");
var admin = require("firebase-admin");
// function to send notification
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async (token, title, body) => {
  const notificationPayload = {
    notification: {
      title: title,
      body: body,
    },
    android: {
      priority: "high", // Ensures the notification pops up immediately
      notification: {
        channel_id: "default", // Ensure the channel ID matches the one created in the app
        priority: "high", // Ensures the notification pops up immediately
        icon: "ic_notification", // This should match your icon name
        color: "#F1DEAC",
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: title,
            body: body,
          },
          sound: "default", // Ensures sound plays for iOS
        },
      },
    },

    token: token,
  };

  try {
    const response = await admin.messaging().send(notificationPayload);
    console.log("Notification sent:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

module.exports = {
  sendNotification,
};
