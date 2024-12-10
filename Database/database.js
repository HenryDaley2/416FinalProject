// Handles Sqlite database connection and setup
// testing
const sqlite3 = require('../Server/node_modules/sqlite3/lib/sqlite3').verbose();
const fs = require('fs'); 
const path = require('path');

const dbPath = path.join(__dirname, '../demo.db');
const db = new sqlite3.Database('demo.db');

db.serialize(() => {
    // Drop tables, for fresh startup
    
    db.run(`DROP TABLE IF EXISTS Users`); 
    db.run(`DROP TABLE IF EXISTS Stocks`); 
    db.run(`DROP TABLE IF EXISTS Portfolios`);
    db.run(`DROP TABLE IF EXISTS Transactions`); 
    db.run(`DROP TABLE IF EXISTS AdminActions`);

    db.run(`CREATE TABLE IF NOT EXISTS Users (
        UserID INTEGER PRIMARY KEY AUTOINCREMENT,
        Username TEXT NOT NULL UNIQUE,
        PasswordHash TEXT NOT NULL,
        Email TEXT NOT NULL UNIQUE,
        Role TEXT CHECK(Role IN ('admin', 'staff', 'customer')) NOT NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Stocks (
        StockID INTEGER PRIMARY KEY AUTOINCREMENT,
        TickerSymbol TEXT NOT NULL,
        OpenPrice REAL,
        ClosePrice REAL,
        Difference REAL,
        Date TEXT,
        LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (TickerSymbol, Date)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Portfolios (
        PortfolioID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        TickerSymbol TEXT NOT NULL UNIQUE,
        SharesOwned INTEGER NOT NULL,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (TickerSymbol) REFERENCES Stocks(TickerSymbol)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Transactions (
        TransactionID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        StockID INTEGER NOT NULL,
        TransactionType TEXT CHECK(TransactionType IN ('buy', 'sell')) NOT NULL,
        Shares INTEGER NOT NULL,
        TransactionPrice REAL NOT NULL,
        TransactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (StockID) REFERENCES Stocks(StockID)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS AdminActions (
        ActionID INTEGER PRIMARY KEY AUTOINCREMENT,
        AdminID INTEGER NOT NULL,
        ActionDescription TEXT NOT NULL,
        ActionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (AdminID) REFERENCES Users(UserID)
    )`);

    db.run(`CREATE TRIGGER IF NOT EXISTS update_users_updated_at
    AFTER UPDATE ON Users
    FOR EACH ROW
    BEGIN
       UPDATE Users SET UpdatedAt = CURRENT_TIMESTAMP WHERE UserID = NEW.UserID;
    END`);

    db.run(`CREATE TRIGGER IF NOT EXISTS update_stocks_last_updated
    AFTER UPDATE ON Stocks
    FOR EACH ROW
    BEGIN
       UPDATE Stocks SET LastUpdated = CURRENT_TIMESTAMP WHERE StockID = NEW.StockID;
    END`);

    // Hardcoded data for the demo in the database
    db.run(`INSERT INTO Users (Username, PasswordHash, Email, Role) VALUES ('john_doe', 'password123', 'john@emaill.com', 'customer')`);
    db.run(`INSERT INTO Users (Username, PasswordHash, Email, Role) VALUES ('ethan_admin', 'password123', 'ethan@emaill.com', 'admin')`);
      
    db.run(`INSERT INTO Portfolios (UserID, TickerSymbol, SharesOwned) VALUES (1, 'AAPL', 10)`);
    db.run(`INSERT INTO Portfolios (UserID, TickerSymbol, SharesOwned) VALUES (1, 'MSFT', 20)`);
});

// Function to initialize data from JSON file
async function initializeData() {
    const filePath = path.join(__dirname, 'processed-stocks.json');
    const stockData = await JSON.parse(fs.readFileSync(filePath, 'utf8'));

    stockData.forEach(stock => {
        const numericDifference = parseFloat(stock.difference);

        // Check if the record already exists (TickerSymbol + Date) and insert if not
        db.get(
            `SELECT StockID FROM Stocks WHERE TickerSymbol = ? AND Date = ?`,
            [stock.ticker, stock.date],
            (err, row) => {
                if (err) {
                    console.error('Error checking for duplicate:', err.message);
                    return;
                }

                if (!row) {
                    // Insert new stock record if it doesn't already exist
                    db.run(
                        `INSERT INTO Stocks (TickerSymbol, OpenPrice, ClosePrice, Difference, Date, LastUpdated) 
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [stock.ticker, stock.openPrice, stock.closePrice, numericDifference, stock.date],
                        (insertErr) => {
                            if (insertErr) {
                                console.error('Error inserting stock:', insertErr.message);
                            } else {
                                console.log(`Inserted stock: ${stock.ticker} (${stock.date})`);
                            }
                        }
                    );
                } else {
                    console.log(`Stock already exists: ${stock.ticker} (${stock.date})`);
                }
            }
        );
    });
}

initializeData();

module.exports = db;