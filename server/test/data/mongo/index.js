const dotenv = require("dotenv").config({ path: __dirname + "/../../../.env" });
const MongoDBManager = require("../../../db/mongo/index.js");

const mongoManager = new MongoDBManager();

mongoManager.connection
  .then(() => {
    return mongoManager.resetDB();
  })
  .catch((e) => {
    console.error("Error:", e.message);
  });