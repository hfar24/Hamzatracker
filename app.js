document.addEventListener('DOMContentLoaded', async () => {
    // Show loading screen
    document.getElementById('loading').style.display = 'flex';

    // Initialize chart
    const ctx = document.getElementById('performanceChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Portfolio Value',
                data: [],
                borderColor: var(--accent),
                tension: 0.4
            }]
        }
    });

    // Simulated portfolio data (replace with real data)
    const portfolioData = {
        totalValue: 45678.90,
        assets: [
            { name: 'Bitcoin', symbol: 'BTC', amount: 0.5, value: 45000 },
            { name: 'Ethereum', symbol: 'ETH', amount: 4.2, value: 678.90 }
        ]
    };

    // Update UI
    document.getElementById('totalValue').textContent = `$${portfolioData.totalValue.toLocaleString()}`;
    
    // Hide loading screen
    document.getElementById('loading').style.display = 'none';
});
