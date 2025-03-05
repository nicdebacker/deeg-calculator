document.addEventListener("DOMContentLoaded", function() {
    fetch("bread_data.json")
        .then(response => response.json())
        .then(data => {
            window.breadData = data;
            populateDropdowns();
            setInitialDate();
        });

    document.getElementById("breadType").addEventListener("change", setInitialDate);
    document.getElementById("feedCount").addEventListener("change", setInitialDate);
    document.getElementById("doughWeight").addEventListener("change", updateInterface);
    document.getElementById("hourChoice").addEventListener("change", updateInterface);
    document.getElementById("dayChoice").addEventListener("change", updateInterface);
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

function setInitialDate() {
   /*
    const breadDropdown = document.getElementById("breadType");
    const selectedBread = window.breadData.Broden.find(b => b.Type === breadDropdown.value) || window.breadData.Broden[0];
    const feedCount = parseInt(document.getElementById("feedCount").value);
    
    if (selectedBread) {
        let eindTijd = new Date();
    
        let etensTijd = calculateEndTime(eindTijd, selectedBread.Tijden, feedCount);
        document.getElementById("klaarTijd").value = etensTijd.toISOString().slice(0, 16);
        updateInterface();
    }
    */
   updateInterface();
}

function calculateEndTime(eindTijd, tijden, feedCount) {
    /*
    let currentTijd = new Date(eindTijd);
    let totaalTijd = tijden.rusten + tijden.bakken + tijden.rijzen + (tijden.voeden * feedCount);
    
    currentTijd.setHours(currentTijd.getHours() + totaalTijd);
    
    while (checkForbiddenHours(currentTijd, tijden, feedCount)) {
        currentTijd.setHours(currentTijd.getHours() + 1);
    }
    
    while (currentTijd < new Date()) {
        currentTijd.setHours(currentTijd.getHours() + 24);
    }
    
    return currentTijd;
    */
}

function checkForbiddenHours(eindTijd, tijden, feedCount) {
    /*
    let testTijd = new Date(eindTijd);
    let stappen = [
        { naam: "rusten", duur: tijden.rusten },
        { naam: "bakken", duur: tijden.bakken },
        { naam: "rijzen", duur: tijden.rijzen }
    ];
    
    for (let i = 1; i <= feedCount; i++) {
        stappen.push({ naam: `${i}x Voeden`, duur: tijden.voeden });
    }
    
    for (let stap of stappen) {
        testTijd.setHours(testTijd.getHours() - stap.duur);
        
        if (testTijd.getHours() <= 7 || testTijd.getHours() >= 23) {
            return true;
        }
    }
    return false;
    */
}

function updateInterface() {
    const selectedBread = breadData.Broden.find(b => b.Name === document.getElementById("breadType").value);
    if (!selectedBread) return;

    let doughWeight = parseInt(document.getElementById("doughWeight").value);
    
    let totalWeight = Object.keys(selectedBread.Ingredients).reduce((sum, key) => sum + selectedBread.Ingredients[key], 0);

    let numFeeds = parseInt(document.getElementById("feedCount").value);

    let scalingFactor = doughWeight / totalWeight;
    
    document.getElementById("bakingInstructions").innerHTML = breadData.Soorten.find(s => s.Type === selectedBread.Type).Bakinstructies;
    updateIngredients(selectedBread, scalingFactor);
    updateFeeding(selectedBread, numFeeds, scalingFactor);
   // updateTimeSchedule(selectedBread);
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

function updateFeeding(bread, numFeeds, scalingFactor) { 
    let feedList = document.getElementById("feedList");
    let starterAmount = bread.Ingredients.Starter * scalingFactor;
    let voedFactor = breadData.Settings.VoedFactor;
    let feedAmounts = [starterAmount/voedFactor];
    
    for (let i = 1; i < numFeeds; i++) {
        feedAmounts.push(feedAmounts[i - 1] / voedFactor);
    }
    
    feedList.innerHTML = feedAmounts.map((amount, index) => 
        `<li>${index + 1}x Voeden: ${Math.round(amount)} g</li>`
    ).join('');
}

function updateTimeSchedule(bread) {
    /*
    let klaarTijd = new Date(document.getElementById("klaarTijd").value);
    if (isNaN(klaarTijd)) return;

    let eindTijd = new Date(klaarTijd);
    let startTijd = new Date(klaarTijd);
    let schemaHTML = "<ul>";
    
    const feedCount = parseInt(document.getElementById("feedCount").value);

    const stappen = [
        ["Eten", 0],
        ["Wachten", bread.Tijden.rusten],
        ["Bakken", bread.Tijden.bakken],
        ["Kneden en rijzen", bread.Tijden.rijzen]
    ];

    for (let i = feedCount; i >= 1; i--) {
        stappen.push([`${i}x Voeden`, bread.Tijden.voeden]);
    }

    stappen.forEach(([naam, uren]) => {
        eindTijd = startTijd;
        startTijd.setHours(startTijd.getHours() - uren);
        
        let startStr = formatShortDate(startTijd);
        
        schemaHTML += `<li>${naam}: ${startStr}</li>`;
    });

    document.getElementById("timeSchedule").innerHTML = schemaHTML + "</ul>";
    */
}

function formatShortDate(date) {
    return date.toLocaleDateString("nl-BE", { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}
