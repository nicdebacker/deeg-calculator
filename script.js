document.addEventListener("DOMContentLoaded", function() {
    fetch("bread_data.json")
        .then(response => response.json())
        .then(data => {
            window.breadData = data;
            populateDropdowns();
            updateInterface();
        });

    document.getElementById("breadType").addEventListener("change", updateInterface);
    document.getElementById("feedCount").addEventListener("change", updateInterface);
    document.getElementById("doughWeight").addEventListener("change", updateInterface);
    //document.getElementById("dayChoice").addEventListener("change", updateInterface);
    //document.getElementById("hourChoice").addEventListener("change", updateInterface);
});

function populateDropdowns() {
    const breadDropdown = document.getElementById("breadType");
    const weightDropdown = document.getElementById("doughWeight");
    const feedDropdown = document.getElementById("feedCount");
    
    breadDropdown.innerHTML = breadData.Broden.map(b => `<option value="${b.Name}" ${b.Selected === "Yes" ? "selected" : ""}>${b.Name}</option>`).join("");
    
    weightDropdown.innerHTML = "";
    for (let i = 500; i <= 4500; i += 100) {
        weightDropdown.innerHTML += `<option value="${i}" ${i === 2500 ? "selected" : ""}>${i} g</option>`;
    }

    feedDropdown.innerHTML = "";
    for (let j = 1; j <= 4; j++)  {
        feedDropdown.innerHTML += `<option value="${j}" ${j === 2 ? "selected" : ""}>${j}x voeden (1:1:1)</option>`;
    }
    feedDropdown.innerHTML += `<option value="5"}>1x voeden (1:2:2)</option>`;
}

function updateInterface() {
    const selectedBread = breadData.Broden.find(b => b.Name === document.getElementById("breadType").value);
    if (!selectedBread) return;

    let doughWeight = parseInt(document.getElementById("doughWeight").value);
    
    let totalWeight = Object.keys(selectedBread.Ingredients).reduce((sum, key) => sum + selectedBread.Ingredients[key], 0);

    let numFeeds = parseInt(document.getElementById("feedCount").value);

    let scalingFactor = doughWeight / totalWeight;
    
    updateIngredients(selectedBread, scalingFactor);
    updateFeeding(selectedBread, numFeeds, scalingFactor);
    updateInstructions(breadData.Soorten.find(s => s.Type === selectedBread.Type).Schema);
    updateTimeSchedule(selectedBread);
}

function updateIngredients(bread, scalingFactor) {
    let ingredientsList = document.getElementById("ingredientsList");

    ingredientsList.innerHTML = Object.entries(bread.Ingredients)
        .map(([key, value]) => {
            let scaledValue = Math.round(value * scalingFactor);
            return scaledValue > 0 ? `<li>${key}: ${scaledValue} g</li>` : "";
        })
        .join("");
}

function updateInstructions(instructies) {
    let instructionList = document.getElementById("bakingInstructions");

    instructionList.innerHTML = "";
    instructies.forEach(entry => {
        if (entry.instructie) {
            const li = document.createElement("li");
            li.textContent = entry.instructie;
            instructionList.appendChild(li);
        }
    });
}

function updateFeeding(bread, numFeeds, scalingFactor) { 
    let feedList = document.getElementById("feedList");
    let starterAmount = bread.Ingredients.Starter * scalingFactor;
    let voedFactor = breadData.Settings.VoedFactor;
    let dubbelVoedFactor = breadData.Settings.DubbelVoedFactor;
    let feedAmounts = [starterAmount/voedFactor];
    
    feedList.innerHTML = "";
    if (numFeeds <= 4) {
        for (let i = 1; i < numFeeds; i++) {
            feedAmounts.push(feedAmounts[i - 1] / voedFactor);
        }
        
        feedList.innerHTML = feedAmounts.map((amount, index) => 
            `<li>${index + 1}x Voeden: ${Math.round(amount)} g</li>`
        ).join('');
    } else if (numFeeds === 5) {
        const li = document.createElement("li");
        li.textContent = `1x Voeden: ${Math.round(starterAmount/dubbelVoedFactor)} g`;
        feedList.appendChild(li);
    }
    
}

function updateTimeSchedule (bread) {
    let schedule = calculateSchedule();
    const scheduleHTML = document.getElementById("timeSchedule");
    const dayDropdown = document.getElementById("dayChoice");
    const hourDropdown = document.getElementById("hourChoice");

    schedule = validTimeSchedule(schedule); 

    scheduleHTML.innerHTML = "";
    schedule.forEach(step => {
        const listItem = document.createElement('li');
        listItem.textContent = `${formatShortDate(step.time)} - ${step.title}`;
        scheduleHTML.appendChild(listItem);
    });
    
    let startTime = new Date(schedule[0].time);
    const hour = startTime.getHours();

    dayDropdown.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
        dayDropdown.innerHTML += `<option value="${startTime}" ${i === 1 ? "selected" : ""}>${startTime.toDateString()}</option>`;
        startTime.setDay(startTime.getDay() + 1);
    }

    hourDropdown.innerHTML = "";
    for (let j = 7; j <= 22; j++)  {
        hourDropdown.innerHTML += `<option value="${j}" ${j === hour ? "selected" : ""}>${j}:00</option>`;
    }
}

function validTimeSchedule(schedule) {
    // Controleer op verboden tijden
    let hasForbiddenTime = true;
  
    while (hasForbiddenTime) {
        hasForbiddenTime = false;
  
      // Loop door alle tijden in het schema
      for (let i = 0; i < schedule.length; i++) {
        const entry = schedule[i];
  
        // Controleer of de tijd verboden is
        if (isForbiddenTime(entry.time)) {
          console.log("true");
          hasForbiddenTime = true;
          break; // Stop de loop als er een verboden tijd is gevonden
        }
      }
  
      // Als er een verboden tijd is, voeg een uur toe aan alle tijden
      if (hasForbiddenTime) {
        for (let i = 0; i < schedule.length; i++) {
          schedule[i].time.setHours(schedule[i].time.getHours() + 1);
          schedule[i].time.setMinutes(0,0,0);
        }
      }
    }
    return schedule;
  }

function isForbiddenTime (date) {
    let d = new Date(date);

    const day = d.getDay(); // 0 = zondag, 6 = zaterdag
    const hour = d.getHours();

    if (day >= 1 && day <= 4) { // maandag t/m donderdag
        return hour < 7 || hour >= 22;
    } else if (day === 5) { // vrijdag
        return hour < 7 || hour >= 23;
    } else if (day === 6) { //zaterdag
        return hour < 8 || hour >= 23;
    } else if (day === 7) { // zondag
        return hour < 8 || hour >= 22;
    }
    return false;
}

function calculateSchedule () {
    const breadDropdown = document.getElementById("breadType");
    const selectedBread = window.breadData.Broden.find(b => b.Name === breadDropdown.value) || window.breadData.Broden[0];
    const selectedSchema = window.breadData.Soorten.find(s => s.Type === selectedBread.Type).Schema;
    const feedCount = parseInt(document.getElementById("feedCount").value);
    const now = new Date();
 
    const schedule = [];
    let currentTime = new Date(now);

    if (selectedBread) {
        selectedSchema.forEach((step, index) => {
            let duration = step.tijd;

            if (step.short === "Starter voeden" && feedCount <= 4) {
                if (selectedBread.Type === "rogge") {
                    let tmpDuration = duration * feedCount;
                    tmpDuration *= -1;
                    let minutesToAdd = duration * 60;
                    currentTime.setMinutes(currentTime.getMinutes() + minutesToAdd);
                } 
                for (let i = 1; i <= feedCount; i++) {
                    schedule.push({
                        time: new Date(currentTime),
                        title: step.short
                    });
                    let minutesToAdd = duration * 60;
                    currentTime.setMinutes(currentTime.getMinutes() + minutesToAdd); 
                }
            } else {
                if (step.short === "Starter voeden" && feedCount === 5) {
                    if (selectedBread.Type === "rogge") {
                        duration *= -2;
                        let minutesToAdd = duration * 60;
                        currentTime.setMinutes(currentTime.getMinutes() + minutesToAdd);
                    } else {
                        duration *= 2;
                    }
                }
                schedule.push({
                    time: new Date(currentTime),
                    title: step.short
                });
                let minutesToAdd = Math.abs(duration) * 60;
                currentTime.setMinutes(currentTime.getMinutes() + minutesToAdd);
            }
        })
    }

    return schedule;
}

function formatShortDate(date) {
    return new Date(date).toLocaleDateString("nl-BE", { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}
