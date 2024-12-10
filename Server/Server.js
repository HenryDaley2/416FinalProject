const express = require('express');
const path = require('path');
const db = require('../Database/database.js');
const axios = require('axios');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Serve the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'FrontEnd.html'));
});

// Create user account
app.post('/users', [
    body('Username').isLength({ min: 3, max: 20 }).isAlphanumeric().trim().escape(),
    body('PasswordHash').isLength({ min: 6 }).trim(),
    body('Email').isEmail().normalizeEmail(),
    body('Role').isIn(['admin', 'staff', 'customer']),
], (req, res) => {
    const { Username, PasswordHash, Email, Role } = req.body;
    db.run(`INSERT INTO Users (Username, PasswordHash, Email, Role) VALUES (?, ?, ?, ?)`,
        [Username, PasswordHash, Email, Role],
        function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ UserID: this.lastID });
        });
});

// Login
app.post('/login', [
    body('username').isLength({ min: 3, max: 20 }).isAlphanumeric().trim().escape(),
    body('password').isLength({ min: 6 }).trim(),
], (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM Users WHERE Username = ?`, [username], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Error logging in');
        }
        if (!row || row.PasswordHash !== password) {
            console.log('Invalid login attempt');
            return res.status(401).send('Invalid username or password');
        }
        console.log('Login successful');
        res.json({
            message: 'Login successful!',
            user: {
                id: row.UserID,
                username: row.Username,
                email: row.Email,
                role: row.Role,
                createdAt: row.CreatedAt,
                updatedAt: row.UpdatedAt
            }
        });
    });
});

// Add stock to a portfolio
app.post('/portfolios', [
    body('UserID').isInt().toInt(),
    body('TickerSymbol').isString().trim().toUpperCase(),
    body('SharesOwned').isInt({ min: 1 }).toInt(),
], (req, res) => {
    const { UserID, TickerSymbol, SharesOwned } = req.body;
    if (!UserID || !TickerSymbol || !SharesOwned) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
        INSERT INTO Portfolios (UserID, TickerSymbol, SharesOwned)
        VALUES (?, ?, ?)
        ON CONFLICT(TickerSymbol) DO UPDATE SET SharesOwned = SharesOwned + excluded.SharesOwned
    `;

    db.run(query, [UserID, TickerSymbol, SharesOwned], function (err) {
        if (err) {
            console.error('Error adding to portfolio:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ message: 'Stock added to portfolio successfully', PortfolioID: this.lastID });
    });
});

// Remove stock from a portfolio
app.post('/portfolio/remove', [
    body('userID').isInt().toInt(),
    body('tickerSymbol').isString().trim().toUpperCase(),
    body('shares').isInt({ min: 1 }).toInt(),
], (req, res) => {
    const { userID, tickerSymbol, shares } = req.body;
    if (!userID || !tickerSymbol || shares == null) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    db.get(
        `SELECT SharesOwned FROM Portfolios WHERE UserID = ? AND TickerSymbol = ?`,
        [userID, tickerSymbol],
        (err, row) => {
            if (err) {
                console.error('Error fetching portfolio:', err.message);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (!row || row.SharesOwned < shares) {
                return res.status(400).json({ error: 'Insufficient shares to remove.' });
            }

            if (row.SharesOwned === shares) {
                db.run(
                    `DELETE FROM Portfolios WHERE UserID = ? AND TickerSymbol = ?`,
                    [userID, tickerSymbol],
                    (deleteErr) => {
                        if (deleteErr) {
                            console.error('Error removing stock:', deleteErr.message);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        res.json({ message: 'Stock removed completely.' });
                    }
                );
            } else {
                db.run(
                    `UPDATE Portfolios SET SharesOwned = SharesOwned - ? WHERE UserID = ? AND TickerSymbol = ?`,
                    [shares, userID, tickerSymbol],
                    (updateErr) => {
                        if (updateErr) {
                            console.error('Error updating shares:', updateErr.message);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        res.json({ message: 'Shares updated successfully.' });
                    }
                );
            }
        }
    );
});

// Fetch all profiles
app.get('/admin/profiles', (req, res) => {
    db.all('SELECT UserID, Username, Email, Role FROM Users', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Fetch a portfolio by user ID
app.get('/portfolio/:user_id', (req, res) => {
    const { user_id } = req.params;
    if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    db.all(
        `SELECT p.PortfolioID, p.UserID, p.TickerSymbol, p.SharesOwned,
         s.openPrice, s.closePrice, s.Difference, s.Date
         FROM Portfolios p
         JOIN Stocks s ON p.TickerSymbol = s.TickerSymbol
         WHERE p.UserID = ?`,
        [user_id],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(400).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

app.get('/stocks', (req, res) => {
    db.all(`SELECT TickerSymbol, OpenPrice, ClosePrice, Difference, Date FROM Stocks`, [], (err, rows) => {
        if (err) {
            console.error('Error fetching stocks:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(rows);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});