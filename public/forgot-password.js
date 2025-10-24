// Forgot Password functionality
class ForgotPasswordManager {
    constructor() {
        this.baseUrl = null; // Will be loaded from server config
        this.currentStep = 1;
        this.userEmail = '';
        this.otpId = null;
        this.resetTimer = null;
        this.timeLeft = 600; // 10 minutes in seconds
        
        this.init();
    }
    
    async init() {
        // Check if user is already logged in
        const token = localStorage.getItem('access_token');
        if (token) {
            console.log('User already logged in, redirecting to dashboard...');
            window.location.href = '/dashboard/';
            return;
        }
        
        await this.loadConfig();
        this.setupEventListeners();
        this.setupOTPInputs();
    }
    
    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            this.baseUrl = config.apiBaseUrl;
            console.log('Loaded API Base URL:', this.baseUrl);
        } catch (error) {
            console.error('Failed to load config, using fallback:', error);
            this.baseUrl = 'https://api.tripzip.ai'; // Fallback
        }
    }
    
    setupEventListeners() {
        // Forgot password form submission
        document.getElementById('forgotForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendResetCode();
        });
        
        // Reset password form submission
        document.getElementById('resetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.resetPassword();
        });
        
        // Resend code button
        document.getElementById('resendResetBtn').addEventListener('click', () => {
            this.resendResetCode();
        });
        
        // Password toggle
        document.getElementById('toggleNewPassword').addEventListener('click', () => {
            this.togglePasswordVisibility();
        });
        
        // Password matching validation
        document.getElementById('confirmNewPassword').addEventListener('input', () => {
            this.validatePasswordMatch();
        });
        
        // Edit email button
        document.getElementById('editEmailBtn').addEventListener('click', () => {
            this.goBackToStep1();
        });
    }
    
    setupOTPInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');
        
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Only allow digits
                if (!/^[0-9]$/.test(value)) {
                    e.target.value = '';
                    return;
                }
                
                // Add filled class
                if (value) {
                    e.target.classList.add('filled');
                } else {
                    e.target.classList.remove('filled');
                }
                
                // Auto-focus next input
                if (value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });
            
            input.addEventListener('keydown', (e) => {
                // Handle backspace
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
            
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text');
                
                // Only process if it's a 6-digit number
                if (/^\d{6}$/.test(pastedData)) {
                    const digits = pastedData.split('');
                    otpInputs.forEach((input, i) => {
                        if (digits[i]) {
                            input.value = digits[i];
                            input.classList.add('filled');
                        }
                    });
                    
                    // Focus the last input
                    otpInputs[5].focus();
                }
            });
        });
    }
    
    async sendResetCode() {
        const email = document.getElementById('forgotEmail').value.trim();
        
        if (!this.validateEmail(email)) {
            this.showError('forgotError', 'Please enter a valid email address');
            return;
        }
        
        if (!this.baseUrl) {
            this.showError('forgotError', 'Configuration not loaded. Please try again.');
            return;
        }
        
        this.showLoading('sendResetBtn', 'sendResetText', 'Sending...');
        this.hideError('forgotError');
        
        try {
            const response = await axios.post(`${this.baseUrl}/v1/auth/forgot-password`, {
                email: email
            });
            
            console.log('Forgot Password Response:', response.data);
            
            if (response.data.status === 'true' || response.data.status === true) {
                this.userEmail = email;
                this.otpId = response.data.data.otp_id;
                this.timeLeft = response.data.data.expires_in_minutes * 60;
                
                this.showStep(2);
                document.getElementById('emailDisplay').textContent = email;
                this.startResetTimer();
                
                this.showSuccess('Reset code sent! Check your email.');
            } else {
                throw new Error(response.data.message || 'Failed to send reset code');
            }
        } catch (error) {
            console.error('Forgot Password Error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset code. Please try again.';
            this.showError('forgotError', errorMessage);
        } finally {
            this.hideLoading('sendResetBtn', 'sendResetText', 'Send Reset Code');
        }
    }
    
    async resendResetCode() {
        if (!this.userEmail) return;
        
        this.showLoading('resendResetBtn', null, 'Resending...');
        
        try {
            const response = await axios.post(`${this.baseUrl}/v1/auth/forgot-password`, {
                email: this.userEmail
            });
            
            console.log('Resend Reset Code Response:', response.data);
            
            if (response.data.status === 'true' || response.data.status === true) {
                this.otpId = response.data.data.otp_id;
                this.timeLeft = response.data.data.expires_in_minutes * 60;
                
                // Clear current OTP inputs
                document.querySelectorAll('.otp-input').forEach(input => {
                    input.value = '';
                    input.classList.remove('filled');
                });
                
                this.startResetTimer();
                this.showSuccess('Reset code resent! Check your email.');
            } else {
                throw new Error(response.data.message || 'Failed to resend reset code');
            }
        } catch (error) {
            console.error('Resend Reset Code Error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to resend reset code. Please try again.';
            this.showError('resetError', errorMessage);
        } finally {
            this.hideLoading('resendResetBtn', null, 'Resend Code');
        }
    }
    
    async resetPassword() {
        const otpCode = this.getOTPCode();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        if (otpCode.length !== 6) {
            this.showError('resetError', 'Please enter the complete 6-digit code');
            return;
        }
        
        if (newPassword.length < 8) {
            this.showError('resetError', 'Password must be at least 8 characters long');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showError('resetError', 'Passwords do not match');
            return;
        }
        
        if (!this.baseUrl) {
            this.showError('resetError', 'Configuration not loaded. Please try again.');
            return;
        }
        
        this.showLoading('resetPasswordBtn', 'resetPasswordText', 'Resetting...');
        this.hideError('resetError');
        
        try {
            const response = await axios.post(`${this.baseUrl}/v1/auth/reset-password`, {
                email: this.userEmail,
                otp_code: otpCode,
                new_password: newPassword
            });
            
            console.log('Reset Password Response:', response.data);
            
            if (response.data.status === 'true' || response.data.status === true) {
                this.clearResetTimer();
                this.showSuccess('Password reset successfully! Redirecting to login...');
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                throw new Error(response.data.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Reset Password Error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to reset password. Please try again.';
            this.showError('resetError', errorMessage);
        } finally {
            this.hideLoading('resetPasswordBtn', 'resetPasswordText', 'Reset Password');
        }
    }
    
    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('#step1, #step2').forEach(step => {
            step.classList.add('hidden');
        });
        
        // Show current step
        document.getElementById(`step${stepNumber}`).classList.remove('hidden');
        document.getElementById(`step${stepNumber}`).classList.add('fade-in');
        
        this.currentStep = stepNumber;
    }
    
    goBackToStep1() {
        // Clear timer if running
        this.clearResetTimer();
        
        // Clear OTP inputs
        document.querySelectorAll('.otp-input').forEach(input => {
            input.value = '';
            input.classList.remove('filled');
        });
        
        // Clear password fields
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
        
        // Hide any error messages
        this.hideError('resetError');
        this.hideError('passwordMatchError');
        
        // Go back to step 1
        this.showStep(1);
        
        // Focus on email input
        document.getElementById('forgotEmail').focus();
    }
    
    startResetTimer() {
        this.clearResetTimer();
        
        const updateTimer = () => {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            
            document.getElementById('resetTimer').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (this.timeLeft <= 0) {
                this.clearResetTimer();
                this.showError('resetError', 'Reset code has expired. Please request a new one.');
                return;
            }
            
            this.timeLeft--;
        };
        
        updateTimer();
        this.resetTimer = setInterval(updateTimer, 1000);
    }
    
    clearResetTimer() {
        if (this.resetTimer) {
            clearInterval(this.resetTimer);
            this.resetTimer = null;
        }
    }
    
    getOTPCode() {
        return Array.from(document.querySelectorAll('.otp-input'))
            .map(input => input.value)
            .join('');
    }
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    validatePasswordMatch() {
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        const errorElement = document.getElementById('passwordMatchError');
        
        if (confirmPassword && password !== confirmPassword) {
            errorElement.classList.remove('hidden');
        } else {
            errorElement.classList.add('hidden');
        }
    }
    
    togglePasswordVisibility() {
        const passwordField = document.getElementById('newPassword');
        const passwordIcon = document.getElementById('newPasswordIcon');
        
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
        const textElement = textElementId ? document.getElementById(textElementId) : null;
        
        button.disabled = true;
        button.classList.add('opacity-75', 'cursor-not-allowed');
        
        if (textElement) {
            textElement.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${loadingText}`;
        } else {
            button.innerHTML = `<span class="flex items-center justify-center space-x-2">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${loadingText}</span>
            </span>`;
        }
    }
    
    hideLoading(buttonId, textElementId, defaultText) {
        const button = document.getElementById(buttonId);
        const textElement = textElementId ? document.getElementById(textElementId) : null;
        
        button.disabled = false;
        button.classList.remove('opacity-75', 'cursor-not-allowed');
        
        if (textElement) {
            textElement.textContent = defaultText;
        } else {
            button.innerHTML = `<span class="flex items-center justify-center space-x-2">
                <span>${defaultText}</span>
            </span>`;
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

// Initialize forgot password manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ForgotPasswordManager();
});