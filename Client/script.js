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

document.addEventListener('DOMContentLoaded', () => {
    const userID = localStorage.getItem('UserID');

    // Skip checks on Login.html and CreateAccount.html
    const isLoginPage = window.location.pathname.endsWith('Login.html');
    const isCreateAccountPage = window.location.pathname.endsWith('CreateAccount.html');

    if (isLoginPage || isCreateAccountPage) {
        console.log('No UserID check required on this page.');
        return; // Exit early for login and create account pages
    }

    // Check if user is logged in for protected pages
    if (!userID) {
        console.error('UserID not found. Redirecting to login.');
        alert('Please log in to access this page.');
        window.location.href = 'Login.html'; // Redirect to login page
    } else {
        console.log(`Logged in as UserID: ${userID}`);
    }
});

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

        const userRole = localStorage.getItem('UserRole'); // Get current user's role
        const isAdmin = userRole === 'admin';

        profiles.forEach(profile => {
            const card = document.createElement('div');
            card.className = 'profile-card';
            card.innerHTML = `
                <h3>${profile.Username}</h3>
                <p>Email: ${profile.Email}</p>
                <p>Role: ${profile.Role}</p>
                <button onclick="viewProfile(${profile.UserID})">View Portfolio</button>
                ${isAdmin ? `<button class="delete" onclick="deleteProfile(${profile.UserID})">Delete Profile</button>` : ''}
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading profiles:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadProfiles);

document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('UserRole');
    const adminActionsButton = document.getElementById('admin-actions');

    if (adminActionsButton) {
        if (userRole === 'admin' || userRole === 'staff') {
            adminActionsButton.style.display = 'block'; // Show button for admins
        } else {
            console.log('User is not an admin.');
        }
    } else {
        console.error('Admin actions button not found in the DOM.');
    }
});

function viewProfile(userId) {
    window.location.href = `/ViewPortfolio.html?userId=${userId}`;
}

async function loadStocks() {
    try {
        // Fetch stock data from the server
        const response = await fetch('/stocks');
        if (!response.ok) {
            throw new Error(`Failed to fetch stocks: ${response.statusText}`);
        }
        const stocks = await response.json();

        const stocksContainer = document.getElementById('stocks-container');
        stocksContainer.innerHTML = ''; // Clear any existing content

        stocks.forEach(stock => {
            // Determine the trend based on price difference
            const trendClass = stock.Difference > 0 ? 'trend-up' : 'trend-down';

            // Create a stock card
            const stockBox = document.createElement('div');
            stockBox.className = `stock-box ${trendClass}`;
            stockBox.innerHTML = `
                <h3>${stock.TickerSymbol}</h3>
                <p>Open Price: $${stock.OpenPrice.toFixed(2)}</p>
                <p>Close Price: $${stock.ClosePrice.toFixed(2)}</p>
                <p>Price Change: ${stock.Difference > 0 ? '+' : ''}${stock.Difference.toFixed(2)}</p>
                <p>Date: ${stock.Date}</p>
            `;

            stocksContainer.appendChild(stockBox);
        });
    } catch (error) {
        console.error('Error loading stocks:', error);
    }
}

// Load stocks when the page loads
document.addEventListener('DOMContentLoaded', loadStocks);

async function deleteProfile(userId) {
    const userRole = localStorage.getItem('UserRole');
    if (!userRole || userRole !== 'admin') {
        alert('You are not authorized to delete profiles.');
        return;
    }

    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
        const response = await fetch(`/admin/profiles/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'User-Role': userRole, // Include user role in request
            },
        });
        if (!response.ok) throw new Error('Failed to delete profile');

        alert('Profile deleted successfully.');
        loadProfiles(); // Refresh the profiles list
    } catch (error) {
        console.error('Error deleting profile:', error);
    }
}

async function displayPortfolio() {
    // First, attempt to retrieve UserID from the URL
    const params = new URLSearchParams(window.location.search);
    let userId = params.get('userId'); // Notice 'userId' matches URL param

    // If not found in the URL, try to get it from localStorage
    if (!userId) {
        userId = localStorage.getItem('UserID');
    }

    // If still not found, redirect to login
    if (!userId) {
        console.error('UserID not found in URL or localStorage.');
        alert('Please log in to access this page.');
        window.location.href = 'Login.html';
        return;
    }

    try {
        // Fetch portfolio data for the UserID
        const response = await fetch(`/portfolio/${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const portfolio = await response.json();
        console.log('Portfolio data:', portfolio);

        const portfolioTable = document.getElementById('portfolio');
        if (!portfolioTable) {
            console.error('Portfolio table element not found in the DOM.');
            return;
        }

        // Clear any existing content
        portfolioTable.innerHTML = '';

        // Populate portfolio data
        portfolio.forEach(stock => {
            const stockBox = document.createElement('div');
            stockBox.className = 'stock-box';
            stockBox.innerHTML = `
                <h3>${stock.TickerSymbol}</h3>
                <p>Shares Owned: ${stock.SharesOwned}</p>
                <p>Open Price: $${stock.OpenPrice.toFixed(2)}</p>
                <p>Close Price: $${stock.ClosePrice.toFixed(2)}</p>
                <p>Difference: $${stock.Difference.toFixed(2)}</p>
                <p>Date: ${stock.Date}</p>
                <button onclick="removeStock('${stock.TickerSymbol}', ${stock.SharesOwned})">Remove Stock</button>
            `;
            portfolioTable.appendChild(stockBox);
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = window.location.pathname.endsWith('Login.html');
    const isCreateAccountPage = window.location.pathname.endsWith('CreateAccount.html');

    // Skip running displayPortfolio on Login or CreateAccount pages
    if (!isLoginPage && !isCreateAccountPage) {
        displayPortfolio();
    }
});

// add stock to portfolio
async function addStockToPortfolio(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const userId = localStorage.getItem('UserID');

    // Create an object from the form data
    const data = Object.fromEntries(formData.entries());
    data.UserID = userId;
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
            window.location.href = 'ViewPortfolio.html'; // Redirect back to portfolio page
        } else {
            console.error('Error adding stock to portfolio:', response.statusText);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
    }
}

async function removeStock(tickerSymbol, totalShares) {
    const userID = localStorage.getItem('UserID');
    if (!userID) {
        alert('No user logged in. Redirecting to login.');
        window.location.href = 'Login.html';
        return;
    }

    const sharesToRemove = prompt(
        `You own ${totalShares} shares of ${tickerSymbol}. Enter the number of shares to remove (or enter "all" to remove all shares):`
    );

    if (sharesToRemove === null) return; // User canceled

    let shares = parseInt(sharesToRemove);
    if (sharesToRemove.toLowerCase() === 'all') {
        shares = totalShares; // Remove all shares
    } else if (isNaN(shares) || shares <= 0 || shares > totalShares) {
        alert('Invalid number of shares. Please try again.');
        return;
    }

    try {
        const response = await fetch(`/portfolio/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userID, tickerSymbol, shares }),
        });

        if (response.ok) {
            alert('Stock removed successfully.');
            displayPortfolio(); // Refresh the portfolio
        } else {
            const error = await response.json();
            alert(`Failed to remove stock: ${error.message}`);
        }
    } catch (error) {
        console.error('Error removing stock:', error);
        alert('An error occurred. Please try again.');
    }
}
