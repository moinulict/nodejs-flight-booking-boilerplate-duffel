// Change Password Management System
class ChangePasswordManager {
    constructor() {
        this.passwordRequirements = {
            length: false,
            uppercase: false,
            lowercase: false,
            number: false,
            special: false
        };
        this.init();
    }
    
    async init() {
        // Initialize navigation and sidebar
        initNavigation();
        initDashboardSidebar('change-password');
        
        // Check authentication
        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Form submission
        document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });
        
        // Cancel button
        document.getElementById('cancelBtn').addEventListener('click', () => {
            window.location.href = '/dashboard';
        });
        
        // Password visibility toggles
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                this.togglePasswordVisibility(e.target.closest('button'));
            });
        });
        
        // Password strength validation
        document.getElementById('newPassword').addEventListener('input', (e) => {
            this.validatePassword(e.target.value);
        });
        
        // Password confirmation validation
        document.getElementById('confirmPassword').addEventListener('input', (e) => {
            this.validatePasswordMatch();
        });
        
        // Real-time form validation
        document.querySelectorAll('#changePasswordForm input').forEach(input => {
            input.addEventListener('input', () => {
                this.validateForm();
            });
        });
    }
    
    togglePasswordVisibility(button) {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }
    
    validatePassword(password) {
        // Reset requirements
        this.passwordRequirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };
        
        // Update requirement indicators
        this.updateRequirementIndicators();
        
        // Calculate and update strength
        this.updatePasswordStrength();
        
        // Validate password match if confirm password is filled
        if (document.getElementById('confirmPassword').value) {
            this.validatePasswordMatch();
        }
    }
    
    updateRequirementIndicators() {
        Object.keys(this.passwordRequirements).forEach(requirement => {
            const icon = document.getElementById(`req-${requirement}`);
            if (icon) {
                if (this.passwordRequirements[requirement]) {
                    icon.className = 'fas fa-check text-green-500 w-4';
                } else {
                    icon.className = 'fas fa-times text-red-500 w-4';
                }
            }
        });
    }
    
    updatePasswordStrength() {
        const metRequirements = Object.values(this.passwordRequirements).filter(Boolean).length;
        const strengthText = document.getElementById('strengthText');
        const strengthBars = document.querySelectorAll('.strength-bar');
        
        // Reset all bars
        strengthBars.forEach(bar => {
            bar.className = 'strength-bar';
        });
        
        let strength = '';
        let strengthClass = '';
        
        switch (metRequirements) {
            case 0:
            case 1:
                strength = 'Very Weak';
                strengthClass = 'strength-very-weak';
                strengthBars[0].classList.add('strength-very-weak');
                break;
            case 2:
                strength = 'Weak';
                strengthClass = 'strength-weak';
                strengthBars[0].classList.add('strength-weak');
                strengthBars[1].classList.add('strength-weak');
                break;
            case 3:
                strength = 'Fair';
                strengthClass = 'strength-fair';
                strengthBars[0].classList.add('strength-fair');
                strengthBars[1].classList.add('strength-fair');
                strengthBars[2].classList.add('strength-fair');
                break;
            case 4:
                strength = 'Good';
                strengthClass = 'strength-good';
                strengthBars.forEach((bar, index) => {
                    if (index < 4) bar.classList.add('strength-good');
                });
                break;
            case 5:
                strength = 'Strong';
                strengthClass = 'strength-strong';
                strengthBars.forEach(bar => bar.classList.add('strength-strong'));
                break;
        }
        
        strengthText.textContent = `Password strength: ${strength}`;
        strengthText.className = `text-sm ${strengthClass}`;
    }
    
    validatePasswordMatch() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const messageDiv = document.getElementById('passwordMatchMessage');
        
        if (confirmPassword && newPassword !== confirmPassword) {
            messageDiv.textContent = 'Passwords do not match';
            messageDiv.className = 'mt-1 text-sm text-red-600';
            messageDiv.classList.remove('hidden');
            return false;
        } else if (confirmPassword && newPassword === confirmPassword) {
            messageDiv.textContent = 'Passwords match';
            messageDiv.className = 'mt-1 text-sm text-green-600';
            messageDiv.classList.remove('hidden');
            return true;
        } else {
            messageDiv.classList.add('hidden');
            return false;
        }
    }
    
    validateForm() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = document.getElementById('submitBtn');
        
        const allRequirementsMet = Object.values(this.passwordRequirements).every(Boolean);
        const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
        const hasCurrentPassword = currentPassword.length > 0;
        
        const isValid = hasCurrentPassword && allRequirementsMet && passwordsMatch;
        
        submitBtn.disabled = !isValid;
        if (isValid) {
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
    
    async changePassword() {
        const form = document.getElementById('changePasswordForm');
        const formData = new FormData(form);
        
        const passwordData = {
            current_password: formData.get('currentPassword'),
            new_password: formData.get('newPassword'),
            confirm_password: formData.get('confirmPassword')
        };
        
        // Validate passwords match
        if (passwordData.new_password !== passwordData.confirm_password) {
            this.showToast('Passwords do not match', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const submitSpinner = document.getElementById('submitSpinner');
        
        submitText.classList.add('hidden');
        submitSpinner.classList.remove('hidden');
        submitBtn.disabled = true;
        
        try {
            const baseUrl = await this.getBaseUrl();
            const token = localStorage.getItem('access_token');
            
            const response = await axios.post(`${baseUrl}/v1/auth/change-password`, passwordData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            this.showToast('Password changed successfully! You will be logged out for security.', 'success');
            
            // Clear form
            form.reset();
            
            // Reset password requirements
            this.passwordRequirements = {
                length: false,
                uppercase: false,
                lowercase: false,
                number: false,
                special: false
            };
            this.updateRequirementIndicators();
            this.updatePasswordStrength();
            
            // Hide password match message
            document.getElementById('passwordMatchMessage').classList.add('hidden');
            
            // Auto logout user for security after password change
            setTimeout(() => {
                this.autoLogoutAfterPasswordChange();
            }, 2000);
            
        } catch (error) {
            console.error('Failed to change password:', error);
            
            if (error.response?.status === 401) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else if (error.response?.status === 400) {
                const message = error.response?.data?.message || 'Current password is incorrect';
                this.showToast(message, 'error');
            } else {
                this.showToast('Failed to change password. Please try again.', 'error');
            }
        } finally {
            // Hide loading state
            submitText.classList.remove('hidden');
            submitSpinner.classList.add('hidden');
            submitBtn.disabled = false;
            this.validateForm(); // Re-validate to set proper button state
        }
    }
    
    async autoLogoutAfterPasswordChange() {
        try {
            // Call logout API if available
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const baseUrl = await this.getBaseUrl();
                    await fetch(`${baseUrl}/v1/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (apiError) {
                    console.log('Logout API call failed, continuing with local logout');
                }
            }
        } catch (error) {
            console.error('Auto logout error:', error);
        }
        
        // Clear local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        
        // Show logout message
        this.showToast('You have been logged out for security. Please login with your new password.', 'info');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
    }
    
    async getBaseUrl() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            return config.apiBaseUrl;
        } catch (error) {
            return 'https://api.tripzip.ai'; // Fallback
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
        
        toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md`;
        toast.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
}

// Initialize change password manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChangePasswordManager();
});