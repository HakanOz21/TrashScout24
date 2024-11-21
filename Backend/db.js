const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://127.0.0.1:27017";

const connectDB = async () => {
  try {
    const client = await MongoClient.connect(url);
    return client; // It gives us the client object to use the database
  } catch (error) {
    console.error("Error during connection process:", error.message);
    throw error;
  }
};

module.exports = connectDB;
