// Reusable Phone Number Input Component
class PhoneNumberInput {
    constructor(config = {}) {
        this.containerId = config.containerId || 'phoneInputContainer';
        this.required = config.required || false;
        this.placeholder = config.placeholder || '123456789';
        this.label = config.label || 'Phone Number';
        this.name = config.name || 'phoneNumber';
        this.onchange = config.onchange || null;
        this.value = config.value || '';
        this.countryCode = config.countryCode || '+1';
        this.countryFlag = config.countryFlag || '🇺🇸';
        this.countryName = config.countryName || 'United States';
        
        this.selectedCountry = { 
            code: this.countryCode, 
            flag: this.countryFlag, 
            name: this.countryName 
        };
        
        // Use centralized country data from window.GLOBAL_COUNTRIES
        // Convert to phone input format: { code, flag, name }
        this.countries = this.loadCountries();
        
        this.uniqueId = Math.random().toString(36).substr(2, 9);
    }
    
    // Load countries from centralized data source
    loadCountries() {
        if (window.GLOBAL_COUNTRIES && window.GLOBAL_COUNTRIES.length > 0) {
            // Convert centralized format to phone input format
            return window.GLOBAL_COUNTRIES.map(country => ({
                code: country.phone_code,
                flag: this.getCountryFlag(country.code),
                name: country.name
            }));
        }
        
        // Fallback to a minimal set if GLOBAL_COUNTRIES is not loaded yet
        return [
            { code: '+1', flag: '��', name: 'United States' },
            { code: '+44', flag: '��', name: 'United Kingdom' },
            { code: '+91', flag: '🇮�', name: 'India' }
        ];
    }
    
    // Convert country code to flag emoji
    getCountryFlag(countryCode) {
        if (!countryCode || countryCode.length !== 2) return '�';
        
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
    }
    
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with ID "${this.containerId}" not found`);
            return;
        }
        
        const requiredAsterisk = this.required ? '<span class="text-red-500">*</span>' : '';
        const requiredAttr = this.required ? 'required' : '';
        
        container.innerHTML = `
            <style>
                .phone-input-group {
                    margin-bottom: 0;
                    width: 100%;
                    max-width: 100%;
                }
                .phone-input-group .flex {
                    gap: 0;
                    width: 100%;
                    max-width: 100%;
                }
                .phone-input-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 0.5rem;
                }
                .phone-container-flex {
                    display: flex;
                    width: 100%;
                    max-width: 100%;
                    overflow: hidden;
                }
                .country-select-container {
                    flex-shrink: 0;
                    width: auto;
                    min-width: 100px;
                    max-width: 120px;
                    position: relative;
                }
                .phone-number-input {
                    flex: 1;
                    min-width: 0;
                    width: 100%;
                }
                .phone-country-dropdown {
                    position: fixed !important;
                    z-index: 999999 !important;
                    background: white !important;
                    border: 2px solid #ea580c !important;
                    border-radius: 0.75rem !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
                    max-height: 15rem !important;
                    overflow-y: auto !important;
                    min-width: 280px !important;
                    margin-top: 0.25rem !important;
                }
                .phone-country-dropdown::before {
                    content: '';
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: -1;
                    pointer-events: none;
                }
            </style>
            <div class="phone-input-group">
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    ${this.label} ${requiredAsterisk}
                </label>
                <div class="phone-container-flex">
                    <div class="country-select-container relative">
                        <button type="button" id="countryCodeBtn_${this.uniqueId}" 
                                class="h-full w-full px-2 py-3 border-2 border-gray-200 rounded-l-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white hover:bg-gray-50 flex items-center space-x-1 text-sm">
                            <span id="selectedFlag_${this.uniqueId}">${this.selectedCountry.flag}</span>
                            <span id="selectedCode_${this.uniqueId}" class="truncate">${this.selectedCountry.code}</span>
                            <i class="fas fa-chevron-down text-xs"></i>
                        </button>
                        <div id="countryDropdown_${this.uniqueId}" class="phone-country-dropdown hidden">
                            <div class="p-3">
                                <input type="text" id="countrySearch_${this.uniqueId}" placeholder="Search countries..."
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm">
                            </div>
                            <div id="countryList_${this.uniqueId}" class="country-dropdown max-h-60 overflow-y-auto">
                                <!-- Country options will be populated by JavaScript -->
                            </div>
                        </div>
                    </div>
                    <input type="tel" 
                           id="phoneNumber_${this.uniqueId}" 
                           name="${this.name}"
                           placeholder="${this.placeholder}" 
                           value="${this.value}"
                           ${requiredAttr}
                           class="phone-number-input px-4 py-3 border-2 border-l-0 border-gray-200 rounded-r-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base">
                </div>
            </div>
        `;
        
        // Use setTimeout to ensure DOM is fully ready
        setTimeout(() => {
            this.setupEventListeners();
            this.renderCountryOptions();
        }, 50);
        
        return this;
    }
    
    setupEventListeners() {
        const countryCodeBtn = document.getElementById(`countryCodeBtn_${this.uniqueId}`);
        const countryDropdown = document.getElementById(`countryDropdown_${this.uniqueId}`);
        const countrySearch = document.getElementById(`countrySearch_${this.uniqueId}`);
        const phoneInput = document.getElementById(`phoneNumber_${this.uniqueId}`);
        
        // Country code dropdown toggle
        if (countryCodeBtn && countryDropdown) {
            countryCodeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isHidden = countryDropdown.classList.contains('hidden');
                
                if (isHidden) {
                    // Calculate position for fixed dropdown
                    const rect = countryCodeBtn.getBoundingClientRect();
                    countryDropdown.style.top = `${rect.bottom + window.scrollY}px`;
                    countryDropdown.style.left = `${rect.left + window.scrollX}px`;
                    countryDropdown.classList.remove('hidden');
                    
                    if (countrySearch) {
                        setTimeout(() => countrySearch.focus(), 100);
                    }
                } else {
                    countryDropdown.classList.add('hidden');
                }
            });
        }
        
        // Country search functionality
        if (countrySearch) {
            countrySearch.addEventListener('input', (e) => {
                this.filterCountries(e.target.value);
            });
        }
        
        // Phone input change event
        if (phoneInput) {
            phoneInput.addEventListener('input', () => {
                if (this.onchange && typeof this.onchange === 'function') {
                    this.onchange(this.getFullPhoneNumber());
                }
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (countryCodeBtn && countryDropdown && 
                !countryCodeBtn.contains(e.target) && 
                !countryDropdown.contains(e.target)) {
                countryDropdown.classList.add('hidden');
            }
        });
        
        // Close dropdown on scroll to reposition
        window.addEventListener('scroll', () => {
            if (countryDropdown && !countryDropdown.classList.contains('hidden')) {
                countryDropdown.classList.add('hidden');
            }
        });
        
        // Close dropdown on resize
        window.addEventListener('resize', () => {
            if (countryDropdown && !countryDropdown.classList.contains('hidden')) {
                countryDropdown.classList.add('hidden');
            }
        });
    }
    
    renderCountryOptions(filteredCountries = null) {
        const countryList = document.getElementById(`countryList_${this.uniqueId}`);
        if (!countryList) {
            return;
        }
        
        const countries = filteredCountries || this.countries;
        countryList.innerHTML = '';
        
        countries.forEach(country => {
            const option = document.createElement('div');
            option.className = 'flex items-center space-x-3 px-4 py-3 hover:bg-orange-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0';
            option.innerHTML = `
                <span class="text-lg">${country.flag}</span>
                <span class="font-medium">${country.code}</span>
                <span class="text-gray-600 flex-1">${country.name}</span>
            `;
            
            option.addEventListener('click', () => {
                this.selectCountry(country);
            });
            
            countryList.appendChild(option);
        });
    }
    
    selectCountry(country) {
        this.selectedCountry = country;
        
        document.getElementById(`selectedFlag_${this.uniqueId}`).textContent = country.flag;
        document.getElementById(`selectedCode_${this.uniqueId}`).textContent = country.code;
        document.getElementById(`countryDropdown_${this.uniqueId}`).classList.add('hidden');
        document.getElementById(`countrySearch_${this.uniqueId}`).value = '';
        
        this.renderCountryOptions(); // Reset the country list
        
        if (this.onchange && typeof this.onchange === 'function') {
            this.onchange(this.getFullPhoneNumber());
        }
    }
    
    filterCountries(searchTerm) {
        const filtered = this.countries.filter(country => 
            country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            country.code.includes(searchTerm)
        );
        this.renderCountryOptions(filtered);
    }
    
    // Public methods for getting and setting values
    getPhoneNumber() {
        const phoneInput = document.getElementById(`phoneNumber_${this.uniqueId}`);
        return phoneInput ? phoneInput.value : '';
    }
    
    getCountryCode() {
        return this.selectedCountry.code;
    }
    
    getFullPhoneNumber() {
        const phoneNumber = this.getPhoneNumber();
        return phoneNumber ? `${this.selectedCountry.code}${phoneNumber}` : '';
    }
    
    setPhoneNumber(phoneNumber) {
        const phoneInput = document.getElementById(`phoneNumber_${this.uniqueId}`);
        if (phoneInput) {
            phoneInput.value = phoneNumber;
        }
    }
    
    setCountry(countryCode) {
        const country = this.countries.find(c => c.code === countryCode);
        if (country) {
            this.selectCountry(country);
        }
    }
    
    getValue() {
        return {
            countryCode: this.getCountryCode(),
            phoneNumber: this.getPhoneNumber(),
            fullPhoneNumber: this.getFullPhoneNumber()
        };
    }
    
    setValue(countryCode, phoneNumber) {
        this.setCountry(countryCode);
        this.setPhoneNumber(phoneNumber);
    }
    
    validate() {
        if (this.required) {
            const phoneNumber = this.getPhoneNumber();
            return phoneNumber && phoneNumber.trim().length > 0;
        }
        return true;
    }
    
    showError(message) {
        const container = document.getElementById(this.containerId);
        if (container) {
            let errorDiv = container.querySelector('.phone-input-error');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.className = 'phone-input-error text-red-500 text-sm mt-1';
                container.appendChild(errorDiv);
            }
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }
    
    hideError() {
        const container = document.getElementById(this.containerId);
        if (container) {
            const errorDiv = container.querySelector('.phone-input-error');
            if (errorDiv) {
                errorDiv.classList.add('hidden');
            }
        }
    }
    
    destroy() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        }
    }
}

// CSS for country dropdown scrolling
if (!document.getElementById('phoneInputStyles')) {
    const style = document.createElement('style');
    style.id = 'phoneInputStyles';
    style.textContent = `
        .country-dropdown {
            max-height: 240px;
            overflow-y: auto;
        }
        
        .country-dropdown::-webkit-scrollbar {
            width: 6px;
        }
        
        .country-dropdown::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 6px;
        }
        
        .country-dropdown::-webkit-scrollbar-thumb {
            background: #ea580c;
            border-radius: 6px;
        }
        
        .country-dropdown::-webkit-scrollbar-thumb:hover {
            background: #dc2626;
        }
    `;
    document.head.appendChild(style);
}

// Export for use
window.PhoneNumberInput = PhoneNumberInput;