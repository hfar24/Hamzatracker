// app.js
document.addEventListener('DOMContentLoaded', () => {
    let btcChart, portfolioChart;
    let transactions = JSON.parse(localStorage.getItem('btcTransactions')) || [];
    let currentTheme = localStorage.getItem('theme') || 'dark';

    // Initialize application
    const init = async () => {
        initTheme();
        initCharts();
        loadTransactions();
        await loadMarketData();
        setInterval(loadMarketData, 300000); // Refresh every 5 minutes
    };

    // Theme management
    const initTheme = () => {
        document.body.className = `${currentTheme}-theme`;
        document.getElementById('themeToggle').innerHTML = 
            currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    };

    // Chart initialization
    const initCharts = () => {
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    grid: { color: 'var(--border)' },
                    ticks: { 
                        color: 'var(--text-primary)',
                        callback: value => `$${value.toLocaleString()}`
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: 'var(--text-primary)',
                        maxTicksLimit: 10
                    }
                }
            }
        };

        // BTC Price Chart
        btcChart = new Chart(document.getElementById('btcChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'BTC Price',
                    borderColor: 'var(--accent)',
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0
                }]
            },
            options: chartOptions
        });

        // Portfolio Growth Chart
        portfolioChart = new Chart(document.getElementById('portfolioChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Portfolio Value',
                    borderColor: 'var(--profit)',
                    backgroundColor: 'rgba(22, 199, 132, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0
                }]
            },
            options: chartOptions
        });
    };

    // Market data handling
    const loadMarketData = async () => {
        try {
            showLoading();
            const [priceData, historyData] = await Promise.all([
                fetchJSON('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'),
                fetchJSON('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30')
            ]);
            
            updatePrices(priceData.bitcoin.usd);
            updateCharts(historyData.prices);
        } catch (error) {
            showError('Failed to load market data');
            console.error(error);
        } finally {
            hideLoading();
        }
    };

    // Chart updates
    const updateCharts = (priceHistory) => {
        try {
            const step = Math.floor(priceHistory.length / 50);
            const btcData = [];
            const portfolioData = [];
            let cumulativeBTC = 0;

            // Process data points
            priceHistory.forEach(([timestamp, price], index) => {
                if (index % step === 0 || index === priceHistory.length - 1) {
                    // Calculate cumulative BTC
                    transactions.forEach(tx => {
                        const txDate = new Date(tx.date);
                        if (txDate <= new Date(timestamp)) {
                            cumulativeBTC += tx.type === 'buy' ? tx.amount : -tx.amount;
                        }
                    });

                    // Push data points
                    btcData.push({
                        label: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        value: price
                    });

                    portfolioData.push({
                        label: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        value: cumulativeBTC * price
                    });
                }
            });

            // Update BTC Chart
            btcChart.data.labels = btcData.map(d => d.label);
            btcChart.data.datasets[0].data = btcData.map(d => d.value);
            btcChart.update();

            // Update Portfolio Chart
            portfolioChart.data.labels = portfolioData.map(d => d.label);
            portfolioChart.data.datasets[0].data = portfolioData.map(d => d.value);
            portfolioChart.update();

        } catch (error) {
            showError('Chart update failed');
            console.error('Chart Error:', error);
        }
    };

    // Transaction handling
    window.addTransaction = () => {
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
    };

    const loadTransactions = () => {
        document.querySelector('#txHistory tbody').innerHTML = transactions
            .map(tx => `
                <tr>
                    <td>${tx.date}</td>
                    <td><span class="tx-type ${tx.type}">${tx.type}</span></td>
                    <td>${tx.amount.toFixed(8)}</td>
                    <td>$${tx.price.toLocaleString()}</td>
                    <td>$${(tx.amount * tx.price).toLocaleString()}</td>
                </tr>
            `).join('');
    };

    // Price calculations
    const updatePrices = (currentPrice) => {
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
        document.getElementById('dailyChange').innerHTML = `
            ${profitLoss >= 0 ? '+' : '-'}$${Math.abs(profitLoss).toFixed(2)} 
            <span style="color:${profitLoss >= 0 ? 'var(--profit)' : 'var(--loss)'}">
                (${profitPercentage}%)
            </span>
        `;
    };

    // Helper functions
    const fetchJSON = async url => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    };

    const clearForm = () => {
        ['txDate', 'txAmount', 'txPrice'].forEach(id => 
            document.getElementById(id).value = ''
        );
    };

    const showLoading = () => document.getElementById('loading').style.display = 'flex';
    const hideLoading = () => document.getElementById('loading').style.display = 'none';
    
    const showError = message => {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        document.body.appendChild(errorElement);
        setTimeout(() => errorElement.remove(), 3000);
    };

    // Event listeners
    document.getElementById('themeToggle').addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        initTheme();
    });

    // Start the application
    init();
});
