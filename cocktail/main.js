// Connect to the cocktail namespace
const socket = io("https://common-verdant-boa.glitch.me/cocktail");



const form = document.getElementById("ingredients-form");
const ingredientsList = document.getElementById("ingredients-list");
const resultsDiv = document.getElementById("results");
const retrieveButton = document.getElementById("retrieve-preferences");
const usernameInput = document.getElementById("username");

// const userId = `user${Math.floor(Math.random() * 10000)}`; // Generate a random unique user ID
let userId = ""; // Declare at the top of the file

// Helper function to get selected ingredients with color codes
function getSelectedIngredients() {
  const checkboxes = Array.from(ingredientsList.querySelectorAll("input[type='checkbox']"));
  return checkboxes
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => {
      const ingredient = checkbox.value;
      const colorSelector = ingredientsList.querySelector(`select[data-ingredient="${ingredient}"]`);
      const color = colorSelector.value;
      return { ingredient, color };
    });
}

// Helper function to display results
function displayResults(message, data = []) {
  resultsDiv.innerHTML = `<p>${message}</p>`;
  if (data.length > 0) {
    const ul = document.createElement("ul");
    data.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${item.userId}</strong>: ${item.ingredients
        .map((i) => `<span style="color: ${i.color};">${i.ingredient}</span>`)
        .join(", ")}`;
      ul.appendChild(li);
    });
    resultsDiv.appendChild(ul);
  }
}

// Handle form submission to save preferences
form.addEventListener("submit", (event) => {
  event.preventDefault();

  userId = usernameInput.value.trim();

  if (!userId) {
    alert("Please enter a valid username.");
    return;
  }

  const selectedIngredients = getSelectedIngredients();

  if (selectedIngredients.length > 5) {
    resultsDiv.innerHTML = "<p>Please select up to 5 ingredients only.</p>";
    return;
  }

  // Emit savePreferences event to the server
  socket.emit("savePreferences", { userId, selectedIngredients });
});

// Handle savePreferences response
socket.on("preferencesSaved", (data) => {
  resultsDiv.innerHTML = `<p>${data.message}</p>`;
});

// Handle errors
socket.on("error", (data) => {
  resultsDiv.innerHTML = `<p style="color: red;">${data.message}</p>`;
});

// Retrieve all preferences
retrieveButton.addEventListener("click", () => {
  // Emit getPreferences event to the server
  socket.emit("getPreferences");
});

// Handle getPreferences response
socket.on("preferencesRetrieved", (preferences) => {
  if (preferences.length === 0) {
    resultsDiv.innerHTML = "<p>No preferences found.</p>";
  } else {
    displayResults("All Preferences:", preferences);
  }
});
