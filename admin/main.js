const socket = io("https://common-verdant-boa.glitch.me/admin");



    const sqlForm = document.getElementById("sql-form");
    const sqlCommandInput = document.getElementById("sql-command");
    const resultsDiv = document.getElementById("results");

    // Handle form submission for SQL commands
    sqlForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const sql = sqlCommandInput.value.trim();
      if (!sql) {
        resultsDiv.innerHTML = "<p>Please enter a valid SQL command.</p>";
        return;
      }

      console.log("Emitting runSQL event with SQL:", sql);

      // Emit the runSQL event to the backend
      socket.emit("runSQL", { sql });
    });

    // Listen for SQL result from the backend
    socket.on("sqlResult", (rows) => {
      console.log("SQL Result received:", rows);

      // Display results in a pretty format
      resultsDiv.innerHTML = `<h3>SQL Results:</h3><pre>${JSON.stringify(rows, null, 2)}</pre>`;
    });

    // Listen for SQL errors from the backend
    socket.on("sqlError", (error) => {
      console.error("SQL Error:", error.message);
      resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    });

    // Listen for connection confirmation
    socket.on("connect", () => {
      console.log("Connected to /admin namespace");
    });