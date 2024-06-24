function fetchManagers() {
    fetch('/api/managers')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('managersTable').getElementsByTagName('tbody')[0];
            // Clear existing rows in the table body before adding new ones
            tableBody.innerHTML = '';

            data.forEach(manager => {
                let row = tableBody.insertRow();
                row.insertCell(0).textContent = manager.firstname;
                row.insertCell(1).textContent = manager.lastname;
                row.insertCell(2).textContent = manager.email;
                row.insertCell(3).textContent = manager.phonenumber;

                // Optionally, add a edit button for each manager
                let editCell = row.insertCell(4);
                editCell.style.textAlign = 'center';
                let editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.className = 'button is-info';
                editButton.onclick = function() { openManagerEditModal(manager); };
                editCell.appendChild(editButton);

                // Optionally, add a delete button for each manager
                let deleteCell = row.insertCell(5);
                deleteCell.style.textAlign = 'center';
                let deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'button is-danger';
                deleteButton.onclick = function() { deleteManager(manager.userid); };
                deleteCell.appendChild(deleteButton);
            });
        })
        .catch(error => console.error('Failed to load managers:', error));
}

function insertAddManagerForm() {
    const addRow = document.getElementById('addManagerRow');
    addRow.innerHTML = `
        <td><input class="input" type="text" id="newManagerFirstName" placeholder="First Name"></td>
        <td><input class="input" type="text" id="newManagerLastName" placeholder="Last Name"></td>
        <td><input class="input" type="email" id="newManagerEmail" placeholder="Email"></td>
        <td><input class="input" type="password" id="newManagerPassword" placeholder="Password">
        <input type="checkbox" onclick="togglePasswordVisibility('newManagerPassword', 'signupToggleIcon')"> Show Password</td>
        <td><input class="input" type="text" id="newManagerPhone" placeholder="Phone Number"></td>
        <td class="is-vcentered"><button class="button is-primary" onclick="addNewManager()">Add Manager</button></td>
    `;
}

function addNewManager() {
    const data = {
        firstname: document.getElementById('newManagerFirstName').value,
        lastname: document.getElementById('newManagerLastName').value,
        email: document.getElementById('newManagerEmail').value,
        password: document.getElementById('newManagerPassword').value,
        phonenumber: document.getElementById('newManagerPhone').value,
        type: 'M'
    }; 

    const warningMessageManager = document.getElementById('warningMessageManager');

    // Check if all fields are filled
    if (!data.firstname || !data.lastname || !data.email || !data.password || !data.phonenumber) {
        warningMessageManager.textContent = 'Please fill in all fields.';
        warningMessageManager.classList.remove('is-hidden');
        setTimeout(() => {
            warningMessageManager.classList.add('is-hidden');
        }, 3000); // Hide the message after 3 seconds
        return; // Stop the function if any field is empty
    }

    // Check if the password is at least 8 characters long
    if (data.password.length < 8) {
        warningMessageManager.textContent = 'Password must be at least 8 characters long.';
        warningMessageManager.classList.remove('is-hidden');
        setTimeout(() => {
            warningMessageManager.classList.add('is-hidden');
        }, 3000); // Hide the message after 3 seconds
        return; // Stop the function if the password is too short
    }

    // Proceed with the fetch request
    fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Success:', data);
            fetchManagers(); // Refresh the managers list
        } else {
            throw new Error(data.error || 'Failed to add manager');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        warningMessageManager.textContent = error.message;
        warningMessageManager.classList.remove('is-hidden');
        setTimeout(() => {
            warningMessageManager.classList.add('is-hidden');
        }, 3000); // Hide the message after 3 seconds
    });
}

function editManager(userId) {
    let data = {
        firstname: document.getElementById('editManagerFirstName').value,
        lastname: document.getElementById('editManagerLastName').value,
        email: document.getElementById('editManagerEmail').value,
        phonenumber: document.getElementById('editManagerPhone').value,
        type: 'M' // Assuming the type remains 'M' for managers
    };

    // Only add password to the payload if it's not empty
    const password = document.getElementById('editManagerPassword').value;
    if (password) {
        data.password = password;
    }

    fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Failed to update manager:', data.error);
        } else {
            console.log('Manager updated successfully:', data);
            fetchManagers(); // Refresh the managers list
            closeManagerEditModal();
        }
    })
    .catch(error => {
        console.error('Error updating manager:', error);
    });
}

function submitEditManager() {
    const userId = document.getElementById('editManagerUserId').value; // Ensure you have a hidden input for userId in your form
    editManager(userId);
}

function deleteManager(userId) {
    fetch(`/api/users/${userId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            fetchManagers(); // Refresh the list after deletion
        } else {
            throw new Error('Failed to delete manager');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}