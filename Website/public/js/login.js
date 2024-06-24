function openModal(modalId) {
    document.getElementById(modalId).classList.add('is-active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('is-active');
}

function filterNonDigits(event) {
    const keyCode = event.which ? event.which : event.keyCode;
    if (keyCode > 31 && (keyCode < 48 || keyCode > 57)) {
        event.preventDefault();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const formData = new FormData(loginForm);
            const jsonData = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(jsonData)
                });

                if (response.ok) {
                    const result = await response.json();
                    const token = 'user_token_here';  // This should be the token you receive from your authentication API
                    sessionStorage.setItem('authToken', token);
                    console.log('Login successful:', result);
                    closeModal('loginModal');
                    window.location.reload();
                } else {
                    const error = await response.json();
                    const loginErrorMessage = document.getElementById('loginErrorMessage');
                    loginErrorMessage.textContent = 'Login failed: ' + error.error;
                    loginErrorMessage.classList.remove('is-hidden');
                }
            } catch (error) {
                console.error('Failed to submit login form:', error);
                const loginErrorMessage = document.getElementById('loginErrorMessage');
                loginErrorMessage.textContent = 'Login failed: ' + error.message;
                loginErrorMessage.classList.remove('is-hidden');
            }
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const formData = new FormData(signupForm);
            const jsonData = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(jsonData)
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Signup successful:', result);
                    const signupSuccessMessage = document.getElementById('signupSuccessMessage');
                    const signupErrorMessage = document.getElementById('signupErrorMessage');
                    signupSuccessMessage.textContent = 'Signup successful! Please log in. This will close in 5 seconds.';
                    signupSuccessMessage.classList.remove('is-hidden');
                    signupErrorMessage.classList.add('is-hidden');
                    setTimeout(() => {
                        closeModal('signupModal');
                        window.location.reload();
                    }, 5000); // Close modal and reload after 5 seconds
                } else {
                    const error = await response.json();
                    const signupErrorMessage = document.getElementById('signupErrorMessage');
                    signupErrorMessage.textContent = 'Signup failed: ' + error.error;
                    signupErrorMessage.classList.remove('is-hidden');
                }
            } catch (error) {
                console.error('Failed to submit signup form:', error);
                const signupErrorMessage = document.getElementById('signupErrorMessage');
                signupErrorMessage.textContent = 'Signup failed: ' + error.message;
                signupErrorMessage.classList.remove('is-hidden');
            }
        });
    }
});

function getAuthToken() {
    return sessionStorage.getItem('authToken');
}

function checkUserLoggedIn() {
    fetch('/api/is-logged-in')
        .then(response => response.json())
        .then(data => {
            const authButtons = document.getElementById('auth-buttons');
            const signInLink = document.getElementById('signInLink');
            const logInLink = document.getElementById('logInLink');
            const navbarEnd = document.querySelector('.navbar-end');

            authButtons.innerHTML = ''; // Clear previous auth buttons

            if (data.isLoggedIn) {
                console.log('User is logged in.');
                signInLink.style.display = 'none';
                logInLink.style.display = 'none';

                // Add a Cart button
                const cartButton = document.createElement('a');
                cartButton.className = 'navbar-item is-black has-text-weight-bold has-text-primary-dark';
                cartButton.textContent = 'Cart';
                cartButton.onclick = function() { openModal('cartModal'); };
                navbarEnd.appendChild(cartButton);

                // Create a div to group tags with 'has-addons'
                const cartInfo = document.createElement('div');
                cartInfo.className = 'tags has-addons';

                // Create a span element for the cart counter
                const cartCounter = document.createElement('span');
                cartCounter.id = 'cartCounter';
                cartCounter.className = 'tag is-primary ml-2';
                cartCounter.textContent = 'Items in Cart: 0';

                // Create a span element for the cart total cost
                const cartTotalCost = document.createElement('span');
                cartTotalCost.id = 'cartTotalCost';
                cartTotalCost.className = 'tag is-link';
                cartTotalCost.textContent = 'Total: 0 zł';

                // Append the counter and total cost to the cartInfo div
                cartInfo.appendChild(cartCounter);
                cartInfo.appendChild(cartTotalCost);

                // Append the cartInfo to the Cart button
                cartButton.appendChild(cartInfo);

                // Append the Cart button to the navbar
                navbarEnd.appendChild(cartButton);

                // Add a Profile button
                const profileButton = document.createElement('a');
                profileButton.className = 'navbar-item';
                profileButton.textContent = 'Profile';
                profileButton.href = '/profile'; // Set the href to the URL of the profile page
                authButtons.appendChild(profileButton);

                // Add a logout button
                const logoutButton = document.createElement('a');
                logoutButton.className = 'navbar-item';
                logoutButton.textContent = 'Logout';
                logoutButton.onclick = function() { logoutUser(); };
                authButtons.appendChild(logoutButton);

                // Conditionally add Manager dropdown
                if (data.type === 'M') {
                    const managerDropdown = document.createElement('div');
                    managerDropdown.className = 'navbar-item has-dropdown is-hoverable';

                    const managerLink = document.createElement('a');
                    managerLink.className = 'navbar-link is-black has-text-weight-bold has-text-primary-dark';
                    managerLink.textContent = 'Manager Panel';

                    const dropdownMenu = document.createElement('div');
                    dropdownMenu.className = 'navbar-dropdown';

                    const productsLink = document.createElement('a');
                    productsLink.className = 'navbar-item';
                    productsLink.textContent = 'Products';
                    productsLink.href = '/manager/products';

                    const staffLink = document.createElement('a');
                    staffLink.className = 'navbar-item';
                    staffLink.textContent = 'Staff';
                    staffLink.href = '/manager/staff';

                    const salesLink = document.createElement('a');
                    salesLink.className = 'navbar-item';
                    salesLink.textContent = 'Sales';
                    salesLink.href = '/manager/sales';

                    dropdownMenu.appendChild(productsLink);
                    dropdownMenu.appendChild(staffLink);
                    dropdownMenu.appendChild(salesLink);

                    managerDropdown.appendChild(managerLink);
                    managerDropdown.appendChild(dropdownMenu);

                    navbarEnd.appendChild(managerDropdown);
                }

                // Conditionally add Worker dropdown
                if (data.type === 'W') {
                    const workerDropdown = document.createElement('div');
                    workerDropdown.className = 'navbar-item has-dropdown is-hoverable';

                    const workerLink = document.createElement('a');
                    workerLink.className = 'navbar-link is-black has-text-weight-bold has-text-primary-dark';
                    workerLink.textContent = 'Worker Panel';

                    const dropdownMenu = document.createElement('div');
                    dropdownMenu.className = 'navbar-dropdown';

                    const productsLink = document.createElement('a');
                    productsLink.className = 'navbar-item';
                    productsLink.textContent = 'Products';
                    productsLink.href = '/worker/products';

                    dropdownMenu.appendChild(productsLink);

                    workerDropdown.appendChild(workerLink);
                    workerDropdown.appendChild(dropdownMenu);

                    navbarEnd.appendChild(workerDropdown);
                }
                initializeCart();
            } else {
                console.log('User is not logged in.');
                signInLink.style.display = 'block';
                logInLink.style.display = 'block';
            }
        })
        .catch(error => console.error('Error checking login status:', error));
}

function logoutUser() {
    fetch('/api/logout', { method: 'POST' })
        .then(() => {
            console.log('Logged out successfully.');
                // Redirect to home page or update UI
                window.location.reload();
            })
            .catch(error => console.error('Error logging out:', error));
}

function togglePasswordVisibility(passwordInputId, iconId) {
    var passwordInput = document.getElementById(passwordInputId);
    var icon = document.getElementById(iconId);
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = "password";
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}