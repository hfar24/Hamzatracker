let chart = null;
let ws = null;
let transactions = JSON.parse(localStorage.getItem('btcTransactions')) || [];

// Initialize Chart
function initChart() {
    chart = LightweightCharts.createChart(document.getElementById('tvChart'), {
        width: document.getElementById('tvChart').clientWidth,
        height: 600,
        layout: {
            background: { color: 'transparent' },
            textColor: 'var(--text-primary)',
        },
        grid: {
            vertLines: { color: 'var(--border)' },
            horzLines: { color: 'var(--border)' },
        },
        timeScale: {
            borderColor: 'var(--border)',
            timeVisible: true,
            secondsVisible: false,
        },
        rightPriceScale: {
            borderColor: 'var(--border)',
        },
    });

    const candleSeries = chart.addCandlestickSeries({
        upColor: 'var(--profit)',
        downColor: 'var(--loss)',
        borderUpColor: 'var(--profit)',
        borderDownColor: 'var(--loss)',
        wickUpColor: 'var(--profit)',
        wickDownColor: 'var(--loss)',
    });

    // Load historical data
    fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=200')
        .then(response => response.json())
        .then(data => {
            const formattedData = data.map(d => ({
                time: d[0] / 1000,
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
            }));
            candleSeries.setData(formattedData);
        });

    // Connect to WebSocket
    ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1m');

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const candle = message.k;
        
        const newCandle = {
            time: candle.t / 1000,
            open: parseFloat(candle.o),
            high: parseFloat(candle.h),
            low: parseFloat(candle.l),
            close: parseFloat(candle.c),
        };

        candleSeries.update(newCandle);
        updatePriceDisplay(newCandle.close);
    };
}

// Update price display
function updatePriceDisplay(price) {
    document.getElementById('btcLivePrice').textContent = `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

// Transaction handling
function addTransaction() {
    const transaction = {
        date: document.getElementById('txDate').value,
        type: document.getElementById('txType').value,
        amount: parseFloat(document.getElementById('txAmount').value),
        price: parseFloat(document.getElementById('txPrice').value)
    };

    if (!transaction.date || isNaN(transaction.amount) || isNaN(transaction.price)) {
        alert('Please fill all fields');
        return;
    }

    transactions.push(transaction);
    localStorage.setItem('btcTransactions', JSON.stringify(transactions));
    updatePortfolio();
}

function updatePortfolio() {
    const totalBTC = transactions.reduce((acc, tx) => {
        return tx.type === 'buy' ? acc + tx.amount : acc - tx.amount;
    }, 0);

    document.getElementById('totalBTC').textContent = totalBTC.toFixed(8);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    updatePortfolio();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        chart.resize(document.getElementById('tvChart').clientWidth, 600);
    });
});
