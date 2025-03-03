$(document).ready(function() {
    // Load bread data from the JSON file
    let breadData;

    $.getJSON('bread_data.json', function(data) {
        breadData = data;
    });

    // Function to update the displayed dough weight
    $('#doughWeight').on('input', function() {
        $('#doughWeightValue').text($(this).val() + ' g');
    });

    // Calculate and display ingredients when the button is clicked
    $('#calculateBtn').click(function() {
        let breadTypeIndex = $('#breadType').val();
        let doughWeight = parseInt($('#doughWeight').val());

        let bread = breadData[breadTypeIndex];

        // Calculate the total weight of the bread ingredients (sum all columns except the first one)
        let totalWeight = 0;
        for (let key in bread) {
            if (key !== "Type") {
                totalWeight += bread[key];
            }
        }

        // Calculate the scaling factor based on desired dough weight
        let scalingFactor = doughWeight / totalWeight;

        // Calculate the required ingredients based on the scaling factor
        let ingredients = {};
        for (let key in bread) {
            if (key !== "Type") {
                ingredients[key] = Math.round(bread[key] * scalingFactor);
            }
        }

        // Display the calculated ingredients
        let ingredientsList = $('#ingredientsList');
        ingredientsList.empty(); // Clear previous results

        for (let ingredient in ingredients) {
            ingredientsList.append(
                `<li class="list-group-item d-flex justify-content-between align-items-center">
                    ${ingredient}
                    <span class="badge bg-primary rounded-pill">${ingredients[ingredient]} g</span>
                </li>`
            );
        }

        // Calculate the feeding amount for the starter
        let starterAmount = bread.Starter;
        let feed1 = starterAmount / 2.5;
        let feed2 = feed1 / 2.5;

        // Add feeding amounts to the list
        ingredientsList.append(
            `<li class="list-group-item d-flex justify-content-between align-items-center">
                1x Voeden
                <span class="badge bg-warning rounded-pill">${Math.round(feed1)} g</span>
            </li>`
        );
        ingredientsList.append(
            `<li class="list-group-item d-flex justify-content-between align-items-center">
                2x Voeden
                <span class="badge bg-warning rounded-pill">${Math.round(feed2)} g</span>
            </li>`
        );
    });
});
