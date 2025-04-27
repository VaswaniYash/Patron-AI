// DOM Elements
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const toggleLinks = document.querySelectorAll('.toggle-link');

// Toggle between forms with button highlighting
function toggleForms(showLogin = true) {
    if (showLogin) {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        loginBtn.classList.add('active');
        signupBtn.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        loginBtn.classList.remove('active');
        signupBtn.classList.add('active');
    }
}

// Initialize active state
toggleForms(true);

// Button event listeners
loginBtn.addEventListener('click', () => toggleForms(true));
signupBtn.addEventListener('click', () => toggleForms(false));

// Link event listeners
toggleLinks.forEach(link => {
    link.addEventListener('click', function() {
        const showLogin = this.textContent.trim() === 'Login';
        toggleForms(showLogin);
    });
});

// LOGIN - Fixed Version
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target[0].value.trim();
    const password = e.target[1].value;

    try {
        const res = await fetch('http://localhost:5500/AI/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || data.message || 'Login failed');
        }

        // Successful login
        alert(data.message || 'Login successful!');
        console.log('User data:', data.user);
        
        // Store user data or redirect
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/index.html'; // Uncomment to redirect
        }

    } catch (err) {
        console.error('Login Error:', err);
        alert(err.message || 'Login failed. Please try again.');
    }
});

// SIGNUP - Fixed Version
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = e.target[0].value.trim();
    const email = e.target[1].value.trim();
    const password = e.target[2].value;

    try {
        const res = await fetch('http://localhost:5500/AI/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || data.message || 'Signup failed');
        }

        // Successful signup
        alert(data.message || 'Account created successfully!');
        toggleForms(true); // Switch to login form
        
        // Auto-fill login form
        document.querySelector('#login-form input[type="email"]').value = email;
        document.querySelector('#login-form input[type="password"]').value = '';

    } catch (err) {
        console.error('Signup Error:', err);
        alert(err.message || 'Signup failed. Please try again.');
    }
});
