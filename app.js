// Configuration
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
let transactions = JSON.parse(localStorage.getItem('btcTransactions')) || [];
let currentTheme = localStorage.getItem('theme') || 'dark';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    loadTransactions();
    await loadMarketData();
    setInterval(loadMarketData, 300000); // 5-minute refresh
});

// CoinGecko API Integration
async function loadMarketData() {
    try {
        const [priceRes, historyRes] = await Promise.all([
            fetch(`${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`),
            fetch(`${COINGECKO_API}/coins/bitcoin/market_chart?vs_currency=usd&days=30`)
        ]);

        const priceData = await priceRes.json();
        const historyData = await historyRes.json();
        
        updatePrices(priceData.bitcoin.usd);
        updateChart(historyData.prices);
    } catch (error) {
        console.error('API Error:', error);
    }
}

// Portfolio Calculations
function calculatePortfolio(currentPrice) {
    return transactions.reduce((acc, transaction) => {
        acc.totalBTC += transaction.amount;
        acc.invested += transaction.amount * transaction.price;
        return acc;
    }, { totalBTC: 0, invested: 0 });
}

// Transaction Management
function addTransaction() {
    const transaction = {
        date: document.getElementById('transactionDate').value,
        amount: parseFloat(document.getElementById('transactionAmount').value),
        price: parseFloat(document.getElementById('transactionPrice').value)
    };

    transactions.push(transaction);
    localStorage.setItem('btcTransactions', JSON.stringify(transactions));
    loadTransactions();
    loadMarketData();
}

function loadTransactions() {
    const tbody = document.querySelector('#transactionHistory tbody');
    tbody.innerHTML = transactions.map(transaction => `
        <tr>
            <td>${transaction.date}</td>
            <td>${transaction.amount > 0 ? 'Buy' : 'Sell'}</td>
            <td>${transaction.amount.toFixed(8)}</td>
            <td>$${transaction.price.toLocaleString()}</td>
            <td>$${(transaction.amount * transaction.price).toLocaleString()}</td>
        </tr>
    `).join('');
}

// Theme Management
function initTheme() {
    document.body.classList.toggle('dark-theme', currentTheme === 'dark');
    document.getElementById('themeToggle').innerHTML = currentTheme === 'dark' ? 
        '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

document.getElementById('themeToggle').addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    initTheme();
});

// Chart Implementation (using previous chart code with current data)
function updateChart(prices) {
    // Use chart.js implementation from previous messages
}

// Price Display
function updatePrices(currentPrice) {
    const portfolio = calculatePortfolio(currentPrice);
    const currentValue = portfolio.totalBTC * currentPrice;
    const profitLoss = currentValue - portfolio.invested;

    document.getElementById('totalValue').textContent = `$${currentValue.toLocaleString()}`;
    document.getElementById('profitLoss').textContent = 
        `${profitLoss >= 0 ? '+' : '-'}$${Math.abs(profitLoss).toLocaleString()}`;
}
