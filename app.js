// FoodFinder - Frontend Prototype (WEB700 Phase 0)
// Team: Sinchana & Simranjeet
// Data Source: TheMealDB API

let allMeals = []; // Stores our working set of meals

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const categoryFilter = document.getElementById("categoryFilter");
const areaFilter = document.getElementById("areaFilter");
const resetBtn = document.getElementById("resetBtn");
const mealGrid = document.getElementById("mealGrid");
const statusMessage = document.getElementById("statusMessage");

const recipeModal = document.getElementById("recipeModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalBody = document.getElementById("modalBody");

// --- INITIAL LOAD: FETCH INITIAL WORKING SET ---
// TheMealDB search by popular letter/keyword to populate working set of meals
async function initializeApp() {
  try {
    statusMessage.textContent = "Loading working dataset from TheMealDB API...";
    
    // Fetch initial meal batches using search endpoint
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/search.php?s=c");
    const data = await response.json();

    if (data.meals) {
      allMeals = data.meals;
      populateFilterDropdowns(allMeals);
      renderMealCards(allMeals);
      statusMessage.textContent = `Showing ${allMeals.length} meals loaded from TheMealDB.`;
    } else {
      statusMessage.textContent = "No meals found.";
    }
  } catch (error) {
    console.error("Error loading initial data:", error);
    statusMessage.textContent = "Failed to load API data. Check internet connection.";
  }
}

// --- POPULATE FILTER DROPDOWNS DYNAMICALLY ---
function populateFilterDropdowns(meals) {
  const categories = new Set();
  const areas = new Set();

  meals.forEach((meal) => {
    if (meal.strCategory) categories.add(meal.strCategory);
    if (meal.strArea) areas.add(meal.strArea);
  });

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });

  areas.forEach((area) => {
    const opt = document.createElement("option");
    opt.value = area;
    opt.textContent = area;
    areaFilter.appendChild(opt);
  });
}

// --- RENDER MEAL CARDS (GRID VIEW) ---
function renderMealCards(mealsToDisplay) {
  mealGrid.innerHTML = "";

  if (mealsToDisplay.length === 0) {
    mealGrid.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>No matching meals found.</p>";
    return;
  }

  mealsToDisplay.forEach((meal) => {
    const card = document.createElement("div");
    card.className = "meal-card";

    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy" />
      <div class="card-content">
        <div>
          <h3>${meal.strMeal}</h3>
          <div class="badge-group">
            <span class="badge">${meal.strCategory || "General"}</span>
            <span class="badge">${meal.strArea || "Global"}</span>
          </div>
        </div>
        <button onclick="viewMealDetails('${meal.idMeal}')">View Recipe</button>
      </div>
    `;

    mealGrid.appendChild(card);
  });
}

// --- SEARCH & FILTER LOGIC ---
async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    filterAndDisplay();
    return;
  }

  statusMessage.textContent = `Searching for "${query}"...`;

  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data.meals) {
      allMeals = data.meals;
      populateFilterDropdowns(allMeals);
      filterAndDisplay();
      statusMessage.textContent = `Found ${allMeals.length} results for "${query}".`;
    } else {
      mealGrid.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>No meals matched your search.</p>";
      statusMessage.textContent = "0 meals found.";
    }
  } catch (err) {
    console.error("Search error:", err);
    statusMessage.textContent = "Error executing search.";
  }
}

function filterAndDisplay() {
  const selectedCat = categoryFilter.value;
  const selectedArea = areaFilter.value;

  const filtered = allMeals.filter((meal) => {
    const matchCat = (selectedCat === "All" || meal.strCategory === selectedCat);
    const matchArea = (selectedArea === "All" || meal.strArea === selectedArea);
    return matchCat && matchArea;
  });

  renderMealCards(filtered);
  statusMessage.textContent = `Showing ${filtered.length} of ${allMeals.length} meals.`;
}

// --- DETAILS VIEW / MODAL (LOOKUP BY ID) ---
async function viewMealDetails(idMeal) {
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`);
    const data = await res.json();
    const meal = data.meals[0];

    // Gather ingredients & measurements
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push(`${measure ? measure.trim() : ""} ${ingredient.trim()}`);
      }
    }

    modalBody.innerHTML = `
      <h2 style="color: #1a365d;">${meal.strMeal}</h2>
      <p style="color: #718096; font-size: 0.9rem; margin-top: 4px;">
        <strong>Category:</strong> ${meal.strCategory} | <strong>Cuisine:</strong> ${meal.strArea}
      </p>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
      
      <h3 style="margin-top: 15px; color: #2b6cb0;">Ingredients:</h3>
      <ul style="margin: 8px 0 15px 20px; color: #4a5568;">
        ${ingredients.map((ing) => `<li>${ing}</li>`).join("")}
      </ul>

      <h3 style="color: #2b6cb0;">Instructions:</h3>
      <div class="instructions-text">${meal.strInstructions}</div>

      ${meal.strYoutube ? `<a class="youtube-link" href="${meal.strYoutube}" target="_blank">▶ Watch on YouTube</a>` : ""}
    `;

    recipeModal.style.display = "block";
  } catch (err) {
    console.error("Error displaying recipe details:", err);
  }
}

// --- EVENT LISTENERS ---
searchBtn.addEventListener("click", handleSearch);
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});

categoryFilter.addEventListener("change", filterAndDisplay);
areaFilter.addEventListener("change", filterAndDisplay);

resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "All";
  areaFilter.value = "All";
  initializeApp();
});

closeModalBtn.addEventListener("click", () => {
  recipeModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === recipeModal) {
    recipeModal.style.display = "none";
  }
});

// Run on page load
initializeApp();