document.addEventListener("DOMContentLoaded", () => {
  const predictBtn = document.querySelector(".predict-btn");
  const inputInfo = document.querySelector(".input-info");
  const rightPanel = document.querySelector(".input-right");
  const leftResultCard = document.querySelector(".input-result");

  const locationInput = document.querySelector(".location-search");
  const soilInput = document.querySelector(".soil-search");
  const sizeInput = document.querySelector(".size-search");
  const prevInput = document.querySelector(".prev-search");

  const locationList = document.querySelector(".location-search-list");
  const soilList = document.querySelector(".soil-search-list");
  const sizeList = document.querySelector(".size-search-list");
  const prevList = document.querySelector(".prev-search-list");

  /* =====================================
     DATA
  ===================================== */

  const soilByLocation = {
    Davangere: ["Black", "Red Sandy", "Sandy Loam"],
    Hassan: [
      "Alluvial",
      "Black",
      "Black cotton",
      "Clay loam",
      "Gravelly sand",
      "Laterite",
      "Loam",
      "Red",
      "Red laterite",
      "Sandy",
      "Sandy loam",
    ],
    Mangalore: ["Alluvial", "Laterite", "Sandy", "Sandy loam"],
    Mysuru: [
      "Alluvial",
      "Black",
      "Clay",
      "Laterite",
      "Sandy",
      "Sandy clay loam",
      "Sandy loam",
    ],
    Raichur: ["Alluvial", "Black", "Loam", "Red", "Sandy", "Sandy loam"],
  };

  const locations = Object.keys(soilByLocation);

  const landSizes = [
    "10–30 cent (Very small farms)",
    "30–50 cent (small farms)",
    "50–80 cent (medium farms)",
    "80+ cent (large farms)",
  ];

  const previousCrops = [
    "Arecanut",
    "Blackgram",
    "Cardamum",
    "Cashew",
    "Cocoa",
    "Coconut",
    "Coffee",
    "Cotton",
    "Ginger",
    "Groundnut",
    "Paddy",
    "Pepper",
    "Tea",
  ];

  /* =====================================
     HELPERS
  ===================================== */

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  /* =====================================
     DEFAULT RIGHT PANEL
  ===================================== */

  function renderDefaultRightPanel() {
    rightPanel.style.backgroundColor = "#fbfaf8";
    rightPanel.style.backgroundImage = 'url("crop_img.png")';
    rightPanel.style.backgroundRepeat = "no-repeat";
    rightPanel.style.backgroundSize = "58%";
    rightPanel.style.backgroundPosition = "right 25px bottom 25px";

    inputInfo.innerHTML = `
    <div class="default-state">
      <h3>Ready to grow better?</h3>
      <p>
        Enter your farm details and get the best crop recommendation.
      </p>
    </div>
  `;
  }

  /* =====================================
     DEFAULT LEFT CARD (OPTION 5)
  ===================================== */

  function renderDefaultLeftResult() {
    leftResultCard.innerHTML = `
      <div class="dot-card-header">
        <div class="dot-crop-block">
          <span class="dot-label">Best Crop</span>
          <h1 class="dot-crop-name">---</h1>
        </div>

        <div class="dot-score-block">
          <span class="dot-label">Confidence</span>
          <h2 class="dot-score">--%</h2>
        </div>
      </div>

      <div class="dot-progress-row" id="dot-progress-row"></div>

      <div class="dot-intercrop">
        Intercrop: ---
      </div>
    `;
  }

  /* =====================================
     DOTTED BAR
  ===================================== */

  function createDots(confidence) {
    const row = document.getElementById("dot-progress-row");
    if (!row) return;

    row.innerHTML = "";

    const totalDots = 40;
    const activeDots = Math.round((confidence / 100) * totalDots);

    for (let i = 0; i < totalDots; i++) {
      const dot = document.createElement("span");
      dot.className = i < activeDots ? "dot active-dot" : "dot";
      row.appendChild(dot);
    }
  }

  /* =====================================
     DROPDOWNS
  ===================================== */

  function populateDropdown(listElement, items, itemClass) {
    listElement.innerHTML = "";

    items.forEach((item) => {
      const div = document.createElement("div");
      div.className = itemClass;
      div.textContent = item;

      div.addEventListener("click", () => {
        const input = listElement.parentElement.querySelector("input");

        if (input) input.value = item;

        listElement.style.display = "none";

        if (input === locationInput) {
          updateSoilDropdown(item);
        }
      });

      listElement.appendChild(div);
    });
  }

  function setupDropdown(input, list) {
    input.addEventListener("focus", () => {
      if (input === soilInput && soilInput.disabled) return;
      list.style.display = "block";
    });

    input.addEventListener("input", () => {
      if (input === soilInput && soilInput.disabled) return;

      const filter = input.value.toLowerCase().trim();

      Array.from(list.children).forEach((item) => {
        item.style.display = item.textContent.toLowerCase().includes(filter)
          ? "block"
          : "none";
      });

      list.style.display = "block";
    });

    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !list.contains(e.target)) {
        list.style.display = "none";
      }
    });
  }

  /* =====================================
     SOIL FILTER
  ===================================== */

  function resetSoilField(message = "Select location first") {
    soilInput.value = "";
    soilInput.disabled = true;
    soilInput.placeholder = message;
    soilList.innerHTML = "";
    soilList.style.display = "none";
  }

  function updateSoilDropdown(location) {
    const soils = soilByLocation[location] || [];

    if (!soils.length) {
      resetSoilField("No soil data available");
      return;
    }

    soilInput.disabled = false;
    soilInput.placeholder = "Select soil type";
    soilInput.value = "";
    soilList.innerHTML = "";

    soils.forEach((soil) => {
      const div = document.createElement("div");
      div.className = "soil-search-item";
      div.textContent = soil;

      div.addEventListener("click", () => {
        soilInput.value = soil;
        soilList.style.display = "none";
      });

      soilList.appendChild(div);
    });
  }

  locationInput.addEventListener("input", () => {
    const typed = locationInput.value.trim();

    const match = locations.find(
      (loc) => loc.toLowerCase() === typed.toLowerCase(),
    );

    if (match) {
      updateSoilDropdown(match);
    } else {
      resetSoilField();
    }
  });

  /* =====================================
     INIT
  ===================================== */

  populateDropdown(locationList, locations, "location-search-item");

  populateDropdown(sizeList, landSizes, "size-search-item");

  populateDropdown(prevList, previousCrops, "prev-search-item");

  resetSoilField();
  renderDefaultRightPanel();
  renderDefaultLeftResult();
  createDots(0);

  setupDropdown(locationInput, locationList);
  setupDropdown(soilInput, soilList);
  setupDropdown(sizeInput, sizeList);
  setupDropdown(prevInput, prevList);

  /* =====================================
     PREDICT
  ===================================== */

  predictBtn.addEventListener("click", async () => {
    const location = locationInput.value.trim();
    const soil = soilInput.value.trim();
    const sizeDisplay = sizeInput.value.trim();
    const prevCrop = prevInput.value.trim();

    if (!location || !soil || !sizeDisplay || !prevCrop) {
      alert("⚠️ Please fill all 4 fields!");
      return;
    }

    const originalText = predictBtn.textContent;
    predictBtn.textContent = "Predicting...";
    predictBtn.disabled = true;

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          soil_type: soil,
          location: location,
          previous_crop: prevCrop,
          land_size: sizeDisplay,
        }),
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const result = await response.json();

      const confidence = result.top_suggestions?.[0]?.confidence ?? 75;

      /* LEFT RESULT OPTION 5 */

      leftResultCard.innerHTML = `
        <div class="dot-card-header">

          <div class="dot-crop-block">
            <span class="dot-label">Best Crop</span>
            <h1 class="dot-crop-name">
              ${escapeHTML(result.best_crop || "---")}
            </h1>
          </div>

          <div class="dot-score-block">
            <span class="dot-label">Confidence</span>
            <h2 class="dot-score">${confidence}%</h2>
          </div>

        </div>

        <div class="dot-progress-row" id="dot-progress-row"></div>

        <div class="dot-intercrop">
          Intercrop:
          ${escapeHTML(result.intercrop || "---")}
        </div>
      `;

      createDots(confidence);

      /* RIGHT PANEL SAME */

      const bestCrop = escapeHTML(result.best_crop || "---");

      const intercrop = escapeHTML(result.intercrop || "---");

      const landSize = escapeHTML(sizeDisplay);

      let suggestionsHTML = "";

      if (
        Array.isArray(result.top_suggestions) &&
        result.top_suggestions.length
      ) {
        suggestionsHTML = result.top_suggestions
          .slice(0, 3)
          .map((s, index) => {
            return `
              <div class="suggestion-row">
                <div class="suggestion-left">
                  <span class="rank-chip">
                    ${index + 1}
                  </span>
                  <span class="suggestion-name">
                    ${escapeHTML(s.crop)}
                  </span>
                </div>

                <strong class="suggestion-score">
                  ${s.confidence}%
                </strong>
              </div>
            `;
          })
          .join("");
      }

      inputInfo.innerHTML = `
        <div class="result-panel">

          <div class="result-header">
            <h3>Recommendation Result</h3>
          </div>

          <div class="result-grid">

            <div class="result-card">
              <span class="result-label">Best Crop</span>
              <strong class="result-value">${bestCrop}</strong>
            </div>

            <div class="result-card">
              <span class="result-label">Intercrop</span>
              <strong class="result-value">${intercrop}</strong>
            </div>

            <div class="result-card">
              <span class="result-label">Land Size</span>
              <strong class="result-value">${landSize}</strong>
            </div>

          </div>

          <div class="suggestions-box">
            <div class="section-title">
              Top 3 Suggestions
            </div>

            ${suggestionsHTML}
          </div>

          <div class="recommendation-box">
            <div class="section-title">
              Recommendation
            </div>

            <p>
              ${escapeHTML(result.suggestion || "No recommendation available.")}
            </p>
          </div>

        </div>
      `;
    } catch (error) {
      console.error(error);
      alert("❌ Failed to connect to Flask server.");
    } finally {
      predictBtn.textContent = originalText;
      predictBtn.disabled = false;
    }
  });

  /* =====================================
     ENTER KEY
  ===================================== */

  [locationInput, soilInput, sizeInput, prevInput].forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        predictBtn.click();
      }
    });
  });
});
