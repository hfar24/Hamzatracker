// app.js - Complete Working Version
document.addEventListener('DOMContentLoaded', () => {
    let btcChart, portfolioChart;
    let transactions = JSON.parse(localStorage.getItem('btcTransactions')) || [];
    let currentTheme = localStorage.getItem('theme') || 'dark';

    // Initialize
    initTheme();
    loadTransactions();
    initCharts();
    loadMarketData();
    setInterval(loadMarketData, 300000); // 5-minute refresh

    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        initTheme();
    });

    async function loadMarketData() {
        try {
            showLoading();
            const [priceData, historyData] = await Promise.all([
                fetchCoinGecko('simple/price?ids=bitcoin&vs_currencies=usd'),
                fetchCoinGecko('coins/bitcoin/market_chart?vs_currency=usd&days=30')
            ]);
            
            updatePrices(priceData.bitcoin.usd);
            updateCharts(historyData.prices);
        } catch (error) {
            showError('Failed to load market data');
        } finally {
            hideLoading();
        }
    }

    async function fetchCoinGecko(endpoint) {
        const response = await fetch(`https://api.coingecko.com/api/v3/${endpoint}`);
        if (!response.ok) throw new Error('API Error');
        return response.json();
    }

    function updatePrices(currentPrice) {
        const portfolio = transactions.reduce((acc, tx) => {
            acc.totalBTC += tx.type === 'buy' ? tx.amount : -tx.amount;
            acc.invested += tx.amount * tx.price;
            return acc;
        }, { totalBTC: 0, invested: 0 });

        const currentValue = portfolio.totalBTC * currentPrice;
        const profitLoss = currentValue - portfolio.invested;
        const profitPercentage = ((profitLoss / portfolio.invested) * 100 || 0).toFixed(2);

        document.getElementById('btcPrice').textContent = `$${currentPrice.toLocaleString()}`;
        document.getElementById('portfolioValue').textContent = `$${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        document.getElementById('dailyChange').textContent = `${profitLoss >= 0 ? '+' : ''}${profitPercentage}%`;
        document.getElementById('dailyChange').style.color = profitLoss >= 0 ? 'var(--profit)' : 'var(--loss)';
    }

    function addTransaction() {
        const transaction = {
            date: document.getElementById('txDate').value,
            type: document.getElementById('txType').value,
            amount: parseFloat(document.getElementById('txAmount').value),
            price: parseFloat(document.getElementById('txPrice').value)
        };

        if (!transaction.date || isNaN(transaction.amount) || isNaN(transaction.price)) {
            showError('Invalid transaction data');
            return;
        }

        transactions.push(transaction);
        localStorage.setItem('btcTransactions', JSON.stringify(transactions));
        loadTransactions();
        loadMarketData();
        clearForm();
    }

    function loadTransactions() {
        const tbody = document.querySelector('#txHistory tbody');
        tbody.innerHTML = transactions.map(tx => `
            <tr>
                <td>${tx.date}</td>
                <td><span class="tx-type ${tx.type}">${tx.type}</span></td>
                <td>${tx.amount.toFixed(8)}</td>
                <td>$${tx.price.toLocaleString()}</td>
                <td>$${(tx.amount * tx.price).toLocaleString()}</td>
            </tr>
        `).join('');
    }

    function initCharts() {
        const chartConfig = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'var(--border)' }, ticks: { color: 'var(--text-primary)' } },
                x: { grid: { display: false }, ticks: { color: 'var(--text-primary)' } }
            }
        };

        btcChart = new Chart(document.getElementById('btcChart'), {
            type: 'line',
            data: { labels: [], datasets: [{
                label: 'BTC Price',
                borderColor: 'var(--accent)',
                backgroundColor: 'rgba(247, 147, 26, 0.1)',
                tension: 0.4
            }]},
            options: chartConfig
        });

        portfolioChart = new Chart(document.getElementById('portfolioChart'), {
            type: 'line',
            data: { labels: [], datasets: [{
                label: 'Portfolio Value',
                borderColor: 'var(--profit)',
                backgroundColor: 'rgba(22, 199, 132, 0.1)',
                tension: 0.4
            }]},
            options: chartConfig
        });
    }

    function updateCharts(prices) {
        const labels = prices.map(([timestamp]) => 
            new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );

        // Update BTC Price Chart
        btcChart.data.labels = labels;
        btcChart.data.datasets[0].data = prices.map(([, price]) => price);
        btcChart.update();

        // Update Portfolio Chart
        const portfolioValues = prices.map(([, price]) => 
            transactions.reduce((total, tx) => total + (tx.type === 'buy' ? tx.amount : -tx.amount) * price, 0)
        );
        
        portfolioChart.data.labels = labels;
        portfolioChart.data.datasets[0].data = portfolioValues;
        portfolioChart.update();
    }

    function initTheme() {
        document.body.className = `${currentTheme}-theme`;
        document.getElementById('themeToggle').innerHTML = 
            currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function clearForm() {
        document.getElementById('txDate').value = '';
        document.getElementById('txAmount').value = '';
        document.getElementById('txPrice').value = '';
    }

    function showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }

    function hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }
});
