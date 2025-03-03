$(document).ready(function() {
    // Load bread data from the JSON file
    let breadData;

    $.getJSON('bread_data.json', function(data) {
        breadData = data;
        populateDropdown();  // Populate dropdown with bread types
        updateIngredients();  // Update ingredients on initial load
    });

    // Function to populate the dropdown dynamically
    function populateDropdown() {
        let dropdown = $('#breadType');
        dropdown.empty(); // Clear existing options

        $.each(breadData, function(index, bread) {
            dropdown.append($('<option></option>').attr('value', index).text(bread.Type));
        });

        dropdown.trigger('change'); // Trigger change to update ingredients
    }

    // Function to update the displayed dough weight
    function updateWeight(value) {
        let weightInput = $('#doughWeight');
        let newWeight = parseInt(weightInput.val()) + value;
        if (newWeight >= 500 && newWeight <= 5000) {
            weightInput.val(newWeight);
            $('#doughWeightValue').text(newWeight + ' g');
            updateIngredients();
        }
    }

    $('#increaseWeight').click(function() {
        updateWeight(100);
    });

    $('#decreaseWeight').click(function() {
        updateWeight(-100);
    });

    $('#doughWeight').on('input', function() {
        let weight = parseInt($(this).val());
        if (weight >= 500 && weight <= 5000) {
            $('#doughWeightValue').text(weight + ' g');
            updateIngredients();
        }
    });

    // Function to update ingredients when bread type or dough weight changes
    $('#breadType').change(function() {
        updateIngredients();  // Update ingredients when bread type changes
    });

    // Function to update ingredients list based on the selected bread type and dough weight
    function updateIngredients() {
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
            // Only show ingredients that have a value greater than 0g
            if (ingredients[ingredient] > 0) {
                ingredientsList.append(
                    `<li class="list-group-item d-flex justify-content-between align-items-center">
                        <span class="ingredient-amount">${ingredients[ingredient]} g</span>
                        <span class="ingredient-name">${ingredient}</span>
                    </li>`
                );
            }
        }

        // Calculate the feeding amount for the starter
        let starterAmount = Math.round(bread.Starter * scalingFactor);
        let feed1 = starterAmount / 2.5;
        let feed2 = feed1 / 2.5;

        // Create a new section for "Voeden"
        let feedList = $('#feedList');
        feedList.empty(); // Clear previous feed results

        // Add feeding amounts to the list, only if greater than 0g
        if (feed1 > 0) {
            feedList.append(
                `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span class="ingredient-amount">${Math.round(feed1)} g</span>
                    <span class="ingredient-name">1x Voeden</span>
                </li>`
            );
        }

        if (feed2 > 0) {
            feedList.append(
                `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span class="ingredient-amount">${Math.round(feed2)} g</span>
                    <span class="ingredient-name">2x Voeden</span>
                </li>`
            );
        }
    }
});
