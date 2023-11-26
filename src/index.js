const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");

// "mongodb://127.0.0.1:27017/database-name ";
const options = config.mongoose.options;
const MONGODB_URI = config.mongoose.url;
mongoose
  .connect(MONGODB_URI, options)
  .then(() => console.log("connected to Database :D"));

app.listen(config.port, () => {
  console.log(`express server listening on ${config.port}`);
});

// let server;
