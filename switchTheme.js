    // Array of themes
    const themes = ["styles.css", "frutiger-aero.css"];
    let currentThemeIndex = 0; // Keep track of the current theme index

    // Get the theme stylesheet link element
    const themeStylesheet = document.getElementById("themeStylesheet");

    // Add event listener to switch themes
    switchStyle.addEventListener("click", () => {
        // Increment the theme index and cycle back to the start if needed
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;

        // Set the new theme
        themeStylesheet.setAttribute("href", themes[currentThemeIndex]);
    });