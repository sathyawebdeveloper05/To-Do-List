// -----------------------------
// Authentication Management
// -----------------------------

document.addEventListener('DOMContentLoaded', function() {
    // Signup Form Handling
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);

        // Real-time validation with debounce
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        if (usernameInput) usernameInput.addEventListener('input', debounce(validateUsername, 300));
        if (emailInput) emailInput.addEventListener('input', debounce(validateEmail, 300));
        if (passwordInput) passwordInput.addEventListener('input', debounce(validatePassword, 300));
        if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', debounce(validateConfirmPassword, 300));
    }

    // Login Form Handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Check if user is already logged in
    checkAuthStatus();
});

// -----------------------------
// Debounce Helper
// -----------------------------
function debounce(fn, delay = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

// -----------------------------
// Validation Functions
// -----------------------------
function validateUsername() {
    const username = document.getElementById('username').value.trim();
    const errorElement = document.getElementById('usernameError');

    if (username.length < 3) {
        errorElement.textContent = 'Username must be at least 3 characters';
        return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errorElement.textContent = 'Username can only contain letters, numbers, and underscores';
        return false;
    }

    // Check uniqueness
    if (storage.findUser(username)) {
        errorElement.textContent = 'Username already exists';
        return false;
    }

    errorElement.textContent = '';
    return true;
}

function validateEmail() {
    const email = document.getElementById('email').value.trim();
    const errorElement = document.getElementById('emailError');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorElement.textContent = 'Please enter a valid email address';
        return false;
    }

    // Check uniqueness
    if (storage.findUserByEmail(email)) {
        errorElement.textContent = 'Email already exists';
        return false;
    }

    errorElement.textContent = '';
    return true;
}

function validatePassword() {
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('passwordError');

    if (password.length < 6) {
        errorElement.textContent = 'Password must be at least 6 characters';
        return false;
    }

    errorElement.textContent = '';
    return true;
}

function validateConfirmPassword() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorElement = document.getElementById('confirmPasswordError');

    if (password !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match';
        return false;
    }

    errorElement.textContent = '';
    return true;
}

// -----------------------------
// Form Handlers
// -----------------------------
async function handleSignup(e) {
    e.preventDefault();

    const isUsernameValid = validateUsername();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();

    if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
        showNotification('Please fix all errors before submitting', 'error');
        return;
    }

    const formData = {
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: hashPassword(document.getElementById('password').value)
    };

    try {
        storage.createUser(formData);
        showNotification('Account created successfully! Redirecting to login...', 'success');
        setTimeout(() => window.location.href = 'login.html', 2000);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    document.getElementById('loginUsernameError').textContent = '';
    document.getElementById('loginPasswordError').textContent = '';

    const user = storage.findUser(username);

    if (!user) {
        document.getElementById('loginUsernameError').textContent = 'User not found';
        showNotification('Invalid username or password', 'error');
        return;
    }

    if (user.password !== hashPassword(password)) {
        document.getElementById('loginPasswordError').textContent = 'Incorrect password';
        showNotification('Invalid username or password', 'error');
        return;
    }

    storage.setCurrentUser(user);
    showNotification('Login successful! Redirecting...', 'success');

    setTimeout(() => window.location.href = 'todo.html', 1500);
}

// -----------------------------
// Authentication Status
// -----------------------------
function checkAuthStatus() {
    const currentUser = storage.getCurrentUser();
    const currentPage = window.location.pathname.split('/').pop();

    if (currentUser && ['index.html', 'login.html', 'signup.html'].includes(currentPage)) {
        window.location.href = 'todo.html';
    }

    if (!currentUser && ['todo.html', 'report.html'].includes(currentPage)) {
        window.location.href = 'login.html';
    }
}

// -----------------------------
// Notification System
// -----------------------------
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) existingNotification.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        max-width: 400px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;

    const colors = { success: '#4CAF50', error: '#ff4757', info: '#667eea', warning: '#ffa502' };
    notification.style.background = colors[type] || colors.info;

    document.body.appendChild(notification);

    setTimeout(() => { if (notification.parentElement) notification.remove(); }, 5000);
}

// Slide-in animation
const style = document.createElement('style');
style.textContent = `
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
`;
document.head.appendChild(style);

// -----------------------------
// Password Hashing Simulation
// -----------------------------
function hashPassword(password) {
    // Simple hash for demo; in real apps, use bcrypt or other secure hashing
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        hash = (hash << 5) - hash + password.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}

// -----------------------------
// Storage System (LocalStorage)
// -----------------------------
const storage = {
    createUser: ({ username, email, password }) => {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.username === username)) throw new Error('Username already exists');
        if (users.find(u => u.email === email)) throw new Error('Email already exists');
        users.push({ username, email, password });
        localStorage.setItem('users', JSON.stringify(users));
        return { username, email };
    },
    findUser: (username) => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(u => u.username === username);
    },
    findUserByEmail: (email) => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(u => u.email === email);
    },
    setCurrentUser: (user) => localStorage.setItem('currentUser', JSON.stringify(user)),
    getCurrentUser: () => JSON.parse(localStorage.getItem('currentUser') || null)
};

