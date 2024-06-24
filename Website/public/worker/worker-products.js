document.addEventListener('DOMContentLoaded', function() {
    fetchProducts();
});

function fetchProducts() {
    fetch('/api/products')
        .then(response => response.json())
        .then(products => {
            const container = document.getElementById('products-container');
            // Remove only the product cards, not the add new product card
            const existingProductCards = container.querySelectorAll('.product-card');
            existingProductCards.forEach(card => card.remove());

            products.forEach((product, index) => {
                const column = document.createElement('div');
                column.className = 'column is-one-quarter product-card'; // Use 'product-card' class for product cards

                let imageHTML = '<p>No image available</p>'; // Default if no image exists
                if (product.image) {
                    const blob = new Blob([new Uint8Array(product.image.data)], { type: 'image/jpeg' });
                    const imageURL = URL.createObjectURL(blob);
                    imageHTML = `<img src="${imageURL}" alt="${product.name}" style="width: 100%;">`;
                }

                // Add lock status indicator
                const lockStatus = product.is_locked ? '<span class="tag is-danger">Locked</span>' : '<span class="tag is-success">Available</span>';

                const buttonsHTML = `<footer class="card-footer">
                                        <p class="card-footer-item">
                                            <button class="button is-info is-rounded" id="editButton-${index}" onclick="editProduct('${product.productid}', this)">Edit</button>
                                        </p>
                                    </footer>`;

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
                            <p>${product.productcategory}</p>
                            <p class="has-text-centered">${lockStatus}</p>
                        </div>
                        ${buttonsHTML}
                    </div>
                `;

                column.innerHTML = cardHTML;
                container.appendChild(column);
            });
        })
        .catch(error => console.error('Error fetching products:', error));
}

function editProduct(productId, buttonElement) {
    fetch(`/api/products/${productId}`)
        .then(response => response.json())
        .then(product => {
            document.getElementById('edit-product-id').value = productId;
            document.getElementById('edit-product-name').value = product.name;
            document.getElementById('edit-product-description').value = product.description;
            document.getElementById('edit-product-price').value = product.productprice;
            document.getElementById('edit-product-category').value = product.productcategory;
            document.getElementById('edit-product-locked').checked = product.is_locked;

            document.getElementById('edit-product-modal').classList.add('is-active');
        })
        .catch(error => console.error('Error fetching product details:', error));
}

function submitProductEdit() {
    const productId = document.getElementById('edit-product-id').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('edit-product-name').value);
    formData.append('description', document.getElementById('edit-product-description').value);
    formData.append('productprice', document.getElementById('edit-product-price').value);
    formData.append('productcategory', document.getElementById('edit-product-category').value);
    formData.append('is_locked', document.getElementById('edit-product-locked').checked);

    const imageFile = document.getElementById('edit-product-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    } else {
        // Only append the flag if no new image is provided
        formData.append('keep_existing_image', 'true');
    }

    fetch(`/api/products/${productId}`, {
        method: 'PUT',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update product');
        }
        return response.json();
    })
    .then(updatedProduct => {
        console.log('Product updated successfully:', updatedProduct);
        fetchProducts(); // Refresh the product list
        document.getElementById('edit-product-modal').classList.remove('is-active'); // Hide the modal/form
    })
    .catch(error => {
        console.error('Error updating product:', error);
        alert('Error updating product: ' + error.message);
    });
}