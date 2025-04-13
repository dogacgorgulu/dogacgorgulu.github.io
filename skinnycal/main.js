let chartInstance = null; // Global variable to store the Chart.js instance

document.getElementById("chart-container").style.display = "block";

document
  .getElementById("calculateButton")
  .addEventListener("click", function () {
    const system = document.getElementById("system").value;
    let weight = parseFloat(document.getElementById("weight").value);
    let height = parseFloat(document.getElementById("height").value);
    const age = parseInt(document.getElementById("age").value);
    const sex = document.getElementById("sex").value;
    const activityFactor = parseFloat(
      document.getElementById("activityFactor").value
    );
    let goalWeight = parseFloat(document.getElementById("goalWeight").value);
    let ultimateGoalWeight = parseFloat(
      document.getElementById("ultimateGoalWeight").value
    );
    const days = parseInt(document.getElementById("days").value);

    if (
      isNaN(weight) ||
      isNaN(height) ||
      isNaN(age) ||
      isNaN(goalWeight) ||
      isNaN(ultimateGoalWeight) ||
      isNaN(days)
    ) {
      alert("Please fill in all fields with valid numbers!");
      return;
    }

    // Ensure ultimate goal weight is less than goal weight
    if (ultimateGoalWeight >= goalWeight) {
      alert("Ultimate Goal Weight must be less than Goal Weight!");
      return;
    }

    // Convert imperial to metric if necessary
    if (system === "imperial") {
      weight = weight / 2.205; // lb to kg
      height = height * 2.54; // inches to cm
      goalWeight = goalWeight / 2.205; // lb to kg
      ultimateGoalWeight = ultimateGoalWeight / 2.205; // lb to kg
    }

    // BMR calculation function
    const calculateBMR = (currentWeight) => {
      return sex === "male"
        ? 10 * currentWeight + 6.25 * height - 5 * age + 5
        : 10 * currentWeight + 6.25 * height - 5 * age - 161;
    };

    // Initial BMR and TDEE calculation
    const initialBMR = calculateBMR(weight);
    const initialTDEE = initialBMR * activityFactor;

    const totalWeightChangeToGoal = weight - goalWeight;
    const dailyCalorieDeficitToGoal = (totalWeightChangeToGoal * 7700) / days;
    const fixedDailyCalories = initialTDEE - dailyCalorieDeficitToGoal;

    // Weekly updates
    const weeklyDates = [];
    const weeklyWeights = [];
    const weeklyTDEEs = []; // Array to store TDEE values
    let currentWeight = weight;
    const today = new Date();
    let totalWeeks = 0;

    const maxIterations = 1000; // Limit the number of iterations for safety

    const calculateWeekly = () => {
      if (currentWeight <= ultimateGoalWeight || totalWeeks >= maxIterations) {
        // Finalize the chart once the weight goal is reached
        finalizeChart();
        return;
      }

      // Update BMR dynamically based on the current weight
      const bmr = calculateBMR(currentWeight);
      const tdee = bmr * activityFactor;

      // Calculate weekly calorie deficit and weight loss
      const weeklyCalorieDeficit = (tdee - fixedDailyCalories) * 7;
      const weeklyWeightLoss = weeklyCalorieDeficit / 7700; // 7700 calories = 1 kg

      // Update current weight
      currentWeight -= weeklyWeightLoss;
      if (currentWeight < ultimateGoalWeight) {
        currentWeight = ultimateGoalWeight; // Ensure weight doesn't drop below the ultimate goal
      }

      // Update week count and date
      totalWeeks++;
      const date = new Date(today);
      date.setDate(today.getDate() + totalWeeks * 7);

      // Format the date as "15 Jan 2025"
      const formattedDate = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);

      // Add data for this week
      weeklyDates.push(formattedDate);
      weeklyWeights.push(currentWeight.toFixed(2));
      weeklyTDEEs.push(Math.round(tdee)); // Store TDEE instead of BMR

      // Update partial results in HTML
      document.getElementById(
        "result"
      ).innerHTML = `<h3>Calculating... Week ${totalWeeks}</h3>`;
      setTimeout(calculateWeekly, 0); // Schedule the next iteration asynchronously
    };

    const finalizeChart = () => {
      // Display final results
      let resultHTML = `<h2>Results</h2>`;

      resultHTML += `<p><strong>GW:</strong> ${
        system === "imperial"
          ? (goalWeight * 2.205).toFixed(2)
          : goalWeight.toFixed(2)
      } ${system === "imperial" ? "lb" : "kg"}</p>`;
      resultHTML += `<p>Fixed daily calorie intake: <strong>${Math.round(
        fixedDailyCalories
      )} kcal</strong></p>`;
      resultHTML += `<p><strong>UGW:</strong> ${
        system === "imperial"
          ? (ultimateGoalWeight * 2.205).toFixed(2)
          : ultimateGoalWeight.toFixed(2)
      } ${system === "imperial" ? "lb" : "kg"}</p>`;

      resultHTML += `<p>Estimated time to reach UGW: <strong>${
        totalWeeks * 7
      } days</strong></p>`;
      resultHTML += `<h3>Weight Change Timetable</h3>`;
      resultHTML += `<table border="1" style="width:100%;text-align:center;border-collapse:collapse;">
  <thead>
    <tr>
      <th>Week</th>
      <th>Date</th>
      <th>Weight (${system === "imperial" ? "lb" : "kg"})</th>
      <th>TDEE (kcal)</th>
    </tr>
  </thead>
  <tbody>`;
      for (let i = 0; i < weeklyDates.length; i++) {
        resultHTML += `<tr>
    <td>${i + 1}</td>
    <td>${weeklyDates[i]}</td>
    <td>${
      system === "imperial"
        ? (weeklyWeights[i] * 2.205).toFixed(2)
        : weeklyWeights[i]
    }</td>
    <td>${weeklyTDEEs[i]}</td>
  </tr>`;
      }
      resultHTML += `</tbody></table>`;

      document.getElementById("result").innerHTML = resultHTML;

      // Destroy the previous chart instance if it exists
      if (chartInstance) {
        chartInstance.destroy();
      }

      // Generate Chart
      const ctx = document.getElementById("weightLossChart").getContext("2d");
      chartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: weeklyDates, // X-axis labels (dates)
          datasets: [
            {
              label: `TDEE (kcal)`,
              data: weeklyTDEEs, // Y-axis data (TDEE values)
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              fill: true,
              tension: 0.4, // Smooth curve
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Date",
              },
            },
            y: {
              title: {
                display: true,
                text: `TDEE (kcal)`,
              },
            },
          },
        },
      });
    };

    // Start weekly calculations asynchronously
    calculateWeekly();
  });
