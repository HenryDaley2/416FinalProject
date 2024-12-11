const express = require('express');
const path = require('path');
const db = require('../Database/database.js');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10; // Number of salt rounds for bcrypt
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
], async (req, res) => {
    const { Username, PasswordHash, Email, Role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(PasswordHash, SALT_ROUNDS);

        db.run(`INSERT INTO Users (Username, PasswordHash, Email, Role) VALUES (?, ?, ?, ?)`,
            [Username, hashedPassword, Email, Role],
            function (err) {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                res.json({ UserID: this.lastID });
            });
    } catch (error) {
        console.error('Error hashing password:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
app.post('/login', [
    body('username').isLength({ min: 3, max: 20 }).isAlphanumeric().trim().escape(),
    body('password').isLength({ min: 6 }).trim(),
], async (req, res) => {
    const { username, password } = req.body;

    try {
        db.get(`SELECT * FROM Users WHERE Username = ?`, [username], async (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Error logging in');
            }

            if (!row) {
                return res.status(401).send('Invalid username or password');
            }

            // Compare the input password with the hashed password
            const isMatch = await bcrypt.compare(password, row.PasswordHash);

            if (!isMatch) {
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
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).send('Internal server error');
    }
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
        // Log the transaction
        db.run(
            `INSERT INTO Transactions (UserID, TickerSymbol, Action, SharesChanged) 
            VALUES (?, ?, ?, ?)`,
            [UserID, TickerSymbol, 'Added to Portfolio', SharesOwned],
            (insertErr) => {
                if (insertErr) {
                    console.error('Error logging transaction:', insertErr.message);
                }
            }
        );

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

app.get('/admin/transactions', (req, res) => {
    db.all(
        `SELECT t.TransactionID, u.Username, t.TickerSymbol, t.Action, t.SharesChanged, t.Timestamp 
        FROM Transactions t
        JOIN Users u ON t.UserID = u.UserID
        ORDER BY t.Timestamp DESC`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Error fetching transactions:', err.message);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json(rows);
        }
    );
});

app.delete('/admin/profiles/:id', (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Profile ID is required' });
    }

    db.run(`DELETE FROM Users WHERE UserID = ?`, [id], function (err) {
        if (err) {
            console.error('Error deleting profile:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (this.changes === 0) {
            // If no rows were affected, the user doesn't exist
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({ message: 'Profile deleted successfully' });
    });
});
app.get('/search', (req, res) => {
    const { query } = req.query;
    const sqlQuery = `
        SELECT TickerSymbol, OpenPrice, ClosePrice, Difference, Date 
        FROM Stocks 
        WHERE TickerSymbol LIKE ? OR Date LIKE ?
        ORDER BY Date DESC
    `;
    db.all(sqlQuery, [`%${query}%`, `%${query}%`], (err, rows) => {
        if (err) {
            console.error('Error searching stocks:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
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