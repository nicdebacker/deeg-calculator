document.addEventListener("DOMContentLoaded", function() {
    fetch("bread_data.json")
        .then(response => response.json())
        .then(data => {
            window.breadData = data;
            populateDropdowns();
            setInitialDate();
        });

    document.getElementById("breadType").addEventListener("change", setInitialDate);
    document.getElementById("doughWeight").addEventListener("change", updateInterface);
    document.getElementById("klaarTijd").addEventListener("change", updateInterface);
    document.getElementById("feedCount").addEventListener("change", setInitialDate);
});

function populateDropdowns() {
    const breadDropdown = document.getElementById("breadType");
    const weightDropdown = document.getElementById("doughWeight");
    
    breadDropdown.innerHTML = breadData.Broden.map(b => `<option value="${b.Type}">${b.Type}</option>`).join("");
    
    weightDropdown.innerHTML = "";
    for (let i = 500; i <= 4500; i += 100) {
        weightDropdown.innerHTML += `<option value="${i}" ${i === 2500 ? "selected" : ""}>${i} g</option>`;
    }

    feedCount.innerHTML = "";
    for (let j = 1; j <= 5; j++)  {
        feedCount.innerHTML += `<option value="${j}" ${j === 2 ? "selected" : ""}>${j} x voeden</option>`;
    }
}

function setInitialDate() {
    const breadDropdown = document.getElementById("breadType");
    const selectedBread = window.breadData.Broden.find(b => b.Type === breadDropdown.value) || window.breadData.Broden[0];
    const feedCount = parseInt(document.getElementById("feedCount").value);
    
    if (selectedBread) {
        let eindTijd = new Date();
    
        let etensTijd = calculateEndTime(eindTijd, selectedBread.Tijden, feedCount);
        document.getElementById("klaarTijd").value = etensTijd.toISOString().slice(0, 16);
        updateInterface();
    }
}

function calculateEndTime(eindTijd, tijden, feedCount) {
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
}

function checkForbiddenHours(eindTijd, tijden, feedCount) {
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
}

function updateInterface() {
    const selectedBread = breadData.Broden.find(b => b.Type === document.getElementById("breadType").value);
    if (!selectedBread) return;

    let doughWeight = parseInt(document.getElementById("doughWeight").value);
    
    let totalWeight = Object.keys(selectedBread)
        .filter(key => key !== "Type" && key !== "Bakinstructies" && key !== "Tijden")
        .reduce((sum, key) => sum + selectedBread[key], 0);

    let scalingFactor = doughWeight / totalWeight;
    
    document.getElementById("bakingInstructions").innerHTML = selectedBread.Bakinstructies;
    updateIngredients(selectedBread, scalingFactor);
    updateFeeding(selectedBread, scalingFactor);
    updateTimeSchedule(selectedBread);
}

function updateIngredients(bread, scalingFactor) {
    let ingredientsList = document.getElementById("ingredientsList");
    ingredientsList.innerHTML = Object.entries(bread)
        .filter(([key, value]) => !isNaN(value) && value > 0 && key !== "Type" && key !== "Bakinstructies" && key !== "Tijden")
        .map(([key, value]) => {
            let scaledValue = Math.round(value * scalingFactor);
            return scaledValue > 0 ? `<li>${key}: ${scaledValue} g</li>` : "";
        })
        .join("");
}

function updateFeeding(bread, scalingFactor) {
    let feedList = document.getElementById("feedList");
    let starterAmount = bread.Starter * scalingFactor;
    let voedFactor = breadData.Settings.VoedFactor;
    let feed1 = starterAmount / voedFactor;
    let feed2 = feed1 / voedFactor;
    let feed3 = feed2 / voedFactor;
    
    feedList.innerHTML = `
        <li>1x Voeden: ${Math.round(feed1)} g</li>
        <li>2x Voeden: ${Math.round(feed2)} g</li>
        <li>3x Voeden: ${Math.round(feed3)} g</li>
    `;
}

function updateTimeSchedule(bread) {
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
}

function formatShortDate(date) {
    return date.toLocaleDateString("nl-BE", { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}
