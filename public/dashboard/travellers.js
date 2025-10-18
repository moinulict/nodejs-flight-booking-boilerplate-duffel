// Travellers Management System
class TravellersManager {
    constructor() {
        this.travellers = [];
        this.editingTravellerId = null;
        this.countries = [
            'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia',
            'Austria', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium',
            'Bolivia', 'Brazil', 'Bulgaria', 'Cambodia', 'Canada', 'Chile', 'China',
            'Colombia', 'Croatia', 'Czech Republic', 'Denmark', 'Egypt', 'Estonia',
            'Finland', 'France', 'Georgia', 'Germany', 'Greece', 'Hungary', 'Iceland',
            'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
            'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Latvia', 'Lebanon',
            'Lithuania', 'Luxembourg', 'Malaysia', 'Mexico', 'Netherlands', 'New Zealand',
            'Norway', 'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Qatar',
            'Romania', 'Russia', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea',
            'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand', 'Turkey',
            'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Vietnam'
        ];
        this.init();
    }
    
    async init() {
        // Initialize navigation and sidebar
        initNavigation();
        initDashboardSidebar('travellers');
        
        // Check authentication
        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        this.setupEventListeners();
        this.populateCountryDropdown();
        await this.loadTravellers();
    }
    
    setupEventListeners() {
        // Add traveller buttons
        document.getElementById('addTravellerBtn').addEventListener('click', () => {
            this.openTravellerModal();
        });
        
        document.getElementById('addFirstTravellerBtn').addEventListener('click', () => {
            this.openTravellerModal();
        });
        
        // Modal controls
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.closeTravellerModal();
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeTravellerModal();
        });
        
        // Form submission
        document.getElementById('travellerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTraveller();
        });
        
        // Delete modal controls
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.closeDeleteModal();
        });
        
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.deleteTraveller();
        });
        
        // Close modals on outside click
        document.getElementById('travellerModal').addEventListener('click', (e) => {
            if (e.target.id === 'travellerModal') {
                this.closeTravellerModal();
            }
        });
        
        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') {
                this.closeDeleteModal();
            }
        });
        
        // Country code search functionality
        this.setupCountrySearch();
    }
    
    setupCountrySearch() {
        // Add search functionality to country code dropdown
        const countrySelect = document.getElementById('countryCode');
        if (!countrySelect) return;
        
        // Store original options
        this.originalOptions = Array.from(countrySelect.options).map(option => ({
            value: option.value,
            text: option.textContent,
            searchData: option.getAttribute('data-search') || ''
        }));
        
        // Add search input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search countries...';
        searchInput.className = 'country-search-input';
        searchInput.style.cssText = `
            width: 100%;
            padding: 0.5rem;
            border: none;
            border-bottom: 1px solid #e5e7eb;
            font-size: 0.875rem;
            background: #f9fafb;
        `;
        
        // Create custom dropdown
        this.createCustomDropdown(countrySelect);
        
        // Handle search input
        searchInput.addEventListener('input', (e) => {
            this.filterCountries(e.target.value);
        });
    }
    
    createCustomDropdown(originalSelect) {
        // Hide original select
        originalSelect.style.display = 'none';
        
        // Create custom dropdown container
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'custom-country-dropdown';
        dropdownContainer.style.cssText = `
            position: relative;
            width: 120px;
            min-width: 120px;
        `;
        
        // Create display button
        const displayButton = document.createElement('button');
        displayButton.type = 'button';
        displayButton.className = 'country-select';
        displayButton.innerHTML = '🌍 Code';
        displayButton.addEventListener('click', () => {
            this.toggleDropdown();
        });
        
        // Create dropdown menu
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'country-dropdown-menu';
        dropdownMenu.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 2px solid #ea580c;
            border-radius: 0.5rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            z-index: 9999;
            max-height: 250px;
            overflow-y: auto;
            display: none;
            margin-top: 2px;
        `;
        
        // Create search input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search countries...';
        searchInput.style.cssText = `
            width: 100%;
            padding: 0.5rem;
            border: none;
            border-bottom: 1px solid #e5e7eb;
            font-size: 0.875rem;
            background: #f9fafb;
            outline: none;
        `;
        
        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'country-options';
        
        // Add elements to dropdown
        dropdownMenu.appendChild(searchInput);
        dropdownMenu.appendChild(optionsContainer);
        dropdownContainer.appendChild(displayButton);
        dropdownContainer.appendChild(dropdownMenu);
        
        // Replace original select
        originalSelect.parentNode.insertBefore(dropdownContainer, originalSelect);
        
        // Store references
        this.displayButton = displayButton;
        this.dropdownMenu = dropdownMenu;
        this.searchInput = searchInput;
        this.optionsContainer = optionsContainer;
        this.originalSelect = originalSelect;
        
        // Populate options
        this.populateDropdownOptions();
        
        // Add event listeners
        searchInput.addEventListener('input', (e) => {
            this.filterCountries(e.target.value);
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdownContainer.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }
    
    populateDropdownOptions() {
        this.optionsContainer.innerHTML = '';
        
        this.originalOptions.forEach(option => {
            if (option.value === '') return; // Skip empty option
            
            const optionElement = document.createElement('div');
            optionElement.className = 'country-option';
            optionElement.innerHTML = option.text;
            optionElement.style.cssText = `
                padding: 0.5rem;
                cursor: pointer;
                font-size: 0.875rem;
                transition: background-color 0.2s;
            `;
            
            optionElement.addEventListener('mouseenter', () => {
                optionElement.style.backgroundColor = '#f3f4f6';
            });
            
            optionElement.addEventListener('mouseleave', () => {
                optionElement.style.backgroundColor = 'transparent';
            });
            
            optionElement.addEventListener('click', () => {
                this.selectCountry(option.value, option.text);
            });
            
            this.optionsContainer.appendChild(optionElement);
        });
    }
    
    filterCountries(searchTerm) {
        const options = this.optionsContainer.querySelectorAll('.country-option');
        const term = searchTerm.toLowerCase();
        
        options.forEach((option, index) => {
            const optionData = this.originalOptions[index + 1]; // +1 to skip empty option
            if (!optionData) return;
            
            const searchText = `${optionData.text} ${optionData.searchData}`.toLowerCase();
            const isVisible = searchText.includes(term);
            
            option.style.display = isVisible ? 'block' : 'none';
        });
    }
    
    selectCountry(value, text) {
        this.originalSelect.value = value;
        this.displayButton.innerHTML = text;
        this.closeDropdown();
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        this.originalSelect.dispatchEvent(event);
    }
    
    toggleDropdown() {
        const isOpen = this.dropdownMenu.style.display === 'block';
        if (isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    openDropdown() {
        this.dropdownMenu.style.display = 'block';
        this.searchInput.focus();
        this.searchInput.value = '';
        this.filterCountries('');
    }
    
    closeDropdown() {
        this.dropdownMenu.style.display = 'none';
    }
    
    populateCountryDropdown() {
        const select = document.getElementById('passportCountry');
        this.countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            select.appendChild(option);
        });
    }
    
    async loadTravellers() {
        try {
            const baseUrl = await this.getBaseUrl();
            const token = localStorage.getItem('access_token');
            
            const response = await axios.get(`${baseUrl}/v1/users/travelers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data.status === 'true' || response.data.status === true) {
                this.travellers = response.data.data.travelers || [];
                console.log('Loaded travellers:', this.travellers);
                this.renderTravellers();
            } else {
                throw new Error(response.data.message || 'Failed to load travellers');
            }
            
        } catch (error) {
            console.error('Failed to load travellers:', error);
            this.hideLoadingState();
            
            if (error.response?.status === 401) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else if (error.response?.status === 404) {
                // No travellers found - this is normal
                this.travellers = [];
                this.renderTravellers();
            } else {
                const message = error.response?.data?.message || 'Failed to load travellers';
                this.showToast(message, 'error');
                // Still try to render empty state
                this.travellers = [];
                this.renderTravellers();
            }
        }
    }
    
    renderTravellers() {
        this.hideLoadingState();
        
        const table = document.getElementById('travellersTable');
        const tableBody = document.getElementById('travellersTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (this.travellers.length === 0) {
            // Show table with "No traveler found" message
            emptyState.classList.add('hidden');
            table.classList.remove('hidden');
            
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center justify-center">
                            <i class="fas fa-users text-gray-300 text-4xl mb-4"></i>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">No travelers found</h3>
                            <p class="text-gray-600 mb-6">You haven't added any travelers yet. Start by adding your first traveler.</p>
                            <button onclick="travellersManager.openTravellerModal()" class="btn-primary">
                                <i class="fas fa-plus mr-2"></i>
                                Add Your First Traveler
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        emptyState.classList.add('hidden');
        table.classList.remove('hidden');
        
        tableBody.innerHTML = this.travellers.map(traveller => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-white text-sm"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${traveller.title ? traveller.title + ' ' : ''}${traveller.first_name} ${traveller.last_name}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${traveller.email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${traveller.phone_number}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        traveller.passenger_type === 'adult' ? 'bg-green-100 text-green-800' :
                        traveller.passenger_type === 'child' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                    }">
                        ${traveller.passenger_type.charAt(0).toUpperCase() + traveller.passenger_type.slice(1)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${this.formatDate(traveller.date_of_birth)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center space-x-2">
                        <button onclick="travellersManager.editTraveller('${traveller.id}')" 
                                class="text-orange-600 hover:text-orange-900 transition-colors" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="travellersManager.showDeleteModal('${traveller.id}', '${traveller.first_name} ${traveller.last_name}')" 
                                class="text-red-600 hover:text-red-900 transition-colors" title="Delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    openTravellerModal(traveller = null, isViewOnly = false) {
        this.editingTravellerId = traveller?.id || null;
        
        const modal = document.getElementById('travellerModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('travellerForm');
        
        title.textContent = isViewOnly ? 'View Traveller' : (traveller ? 'Edit Traveller' : 'Add New Traveller');
        
        if (traveller) {
            // Populate form with traveller data (using API response format)
            const titleField = document.getElementById('title');
            const firstNameField = document.getElementById('firstName');
            const lastNameField = document.getElementById('lastName');
            const dateOfBirthField = document.getElementById('dateOfBirth');
            const genderField = document.getElementById('gender');
            const emailField = document.getElementById('email');
            const countryCodeField = document.getElementById('countryCode');
            const phoneField = document.getElementById('phone');
            const passportNumberField = document.getElementById('passportNumber');
            const passportCountryField = document.getElementById('passportCountry');
            const passportExpiryField = document.getElementById('passportExpiry');
            const travellerTypeField = document.getElementById('travellerType');
            
            if (titleField) titleField.value = traveller.title || '';
            if (firstNameField) firstNameField.value = traveller.first_name || '';
            if (lastNameField) lastNameField.value = traveller.last_name || '';
            if (dateOfBirthField) dateOfBirthField.value = traveller.date_of_birth || '';
            if (genderField) genderField.value = traveller.gender || '';
            if (emailField) emailField.value = traveller.email || '';
            
            // Split phone number into country code and phone
            if (traveller.phone_number) {
                const phoneNumber = traveller.phone_number;
                let countryCode = '';
                let phone = phoneNumber;
                
                // Common country codes to check
                const countryCodes = ['+971', '+966', '+974', '+965', '+973', '+968', '+880', '+358', '+420', '+385', '+381', '+380', '+91', '+86', '+81', '+82', '+65', '+60', '+66', '+84', '+63', '+62', '+61', '+64', '+44', '+33', '+49', '+39', '+34', '+31', '+32', '+41', '+43', '+45', '+46', '+47', '+92', '+94', '+977', '+98', '+964', '+90', '+48', '+36', '+40', '+359', '+55', '+52', '+54', '+56', '+57', '+51', '+27', '+20', '+1', '+7'];
                
                // Find matching country code
                for (const code of countryCodes) {
                    if (phoneNumber.startsWith(code)) {
                        countryCode = code;
                        phone = phoneNumber.substring(code.length);
                        break;
                    }
                }
                
                if (countryCodeField) countryCodeField.value = countryCode;
                if (phoneField) phoneField.value = phone;
            } else {
                if (countryCodeField) countryCodeField.value = '';
                if (phoneField) phoneField.value = '';
            }
            
            if (passportNumberField) passportNumberField.value = traveller.passport_number || '';
            if (passportCountryField) passportCountryField.value = traveller.passport_country || '';
            if (passportExpiryField) passportExpiryField.value = traveller.passport_expiry_date || '';
            if (travellerTypeField) travellerTypeField.value = traveller.passenger_type || '';
            
            // Make fields read-only if in view mode
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.readOnly = isViewOnly;
                input.disabled = isViewOnly;
            });
            
            // Hide save button in view mode
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.style.display = isViewOnly ? 'none' : 'block';
            }
        } else {
            form.reset();
            // Ensure fields are editable for new traveller
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.readOnly = false;
                input.disabled = false;
            });
            
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.style.display = 'block';
            }
        }
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    closeTravellerModal() {
        const modal = document.getElementById('travellerModal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        this.editingTravellerId = null;
    }
    
    async saveTraveller() {
        const form = document.getElementById('travellerForm');
        const formData = new FormData(form);
        
        const travellerData = {
            title: formData.get('title'),
            first_name: formData.get('firstName'),
            last_name: formData.get('lastName'),
            date_of_birth: formData.get('dateOfBirth'),
            gender: formData.get('gender'),
            email: formData.get('email'),
            phone_number: formData.get('countryCode') + formData.get('phone'),
            passport_number: formData.get('passportNumber') || null,
            passport_country: formData.get('passportCountry') || null,
            passport_expiry_date: formData.get('passportExpiry') || null,
            passenger_type: formData.get('travellerType')
        };
        
        // Validate required fields
        const requiredFields = ['title', 'first_name', 'last_name', 'date_of_birth', 'gender', 'email', 'passenger_type'];
        const missingFields = requiredFields.filter(field => !travellerData[field]);
        
        // Validate phone number components
        if (!formData.get('countryCode') || !formData.get('phone')) {
            this.showToast('Please select country code and enter phone number', 'error');
            return;
        }
        
        if (missingFields.length > 0) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(travellerData.email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }
        
        // Show loading state
        const saveBtn = document.getElementById('saveBtn');
        const saveText = document.getElementById('saveText');
        const saveSpinner = document.getElementById('saveSpinner');
        
        saveText.classList.add('hidden');
        saveSpinner.classList.remove('hidden');
        saveBtn.disabled = true;
        
        try {
            const baseUrl = await this.getBaseUrl();
            const token = localStorage.getItem('access_token');
            
            let response;
            if (this.editingTravellerId) {
                // Update existing traveller
                response = await axios.put(`${baseUrl}/v1/users/travelers/${this.editingTravellerId}`, travellerData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                // Create new traveller
                response = await axios.post(`${baseUrl}/v1/users/travelers`, travellerData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            
            if (response.data.status === 'true' || response.data.status === true) {
                this.showToast(
                    this.editingTravellerId ? 'Traveller updated successfully!' : 'Traveller added successfully!', 
                    'success'
                );
                
                this.closeTravellerModal();
                await this.loadTravellers();
            } else {
                throw new Error(response.data.message || 'Operation failed');
            }
            
        } catch (error) {
            console.error('Failed to save traveller:', error);
            
            if (error.response?.status === 401) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                const message = error.response?.data?.message || 'Failed to save traveller';
                this.showToast(message, 'error');
            }
        } finally {
            // Hide loading state
            saveText.classList.remove('hidden');
            saveSpinner.classList.add('hidden');
            saveBtn.disabled = false;
        }
    }
    
    async viewTraveller(travellerId) {
        try {
            // Fetch detailed traveller data from API
            const baseUrl = await this.getBaseUrl();
            const token = localStorage.getItem('access_token');
            
            const response = await axios.get(`${baseUrl}/v1/users/travelers/${travellerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data.status === 'true' || response.data.status === true) {
                const traveller = response.data.data;
                // Show detailed view in modal (read-only)
                this.openTravellerModal(traveller, true);
            } else {
                this.showToast('Failed to load traveller details', 'error');
            }
            
        } catch (error) {
            console.error('Failed to fetch traveller details:', error);
            
            if (error.response?.status === 401) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                // Fallback to local data if API fails
                const traveller = this.travellers.find(t => t.id === travellerId);
                if (traveller) {
                    this.openTravellerModal(traveller, true);
                } else {
                    this.showToast('Failed to load traveller details', 'error');
                }
            }
        }
    }

    async editTraveller(travellerId) {
        try {
            // Fetch latest traveller data from API before editing
            const baseUrl = await this.getBaseUrl();
            const token = localStorage.getItem('access_token');
            
            const response = await axios.get(`${baseUrl}/v1/users/travelers/${travellerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data.status === 'true' || response.data.status === true) {
                const traveller = response.data.data;
                this.openTravellerModal(traveller);
            } else {
                this.showToast('Failed to load traveller details for editing', 'error');
            }
            
        } catch (error) {
            console.error('Failed to fetch traveller for editing:', error);
            
            if (error.response?.status === 401) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                // Fallback to local data if API fails
                const traveller = this.travellers.find(t => t.id === travellerId);
                if (traveller) {
                    this.openTravellerModal(traveller);
                } else {
                    this.showToast('Failed to load traveller for editing', 'error');
                }
            }
        }
    }
    
    showDeleteModal(travellerId, travellerName) {
        this.deletingTravellerId = travellerId;
        document.getElementById('deleteTravellerName').textContent = travellerName;
        document.getElementById('deleteModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    closeDeleteModal() {
        document.getElementById('deleteModal').classList.add('hidden');
        document.body.style.overflow = '';
        this.deletingTravellerId = null;
    }
    
    async deleteTraveller() {
        if (!this.deletingTravellerId) return;
        
        // Show loading state on delete button
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<div class="flex items-center"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div><span>Deleting...</span></div>';
        confirmBtn.disabled = true;
        
        try {
            const baseUrl = await this.getBaseUrl();
            const token = localStorage.getItem('access_token');
            
            const response = await axios.delete(`${baseUrl}/v1/users/travelers/${this.deletingTravellerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Check if deletion was successful
            if (response.status === 200 || response.status === 204 || 
                (response.data && (response.data.status === 'true' || response.data.status === true))) {
                this.showToast('Traveller deleted successfully!', 'success');
                this.closeDeleteModal();
                await this.loadTravellers();
            } else {
                throw new Error('Delete operation failed');
            }
            
        } catch (error) {
            console.error('Failed to delete traveller:', error);
            
            if (error.response?.status === 401) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else if (error.response?.status === 404) {
                this.showToast('Traveller not found', 'error');
            } else {
                const message = error.response?.data?.message || 'Failed to delete traveller';
                this.showToast(message, 'error');
            }
        } finally {
            // Reset button state
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    }
    
    hideLoadingState() {
        const loading = document.getElementById('loadingTravellers');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    formatDate(dateString) {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    async refreshTravellerInList(travellerId) {
        try {
            const baseUrl = await this.getBaseUrl();
            const token = localStorage.getItem('access_token');
            
            const response = await axios.get(`${baseUrl}/v1/users/travelers/${travellerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data.status === 'true' || response.data.status === true) {
                const updatedTraveller = response.data.data;
                
                // Update the traveller in local array
                const index = this.travellers.findIndex(t => t.id === travellerId);
                if (index !== -1) {
                    this.travellers[index] = updatedTraveller;
                } else {
                    this.travellers.push(updatedTraveller);
                }
                
                this.renderTravellers();
            }
        } catch (error) {
            console.error('Failed to refresh traveller:', error);
            // Fallback to full reload
            await this.loadTravellers();
        }
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

// Initialize travellers manager when page loads
let travellersManager;
document.addEventListener('DOMContentLoaded', () => {
    travellersManager = new TravellersManager();
});