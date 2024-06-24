function fetchProducts(searchQuery = '', category = '') {
    fetch('/api/is-logged-in')
        .then(response => response.json())
        .then(data => {
            const isLoggedIn = data.isLoggedIn;
            // Fetch the products and pass isLoggedIn along with the fetched products
            return fetch('/api/products/available').then(response => response.json().then(products => ({ products, isLoggedIn })));
        })
        .then(({ products, isLoggedIn }) => {
            const container = document.getElementById('products-container');
            container.innerHTML = ''; // Clear previous products
            
            products
                .filter(product => product.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .filter(product => category === '' || product.productcategory === category)
                .forEach((product, index) => {
                    const column = document.createElement('div');
                    column.className = 'column is-one-quarter';

                    let imageHTML = '<p>No image available</p>'; // Default if no image exists
                    if (product.image) {
                        const blob = new Blob([new Uint8Array(product.image.data)], { type: 'image/jpeg' });
                        const imageURL = URL.createObjectURL(blob);
                        imageHTML = `<img src="${imageURL}" alt="${product.name}" style="width: 100%;">`;
                    }

                    let addButtonHTML = '';
                    if (isLoggedIn) {  // Use isLoggedIn from the closure
                        addButtonHTML = `<footer class="card-footer">
                                            <p class="card-footer-item">
                                                <button class="button is-warning is-rounded" id="addButton-${index}">Add to cart</button>
                                            </p>
                                         </footer>`;
                    }

                    const cardHTML = `
                        <div class="card card-equal-height">
                            <div class="card-image">
                                <figure class="image">
                                    ${imageHTML}
                                </figure>
                            </div>
                            <div class="card-content">
                                <p class="title is-size-5">${product.name}</p>
                                <p>${product.description}</p>
                                <p>${product.productprice} zł</p>
                            </div>
                            ${addButtonHTML}
                        </div>
                    `;

                    column.innerHTML = cardHTML;
                    container.appendChild(column);

                    // Add event listener to the "Add to Cart" button
                    if (isLoggedIn) {
                        document.getElementById(`addButton-${index}`).addEventListener('click', () => {
                            prepareModalForExtras(product, index);
                        });
                    }
                });
        })
        .catch(error => console.error('Error fetching products:', error));
}

function fetchExtras() {
    fetch('/api/extras')
        .then(response => response.json())
        .then(extras => {
            // Extras are fetched and available in the 'extras' variable, but not displayed.
            //console.log('Extras fetched:', extras); // Optional: for debugging to see the extras in the console.
        })
        .catch(error => console.error('Error fetching extras:', error));
}

function fetchCategories() {
    fetch('/api/products/categories/available')
        .then(response => response.json())
        .then(categories => {
            const buttonContainer = document.querySelector('.field.has-addons');
            const allButton = document.getElementById('allButton');
            allButton.onclick = function() {
                // Remove is-warning from all buttons and add to 'All' button
                document.querySelectorAll('.field.has-addons .button').forEach(btn => {
                    btn.classList.remove('is-warning');
                });
                this.classList.add('is-warning');
                fetchProducts('');
            };

            categories.forEach(category => {
                const button = document.createElement('button');
                button.className = 'button';
                button.textContent = category.name;
                button.id = `categoryButton-${category.name}`;
                button.onclick = function() {
                    // Remove is-warning from all buttons
                    document.querySelectorAll('.field.has-addons .button').forEach(btn => {
                        btn.classList.remove('is-warning');
                    });
                    // Add is-warning to the clicked button
                    this.classList.add('is-warning');
                    fetchProducts('', category.name);
                };
                
                const p = document.createElement('p');
                p.className = 'control';
                p.appendChild(button);
                buttonContainer.appendChild(p);
            });
        })
        .catch(error => console.error('Error fetching categories:', error));
}