const PostgresManager = require("../../../db/postgre/index.js");

const postgresManager = new PostgresManager();

postgresManager.connection
  .then(() => {
    return postgresManager.resetDB();
  })
  .catch((e) => {
    console.error("Error:", e.message);
  });