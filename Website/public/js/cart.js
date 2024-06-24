function initializeCart() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('Cart initialized:', cart);
    updateCartModal(cart);
}

function fetchExtrasFM() {
    return fetch('/api/extras')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function cartLength(cart) {
    return cart.length;
}

function calculateTotalCost(cart) {
    return cart.reduce((acc, item) => acc + parseFloat(item.price), 0);
}

function updateCartModal(cart) {
    const container = document.getElementById('cartItemsContainer');
    container.innerHTML = ''; // Clear previous contents

    if (cart.length === 0) {
        container.innerHTML = '<tr><td colspan="4">Your cart is empty.</td></tr>';
    } else {
        cart.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.description || 'No description'}</td>
                <td>${item.price} zł</td>
                <td><button class="button is-danger" onclick="removeFromCart(${index})">Remove</button></td>
            `;
            container.appendChild(row);
        });
    }
    updateCounters(cart);
}

function updateCounters(cart) {
    const cartCounter = document.getElementById('cartCounter');
    const cartTotalCost = document.getElementById('cartTotalCost');
    const cartTotalCostModal = document.getElementById('total-cost');

    cartCounter.textContent = 'Items in Cart: ' + cartLength(cart);
    let totalCost = calculateTotalCost(cart);
    cartTotalCost.textContent = 'Total: ' + totalCost + ' zł';
    cartTotalCostModal.textContent = 'Total: ' + totalCost + ' zł';
}

function prepareModalForExtras(product, index) {
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
        <p class="subtitle">${product.name} with:</p>
        <table class="table is-fullwidth is-hoverable is-striped">
            <thead>
                <tr class="is-selected has-background-black has-text-centered">
                    <th>Extra</th>
                    <th>Price</th>
                    <th>Select</th>
                </tr>
            </thead>
            <tbody id="extras-options"></tbody>
            <tfoot>
                <tr class="is-selected has-background-black">
                    <th colspan="3" id="current-price-display" class="has-text-centered">
                        Current Price: ${parseFloat(product.productprice).toFixed(2)} zł
                    </th>
                </tr>
            </tfoot>
        </table>
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('has-text-centered');

    const addButton = document.createElement('button');
    addButton.textContent = 'Add to Cart with Extras';
    addButton.classList.add('button', 'is-success');
    addButton.addEventListener('click', () => addToCartWithExtras(product, index));

    buttonContainer.appendChild(addButton);
    modalContent.appendChild(buttonContainer);

    fetchExtrasFM().then(extras => {
        const extrasOptions = document.getElementById('extras-options');
        const currentPriceDisplay = document.getElementById('current-price-display');
        let currentPrice = parseFloat(product.productprice);

        extras.forEach(extra => {
            const isChecked = extra.name === "nothing"; // Check if the extra's name is "Nothing"
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${extra.name}</td>
                <td class="has-text-centered">${extra.extrasprice} zł</td>
                <td class="has-text-centered">
                    <input type="checkbox" id="extra-${extra.extrasid}" value="${extra.extrasid}" ${isChecked ? 'checked' : ''}>
                    <label for="extra-${extra.extrasid}" class="is-hidden">${extra.name} - zł${extra.extrasprice}</label>
                </td>
            `;
            extrasOptions.appendChild(row);
        });

        // Add event listeners to manage checkbox states and update price
        const checkboxes = document.querySelectorAll('#extras-options input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const extraPrice = parseFloat(document.querySelector(`label[for="${checkbox.id}"]`).textContent.split(' - zł')[1]);
                if (checkbox.checked) {
                    currentPrice += extraPrice;
                } else {
                    currentPrice -= extraPrice;
                }
                currentPriceDisplay.textContent = `Current Price: ${currentPrice.toFixed(2)} zł`;

                // Manage "Nothing" checkbox logic
                if (checkbox.checked && checkbox.nextElementSibling.textContent.startsWith("nothing -")) {
                    checkboxes.forEach(cb => {
                        if (cb !== checkbox) {
                            cb.checked = false;
                            currentPrice = parseFloat(product.productprice); // Reset to base price
                            currentPriceDisplay.textContent = `Current Price: ${currentPrice.toFixed(2)} zł`;
                        }
                    });
                } else if (checkbox.checked) {
                    const nothingCheckbox = Array.from(checkboxes).find(cb => cb.nextElementSibling.textContent.startsWith("nothing -"));
                    if (nothingCheckbox && nothingCheckbox.checked) {
                        nothingCheckbox.checked = false;
                        currentPrice -= parseFloat(document.querySelector(`label[for="${nothingCheckbox.id}"]`).textContent.split(' - zł')[1]);
                        currentPriceDisplay.textContent = `Current Price: ${currentPrice.toFixed(2)} zł`;
                    }
                }
            });
        });
    }).catch(error => {
        console.error('Error fetching extras:', error);
        modalContent.innerHTML += '<p>Error loading extras. Please try again later.</p>';
    });

    openModal('extrasModal');
}

// Function to add product and selected extras to cart
function addToCartWithExtras(product, index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const selectedExtras = [];
    let extrasTotalPrice = 0; // Initialize total price of extras

    document.querySelectorAll('#extras-options input[type="checkbox"]:checked').forEach(checkbox => {
        const label = document.querySelector(`label[for="${checkbox.id}"]`).textContent;
        const name = label.split(' - zł')[0];
        const price = parseFloat(label.split(' - zł')[1]); // Extract price from label

        selectedExtras.push({
            id: checkbox.value,
            name: name,
            price: price // Store price for each extra
        });

        extrasTotalPrice += price; // Add to total price of extras
    });

    const totalPrice = parseFloat(product.productprice) + extrasTotalPrice; // Sum product price and extras price

    // Check if the product with the same extras already exists in the cart
    const existingItemIndex = cart.findIndex(item => item.productid === product.id && JSON.stringify(item.extras) === JSON.stringify(selectedExtras));
    if (existingItemIndex !== -1) {
        // Update the existing item's price
        cart[existingItemIndex].price = totalPrice.toFixed(2);
    } else {
        // Add new item to the cart
        cart.push({
            productid: product.productid, // Ensure productid is included
            name: product.name,
            description: selectedExtras.map(extra => extra.name).join(', '),
            extras: selectedExtras,
            price: totalPrice.toFixed(2) // Store total price as a formatted string
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('Product with extras added to cart:', product.name, selectedExtras.map(extra => extra.name).join(', '));

    updateCartModal(cart);
    showNotification('Product added: ' + product.name);

    closeModal('extrasModal'); // Use the closeModal function to hide the modal
}

function addToCart(product, index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push({
        productid: product.productid,
        name: product.name,
        description: product.description,
        price: product.productprice
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('Product added to cart:', product.name);
    updateCartModal(cart);
    showNotification('Product added: ' + product.name);
}

function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartModal(cart);
}

function checkout() {
    window.location.href = '/checkout';
}