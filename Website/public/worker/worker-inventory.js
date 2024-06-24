function fetchInventory() {
    fetch('/inventory')
        .then(response => response.json())
        .then(items => {
            const container = document.getElementById('inventory-container');
            if (!container) {
                console.error('Error: inventory-container element not found');
                return;
            }
            // Remove only the item cards, not the add new item card
            const existingItemCards = container.querySelectorAll('.item-card');
            existingItemCards.forEach(card => card.remove());

            items.forEach((item, index) => {
                const column = document.createElement('div');
                column.className = 'column is-one-quarter item-card'; // Use 'item-card' class for item cards

                const buttonsHTML = `<footer class="card-footer">
                                        <p class="card-footer-item">
                                            <button class="button is-info is-rounded" id="editButton-${index}" onclick="editItem('${item.inventoryid}', this)">Edit</button>
                                        </p>
                                        <p class="card-footer-item">
                                            <button class="button is-danger is-rounded" id="deleteButton-${index}" onclick="deleteItem('${item.inventoryid}')">Delete</button>
                                        </p>
                                    </footer>`;

                const cardHTML = `
                    <div class="card">
                        <div class="card-content">
                            <p class="title is-4">${item.itemname}</p>
                            <p class="subtitle is-6">${item.itemquantity}</p>
                        </div>
                        ${buttonsHTML}
                    </div>
                `;

                column.innerHTML = cardHTML;
                container.appendChild(column);
            });
        })
        .catch(error => console.error('Error fetching inventory:', error));
}

function deleteItem(itemId) {
    console.log("Attempting to delete item with ID:", itemId); // Log for debugging
    if (confirm('Are you sure you want to delete this item?')) {
        fetch(`/inventory/${itemId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete item');
            }
            console.log('Item deleted successfully');
            fetchInventory();
        })
        .catch(error => {
            console.error('Error deleting item:', error);
        });
    }
}

function editItem(itemId, buttonElement) {
    fetch(`/inventory/${itemId}`)
        .then(response => response.json())
        .then(item => {
            document.getElementById('edit-item-id').value = itemId;
            document.getElementById('edit-item-name').value = item.itemname;
            document.getElementById('edit-item-quantity').value = item.itemquantity;

            document.getElementById('edit-item-modal').classList.add('is-active');
        })
        .catch(error => console.error('Error fetching item details:', error));
}

function submitItemEdit() {
    const itemId = document.getElementById('edit-item-id').value;
    const formData = new FormData();
    formData.append('itemname', document.getElementById('edit-item-name').value);
    formData.append('itemquantity', document.getElementById('edit-item-quantity').value);

    fetch(`/inventory/${itemId}`, {
        method: 'PUT',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update item');
        }
        return response.json();
    })
    .then(updatedItem => {
        console.log('Item updated successfully:', updatedItem);
        fetchInventory(); // Refresh the inventory list
        document.getElementById('edit-item-modal').classList.remove('is-active'); // Hide the modal/form
    })
    .catch(error => {
        console.error('Error updating item:', error);
        alert('Error updating item: ' + error.message);
    });
}