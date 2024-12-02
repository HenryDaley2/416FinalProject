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
        TickerSymbol TEXT NOT NULL UNIQUE,
        openPrice REAL,
        closePrice REAL,
        Difference REAL,
        Date DATE,
        LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Portfolios (
        PortfolioID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        StockID INTEGER NOT NULL,
        SharesOwned INTEGER NOT NULL,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (StockID) REFERENCES Stocks(StockID)
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
});

// Function to initialize data from JSON file
const initializeData = () => {
    const filePath = path.join(__dirname, 'processed-stonks.json');
    const stockData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    stockData.forEach(stock => {
        db.run('INSERT OR REPLACE INTO Stocks (TickerSymbol, OpenPrice, ClosePrice, Difference, Date, LastUpdated) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [stock.ticker, stock.openPrice, stock.closePrice, stock.difference, stock.Date], (err) => {
                if (err) {
                    console.error(err.message);
                }
            });
    });
};

initializeData();

module.exports = db;