function fetchWorkers() {
    fetch('/api/workers')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('workersTable').getElementsByTagName('tbody')[0];
            // Clear existing rows in the table body before adding new ones
            tableBody.innerHTML = '';

            data.forEach(workers => {
                let row = tableBody.insertRow();
                row.insertCell(0).textContent = workers.firstname;
                row.insertCell(1).textContent = workers.lastname;
                row.insertCell(2).textContent = workers.email;
                row.insertCell(3).textContent = workers.phonenumber;

                // Optionally, add a edit button for each workers
                let editCell = row.insertCell(4);
                editCell.style.textAlign = 'center';
                let editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.className = 'button is-info';
                editButton.onclick = function() { openWorkerEditModal(workers); };
                editCell.appendChild(editButton);

                // Optionally, add a delete button for each workers
                let deleteCell = row.insertCell(5);
                deleteCell.style.textAlign = 'center';
                let deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'button is-danger';
                deleteButton.onclick = function() { deleteWorker(workers.userid); };
                deleteCell.appendChild(deleteButton);
            });
        })
        .catch(error => console.error('Failed to load workers:', error));
}

function insertAddWorkerForm() {
    const addRow = document.getElementById('addWorkerRow');
    addRow.innerHTML = `
        <td><input class="input" type="text" id="newWorkerFirstName" placeholder="First Name"></td>
        <td><input class="input" type="text" id="newWorkerLastName" placeholder="Last Name"></td>
        <td><input class="input" type="email" id="newWorkerEmail" placeholder="Email"></td>
        <td><input class="input" type="password" id="newWorkerPassword" placeholder="Password" pattern=".{8,}">
        <input type="checkbox" onclick="togglePasswordVisibility('newWorkerPassword', 'signupToggleIcon')"> Show Password</td>
        <td><input class="input" type="text" id="newWorkerPhone" placeholder="Phone Number"></td>
        <td class="is-vcentered"><button class="button is-primary" onclick="addNewWorker()">Add Worker</button></td>
    `;
}

function addNewWorker() {
    const data = {
        firstname: document.getElementById('newWorkerFirstName').value,
        lastname: document.getElementById('newWorkerLastName').value,
        email: document.getElementById('newWorkerEmail').value,
        password: document.getElementById('newWorkerPassword').value,
        phonenumber: document.getElementById('newWorkerPhone').value,
        type: 'W'
    };

    const warningMessageWorker = document.getElementById('warningMessageWorker');

    // Check if all fields are filled
    if (!data.firstname || !data.lastname || !data.email || !data.password || !data.phonenumber) {
        warningMessageWorker.textContent = 'Please fill in all fields.';
        warningMessageWorker.classList.remove('is-hidden');
        setTimeout(() => {
            warningMessageWorker.classList.add('is-hidden');
        }, 3000); // Hide the message after 3 seconds
        return; // Stop the function if any field is empty
    }

    // Check if the password is at least 8 characters long
    if (data.password.length < 8) {
        warningMessageWorker.textContent = 'Password must be at least 8 characters long.';
        warningMessageWorker.classList.remove('is-hidden');
        setTimeout(() => {
            warningMessageWorker.classList.add('is-hidden');
        }, 3000); // Hide the message after 3 seconds
        return; // Stop the function if the password is too short
    }

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
        warningMessageWorker.textContent = error.message;
        warningMessageWorker.classList.remove('is-hidden');
        setTimeout(() => {
            warningMessageWorker.classList.add('is-hidden');
        }, 3000); // Hide the message after 3 seconds
    });
}

function editWorker(userId) {
    let data = {
        firstname: document.getElementById('editWorkerFirstName').value,
        lastname: document.getElementById('editWorkerLastName').value,
        email: document.getElementById('editWorkerEmail').value,
        phonenumber: document.getElementById('editWorkerPhone').value,
        type: 'W' // Assuming the type remains 'W' for workers
    };

    // Only add password to the payload if it's not empty
    const password = document.getElementById('editWorkerPassword').value;
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
            console.error('Failed to update worker:', data.error);
        } else {
            console.log('Worker updated successfully:', data);
            fetchWorkers(); // Refresh the workers list
            closeWorkerEditModal();
        }
    })
    .catch(error => {
        console.error('Error updating worker:', error);
    });
}

function submitEditWorker() {
    const userId = document.getElementById('editWorkerUserId').value; // Ensure you have a hidden input for userId in your form
    editWorker(userId);
}

function deleteWorker(userId) {
    fetch(`/users/${userId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            fetchWorkers(); // Refresh the list after deletion
        } else {
            throw new Error('Failed to delete worker');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}