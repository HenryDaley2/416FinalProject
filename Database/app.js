const express = require('express');
const db = require('./database');
const axios = require('axios');

const app = express();
app.use(express.json());

// Create
// HTTP POST route handler for creating new users in the database
// Listens for POST request at /users
app.post('/users', (req, res) => {
    // req.body contains the data sent in the body of the POST request
    // it extracts 4 fields: Username, PasswordHash, Email, Role
    const { Username, PasswordHash, Email, Role } = req.body;
    // Executes SQL to insert new User into database
    // using the ? placeholders it prevents SQL injection by excaping any user input
    db.run(`INSERT INTO Users (Username, PasswordHash, Email, Role) VALUES (?, ?, ?, ?)`,
        [Username, PasswordHash, Email, Role],
        //error handling
        function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            // Success response
            res.json({ UserID: this.lastID });
        });
});

/*
Work flow for user should go as follows:
1. Client sends a POST request in the JSON body
{
    "Username": "johndoe",
    "PasswordHash": "hashedpassword123",
    "Email": "johndoe@example.com",
    "Role": "user"
}

2. Server executes the INSERT operation and on success responds with:
{
    "UserID": 42
}
    (Assuming 42 is the 'lastID' of the inserted user)
*/

// add stocks to the database
app.post('/stocks', (req, res) => {
    const { TickerSymbol, CompanyName, MarketPrice } = req.body;
    db.run(`INSERT INTO Stocks (TickerSymbol, CompanyName, MarketPrice) VALUES (?, ?, ?)`,
        [TickerSymbol, CompanyName, MarketPrice],
        function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ StockID: this.lastID });
        });
});

// hanldes creating a portfolio entry that associates a user with a stock and the number of shares they own.
app.post('/portfolios', (req, res) => {
    const { UserID, StockID, SharesOwned } = req.body;
    db.run(`INSERT INTO Portfolios (UserID, StockID, SharesOwned) VALUES (?, ?, ?)`,
        [UserID, StockID, SharesOwned],
        function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ PortfolioID: this.lastID });
        });
});

// log transactions involving a user and a stock: purchases, sales, or other operations
app.post('/transactions', (req, res) => {
    const { UserID, StockID, TransactionType, Shares, TransactionPrice } = req.body;
    db.run(`INSERT INTO Transactions (UserID, StockID, TransactionType, Shares, TransactionPrice) VALUES (?, ?, ?, ?, ?)`,
        [UserID, StockID, TransactionType, Shares, TransactionPrice],
        function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ TransactionID: this.lastID });
        });
});

//recording actions performed by an administrator
app.post('/admin-actions', (req, res) => {
    const { AdminID, ActionDescription } = req.body;
    db.run(`INSERT INTO AdminActions (AdminID, ActionDescription) VALUES (?, ?)`,
        [AdminID, ActionDescription],
        function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ ActionID: this.lastID });
        });
});

// Read
// retrieve user details from a database based on their username
// defines a GET route for the URL path /users/:username
// :username is dynamic for example: /users/johndoe
app.get('/users/:username', (req, res) => {
    // extracts the username from the req.params object
    // if the URL request is /users/johndoe username will hodl the string "johndoe"
    const { username } = req.params;
    // sql to select all cols where username matches
    db.get(`SELECT * FROM Users WHERE Username = ?`, [username], (err, row) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json(row);
    });
});

//retrieve all stock records from database
app.get('/stocks', (req, res) => {
    db.all(`SELECT * FROM Stocks`, [], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Serve the portfolio page
app.get('/portfolio-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portfolio.html'));
});

// retrieve portfolio details for a specific user from database
app.get('/portfolios/:user_id', (req, res) => {
    const { user_id } = req.params;
    db.all(`SELECT p.PortfolioID, s.TickerSymbol, s.CompanyName, p.SharesOwned, s.MarketPrice
            FROM Portfolios p
            JOIN Stocks s ON p.StockID = s.StockID
            WHERE p.UserID = ?`, [user_id], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Update
// listens for a PUT request at '/users/:username'
// designed to update information, in this case their email
app.put('/users/:username', (req, res) => {
    // extracts username from the URL, the :username part
    const { username } = req.params;
    // extracts the email field from the request body
    const { Email } = req.body;
    // SQL UPDATE query which sets the email column to the new value passed where the username matches
    db.run(`UPDATE Users SET Email = ? WHERE Username = ?`,
        [Email, username],
        function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ message: 'User updated successfully' });
        });
});

app.put('/stocks/:ticker_symbol', (req, res) => {
    const { ticker_symbol } = req.params;
    const { MarketPrice } = req.body;
    db.run(`UPDATE Stocks SET MarketPrice = ? WHERE TickerSymbol = ?`,
        [MarketPrice, ticker_symbol],
        function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ message: 'Stock updated successfully' });
        });
});

// Delete
app.delete('/users/:username', (req, res) => {
    const { username } = req.params;
    db.run(`DELETE FROM Users WHERE Username = ?`, [username], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

app.delete('/stocks/:ticker_symbol', (req, res) => {
    const { ticker_symbol } = req.params;
    db.run(`DELETE FROM Stocks WHERE TickerSymbol = ?`, [ticker_symbol], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'Stock deleted successfully' });
    });
});

/*
// Fetch Stock Data from API and Store in Database
app.get('/fetch-stocks', async (req, res) => {
    try {
        const apiUrl = 'https://example.com/api/stocks'; // Replace with API URL
        const response = await axios.get(apiUrl);
        const stockData = response.data;

        stockData.forEach(stock => {
            db.run(`INSERT OR REPLACE INTO Stocks (TickerSymbol, CompanyName, MarketPrice, LastUpdated)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [stock.symbol, stock.companyName, stock.marketPrice]);
        });

        res.json({ message: 'Stock data fetched and stored successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
*/

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});