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
    /*
    db.run(`INSERT INTO Stocks (TickerSymbol, OpenPrice, ClosePrice, Difference, Date) VALUES
        ('AAPL', 150.00, 155.00, '5.00', '2024-12-01'),
        ('MSFT', 300.00, 305.00, '5.00', '2024-12-01'),
        ('GOOGL', 2700.00, 2750.00, '50.00', '2024-12-01'),
        ('AMZN', 3400.00, 3450.00, '50.00', '2024-12-01'),
        ('TSLA', 700.00, 720.00, '20.00', '2024-12-01'),
        ('NFLX', 600.00, 610.00, '10.00', '2024-12-01'),
        ('FB', 370.00, 375.00, '5.00', '2024-12-01'),
        ('NVDA', 200.00, 205.00, '5.00', '2024-12-01'),
        ('BABA', 250.00, 260.00, '10.00', '2024-12-01'),
        ('INTC', 50.00, 52.00, '2.00', '2024-12-01'),
        ('AMD', 100.00, 105.00, '5.00', '2024-12-01'),
        ('ORCL', 90.00, 95.00, '5.00', '2024-12-01'),
        ('IBM', 140.00, 142.00, '2.00', '2024-12-01'),
        ('CSCO', 55.00, 57.00, '2.00', '2024-12-01'),
        ('SAP', 140.00, 145.00, '5.00', '2024-12-01'),
        ('ADBE', 500.00, 510.00, '10.00', '2024-12-01'),
        ('CRM', 220.00, 225.00, '5.00', '2024-12-01'),
        ('TWTR', 60.00, 65.00, '5.00', '2024-12-01'),
        ('SNAP', 80.00, 82.00, '2.00', '2024-12-01'),
        ('UBER', 50.00, 52.00, '2.00', '2024-12-01'),
        ('LYFT', 40.00, 42.00, '2.00', '2024-12-01'),
        ('SPOT', 300.00, 310.00, '10.00', '2024-12-01'),
        ('SQ', 200.00, 205.00, '5.00', '2024-12-01'),
        ('PYPL', 250.00, 255.00, '5.00', '2024-12-01'),
        ('SHOP', 1400.00, 1450.00, '50.00', '2024-12-01'
    )`);
    
    db.run(`INSERT INTO Portfolios (UserID, TickerSymbol, SharesOwned) VALUES
        (1, 'AAPL', 10),
        (1, 'MSFT', 20),
        (1, 'GOOGL', 5
    )`);
*/
});

// Function to initialize data from JSON file
async function initializeData() {
    const filePath = path.join(__dirname, 'processed-stonks.json');
    const stockData = await JSON.parse(fs.readFileSync(filePath, 'utf8'));

    stockData.forEach(stock => {
        const numericDifference = parseFloat(stock.difference);
        db.run('INSERT INTO Stocks (TickerSymbol, OpenPrice, ClosePrice, Difference, Date, LastUpdated) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [stock.ticker, stock.openPrice, stock.closePrice, numericDifference, stock.date], (err) => {
                if (err) {
                    console.error(err.message);
                }
            });
    });
};

initializeData();

module.exports = db;