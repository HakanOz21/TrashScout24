const express = require("express");
const app = express();
const connectDB = require("./db");
const path = require("path");
const { log } = require("console");
const { ObjectId } = require("mongodb");

// Middleware to get static files like HTML
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Route to get all locations from the database
app.get("/allLocations", async (req, res) => {
  try {
    const client = await connectDB(); // to get the client object
    const db = client.db("WebLocations");

    const locations = await db.collection("locations").find({}).toArray();

    res.status(200).send(locations);
    client.close(); // close the connection
  } catch (err) {
    console.error(err);
    res.status(500).send("Serverfehler");
  }
});

app.post("/addLocation", async (req, res) => {
  const newLocation = req.body;
  try {
    const client = await connectDB();
    const db = client.db("WebLocations");

    const locationObj = {
      street: newLocation.street,
      address: newLocation.address,
      city: newLocation.city,
      description: newLocation.description,
      coordinates: newLocation.coordinates,
    };

    console.log("Neuer Standort:", locationObj);
    await db.collection("locations").insertOne(locationObj);
    res.status(200).send(locationObj);
    client.close();
  } catch (error) {
    res.status(500).send("Fehler beim Hinzufügen des Standorts");
  }
});

app.delete("/deleteLocation/:id", async (req, res) => {
  const locationId = req.params.id;
  try {
    const client = await connectDB();
    const db = client.db("WebLocations");

    // Convert the locationId to an ObjectId for the query
    const result = await db
      .collection("locations")
      .deleteOne({ _id: new ObjectId(locationId) });

    if (result.deletedCount === 1) {
      res.status(200).send({ message: "Location successfully deleted" });
    } else {
      res.status(404).send({ message: "Location not found" });
    }

    client.close();
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).send("Error deleting location");
  }
});

app.put("/updateLocation/:id", async (req, res) => {
  const locationId = req.params.id;
  const updatedData = req.body;

  try {
    const client = await connectDB();
    const db = client.db("WebLocations");

    const result = await db
      .collection("locations")
      .updateOne({ _id: new ObjectId(locationId) }, { $set: updatedData });

    if (result.modifiedCount === 1) {
      res.status(200).send({ message: "Location successfully updated" });
    } else {
      res.status(404).send({ message: "Location not found" });
    }

    client.close();
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).send("Error updating location");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
