// Handles Sqlite database connection and setup
// testing
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('stock_trading.db');

db.serialize(() => {
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
        CompanyName TEXT NOT NULL,
        MarketPrice REAL NOT NULL,
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

module.exports = db;