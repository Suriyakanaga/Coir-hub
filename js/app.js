// State Management
let transactions = JSON.parse(localStorage.getItem('coirhub_transactions')) || [];

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');
const pageTitle = document.getElementById('page-title');

const modal = document.getElementById('transaction-modal');
const btnNewTx = document.getElementById('btn-new-transaction');
const btnCloseModal = document.getElementById('close-modal');
const btnCancelModal = document.getElementById('btn-cancel');
const txForm = document.getElementById('transaction-form');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date in form
    document.getElementById('tx_date').valueAsDate = new Date();
    updateDashboard();
    renderTransactions();
    renderStock();
});

// Navigation Handling
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active class on nav
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Update page title
        pageTitle.textContent = item.textContent.trim();
        
        // Show target view
        const targetId = item.getAttribute('data-target');
        viewSections.forEach(section => {
            if (section.id === targetId) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });
        
        // Refresh specific view data when navigated to
        if(targetId === 'dashboard') updateDashboard();
        if(targetId === 'transactions') renderTransactions();
        if(targetId === 'stock') renderStock();
    });
});

// Modal Handling
btnNewTx.addEventListener('click', () => {
    modal.classList.remove('hidden');
});

const closeModal = () => {
    modal.classList.add('hidden');
    txForm.reset();
    document.getElementById('tx_date').valueAsDate = new Date();
};

btnCloseModal.addEventListener('click', closeModal);
btnCancelModal.addEventListener('click', closeModal);

// Form Submission
txForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const type = document.querySelector('input[name="tx_type"]:checked').value;
    const date = document.getElementById('tx_date').value;
    const party = document.getElementById('tx_party').value;
    const qty = parseFloat(document.getElementById('tx_qty').value);
    const amount = parseFloat(document.getElementById('tx_amount').value);
    const payment = document.getElementById('tx_payment').value;
    
    const newTx = {
        id: Date.now().toString(),
        type,
        date,
        party,
        qty,
        amount,
        payment,
        createdAt: new Date().toISOString()
    };
    
    transactions.push(newTx);
    saveData();
    closeModal();
    
    // Refresh Current View
    updateDashboard();
    renderTransactions();
    renderStock();
});

function saveData() {
    // Sort transactions by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('coirhub_transactions', JSON.stringify(transactions));
}

// Format Currency
const formatRs = (num) => '₹' + num.toLocaleString('en-IN');

function updateDashboard() {
    let stock = 0;
    let totalSales = 0;
    let totalPurchases = 0;
    let pendingPayments = 0;
    
    transactions.forEach(tx => {
        if (tx.type === 'purchase') {
            stock += tx.qty;
            totalPurchases += tx.amount;
            if (tx.payment === 'unpaid') pendingPayments += tx.amount;
        } else if (tx.type === 'sale') {
            stock -= tx.qty;
            totalSales += tx.amount;
            if (tx.payment === 'unpaid') pendingPayments += tx.amount;
        }
    });
    
    document.getElementById('dash-stock').textContent = `${stock} kg`;
    document.getElementById('dash-sales').textContent = formatRs(totalSales);
    document.getElementById('dash-purchases').textContent = formatRs(totalPurchases);
    document.getElementById('dash-pending').textContent = formatRs(pendingPayments);
    
    // Render recent activity
    const recentActivityContainer = document.getElementById('recent-activity');
    recentActivityContainer.innerHTML = '';
    
    const recentTx = transactions.slice(0, 5); // top 5
    if (recentTx.length === 0) {
        recentActivityContainer.innerHTML = '<p style="color:var(--text-secondary)">No recent activity found.</p>';
        return;
    }
    
    recentTx.forEach(tx => {
        const isPurchase = tx.type === 'purchase';
        recentActivityContainer.innerHTML += `
            <div class="activity-item">
                <div class="activity-info">
                    <div class="activity-icon ${isPurchase ? 'icon-purchase' : 'icon-sale'}">
                        <i class="fa-solid ${isPurchase ? 'fa-cart-arrow-down' : 'fa-chart-line'}"></i>
                    </div>
                    <div class="activity-text">
                        <h4>${tx.party}</h4>
                        <p>${new Date(tx.date).toLocaleDateString()} • ${tx.qty} kg</p>
                    </div>
                </div>
                <div class="activity-amount ${isPurchase ? 'text-negative' : 'text-positive'}">
                    ${isPurchase ? '-' : '+'}${formatRs(tx.amount)}
                </div>
            </div>
        `;
    });
}

function renderTransactions() {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';
    
    const filter = document.getElementById('filter-type').value;
    let filteredTx = transactions;
    if (filter !== 'all') {
        filteredTx = transactions.filter(t => t.type === filter);
    }
    
    if (filteredTx.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 24px;">No transactions recorded.</td></tr>';
        return;
    }
    
    filteredTx.forEach(tx => {
        // inline styles for dynamic stuff are acceptable here, though classes exist (badge, btn)
        tbody.innerHTML += `
            <tr>
                <td>${new Date(tx.date).toLocaleDateString()}</td>
                <td><span class="badge ${tx.type === 'purchase' ? 'badge-purchase' : 'badge-sale'}">${tx.type}</span></td>
                <td><strong>${tx.party}</strong></td>
                <td>${tx.qty} kg</td>
                <td>${formatRs(tx.amount)}</td>
                <td>
                    <span class="badge ${tx.payment === 'paid' ? 'badge-paid' : 'badge-unpaid'}" style="cursor:pointer;" onclick="togglePayment('${tx.id}')">
                        ${tx.payment}
                    </span>
                </td>
                <td>
                    <button class="btn btn-secondary" style="padding: 6px 10px; font-size:12px" onclick="deleteTx('${tx.id}')">
                        <i class="fa-solid fa-trash" style="color:var(--danger)"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

document.getElementById('filter-type').addEventListener('change', renderTransactions);

window.togglePayment = (id) => {
    const tx = transactions.find(t => t.id === id);
    if(tx) {
        tx.payment = tx.payment === 'paid' ? 'unpaid' : 'paid';
        saveData();
        renderTransactions();
        updateDashboard();
    }
};

window.deleteTx = (id) => {
    if(confirm("Are you sure you want to delete this transaction?")) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        renderTransactions();
        updateDashboard();
        renderStock();
    }
};

function renderStock() {
    const tbody = document.getElementById('stock-body');
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 24px;">No stock movements recorded.</td></tr>';
        return;
    }
    
    // Process backwards to show running balance chronologically
    let txs = [...transactions].sort((a,b) => new Date(a.date) - new Date(b.date));
    let balance = 0;
    
    // Map to new array with balances
    const rows = txs.map(tx => {
        if(tx.type === 'purchase') balance += tx.qty;
        else balance -= tx.qty;
        return { ...tx, balance };
    });
    
    // Display newest first
    rows.reverse().forEach(tx => {
        tbody.innerHTML += `
            <tr>
                <td>${new Date(tx.date).toLocaleDateString()}</td>
                <td>${tx.type === 'purchase' ? 'Purchase from ' : 'Sale to '} ${tx.party}</td>
                <td style="color:var(--success)">${tx.type === 'purchase' ? tx.qty : '-'}</td>
                <td style="color:var(--warning)">${tx.type === 'sale' ? tx.qty : '-'}</td>
                <td><strong>${tx.balance} kg</strong></td>
            </tr>
        `;
    });
}
