document.addEventListener("DOMContentLoaded", function() {
    fetch("bread_data.json")
        .then(response => response.json())
        .then(data => {
            window.breadData = data;
            populateDropdowns();
            updateInterface();
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

function updateInterface() {
    const selectedBread = breadData.Broden.find(b => b.Type === document.getElementById("breadType").value);
    if (!selectedBread) return;

    document.getElementById("bakingInstructions").innerHTML = selectedBread.Bakinstructies;
    updateIngredients(selectedBread);
    updateFeeding(selectedBread);
    updateTimeSchedule(selectedBread);
}

function updateIngredients(bread) {
    let doughWeight = parseInt(document.getElementById("doughWeight").value);
    
    let totalWeight = Object.keys(bread)
        .filter(key => key !== "Type" && key !== "Bakinstructies" && key !== "Tijden")
        .reduce((sum, key) => sum + bread[key], 0);

    let scalingFactor = doughWeight / totalWeight;

    let ingredientsList = document.getElementById("ingredientsList");
    ingredientsList.innerHTML = Object.entries(bread)
        .filter(([key, value]) => !isNaN(value) && value > 0 && key !== "Type" && key !== "Bakinstructies" && key !== "Tijden")
        .map(([key, value]) => {
            let scaledValue = Math.round(value * scalingFactor);
            return scaledValue > 0 ? `<li>${key}: ${scaledValue} g</li>` : "";
        })
        .join("");
}

function updateFeeding(bread) {
    let feedList = document.getElementById("feedList");
    let starterAmount = bread.Starter;
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

    let tijden = bread.Tijden;
    let stappen = [
        ["Eten", { min: 0, max: 0 }],
        ["Rusten", tijden.rusten],
        ["Bakken", tijden.bakken],
        ["Rijzen", tijden.rijzen],
        ["1x Voeden", tijden.voeden],
        ["2x Voeden", tijden.voeden],
        ["3x Voeden", tijden.voeden}]
    ];

    let minTijd = new Date(klaarTijd);
    let maxTijd = new Date(klaarTijd);
    
    let schemaHTML = "<ul>";

    for (let i = 0; i < stappen.length; i++) {
        minTijd.setHours(minTijd.getHours() - stappen[i][1].min);
        maxTijd.setHours(maxTijd.getHours() - stappen[i][1].max);

        schemaHTML += `<li>${stappen[i][0]}: ${formatShortDate(maxTijd)} - ${formatShortDate(minTijd)}</li>`;
    }

    document.getElementById("timeSchedule").innerHTML = schemaHTML + "</ul>";
}

function formatShortDate(date) {
    return date.toLocaleDateString("nl-BE", { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}
