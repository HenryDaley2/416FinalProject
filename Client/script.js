// DOES NOT WORK PLEASE FIX
// the /portfolio/${userId} works and pulls all nescessary data,
// can see the data in the terminal.
async function displayPortfolio(UserID) {
    try {
        // Fetch the portfolio data
        const portfolioResponse = await fetch(`/portfolio/${UserID}`);
        if (!portfolioResponse.ok) {
            throw new Error(`HTTP error! status: ${portfolioResponse.status}`);
        }
        const portfolio = await portfolioResponse.json();
        console.log('Portfolio data:', portfolio); // Log fetched portfolio data

        const portfolioTable = document.getElementById("portfolio");
        if (!portfolioTable) {
            console.error("Portfolio table element not found in the DOM.");
            return;
        }

        // Clear previous content
        portfolioTable.innerHTML = ''; 

        portfolio.forEach(stock => {
            const stockBox = document.createElement("div");
            stockBox.className = "stock-box";
            stockBox.innerHTML = `
                <h3>${stock.TickerSymbol}</h3>
                <p>Shares Owned: ${stock.SharesOwned}</p>
                <p>Open Price: $${stock.OpenPrice.toFixed(2)}</p>
                <p>Close Price: $${stock.ClosePrice.toFixed(2)}</p>
                <p>Difference: $${stock.Difference.toFixed(2)}</p>
                <p>Date: ${stock.Date}</p>
            `;
            portfolioTable.appendChild(stockBox);
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
    }
}

// Get the UserID from the URL query string
const urlParams = new URLSearchParams(window.location.search);

let UserID = urlParams.get('UserID'); // Try to get UserID from the URL
if (!UserID) {
    UserID = localStorage.getItem('UserID'); // Fall back to localStorage if not in URL
}

if (UserID) {
    displayPortfolio(UserID); // Call the function to display the portfolio
} else {
    console.error("UserID not found in URL or localStorage."); // Handle missing UserID
}

document.addEventListener('DOMContentLoaded', () => {
    // Get the logged-in user's ID from localStorage
    const userID = localStorage.getItem('UserID');
    const userIDField = document.getElementById('userID');

    if (window.location.pathname === '/Login.html' || window.location.pathname.endsWith('Login.html')) {
        console.log('Login page: No UserID check required.');
        return; // Exit early on the login page
    }

    if (window.location.pathname === '/CreateAccount.html' || window.location.pathname.endsWith('CreateAccount.html')) {
        console.log('Create Account page: No UserID check required.');
        return; // Exit early on the login page
    }
    
    if (userIDField && userID) {
        userIDField.value = userID;
    } else if (!userID) {
        console.error('UserID not found in localStorage.');
        alert('Please log in to access this page.');
        window.location.href = 'Login.html'; // Redirect if not logged in
    } else {
        console.error('UserID input field not found in the DOM.');
    }

    if (userID) {
        document.getElementById('userID').value = userID; // Set the hidden field value
    } else {
        console.error('UserID not found in localStorage. Redirecting to login.');
        alert('Please log in to access this page.');
        window.location.href = 'Login.html'; // Redirect to login if not logged in
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('UserRole');
    const adminActionsButton = document.getElementById('admin-actions');

    if (adminActionsButton) {
        if (userRole === 'admin') {
            adminActionsButton.style.display = 'block'; // Show button for admins
        } else {
            console.log('User is not an admin.');
        }
    } else {
        console.error('Admin actions button not found in the DOM.');
    }
});


// add stock to portfolio
async function addStockToPortfolio(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    // Create an object from the form data
    const data = Object.fromEntries(formData.entries());
    console.log('Form data:', data); // Debug log

    try {
        const response = await fetch('/portfolios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Stock added to portfolio successfully:', result);
            window.location.href = '/portfolio-page'; // Redirect back to portfolio page
        } else {
            console.error('Error adding stock to portfolio:', response.statusText);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
    }
}


async function submitCreateAccountForm(event) {
    event.preventDefault(); // Prevent default form submission
    const form = event.target;
    const formData = new FormData(form);

    // Create an object from the form data
    const data = Object.fromEntries(formData.entries());
    console.log('Form data:', data); // Debug log

    try {
        const response = await fetch(form.action, {
            method: form.method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Account created successfully:', result);
            // Handle successful response, e.g., redirect to login page
            window.location.href = 'login.html'; // Redirect to login page
        } else {
            console.error('Error creating account:', response.statusText);
            // Handle error response
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        // Handle network or other errors
    }
}

async function submitLoginForm(event) {
    event.preventDefault(); // Prevent default form submission
    const form = event.target;
    const formData = new FormData(form);

    // Create an object from the form data
    const data = Object.fromEntries(formData.entries());
    console.log('Login form data:', data); // Debug log

    try {
        const response = await fetch(form.action, {
            method: form.method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Login successful:', result);

            // Store UserID in localStorage
            localStorage.setItem('UserID', result.user.id);
            localStorage.setItem('UserRole', result.user.role);
            // Redirect to portfolio page
            window.location.href = 'ViewPortfolio.html';
        } else {
            console.error('Error logging in:', response.statusText);
            alert('Login failed: ' + response.statusText); // Provide user feedback
        }
    } catch (error) {
        console.error('Error submitting login form:', error);
        alert('An error occurred. Please try again.');
    }
}

function logout() {
    localStorage.clear(); // Clear localStorage to log out the user
    alert('You have been signed out.');
    window.location.href='Login.html'; // Redirect to login page
}

function performAdminActions() {
    window.location.href = 'AdminActions.html';
}

async function loadProfiles() {
    try {
        const response = await fetch('/admin/profiles');
        if (!response.ok) throw new Error('Failed to fetch profiles');

        const profiles = await response.json();
        const container = document.getElementById('profiles-container');

        container.innerHTML = ''; // Clear loading message

        profiles.forEach(profile => {
            const card = document.createElement('div');
            card.className = 'profile-card';
            card.innerHTML = `
                <h3>${profile.Username}</h3>
                <p>Email: ${profile.Email}</p>
                <p>Role: ${profile.Role}</p>
                <button onclick="viewProfile(${profile.UserID})">View Portfolio</button>
                <button class="delete" onclick="deleteProfile(${profile.UserID})">Delete Profile</button>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading profiles:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadProfiles);

function viewProfile(userId) {
    window.location.href = `/ViewPortfolio.html?userId=${userId}`;
}

async function deleteProfile(userId) {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
        const response = await fetch(`/admin/profiles/${userId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete profile');

        alert('Profile deleted successfully.');
        loadProfiles(); // Refresh profiles
    } catch (error) {
        console.error('Error deleting profile:', error);
    }
}