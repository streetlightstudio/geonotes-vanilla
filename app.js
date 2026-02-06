console.log("Script loaded");

// Store in array
const landmarks = [];

// DOM Elements
const imageInput = document.getElementById("imageUpload");
const addMarker = document.getElementById("saveLandmark");
const titleInput = document.getElementById("landmarkName");
const descriptionInput = document.getElementById("landmarkDescription");
const landmarkList = document.getElementById("landmarkList");
const filterInput = document.getElementById("filterInput");
const fileLabel = document.querySelector(".file-label");

// Map Initialization
const map = L.map("map").setView([20, 0], 2);

L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
}).addTo(map);

// Update file label when image is selected
imageInput.addEventListener("change", function() {
    if (this.files && this.files[0]) {
        fileLabel.innerHTML = `<i data-lucide="check-circle"></i> ${this.files[0].name}`;
        lucide.createIcons();
    }
});

// Search / Filter (Add once)
filterInput.addEventListener("input", function () {
    const keyword = filterInput.value.toLowerCase();

    landmarks.forEach(function (landmark) {
        const text = (landmark.title + " " + landmark.description).toLowerCase();

        const match = text.includes(keyword);

        // Show / hide list item
        landmark.listItem.style.display = match ? "flex" : "none";

        // Show / hide marker safely
        if (match) {
            if (!map.hasLayer(landmark.marker)) {
                landmark.marker.addTo(map);
            }
        } else {
            if (map.hasLayer(landmark.marker)) {
                map.removeLayer(landmark.marker);
            }
        }
    });
});

// Add Marker Event
addMarker.addEventListener("click", function () {
    const file = imageInput.files[0];

    if (!file) {
        alert("Please select an image first!");
        return;
    }

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    // Change button state
    const originalContent = addMarker.innerHTML;
    addMarker.innerHTML = '<i class="loader"></i> Adding...';
    addMarker.disabled = true;

    navigator.geolocation.getCurrentPosition(function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const title = titleInput.value;
        const description = descriptionInput.value;

        if (!title || !description) {
            alert("Please enter a title and description");
            addMarker.innerHTML = originalContent;
            addMarker.disabled = false;
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {
            const imageDataUrl = reader.result;

            // Create marker
            const marker = L.marker([lat, lng]).addTo(map);

            // Popup content
            const popupContent = `
                <div class="custom-popup">
                    <h2>${title}</h2>
                    <p>${description}</p>
                    <img src="${imageDataUrl}" alt="${title}">
                </div>
            `;

            marker.bindPopup(popupContent);
            marker.openPopup();

            // Create list item
            const li = document.createElement("li");

            const titleSpan = document.createElement("span");
            titleSpan.textContent = title;

            const deleteButton = document.createElement("button");
            deleteButton.innerHTML = '<i data-lucide="trash-2"></i>';
            deleteButton.title = "Delete Landmark";

            li.appendChild(titleSpan);
            li.appendChild(deleteButton);
            landmarkList.appendChild(li);
            lucide.createIcons();

            // Marker click → open popup + highlight
            marker.on("click", function () {
                this.openPopup();
                highlightItem(li);
            });

            // List click → fly + open popup
            li.addEventListener("click", function (e) {
                if (e.target.closest('button')) return; // Don't trigger if delete button clicked
                map.flyTo([lat, lng], 15);
                marker.openPopup();
                highlightItem(li);
            });

            function highlightItem(item) {
                document.querySelectorAll("#landmarkList li").forEach(i => i.classList.remove("active"));
                item.classList.add("active");
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            // Landmark object
            const landmark = {
                title,
                description,
                lat,
                lng,
                image: imageDataUrl,
                marker,
                listItem: li
            };

            landmarks.push(landmark);

            // Delete landmark
            deleteButton.addEventListener("click", function (e) {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${title}"?`)) {
                    li.remove();
                    map.removeLayer(marker);
                    const index = landmarks.indexOf(landmark);
                    if (index > -1) landmarks.splice(index, 1);
                }
            });

            // Reset UI
            titleInput.value = "";
            descriptionInput.value = "";
            imageInput.value = "";
            fileLabel.innerHTML = '<i data-lucide="image"></i> Add Photo';
            lucide.createIcons();
            
            addMarker.innerHTML = originalContent;
            addMarker.disabled = false;

            // Optional: zoom to new marker
            map.flyTo([lat, lng], 15);
        };

        reader.readAsDataURL(file);
    }, function(error) {
        alert("Error getting location: " + error.message);
        addMarker.innerHTML = originalContent;
        addMarker.disabled = false;
    });
});
