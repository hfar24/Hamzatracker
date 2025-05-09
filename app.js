let chart;
let transactions = JSON.parse(localStorage.getItem('btcTransactions')) || [];

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize chart
    chart = new Chart(document.getElementById('priceChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'BTC Price',
                borderColor: 'var(--accent)',
                backgroundColor: 'rgba(122, 162, 247, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { ticks: { color: 'var(--text)' } },
                x: { ticks: { color: 'var(--text)' } }
            }
        }
    });

    // Load initial data
    await loadData();
    setInterval(loadData, 60000); // Update every minute
});

async function loadData() {
    try {
        const [priceRes, historyRes] = await Promise.all([
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'),
            fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30')
        ]);

        const priceData = await priceRes.json();
        const historyData = await historyRes.json();

        // Update price display
        document.getElementById('btcPrice').textContent = `$${priceData.bitcoin.usd.toLocaleString()}`;
        document.getElementById('btcChange').textContent = 
            `${priceData.bitcoin.usd_24h_change.toFixed(2)}%`;
        document.getElementById('btcChange').style.color = 
            priceData.bitcoin.usd_24h_change >= 0 ? 'var(--profit)' : 'var(--loss)';

        // Update chart
        updateChart(historyData.prices);
        updatePortfolio(priceData.bitcoin.usd);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function updateChart(prices) {
    const labels = prices.map(([timestamp]) => 
        new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = prices.map(([, price]) => price);
    chart.update();
}

function updatePortfolio(currentPrice) {
    const portfolio = transactions.reduce((acc, tx) => {
        acc.totalBTC += tx.type === 'buy' ? tx.amount : -tx.amount;
        acc.invested += tx.amount * tx.price;
        return acc;
    }, { totalBTC: 0, invested: 0 });

    const currentValue = portfolio.totalBTC * currentPrice;
    const profitLoss = currentValue - portfolio.invested;

    document.getElementById('totalBTC').textContent = portfolio.totalBTC.toFixed(8);
    document.getElementById('portfolioValue').textContent = 
        `$${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

window.addTransaction = () => {
    const transaction = {
        date: document.getElementById('txDate').value,
        type: document.getElementById('txType').value,
        amount: parseFloat(document.getElementById('txAmount').value),
        price: parseFloat(document.getElementById('txPrice').value)
    };

    if (!transaction.date || isNaN(transaction.amount) || isNaN(transaction.price)) {
        alert('Please fill all fields correctly');
        return;
    }

    transactions.push(transaction);
    localStorage.setItem('btcTransactions', JSON.stringify(transactions));
    loadData(); // Refresh data
};
