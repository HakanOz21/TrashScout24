// initialize the map on the "map" div with a given center and zoom
var map = L.map("map").setView([52.52, 13.405], 12); // coordinates and zoom level

// create a tile layer to display the map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const fetchLocations = async () => {
  try {
    const response = await fetch("/allLocations");
    if (!response.ok) throw new Error("Error fetching locations");

    const locations = await response.json();

    removeAllMarkers();

    displayLocations(locations);
  } catch (error) {
    console.error("Es gab ein Problem mit der Fetch-Operation:", error);
  }
};

const markerMap = new Map();
const displayLocations = (locations) => {
  const locationList = document.getElementById("locations");
  locationList.innerHTML = "";

  locations.forEach((location) => {
    const locationItem = document.createElement("li");
    locationItem.className = "location-item";
    locationItem.textContent = `${location.street}, ${location.address}, ${location.city}`;

    const dotsIcon = document.createElement("span");
    dotsIcon.className = "dots-icon";
    dotsIcon.textContent = "⋮";
    dotsIcon.addEventListener("click", (event) =>
      toggleOptionsPopup(event, location)
    );

    locationItem.appendChild(dotsIcon);
    locationList.appendChild(locationItem);

    const coords = JSON.parse(location.coordinates);
    // Add a marker for each location
    const marker = L.marker(coords).addTo(map).bindPopup(location.street);
    markerMap.set(location._id, marker);

    locationItem.addEventListener("click", () => {
      map.setView(coords, 16);
      marker.openPopup();
    });
  });
};

window.onload = fetchLocations;

function addLocation() {
  const popup = document.getElementById("locationPopup");
  popup.classList.add("visible");
}

function closePopup() {
  const popup = document.getElementById("locationPopup");
  popup.classList.remove("visible");
  document.getElementById("addLocationForm").reset();
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("addLocationForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      const newLocation = {
        street: document.getElementById("street").value,
        address: document.getElementById("address").value,
        city: document.getElementById("city").value,
        description: document.getElementById("description").value,
        coordinates: document.getElementById("coordinates").value,
      };

      console.log("Submitting new location:", newLocation);

      try {
        const response = await fetch("/addLocation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newLocation),
        });

        console.log("Response status:", response.status);

        if (!response.ok) throw new Error("Error adding location");

        const addedLocation = await response.json();
        console.log("Added location:", addedLocation);
        displayLocations([addedLocation]);
        fetchLocations();
        closePopup();
      } catch (error) {
        console.error("Error adding location:", error);
        alert(`Error adding location: ${error.message}`);
      }
    });
});

const toggleOptionsPopup = (event, location) => {
  event.stopPropagation();

  document
    .querySelectorAll(".options-popup")
    .forEach((popup) => popup.remove());

  const popup = document.createElement("div");
  popup.className = "options-popup";

  // Create delete and update options
  const deleteOption = document.createElement("div");
  deleteOption.className = "popup-option";
  deleteOption.textContent = "Delete";
  deleteOption.addEventListener("click", (e) => {
    e.stopPropagation();
    handleDelete(location);
    popup.remove();
  });

  const updateOption = document.createElement("div");
  updateOption.className = "popup-option";
  updateOption.textContent = "Update";
  updateOption.addEventListener("click", (e) => {
    e.stopPropagation();
    openUpdatePopup(location);
    popup.remove();
  });

  // Append options to the popup
  popup.appendChild(deleteOption);
  popup.appendChild(updateOption);

  const iconRect = event.target.getBoundingClientRect();
  popup.style.position = "absolute";
  popup.style.top = `${iconRect.top - 50 + window.scrollY}px`;
  popup.style.left = `${iconRect.left - 20 + window.scrollX}px`;

  // Append the popup to the body
  document.body.appendChild(popup);

  // Close the popup when clicking outside
  document.addEventListener("click", () => popup.remove(), { once: true });
};

const removeAllMarkers = () => {
  markerMap.forEach((marker) => {
    marker.remove(); // Marker von der Karte entfernen
  });
  markerMap.clear(); // markerMap leeren
};

const handleDelete = async (location) => {
  console.log("Deleting location:", location._id);
  try {
    const response = await fetch(`/deleteLocation/${location._id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      console.log("Location deleted successfully");

      // Remove marker from map and markerMap
      const marker = markerMap.get(location._id);
      if (marker) {
        marker.remove(); // Remove from the map
        markerMap.delete(location._id); // Remove from the markerMap
      }

      const locationItem = document.querySelector(`#location-${location._id}`);
      if (locationItem) locationItem.remove(); // Remove from the list

      map.invalidateSize();

      fetchLocations();
    } else {
      console.error("Error deleting location:", response.statusText);
      alert("Error deleting location");
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
};

let currentLocationId = null; // Store the location ID being updated

const openUpdatePopup = (location) => {
  currentLocationId = location._id; // Set the current location ID for the update
  document.getElementById("updateStreet").value = location.street;
  document.getElementById("updateAddress").value = location.address;
  document.getElementById("updateCity").value = location.city;
  document.getElementById("updateDescription").value = location.description;
  document.getElementById("updateCoordinates").value = location.coordinates;

  document.getElementById("updatePopup").style.display = "block"; // Show the popup
};

const closeUpdatePopup = () => {
  document.getElementById("updatePopup").style.display = "none";
};

const handleUpdate = async (event) => {
  event.preventDefault(); // Verhindere die Standardformularübermittlung

  const updatedLocation = {
    street: document.getElementById("updateStreet").value,
    address: document.getElementById("updateAddress").value,
    city: document.getElementById("updateCity").value,
    description: document.getElementById("updateDescription").value,
    coordinates: document.getElementById("updateCoordinates").value,
  };

  try {
    const response = await fetch(`/updateLocation/${currentLocationId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedLocation),
    });

    if (response.ok) {
      console.log("Location updated successfully");
      // Update marker on the map immediately
      const marker = markerMap.get(currentLocationId);
      if (marker) {
        const coords = JSON.parse(updatedLocation.coordinates);
        marker.setLatLng(coords).bindPopup(updatedLocation.street).openPopup();
      }
      closeUpdatePopup();
      fetchLocations();
    } else {
      console.error("Error updating location:", response.statusText);
      alert("Error updating location");
    }
  } catch (error) {
    console.error("Error updating location:", error);
    alert(`Error updating location: ${error.message}`);
  }
};

// Warte, bis das DOM vollständig geladen ist, bevor du Event-Listener hinzufügst
document.addEventListener("DOMContentLoaded", () => {
  const updateLocationForm = document.getElementById("updateLocationForm");
  if (updateLocationForm) {
    updateLocationForm.addEventListener("submit", handleUpdate);
  } else {
    console.error("Update-Formular nicht im DOM gefunden");
  }
});
