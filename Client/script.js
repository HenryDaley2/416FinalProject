async function displayPortfolio(userId) {
    try {
        const response = await fetch(`/portfolio/${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const portfolio = await response.json();
        const portfolioTable = document.getElementById('portfolio');
        portfolioTable.innerHTML = ''; // Clear previous content

        portfolio.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.TickerSymbol}</td>
                <td>${entry.SharesOwned}</td>
                <td>$${entry.openPrice.toFixed(2)}</td>
                <td>$${entry.closePrice.toFixed(2)}</td>
                <td>${entry.Difference}</td>
                <td>${entry.Date}</td>
                <td><button onclick="deletePortfolioEntry(${entry.PortfolioID})">Delete</button></td>
            `;
            portfolioTable.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
    }
}

async function addPortfolioEntry(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    // Create an object from the form data
    const data = Object.fromEntries(formData.entries());

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
            console.log('Portfolio entry added successfully:', result);
            displayPortfolio(data.UserID); // Refresh portfolio display
        } else {
            console.error('Error adding portfolio entry:', response.statusText);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
    }
}

async function deletePortfolioEntry(portfolioID) {
    try {
        const response = await fetch(`/portfolios/${portfolioID}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            console.log('Portfolio entry deleted successfully');
            // Refresh portfolio display (assuming userID is globally accessible)
            displayPortfolio(userId);
        } else {
            console.error('Error deleting portfolio entry:', response.statusText);
        }
    } catch (error) {
        console.error('Error deleting portfolio entry:', error);
    }
}

// Assuming userID is a global variable or determined in some way
const userId = 1; // Replace with actual userID
displayPortfolio(userId);