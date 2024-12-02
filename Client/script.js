async function displayPortfolio(userId) {
    try {
        const response = await fetch(`/portfolio/${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const portfolio = await response.json();

        const portfolioTable = document.getElementById('portfolio');
        portfolioTable.innerHTML = ''; // Clear previous content

        portfolio.forEach(stock => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${stock.TickerSymbol}</td>
                <td>${stock.SharesOwned}</td>
                <td>$${stock.openPrice.toFixed(2)}</td>
                <td>$${stock.closePrice.toFixed(2)}</td>
                <td>${stock.Difference}</td>
                <td>${stock.Date}</td>
            `;
            portfolioTable.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
    }
}

// Call this function with the logged-in user's ID
displayPortfolio(1); // Replace with the actual UserID

