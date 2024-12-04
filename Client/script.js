// DOES NOT WORK PLEASE FIX
// the /portfolio/${userId} works and pulls all nescessary data,
// can see the data in the terminal.
async function displayPortfolio(userId) {
    try {
        // Fetch the portfolio data
        const portfolioResponse = await fetch(`/portfolio/${userId}`);
        if (!portfolioResponse.ok) {
            throw new Error(`HTTP error! status: ${portfolioResponse.status}`);
        }
        const portfolio = await portfolioResponse.json();
        console.log('Portfolio data:', portfolio); // Log fetched portfolio data
       
        const portfolioTable = document.getElementById("portfolio");
        //portfolioTable.innerHTML = ''; // Clear previous content

        stocks.forEach(stock => {
            const stockBox = document.createElement("div");
            stockBox.className = "stock-box";
            stockBox.innerHTML = `
                <h3>${stock.TickerSymbol}</h3>
                <p>Shares Owned: ${stock.SharesOwned}</p>
                <p>Open Price: $${stock.OpenPrice.toFixed(2)}</p>
                <p>Close Price: $${stock.ClosePrice.toFixed(2)}</p>
                <p>Difference: ${stock.Difference}</p>
                <p>Date: ${stock.Date}</p>
            `;
            portfolioTable.appendChild(stockBox);
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
    }
}

// Call this function with the logged-in user's ID
// displayPortfolio(1); // Replace with the actual UserID
const urlParams = new URLSearchParams(window.location.search);
const userID = urlParams.get('userId');
if (userId) {
    displayPortfolio(userId);
}

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
            // Display user information
            alert(`Login successful! Welcome, ${result.user.username}.`);
            // Handle successful login, e.g., redirect to main page
            window.location.href = 'ViewPortfolio.html'; // Uncomment to redirect after login
        } else {
            console.error('Error logging in:', response.statusText);
            // Handle error response
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        // Handle network or other errors
    }
}