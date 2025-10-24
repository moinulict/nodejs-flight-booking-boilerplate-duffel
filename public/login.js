// Simplified Login functionality
class LoginManager {
    constructor() {
        console.log('🚀 LoginManager initialized');
        this.setupEventListeners();
    }

    setupAxios() {
        // Simple axios setup without complex configuration
        return axios.create({
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
                console.log('🔥 Form submit event triggered');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.login();
                return false;
            });
        }

        // Also add click handler to the button as backup
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                console.log('🔥 Button click event triggered');
                e.preventDefault();
                e.stopPropagation();
                this.login();
                return false;
            });
        }

        // Real-time validation
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');

        if (emailField) {
            emailField.addEventListener('blur', () => this.validateEmail());
            emailField.addEventListener('input', () => this.clearFieldError('email'));
        }

        if (passwordField) {
            passwordField.addEventListener('blur', () => this.validatePassword());
            passwordField.addEventListener('input', () => this.clearFieldError('password'));
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
        // Clear previous errors
        this.hideError('loginError');
        this.clearAllFieldErrors();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        console.log('🔍 LOGIN DEBUG - Email field value:', email);
        console.log('🔍 LOGIN DEBUG - Password field value:', password);
        console.log('🔍 LOGIN DEBUG - Password length:', password.length);

        // Comprehensive validation
        const emailValid = this.validateEmail();
        const passwordValid = this.validatePassword();

        if (!emailValid || !passwordValid) {
            console.log('❌ LOGIN DEBUG - Validation failed');
            this.showError('loginError', 'Please fix the errors above');
            return;
        }

        console.log('🚀 LOGIN DEBUG - Starting login request...');
        this.showLoading('loginBtn', 'loginText', 'Signing In...');
        this.hideError('loginError');

        try {
            console.log('📤 LOGIN DEBUG - Sending request to /api/login');
            const axiosInstance = this.setupAxios();
            const response = await axiosInstance.post('/api/login', {
                email: email,
                password: password
            });

            console.log('📥 LOGIN DEBUG - Response received:', response.status);
            console.log('🎯 Login Response:', response.data);
            console.log('📊 Response Status:', response.data.status, typeof response.data.status);
            
            if (response.data.status === 'true' || response.data.status === true) {
                // Store user data and tokens
                const { access_token, refresh_token, user } = response.data.data;
                
                console.log('💾 Storing tokens and user data...');
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', refresh_token);
                localStorage.setItem('user_data', JSON.stringify(user));
                
                console.log('✅ Tokens stored successfully');
                console.log('🔄 Redirecting to dashboard in 1 second...');
                
                this.showSuccess('Login successful! Redirecting...');
                
                // Redirect to dashboard immediately for testing
                console.log('🚀 Redirecting NOW to /dashboard');
                window.location.href = '/dashboard';
                
            } else {
                console.log('❌ Login status not true:', response.data.status);
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (error) {
            console.error('❌ LOGIN DEBUG - Error occurred:', error);
            console.error('❌ LOGIN DEBUG - Error response:', error.response?.data);
            console.error('❌ LOGIN DEBUG - Error status:', error.response?.status);
            
            let errorMessage;
            if (error.response) {
                console.log('❌ LOGIN DEBUG - Server responded with error');
                errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
            } else if (error.request) {
                console.log('❌ LOGIN DEBUG - Network error');
                errorMessage = 'Network error: Unable to connect to server';
            } else {
                console.log('❌ LOGIN DEBUG - Other error');
                errorMessage = error.message || 'Login failed. Please try again.';
            }
            
            console.log('❌ LOGIN DEBUG - Showing error to user:', errorMessage);
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

    // Validation Methods
    validateEmail() {
        const emailField = document.getElementById('email');
        const email = emailField.value.trim();
        
        if (!email) {
            this.showFieldError('email', 'Email is required');
            return false;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            return false;
        }

        this.clearFieldError('email');
        return true;
    }

    validatePassword() {
        const passwordField = document.getElementById('password');
        const password = passwordField.value;
        
        if (!password) {
            this.showFieldError('password', 'Password is required');
            return false;
        }

        if (password.length < 6) {
            this.showFieldError('password', 'Password must be at least 6 characters long');
            return false;
        }

        this.clearFieldError('password');
        return true;
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            // Add error styling to field
            field.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
            field.classList.remove('border-gray-200', 'focus:border-orange-500', 'focus:ring-orange-500');
            
            // Find or create error message element
            let errorElement = document.getElementById(`${fieldId}Error`);
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = `${fieldId}Error`;
                errorElement.className = 'text-red-500 text-sm mt-1';
                field.parentNode.appendChild(errorElement);
            }
            
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            // Remove error styling
            field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
            field.classList.add('border-gray-200', 'focus:border-orange-500', 'focus:ring-orange-500');
            
            // Hide error message
            const errorElement = document.getElementById(`${fieldId}Error`);
            if (errorElement) {
                errorElement.classList.add('hidden');
            }
        }
    }

    clearAllFieldErrors() {
        this.clearFieldError('email');
        this.clearFieldError('password');
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
    console.log('🔄 DOM loaded, initializing LoginManager');
    try {
        const loginManager = new LoginManager();
        console.log('✅ LoginManager created successfully');
    } catch (error) {
        console.error('❌ Failed to create LoginManager:', error);
    }
});