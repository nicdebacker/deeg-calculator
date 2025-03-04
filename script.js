document.addEventListener("DOMContentLoaded", function() {
    fetch("bread_data.json")
        .then(response => response.json())
        .then(data => {
            window.breadData = data;
            populateDropdowns();
            setInitialDate();
        });

    document.getElementById("breadType").addEventListener("change", updateInterface);
    document.getElementById("doughWeight").addEventListener("change", updateInterface);
    document.getElementById("klaarTijd").addEventListener("change", updateInterface);
});

function populateDropdowns() {
    const breadDropdown = document.getElementById("breadType");
    const weightDropdown = document.getElementById("doughWeight");
    
    breadDropdown.innerHTML = breadData.Broden.map(b => `<option value="${b.Type}">${b.Type}</option>`).join("");
    
    weightDropdown.innerHTML = "";
    for (let i = 500; i <= 4500; i += 100) {
        weightDropdown.innerHTML += `<option value="${i}" ${i === 2500 ? "selected" : ""}>${i} g</option>`;
    }
}

function setInitialDate() {
    const breadDropdown = document.getElementById("breadType");
    const selectedBread = window.breadData.Broden.find(b => b.Type === breadDropdown.value) || window.breadData.Broden[0];
    
    if (selectedBread) {
        let eetMoment = new Date();
        eetMoment.setHours(10, 0, 0, 0); // Standaard eetmoment om 10:00
        
        let startTijd = calculateStartTime(eetMoment, selectedBread.Tijden);
        document.getElementById("klaarTijd").value = startTijd.toISOString().slice(0, 16);
        updateInterface();
    }
}

function calculateStartTime(eetMoment, tijden) {
    let currentTijd = new Date(eetMoment);
    let totaalTijd = tijden.rusten + tijden.bakken + tijden.rijzen + (tijden.voeden * 3);
    
    currentTijd.setHours(currentTijd.getHours() - totaalTijd);
    
    if (currentTijd < new Date()) {
        currentTijd.setHours(currentTijd.getHours() + 24);
    }
    
    while (checkForbiddenHours(currentTijd, tijden)) {
        currentTijd.setHours(currentTijd.getHours() + 1);
    }
    
    return currentTijd;
}

function checkForbiddenHours(startTijd, tijden) {
    let testTijd = new Date(startTijd);
    let stappen = [
        { naam: "rusten", duur: tijden.rusten },
        { naam: "bakken", duur: tijden.bakken },
        { naam: "rijzen", duur: tijden.rijzen },
        { naam: "1x Voeden", duur: tijden.voeden },
        { naam: "2x Voeden", duur: tijden.voeden },
        { naam: "3x Voeden", duur: tijden.voeden }
    ];
    
    for (let stap of stappen) {
        let eindTijd = new Date(testTijd);
        eindTijd.setHours(eindTijd.getHours() + stap.duur);
        
        if ((testTijd.getHours() < 7 || testTijd.getHours() >= 23) && stap.naam !== "2x Voeden" && stap.naam !== "3x Voeden") {
            return true;
        }
        testTijd = eindTijd;
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

    const stappen = [
        ["Eten", 0],
        ["Wachten", bread.Tijden.rusten],
        ["Bakken", bread.Tijden.bakken],
        ["Kneden en rijzen", bread.Tijden.rijzen],
        ["1x Voeden", bread.Tijden.voeden],
        ["2x Voeden", bread.Tijden.voeden],
        ["3x Voeden", bread.Tijden.voeden]
    ];

    stappen.forEach(([naam, uren]) => {
        eindTijd = startTijd;
        startTijd.setHours(startTijd.getHours() - uren);
        
        let startStr = formatShortDate(startTijd);
        let eindStr = formatShortDate(eindTijd);

        schemaHTML += `<li>${naam}: ${startStr}</li>`;
    });

    document.getElementById("timeSchedule").innerHTML = schemaHTML + "</ul>";
}

function formatShortDate(date) {
    return date.toLocaleDateString("nl-BE", { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}
