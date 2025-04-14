const state = {
    user: null,
    transactions: [],
    statistics: {
        expense: 0,
        saving: 0,
        investment: 0
    }
};

let chart = null;

// Profile Image Generation
function generateProfileImage(gender) {
    // Using avatar-placeholder API with gender-specific avatars
    const avatarType = gender === 'male' ? 'boy' : 'girl';
    return `https://avatar.iran.liara.run/public/${avatarType}`;
}

// Auth Functions
function login(username, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        state.user = { 
            id: user.id, 
            username: user.username,
            gender: user.gender,
            profileImage: generateProfileImage(user.gender)
        };
        localStorage.setItem('currentUser', JSON.stringify(state.user));
        renderHome();
    } else {
        alert('Invalid username or password');
    }
}

function signup(username, password, gender) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.some(u => u.username === username)) {
        alert('Username already exists');
        return;
    }

    const profileImage = generateProfileImage(gender);
    const newUser = {
        id: Date.now(),
        username,
        password,
        gender,
        profileImage
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    state.user = { 
        id: newUser.id, 
        username: newUser.username,
        gender: newUser.gender,
        profileImage: profileImage
    };
    localStorage.setItem('currentUser', JSON.stringify(state.user));
    renderHome();
}

function logout() {
    state.user = null;
    localStorage.removeItem('currentUser');
    renderLogin();
}

// Transaction Functions
function addTransaction(amount, category, description, paymentType, location) {
    const transaction = {
        id: Date.now(),
        amount: parseFloat(amount),
        category,
        description,
        paymentType,
        location,
        userId: state.user.id,
        date: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        })
    };

    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    state.transactions = transactions.filter(t => t.userId === state.user.id);
    updateStatistics();
    renderTransactions();
    
    // Update chart data
    if (chart) {
        const expenseTotal = state.transactions
            .filter(t => t.category === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const savingTotal = state.transactions
            .filter(t => t.category === 'saving')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const investmentTotal = state.transactions
            .filter(t => t.category === 'investment')
            .reduce((sum, t) => sum + t.amount, 0);

        chart.data.datasets[0].data = [expenseTotal, savingTotal, investmentTotal];
        chart.update();
    }
}

function fetchTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    state.transactions = transactions.filter(t => t.userId === state.user.id);
    updateStatistics();
}

// Chart Functions
function updateStatistics() {
    state.statistics = {
        investment: state.transactions
            .filter(t => t.category === 'investment')
            .reduce((sum, t) => sum + t.amount, 0),
        saving: state.transactions
            .filter(t => t.category === 'saving')
            .reduce((sum, t) => sum + t.amount, 0),
        expense: state.transactions
            .filter(t => t.category === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)
    };
}

function initializeChart() {
    const ctx = document.getElementById('statistics-chart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Investment', 'Saving', 'Expense'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#74b9ff', // Investment - Blue
                    '#00b894', // Saving - Green
                    '#ff7675', // Expense - Pink
                ],
                borderWidth: 0,
                cutout: '80%',
                borderRadius: 20,
                spacing: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Hide default legend as we have custom one
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: $${context.raw.toLocaleString()}`;
                        }
                    },
                    backgroundColor: '#1a1a1a',
                    padding: 10,
                    cornerRadius: 5,
                    displayColors: false
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
}

// Render Functions
function renderLogin() {
    const mainContent = document.getElementById('app');
    mainContent.innerHTML = '';
    const loginContent = document.getElementById('login-template').content.cloneNode(true);
    mainContent.appendChild(loginContent);

    const loginForm = document.getElementById('login-form');
    const showSignupLink = document.getElementById('show-signup');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        login(username, password);
    });

    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderSignup();
    });
}

function renderSignup() {
    const mainContent = document.getElementById('app');
    mainContent.innerHTML = '';
    const signupContent = document.getElementById('signup-template').content.cloneNode(true);
    mainContent.appendChild(signupContent);

    const signupForm = document.getElementById('signup-form');
    const showLoginLink = document.getElementById('show-login');

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const gender = document.getElementById('gender').value;

        if (!gender) {
            alert('Please select your gender');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        signup(username, password, gender);
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderLogin();
    });
}

function renderTransactions() {
    const transactionsContainer = document.getElementById('transactions-container');
    transactionsContainer.innerHTML = '';

    state.transactions.slice().reverse().forEach(transaction => {
        const transactionElement = document.createElement('div');
        transactionElement.className = `transaction-card ${transaction.category}`;
        
        transactionElement.innerHTML = `
            <div class="card-header">
                <div class="card-title">${transaction.category}</div>
                <div class="card-actions">
                    <button class="btn-icon" onclick="deleteTransaction('${transaction.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button class="btn-icon" onclick="showUpdateForm('${transaction.id}')">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                </div>
            </div>
            <div class="card-content">
                <div class="transaction-detail">
                    <i class="fas fa-file-alt"></i>
                    <span>Description: ${transaction.description}</span>
                </div>
                <div class="transaction-detail">
                    <i class="fas fa-credit-card"></i>
                    <span>Payment Type: ${transaction.paymentType || 'Card'}</span>
                </div>
                <div class="transaction-detail">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>Amount: $${transaction.amount.toFixed(2)}</span>
                </div>
                <div class="transaction-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Location: ${transaction.location || 'Not specified'}</span>
                </div>
            </div>
            <div class="card-footer">
                <span class="transaction-date">${transaction.date}</span>
                <img src="${state.user.profileImage}" alt="User" class="transaction-user-image">
            </div>
        `;
        
        transactionsContainer.appendChild(transactionElement);
    });

    // Add event listeners for update and delete buttons
    document.querySelectorAll('.btn-update').forEach(button => {
        button.addEventListener('click', (e) => {
            const transactionId = e.target.closest('.btn-update').dataset.id;
            showUpdateForm(transactionId);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const transactionId = e.target.closest('.btn-delete').dataset.id;
            deleteTransaction(transactionId);
        });
    });

    if (chart) {
        chart.data.datasets[0].data = [
            state.statistics.investment,
            state.statistics.saving,
            state.statistics.expense
        ];
        chart.update();
    }
}

function renderHome() {
    const mainContent = document.getElementById('app');
    mainContent.innerHTML = '';
    const homeContent = document.getElementById('home-template').content.cloneNode(true);
    mainContent.appendChild(homeContent);

    // Set profile image
    document.getElementById('profile-image').src = state.user.profileImage;

    // Setup profile dropdown
    const profileDropdown = document.querySelector('.profile-dropdown');
    const profileTrigger = document.querySelector('.profile-trigger');
    const dropdownContent = document.querySelector('.dropdown-content');
    
    // Toggle dropdown on profile trigger click
    profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownContent.classList.toggle('show');
    });

    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        logout();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownContent.classList.remove('show');
    });

    // Prevent dropdown from closing when clicking inside it
    dropdownContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Setup transaction form
    const transactionForm = document.getElementById('transaction-form');
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const paymentType = document.getElementById('payment-type').value;
        const location = document.getElementById('location').value;
        
        if (!amount || !category || !description || !paymentType || !location) {
            alert('Please fill in all fields');
            return;
        }
        
        addTransaction(amount, category, description, paymentType, location);
        transactionForm.reset();
    });

    initializeChart();
    fetchTransactions();
    renderTransactions();
}

// Initializing app
function initializeApp() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        // Regenerate profile image URL based on gender
        currentUser.profileImage = generateProfileImage(currentUser.gender);
        state.user = currentUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        renderHome();
    } else {
        renderLogin();
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const updatedTransactions = transactions.filter(t => t.id !== parseInt(id));
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        state.transactions = updatedTransactions.filter(t => t.userId === state.user.id);
        updateStatistics();
    renderTransactions();
    }
}

function showUpdateForm(transactionId) {
    const transaction = state.transactions.find(t => t.id === parseInt(transactionId));
    if (!transaction) return;

    const updateForm = document.createElement('div');
    updateForm.className = 'update-form-overlay';
    updateForm.innerHTML = `
        <div class="update-form">
            <h3>Update Transaction</h3>
            <form id="update-transaction-form">
                <div class="form-group">
                    <label for="update-amount">Amount</label>
                    <input type="number" id="update-amount" value="${transaction.amount}" required>
                </div>
                <div class="form-group">
                    <label for="update-category">Category</label>
                    <select id="update-category" required>
                        <option value="expense" ${transaction.category === 'expense' ? 'selected' : ''}>Expense</option>
                        <option value="saving" ${transaction.category === 'saving' ? 'selected' : ''}>Saving</option>
                        <option value="investment" ${transaction.category === 'investment' ? 'selected' : ''}>Investment</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="update-description">Description</label>
                    <input type="text" id="update-description" value="${transaction.description}" required>
                </div>
                <div class="form-group">
                    <label for="update-payment-type">Payment Type</label>
                    <select id="update-payment-type" required>
                        <option value="">Select Payment Type</option>
                        <option value="Card" ${transaction.paymentType === 'Card' ? 'selected' : ''}>Card</option>
                        <option value="Cash" ${transaction.paymentType === 'Cash' ? 'selected' : ''}>Cash</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="update-location">Location</label>
                    <input type="text" id="update-location" value="${transaction.location || ''}" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Update</button>
                    <button type="button" class="btn-cancel">Cancel</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(updateForm);

    const form = updateForm.querySelector('#update-transaction-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const updatedTransaction = {
            ...transaction,
            amount: parseFloat(document.getElementById('update-amount').value),
            category: document.getElementById('update-category').value,
            description: document.getElementById('update-description').value,
            paymentType: document.getElementById('update-payment-type').value,
            location: document.getElementById('update-location').value
        };
        updateTransaction(updatedTransaction);
        updateForm.remove();
    });

    const cancelBtn = updateForm.querySelector('.btn-cancel');
    cancelBtn.addEventListener('click', () => {
        updateForm.remove();
    });
}

function updateTransaction(updatedTransaction) {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const index = transactions.findIndex(t => t.id === updatedTransaction.id);
    
    if (index !== -1) {
        transactions[index] = updatedTransaction;
        localStorage.setItem('transactions', JSON.stringify(transactions));
        state.transactions = transactions.filter(t => t.userId === state.user.id);
        updateStatistics();
        renderTransactions();
    }
} 