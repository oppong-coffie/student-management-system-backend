// firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("../credentials-firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "your-bucket-name.appspot.com",
});

const bucket = admin.storage().bucket();
module.exports = bucket;
