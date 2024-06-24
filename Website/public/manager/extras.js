document.addEventListener('DOMContentLoaded', function() {
    fetchExtras();
});

function fetchExtras() {
    fetch('/api/extras')
        .then(response => response.json())
        .then(extras => {
            const container = document.getElementById('extras-container');
            // Remove only the extra cards, not the add new extra card
            const existingExtraCards = container.querySelectorAll('.extra-card');
            existingExtraCards.forEach(card => card.remove());

            extras.forEach((extra, index) => {
                const column = document.createElement('div');
                column.className = 'column is-one-quarter extra-card'; // Use 'extra-card' class for extra cards

                const buttonsHTML = `<footer class="card-footer">
                                        <p class="card-footer-item">
                                            <button class="button is-info is-rounded" id="editButton-${index}" onclick="editExtra('${extra.extrasid}', this)">Edit</button>
                                        </p>
                                        <p class="card-footer-item">
                                            <button class="button is-danger is-rounded" id="deleteButton-${index}" onclick="deleteExtra('${extra.extrasid}')">Delete</button>
                                        </p>
                                    </footer>`;

                const cardHTML = `
                    <div class="card">
                        <div class="card-content">
                            <p class="title is-4">${extra.name}</p>
                            <p class="subtitle is-6">${extra.extrasprice} zł</p>
                            <p>${extra.extrascategory || 'No category'}</p>
                        </div>
                        ${buttonsHTML}
                    </div>
                `;

                column.innerHTML = cardHTML;
                container.appendChild(column);
            });
        })
        .catch(error => console.error('Error fetching extras:', error));
}

function deleteExtra(extraId) {
    console.log("Attempting to delete extra with ID:", extraId); // Log for debugging
    if (confirm('Are you sure you want to delete this extra?')) {
        fetch(`/api/extras/id/${extraId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete extra');
            }
            console.log('Extra deleted successfully');
            fetchExtras();
        })
        .catch(error => {
            console.error('Error deleting extra:', error);
        });
    }
}

function editExtra(extraId, buttonElement) {
    fetch(`/api/extras/id/${extraId}`)
        .then(response => response.json())
        .then(extra => {
            document.getElementById('edit-extra-id').value = extraId;
            document.getElementById('edit-extra-name').value = extra.name;
            document.getElementById('edit-extra-price').value = extra.extrasprice;
            document.getElementById('edit-extra-category').value = extra.extrascategory;

            document.getElementById('edit-extra-modal').classList.add('is-active');
        })
        .catch(error => console.error('Error fetching extra details:', error));
}

function submitExtraEdit() {
    const extraId = document.getElementById('edit-extra-id').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('edit-extra-name').value);
    formData.append('extrasprice', document.getElementById('edit-extra-price').value);
    formData.append('extrascategory', document.getElementById('edit-extra-category').value);

    fetch(`/api/extras/id/${extraId}`, {
        method: 'PUT',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update extra');
        }
        return response.json();
    })
    .then(updatedExtra => {
        console.log('Extra updated successfully:', updatedExtra);
        fetchExtras(); // Refresh the extras list
        document.getElementById('edit-extra-modal').classList.remove('is-active'); // Hide the modal/form
    })
    .catch(error => {
        console.error('Error updating extra:', error);
        alert('Error updating extra: ' + error.message);
    });
}