// Signup functionality with OTP verification
class SignupManager {
    constructor() {
        this.baseUrl = null; // Will be loaded from server config
        this.currentStep = 1;
        this.otpId = null;
        this.userEmail = '';
        this.otpCode = '';
        this.otpTimer = null;
        this.otpTimeLeft = 600; // 10 minutes in seconds
        this.selectedCountry = { code: '+1', flag: '🇺🇸', name: 'United States' };
        this.countries = [
            { code: '+1', flag: '🇺🇸', name: 'United States' },
            { code: '+1', flag: '🇨🇦', name: 'Canada' },
            { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
            { code: '+33', flag: '🇫🇷', name: 'France' },
            { code: '+49', flag: '🇩🇪', name: 'Germany' },
            { code: '+39', flag: '🇮🇹', name: 'Italy' },
            { code: '+34', flag: '🇪🇸', name: 'Spain' },
            { code: '+31', flag: '🇳🇱', name: 'Netherlands' },
            { code: '+41', flag: '🇨🇭', name: 'Switzerland' },
            { code: '+46', flag: '🇸🇪', name: 'Sweden' },
            { code: '+47', flag: '🇳🇴', name: 'Norway' },
            { code: '+45', flag: '🇩🇰', name: 'Denmark' },
            { code: '+358', flag: '🇫🇮', name: 'Finland' },
            { code: '+32', flag: '🇧🇪', name: 'Belgium' },
            { code: '+43', flag: '🇦🇹', name: 'Austria' },
            { code: '+351', flag: '🇵🇹', name: 'Portugal' },
            { code: '+353', flag: '🇮🇪', name: 'Ireland' },
            { code: '+30', flag: '🇬🇷', name: 'Greece' },
            { code: '+48', flag: '🇵🇱', name: 'Poland' },
            { code: '+420', flag: '🇨🇿', name: 'Czech Republic' },
            { code: '+36', flag: '🇭🇺', name: 'Hungary' },
            { code: '+421', flag: '🇸🇰', name: 'Slovakia' },
            { code: '+386', flag: '🇸🇮', name: 'Slovenia' },
            { code: '+385', flag: '🇭🇷', name: 'Croatia' },
            { code: '+381', flag: '🇷🇸', name: 'Serbia' },
            { code: '+387', flag: '🇧🇦', name: 'Bosnia and Herzegovina' },
            { code: '+382', flag: '🇲🇪', name: 'Montenegro' },
            { code: '+389', flag: '🇲🇰', name: 'North Macedonia' },
            { code: '+355', flag: '🇦🇱', name: 'Albania' },
            { code: '+90', flag: '🇹🇷', name: 'Turkey' },
            { code: '+7', flag: '🇷🇺', name: 'Russia' },
            { code: '+380', flag: '🇺🇦', name: 'Ukraine' },
            { code: '+375', flag: '🇧🇾', name: 'Belarus' },
            { code: '+370', flag: '🇱🇹', name: 'Lithuania' },
            { code: '+371', flag: '🇱🇻', name: 'Latvia' },
            { code: '+372', flag: '🇪🇪', name: 'Estonia' },
            { code: '+81', flag: '🇯🇵', name: 'Japan' },
            { code: '+82', flag: '🇰🇷', name: 'South Korea' },
            { code: '+86', flag: '🇨🇳', name: 'China' },
            { code: '+852', flag: '🇭🇰', name: 'Hong Kong' },
            { code: '+886', flag: '🇹🇼', name: 'Taiwan' },
            { code: '+65', flag: '🇸🇬', name: 'Singapore' },
            { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
            { code: '+66', flag: '🇹🇭', name: 'Thailand' },
            { code: '+84', flag: '🇻🇳', name: 'Vietnam' },
            { code: '+62', flag: '🇮🇩', name: 'Indonesia' },
            { code: '+63', flag: '🇵🇭', name: 'Philippines' },
            { code: '+91', flag: '🇮🇳', name: 'India' },
            { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
            { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
            { code: '+94', flag: '🇱🇰', name: 'Sri Lanka' },
            { code: '+977', flag: '🇳🇵', name: 'Nepal' },
            { code: '+61', flag: '🇦🇺', name: 'Australia' },
            { code: '+64', flag: '🇳🇿', name: 'New Zealand' },
            { code: '+27', flag: '🇿🇦', name: 'South Africa' },
            { code: '+20', flag: '🇪🇬', name: 'Egypt' },
            { code: '+212', flag: '🇲🇦', name: 'Morocco' },
            { code: '+213', flag: '🇩🇿', name: 'Algeria' },
            { code: '+216', flag: '🇹🇳', name: 'Tunisia' },
            { code: '+218', flag: '🇱🇾', name: 'Libya' },
            { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
            { code: '+254', flag: '🇰🇪', name: 'Kenya' },
            { code: '+55', flag: '🇧🇷', name: 'Brazil' },
            { code: '+54', flag: '🇦🇷', name: 'Argentina' },
            { code: '+56', flag: '🇨🇱', name: 'Chile' },
            { code: '+57', flag: '🇨🇴', name: 'Colombia' },
            { code: '+58', flag: '🇻🇪', name: 'Venezuela' },
            { code: '+51', flag: '🇵🇪', name: 'Peru' },
            { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
            { code: '+52', flag: '🇲🇽', name: 'Mexico' }
        ];
        
        this.init();
    }
    
    async init() {
        await this.loadConfig();
        this.setupEventListeners();
        this.setupOTPInputs();
        this.setupCountryCodeDropdown();
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
        // Step 1: Email form submission
        document.getElementById('emailForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendOTP();
        });
        
        // Step 2: OTP form submission
        document.getElementById('otpForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.verifyOTP();
        });
        
        // Resend OTP button
        document.getElementById('resendOtpBtn').addEventListener('click', () => {
            this.resendOTP();
        });
        
        // Step 3: Registration form submission
        document.getElementById('registrationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.completeRegistration();
        });
        
        // Password toggle
        document.getElementById('togglePassword').addEventListener('click', () => {
            this.togglePasswordVisibility();
        });
        
        // Password matching validation
        document.getElementById('confirmPassword').addEventListener('input', () => {
            this.validatePasswordMatch();
        });
        
        // Auto-fill display name when first/last name changes
        document.getElementById('firstName').addEventListener('input', () => {
            this.updateDisplayName();
        });
        
        document.getElementById('lastName').addEventListener('input', () => {
            this.updateDisplayName();
        });
        
        // Country code dropdown
        document.getElementById('countryCodeBtn').addEventListener('click', () => {
            this.toggleCountryDropdown();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('countryDropdown');
            const button = document.getElementById('countryCodeBtn');
            if (!dropdown.contains(e.target) && !button.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
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
    
    async sendOTP() {
        const email = document.getElementById('email').value.trim();
        
        if (!this.validateEmail(email)) {
            this.showError('emailError', 'Please enter a valid email address');
            return;
        }
        
        if (!this.baseUrl) {
            this.showError('emailError', 'Configuration not loaded. Please try again.');
            return;
        }
        
        this.showLoading('sendOtpBtn', 'sendOtpText', 'Sending...');
        this.hideError('emailError');
        
        try {
            const response = await axios.post(`${this.baseUrl}/v1/auth/send-otp`, {
                email: email,
                otp_type: 'registration'
            });
            
            console.log('Send OTP Response:', response.data);
            
            if (response.data.status === 'true' || response.data.status === true) {
                this.userEmail = email;
                this.otpId = response.data.data.otp_id;
                this.otpTimeLeft = response.data.data.expires_in_minutes * 60;
                
                this.showStep(2);
                document.getElementById('emailDisplay').textContent = email;
                this.startOTPTimer();
                
                this.showSuccess('OTP sent successfully! Check your email.');
            } else {
                throw new Error(response.data.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Send OTP Error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to send OTP. Please try again.';
            this.showError('emailError', errorMessage);
        } finally {
            this.hideLoading('sendOtpBtn', 'sendOtpText', 'Send OTP');
        }
    }
    
    async resendOTP() {
        if (!this.userEmail) return;
        
        if (!this.baseUrl) {
            this.showError('otpError', 'Configuration not loaded. Please try again.');
            return;
        }
        
        this.showLoading('resendOtpBtn', null, 'Resending...');
        
        try {
            const response = await axios.post(`${this.baseUrl}/v1/auth/resend-otp`, {
                email: this.userEmail,
                otp_type: 'registration'
            });
            
            console.log('Resend OTP Response:', response.data);
            
            if (response.data.status === 'true' || response.data.status === true) {
                this.otpId = response.data.data.otp_id;
                this.otpTimeLeft = response.data.data.expires_in_minutes * 60;
                
                // Clear current OTP inputs
                document.querySelectorAll('.otp-input').forEach(input => {
                    input.value = '';
                    input.classList.remove('filled');
                });
                
                this.startOTPTimer();
                this.showSuccess('OTP resent successfully! Check your email.');
            } else {
                throw new Error(response.data.message || 'Failed to resend OTP');
            }
        } catch (error) {
            console.error('Resend OTP Error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to resend OTP. Please try again.';
            this.showError('otpError', errorMessage);
        } finally {
            this.hideLoading('resendOtpBtn', null, 'Resend OTP');
        }
    }
    
    async verifyOTP() {
        const otpCode = this.getOTPCode();
        
        if (otpCode.length !== 6) {
            this.showError('otpError', 'Please enter the complete 6-digit code');
            return;
        }
        
        if (!this.baseUrl) {
            this.showError('otpError', 'Configuration not loaded. Please try again.');
            return;
        }
        
        this.showLoading('verifyOtpBtn', 'verifyOtpText', 'Verifying...');
        this.hideError('otpError');
        
        try {
            const response = await axios.post(`${this.baseUrl}/v1/auth/verify-otp`, {
                email: this.userEmail,
                otp_code: otpCode,
                otp_type: 'registration'
            });
            
            console.log('Verify OTP Response:', response.data);
            
            if (response.data.status === 'true' || response.data.status === true) {
                this.otpCode = otpCode;
                this.clearOTPTimer();
                this.showStep(3);
                this.showSuccess('Email verified successfully!');
            } else {
                throw new Error(response.data.message || 'Invalid OTP code');
            }
        } catch (error) {
            console.error('Verify OTP Error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Invalid OTP code. Please try again.';
            this.showError('otpError', errorMessage);
        } finally {
            this.hideLoading('verifyOtpBtn', 'verifyOtpText', 'Verify OTP');
        }
    }
    
    async completeRegistration() {
        if (!this.validateRegistrationForm()) {
            return;
        }
        
        if (!this.baseUrl) {
            this.showError('registrationError', 'Configuration not loaded. Please try again.');
            return;
        }
        
        const formData = this.getRegistrationFormData();
        
        this.showLoading('completeRegistrationBtn', 'completeRegistrationText', 'Creating Account...');
        this.hideError('registrationError');
        
        try {
            const response = await axios.post(`${this.baseUrl}/v1/auth/register-with-otp`, {
                email: this.userEmail,
                password: formData.password,
                otp_code: this.otpCode,
                display_name: formData.displayName,
                firstname: formData.firstName,
                lastname: formData.lastName,
                phone_number: formData.phoneNumber || null
            });
            
            console.log('Registration Response:', response.data);
            
            if (response.data.status === 'true' || response.data.status === true) {
                this.showSuccess('Account created successfully! Redirecting to dashboard...');
                
                // Store user data if needed
                if (response.data.data && response.data.data.access_token) {
                    localStorage.setItem('access_token', response.data.data.access_token);
                    localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
                }
                
                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
            } else {
                throw new Error(response.data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration Error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
            this.showError('registrationError', errorMessage);
        } finally {
            this.hideLoading('completeRegistrationBtn', 'completeRegistrationText', 'Create Account');
        }
    }
    
    // UI Helper Methods
    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('#step1, #step2, #step3').forEach(step => {
            step.classList.add('hidden');
        });
        
        // Show current step
        document.getElementById(`step${stepNumber}`).classList.remove('hidden');
        document.getElementById(`step${stepNumber}`).classList.add('fade-in');
        
        // Update step indicators
        this.updateStepIndicators(stepNumber);
        this.currentStep = stepNumber;
    }
    
    updateStepIndicators(activeStep) {
        for (let i = 1; i <= 3; i++) {
            const indicator = document.getElementById(`step${i}Indicator`);
            const connector = document.getElementById(`connector${i}`);
            
            if (i < activeStep) {
                // Completed steps
                indicator.className = 'step-indicator completed w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm';
                indicator.innerHTML = '<i class="fas fa-check"></i>';
                if (connector) connector.className = 'w-12 h-0.5 bg-green-500';
            } else if (i === activeStep) {
                // Active step
                indicator.className = 'step-indicator active w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm';
                indicator.textContent = i;
            } else {
                // Future steps
                indicator.className = 'step-indicator w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gray-300 text-gray-500';
                indicator.textContent = i;
                if (connector) connector.className = 'w-12 h-0.5 bg-gray-300';
            }
        }
    }
    
    startOTPTimer() {
        this.clearOTPTimer();
        
        const updateTimer = () => {
            const minutes = Math.floor(this.otpTimeLeft / 60);
            const seconds = this.otpTimeLeft % 60;
            
            document.getElementById('otpTimer').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (this.otpTimeLeft <= 0) {
                this.clearOTPTimer();
                this.showError('otpError', 'OTP has expired. Please request a new one.');
                return;
            }
            
            this.otpTimeLeft--;
        };
        
        updateTimer();
        this.otpTimer = setInterval(updateTimer, 1000);
    }
    
    clearOTPTimer() {
        if (this.otpTimer) {
            clearInterval(this.otpTimer);
            this.otpTimer = null;
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
    
    validateRegistrationForm() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const displayName = document.getElementById('displayName').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        
        if (!firstName || !lastName || !displayName) {
            this.showError('registrationError', 'Please fill in all required fields');
            return false;
        }
        
        if (password.length < 8) {
            this.showError('registrationError', 'Password must be at least 8 characters long');
            return false;
        }
        
        if (password !== confirmPassword) {
            this.showError('registrationError', 'Passwords do not match');
            return false;
        }
        
        if (!agreeTerms) {
            this.showError('registrationError', 'Please agree to the Terms & Conditions');
            return false;
        }
        
        return true;
    }
    
    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorElement = document.getElementById('passwordMatchError');
        
        if (confirmPassword && password !== confirmPassword) {
            errorElement.classList.remove('hidden');
        } else {
            errorElement.classList.add('hidden');
        }
    }
    
    getRegistrationFormData() {
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const fullPhoneNumber = phoneNumber ? `${this.selectedCountry.code}${phoneNumber}` : '';
        
        return {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            displayName: document.getElementById('displayName').value.trim(),
            phoneNumber: fullPhoneNumber,
            password: document.getElementById('password').value
        };
    }
    
    updateDisplayName() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const displayNameField = document.getElementById('displayName');
        
        if (firstName && lastName && !displayNameField.value) {
            displayNameField.value = `${firstName} ${lastName.charAt(0)}.`;
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
                <i class="fas fa-check-circle"></i>
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
    
    setupCountryCodeDropdown() {
        this.renderCountryOptions();
        
        // Country search functionality
        const countrySearch = document.getElementById('countrySearch');
        countrySearch.addEventListener('input', (e) => {
            this.filterCountries(e.target.value);
        });
    }
    
    renderCountryOptions(filteredCountries = null) {
        const countryList = document.getElementById('countryList');
        const countries = filteredCountries || this.countries;
        
        countryList.innerHTML = '';
        
        countries.forEach(country => {
            const option = document.createElement('div');
            option.className = 'country-option flex items-center space-x-3 p-2';
            option.innerHTML = `
                <span class="text-lg">${country.flag}</span>
                <span class="flex-1">${country.name}</span>
                <span class="text-sm text-gray-500">${country.code}</span>
            `;
            
            option.addEventListener('click', () => {
                this.selectCountry(country);
            });
            
            countryList.appendChild(option);
        });
    }
    
    filterCountries(searchTerm) {
        const filtered = this.countries.filter(country => 
            country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            country.code.includes(searchTerm)
        );
        this.renderCountryOptions(filtered);
    }
    
    selectCountry(country) {
        this.selectedCountry = country;
        
        // Update button display
        document.getElementById('selectedFlag').textContent = country.flag;
        document.getElementById('selectedCode').textContent = country.code;
        
        // Close dropdown
        document.getElementById('countryDropdown').classList.add('hidden');
        
        // Clear search
        document.getElementById('countrySearch').value = '';
        this.renderCountryOptions();
    }
    
    toggleCountryDropdown() {
        const dropdown = document.getElementById('countryDropdown');
        dropdown.classList.toggle('hidden');
        
        if (!dropdown.classList.contains('hidden')) {
            // Focus search input when opened
            setTimeout(() => {
                document.getElementById('countrySearch').focus();
            }, 100);
        }
    }
}

// Initialize signup manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignupManager();
});