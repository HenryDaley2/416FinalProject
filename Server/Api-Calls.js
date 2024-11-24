const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
let Queryp1 = "https://api.polygon.io/v2/aggs/ticker/";
let Queryp2 = "/prev?adjusted=true&apiKey=YedqVkaysCFvBUYJkjSLgxNch_pZw697";
// Path to the text file
const filePath = path.join(__dirname, 'stocks.txt');

// Function to generate new data
function generateNewData() {
    

 
}



function querybulder() {
    let Queryp1 = "https://api.polygon.io/v2/aggs/ticker/";
    let Queryp2 = "/prev?adjusted=true&apiKey=YedqVkaysCFvBUYJkjSLgxNch_pZw697";
    const array = ["AAPL", "NVDA", "MSFT", "GOOGL", "AMZN", "2222.SR", "META",
         "TSLA", "BRK-B", "TSM", "AVGO", "JPM", "LLY", "WMT", "V", "UNH", "XOM", 
         "ORCL", "TCEHY", "MA", "NVO", "COST", "HD", "PG", "NFLX", "JNJ", "BAC", "CRM", 
         "ABBV", "MC.PA", "CVX", "1398.HK", "SAP", "005930.KS", "KO", "TMUS", "600519.SS", 
         "ASML", "MRK", "PEP", "ADBE", "TM", "CSCO", "PFE", "INTC", "OR.PA", "ROG.SW", "NVS", 
         "AZN", "HSBC"];
    for (let i = 0; i <= array.length - 1; i++) {
            let query = "Queryp1 + array[i] + Queryp2";
            
          }
    
}

async function fetchData(query){
    

}

// Function to update the file
function updateFile() {
    const newData = generateNewData();

    fs.writeFile(filePath, newData, (err) => {
        if (err) {
            console.error('Error writing to the file:', err);
        } else {
            console.log('File updated successfully:', new Date().toLocaleString());
        }
    });
}

// Schedule the job to run every morning at 7:00 AM
const job = schedule.scheduleJob('0 7 * * *', () => {
    console.log('Running scheduled job to update file...');
    updateFile();
});

// Initial run (optional, in case you want it to run immediately the first time)
updateFile();
