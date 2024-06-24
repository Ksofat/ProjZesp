function showInput(type) {
    // Hide all inputs and remove selected class from all buttons
    const inputs = ['phone', 'password', 'address'];
    inputs.forEach(input => {
        document.getElementById(input + 'Input').classList.add('is-hidden');
        document.getElementById(input + 'Button').classList.remove('is-selected');
    });

    // Show the selected input and add selected class to the button
    document.getElementById(type + 'Input').classList.remove('is-hidden');
    document.getElementById(type + 'Button').classList.add('is-selected');
}

async function saveChanges(type) {
    const inputElement = document.getElementById(type + 'Input').querySelector('input');
    const value = inputElement.value;
    const errorMessage = document.getElementById('errorMessage'); // Get the error message element
    const successMessage = document.getElementById('successMessage'); // Get the success message element

    if (type === 'phone') {
        // Validate phone number format on the client side as well
        if (!/^\d{9}$/.test(value)) {
            errorMessage.textContent = 'Invalid phone number format';
            errorMessage.classList.remove('is-hidden');
            setTimeout(() => {
                errorMessage.classList.add('is-hidden');
            }, 3000);
            return;
        }

        // Fetch the userId asynchronously
        const userId = await fetchUserId();
        if (!userId) {
            errorMessage.textContent = 'User ID could not be fetched. Please try again.';
            errorMessage.classList.remove('is-hidden');
            setTimeout(() => {
                errorMessage.classList.add('is-hidden');
            }, 3000);
            return;
        }

        fetch(`/api/users/${userId}/phone`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ phonenumber: value })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                errorMessage.textContent = 'Error: ' + data.error;
                errorMessage.classList.remove('is-hidden');
                setTimeout(() => {
                    errorMessage.classList.add('is-hidden');
                }, 3000);
            } else {
                successMessage.textContent = 'Phone number updated successfully! The page will reload in 3 seconds.';
                successMessage.classList.remove('is-hidden');
                setTimeout(() => {
                    closeOptionsModal();
                    window.location.reload();
                }, 3000);
            }
        })
        .catch(error => {
            console.error('Error updating phone number:', error);
            errorMessage.textContent = 'Failed to update phone number';
            errorMessage.classList.remove('is-hidden');
            setTimeout(() => {
                errorMessage.classList.add('is-hidden');
            }, 3000);
        });
    } 
    if (type === 'password') {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        // Check for empty fields
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            errorMessage.textContent = 'Please fill in all fields.';
            errorMessage.classList.remove('is-hidden');
            setTimeout(() => {
                errorMessage.classList.add('is-hidden');
            }, 3000);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            errorMessage.textContent = 'New passwords do not match.';
            errorMessage.classList.remove('is-hidden');
            setTimeout(() => {
                errorMessage.classList.add('is-hidden');
            }, 3000);
            return;
        }

        const userId = await fetchUserId();
        if (!userId) {
            errorMessage.textContent = 'User ID could not be fetched. Please try again.';
            errorMessage.classList.remove('is-hidden');
            setTimeout(() => {
                errorMessage.classList.add('is-hidden');
            }, 3000);
            return;
        }

        fetch(`/api/users/${userId}/password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                errorMessage.textContent = 'Error: ' + data.error;
                errorMessage.classList.remove('is-hidden');
                setTimeout(() => {
                    errorMessage.classList.add('is-hidden');
                }, 3000);
            } else {
                successMessage.textContent = 'Password updated successfully! The page will reload in 3 seconds.';
                successMessage.classList.remove('is-hidden');
                setTimeout(() => {
                    successMessage.classList.add('is-hidden');
                    closeOptionsModal();
                    window.location.reload();
                }, 3000);
            }
        })
        .catch(error => {
            console.error('Error updating password:', error);
            errorMessage.textContent = 'Failed to update password';
            errorMessage.classList.remove('is-hidden');
            setTimeout(() => {
                errorMessage.classList.add('is-hidden');
            }, 3000);
        });
    }
    if (type === 'address') {
        const street = document.getElementById('street').value.trim();
        const buildingnumber = document.getElementById('buildingnumber').value.trim();
        const apartmentnumber = document.getElementById('apartmentnumber').value.trim();
        const city = document.getElementById('city').value.trim();
        const postalcode = document.getElementById('postalcode').value.trim();

        // Check for empty fields
        if (!street || !buildingnumber || !city || !postalcode) {
            errorMessage.textContent = 'Please fill in all required fields.';
            errorMessage.classList.remove('is-hidden');
            setTimeout(() => {
                errorMessage.classList.add('is-hidden');
            }, 3000);
            return;
        }

        const userId = await fetchUserId();
        if (!userId) {
            errorMessage.textContent = 'User ID could not be fetched. Please try again.';
            errorMessage.classList.remove('is-hidden');
            setTimeout(() => {
                errorMessage.classList.add('is-hidden');
            }, 3000);
            return;
        }

        fetch(`/api/user/address`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ street, buildingnumber, apartmentnumber, city, postalcode })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                errorMessage.textContent = 'Error: ' + data.error;
                errorMessage.classList.remove('is-hidden');
                setTimeout(() => {
                    errorMessage.classList.add('is-hidden');
                }, 3000);
            } else {
                successMessage.textContent = 'Address updated successfully! The page will reload in 3 seconds.';
                successMessage.classList.remove('is-hidden');
                setTimeout(() => {
                    successMessage.classList.add('is-hidden');
                    closeOptionsModal();
                    window.location.reload();
                }, 3000);
            }
        })
        .catch(error => {
            console.error('Error updating address:', error);
            errorMessage.textContent = 'Failed to update address';
            errorMessage.classList.remove('is-hidden');
            setTimeout(() => {
                errorMessage.classList.add('is-hidden');
            }, 3000);
        });
    }
}
