// Login functionality
class LoginManager {
    constructor() {
        this.baseUrl = null;
        this.axiosInstance = null;
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.setupAxios();
        this.setupEventListeners();
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            this.baseUrl = config.apiBaseUrl;
        } catch (error) {
            console.error('Failed to load config, using fallback:', error);
            this.baseUrl = 'https://api.tripzip.ai';
        }
    }

    setupAxios() {
        this.axiosInstance = axios.create({
            baseURL: 'http://localhost:3000',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.login();
                return false;
            });
        }

        // Password toggle
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
        }

        // Forgot password button
        const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', () => {
                window.location.href = '/forgot-password';
            });
        }
    }

    async login() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.showError('loginError', 'Please enter both email and password');
            return;
        }

        if (!this.axiosInstance) {
            this.showError('loginError', 'Configuration not loaded. Please try again.');
            return;
        }

        this.showLoading('loginBtn', 'loginText', 'Signing In...');
        this.hideError('loginError');

        try {
            const response = await this.axiosInstance.post('/api/login', {
                email: email,
                password: password
            });

            if (response.data.status === 'true' || response.data.status === true) {
                // Store user data and tokens
                const { access_token, refresh_token, user } = response.data.data;
                
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', refresh_token);
                localStorage.setItem('user_data', JSON.stringify(user));
                
                this.showSuccess('Login successful! Redirecting...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
                
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage;
            if (error.response) {
                errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
            } else if (error.request) {
                errorMessage = 'Network error: Unable to connect to server';
            } else {
                errorMessage = error.message || 'Login failed. Please try again.';
            }
            
            this.showError('loginError', errorMessage);
        } finally {
            this.hideLoading('loginBtn', 'loginText', 'Sign In');
        }
    }

    togglePasswordVisibility() {
        const passwordField = document.getElementById('password');
        const passwordIcon = document.getElementById('passwordIcon');

        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            passwordIcon.className = 'fas fa-eye-slash';
        } else {
            passwordField.type = 'password';
            passwordIcon.className = 'fas fa-eye';
        }
    }

    // Utility Methods
    showLoading(buttonId, textElementId, loadingText) {
        const button = document.getElementById(buttonId);
        const textElement = document.getElementById(textElementId);

        button.disabled = true;
        button.classList.add('opacity-75', 'cursor-not-allowed');

        if (textElement) {
            textElement.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${loadingText}`;
        }
    }

    hideLoading(buttonId, textElementId, defaultText) {
        const button = document.getElementById(buttonId);
        const textElement = document.getElementById(textElementId);

        button.disabled = false;
        button.classList.remove('opacity-75', 'cursor-not-allowed');

        if (textElement) {
            textElement.textContent = defaultText;
        }
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    showSuccess(message) {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';
        toast.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }
}

// Initialize login manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});