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
    document.getElementById("dayChoice").addEventListener("change", updateBakeSchedule);
    document.getElementById("hourChoice").addEventListener("change", updateBakeSchedule);
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
    updateTimeSchedule();
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

function updateBakeSchedule () {
    const dayDropdown = document.getElementById("dayChoice");
    const hourDropdown = document.getElementById("hourChoice");

    updateTimeSchedule(dayDropdown.value, hourDropdown.value);
}

function updateTimeSchedule (startingDate, startingTime) {
    let schedule = calculateSchedule(startingDate, startingTime);
    const scheduleHTML = document.getElementById("timeSchedule");
    const dayDropdown = document.getElementById("dayChoice");
    const hourDropdown = document.getElementById("hourChoice");
    const opties = { weekday: 'long', day: 'numeric', month: 'long' };
    const formatter = new Intl.DateTimeFormat('nl-NL', opties);

    schedule = validTimeSchedule(schedule); 

    scheduleHTML.innerHTML = "";
    schedule.forEach(step => {
        const listItem = document.createElement('li');
        listItem.textContent = `${formatShortDate(step.time)} - ${step.title}`;
        scheduleHTML.appendChild(listItem);
    });
    
    if (startingDate === undefined) {
        let startTime = new Date(schedule[0].time);
        const hour = startTime.getHours();

        dayDropdown.innerHTML = "";
        for (let i = 1; i <= 5; i++) {
            dayDropdown.innerHTML += `<option value="${startTime}" ${i === 1 ? "selected" : ""}>${formatter.format(startTime)}</option>`;
            startTime.setHours(startTime.getHours() + 24);
        }

        hourDropdown.innerHTML = "";
        for (let j = 7; j <= 22; j++)  {
            hourDropdown.innerHTML += `<option value="${j}" ${j === hour ? "selected" : ""}>${j}:00</option>`;
        }
    }
}

function validTimeSchedule(schedule) {
    // Controleer op verboden tijden
    let hasForbiddenTime = true;
    let origSchedule = schedule;
    let maxLoops = 24*4;
    let iLoops = 1;
  
    while (hasForbiddenTime && iLoops < maxLoops) {
        hasForbiddenTime = false;
  
      // Loop door alle tijden in het schema
      // met een maximum van 24 uur verschuiven
      // als 
      for (let i = 0; i < schedule.length; i++) {
        const entry = schedule[i];
        let origTime = entry.time;
  
        // Controleer of de tijd verboden is
        if (isForbiddenTime(entry.time)) {
            console.log(`Dit is een verboden tijd (${entry.time}) voor ${entry.title}`);
            hasForbiddenTime = true;
            //kijken of er een afwijking is en we zo toch terug in goede time komen
            if (entry.afwijking > 0) {
                console.log(`Er is een afwijking mogelijk (${entry.afwijking})`);
                let numLoops = entry.afwijking * 4;
                let k = 1;    

                while (hasForbiddenTime && k < numLoops) {
                    entry.time.setMinutes(entry.time.getMinutes() - 15);
                    console.log(`Nieuwe tijd (${entry.time})`);
                    hasForbiddenTime = isForbiddenTime(entry.time);
                    k++;
                }

                if (hasForbiddenTime) {
                    k = 1;
                    entry.time = origTime;
                    while (hasForbiddenTime && k < numLoops) {
                        entry.time.setMinutes(entry.time.getMinutes() + 15);
                        console.log(`Nieuwe tijd (${entry.time})`);
                        hasForbiddenTime = isForbiddenTime(entry.time);
                        k++;
                    }
                }
            }

            // heeft de vorige stap in het proces een afwijking?
            if (hasForbiddenTime && i > 0) {
                const prevEntry = schedule[i-1];

                if (prevEntry.afwijking > 0) {
                    console.log(`Er is een afwijking mogelijk door de vorige stap ${prevEntry.title} (${prevEntry.afwijking})`);
                    let numLoops = prevEntry.afwijking * 4;
                    let k = 1;    

                    while (hasForbiddenTime && k < numLoops) {
                        entry.time.setMinutes(entry.time.getMinutes() - 15);
                        console.log(`Nieuwe tijd (${entry.time})`);
                        hasForbiddenTime = isForbiddenTime(entry.time);
                        k++;
                    }

                    if (hasForbiddenTime) {
                        k = 1;
                        entry.time = origTime;
                        while (hasForbiddenTime && k < numLoops) {
                            entry.time.setMinutes(entry.time.getMinutes() + 15);
                            console.log(`Nieuwe tijd (${entry.time})`);
                            hasForbiddenTime = isForbiddenTime(entry.time);
                            k++;
                        }
                    }
                }
            }
        }
        
        console.log(`Status verboden: (${hasForbiddenTime})`);
        if (hasForbiddenTime) {
            entry.time = origTime;
            break; // Stop de loop als er een verboden tijd is gevonden
        }
      }
  
      // Als er een verboden tijd is, voeg een kwartier toe aan alle tijden
      if (hasForbiddenTime) {
        iLoops++;
        for (let i = 0; i < schedule.length; i++) {
          schedule[i].time.setMinutes(schedule[i].time.getMinutes() + 15);
        }
      }
    }
    
    if (iLoops < maxLoops) {
        return schedule;
    } else {
        // na 24 uur opschuiven is er geen geldig schema gevonden, geef het originele schema terug
        return origSchedule;
    }
  }

function isForbiddenTime (date) {
    let d = new Date(date);

    const day = d.getDay(); // 0 = zondag, 6 = zaterdag
    const hour = d.getHours();

    //console.log(day);
    //console.log(hour);
    if (day >= 1 && day <= 4) { // maandag t/m donderdag
        return hour < 7 || hour >= 22;
    } else if (day === 5) { // vrijdag
        return hour < 7 || hour >= 23;
    } else if (day === 6) { //zaterdag
        return hour < 8 || hour >= 23;
    } else if (day === 0) { // zondag
        return hour < 8 || hour >= 22;
    }
    return false;
}

function calculateSchedule (startingDate, startingTime) {
    const breadDropdown = document.getElementById("breadType");
    const selectedBread = window.breadData.Broden.find(b => b.Name === breadDropdown.value) || window.breadData.Broden[0];
    const selectedSchema = window.breadData.Soorten.find(s => s.Type === selectedBread.Type).Schema;
    const feedCount = parseInt(document.getElementById("feedCount").value);
    
    let now = new Date();
    if (now.getMinutes() < 15) {
        now.setMinutes(15,0,0);
    } else if (now.getMinutes() < 30) {
        now.setMinutes(30,0,0);
    } else if (now.getMinutes() < 45) {
        now.setMinutes(45,0,0);
    } else {
        now.setHours(now.getHours() + 1);
        now.setMinutes(0,0,0);
    }

    if (startingDate) {
        now = new Date(startingDate);
        now.setHours(startingTime,0,0,0);
    } 
    
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
                        title: step.short,
                        afwijking: step.afwijking
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
                    title: step.short,
                    afwijking: step.afwijking
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
