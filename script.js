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
    
    breadDropdown.innerHTML = breadData.map(b => `<option value="${b.Type}">${b.Type}</option>`).join("");
    
    weightDropdown.innerHTML = "";
    for (let i = 500; i <= 4500; i += 100) {
        weightDropdown.innerHTML += `<option value="${i}" ${i === 2500 ? "selected" : ""}>${i} g</option>`;
    }
}

function updateInterface() {
    const selectedBread = breadData.find(b => b.Type === document.getElementById("breadType").value);
    if (!selectedBread) return;

    document.getElementById("bakingInstructions").innerText = selectedBread.Bakinstructies;
    updateIngredients(selectedBread);
    updateFeeding(selectedBread);
    updateTimeSchedule(selectedBread);
}

function updateTimeSchedule(bread) {
    let klaarTijd = new Date(document.getElementById("klaarTijd").value);
    if (isNaN(klaarTijd)) return;
    
    let tijden = bread.Tijden;
    let steps = [
        ["Rusten", tijden.rusten],
        ["Bakken", tijden.bakken],
        ["Rijzen", tijden.rijzen],
        ["Bollen", tijden.bollen],
        ["Voeden", tijden.voeden]
    ];
    
    let schemaHTML = "<ul>";
    for (let i = steps.length - 1; i >= 0; i--) {
        let minTijd = new Date(klaarTijd);
        let maxTijd = new Date(klaarTijd);
        
        minTijd.setHours(minTijd.getHours() - steps[i][1].max);
        maxTijd.setHours(maxTijd.getHours() - steps[i][1].min);
        
        schemaHTML += `<li>${steps[i][0]}: ${formatDate(minTijd)} - ${formatDate(maxTijd)}</li>`;
        klaarTijd = minTijd;
    }
    document.getElementById("timeSchedule").innerHTML = schemaHTML + "</ul>";
}

function formatDate(date) {
    return date.toLocaleDateString("nl-BE", { weekday: 'long', hour: '2-digit', minute: '2-digit' });
}
