const fs = require("fs");
const fileBuffer = fs.readFileSync("./firebaseAdminSDK.json");
const base64 = fileBuffer.toString("base64");
console.log(base64);
