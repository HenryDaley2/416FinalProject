async function displayPortfolio(userId) {
    try {
        // Fetch the portfolio data
        const portfolioResponse = await fetch(`/portfolio/${userId}`);
        if (!portfolioResponse.ok) {
            throw new Error(`HTTP error! status: ${portfolioResponse.status}`);
        }
        const portfolio = await portfolioResponse.json();
        console.log('Portfolio data:', portfolio); // Log fetched portfolio data

        // Fetch the stock data
        const stockData = {};
        for (const entry of portfolio) {
            const stockResponse = await fetch(`/stock/${entry.TickerSymbol}`);
            if (!stockResponse.ok) {
                throw new Error(`HTTP error! status: ${stockResponse.status}`);
            }
            stockData[entry.TickerSymbol] = await stockResponse.json();
            console.log('Fetched stock data for StockID:', entry.TickerSymbol, stockData[entry.TickerSymbol]); // Debug log
        }

        const portfolioTable = document.getElementById('portfolio');
        portfolioTable.innerHTML = ''; // Clear previous content

        portfolio.forEach(entry => {
            //const stock = stockData[entry.TickerSymbol];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.TickerSymbol}</td>
                <td>${entry.SharesOwned}</td>
                <td>$${entry.openPrice.toFixed(2)}</td>
                <td>$${entry.closePrice.toFixed(2)}</td>
                <td>${entry.Difference}</td>
                <td>${entry.Date}</td>
            `;
            portfolioTable.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
    }
}

// Call this function with the logged-in user's ID
displayPortfolio(1); // Replace with the actual UserID


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