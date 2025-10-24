// Travellers Management System
class TravellersManager {
    constructor() {
        this.travellers = [];
        this.editingTravellerId = null;
        this.phoneInput = null;
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
        
        // Date of birth validation based on traveller type
        document.getElementById('travellerType').addEventListener('change', () => {
            this.updateDateOfBirthConstraints();
            this.validateDateOfBirth();
        });
        
        document.getElementById('dateOfBirth').addEventListener('change', () => {
            this.validateDateOfBirth();
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
                    <div class="text-sm text-gray-900">${traveller.email || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${traveller.phone_number || '-'}</div>
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
        
        // Initialize phone input component
        this.setupPhoneInput();
        
        if (traveller) {
            // Populate form with traveller data (using API response format)
            const titleField = document.getElementById('title');
            const firstNameField = document.getElementById('firstName');
            const lastNameField = document.getElementById('lastName');
            const dateOfBirthField = document.getElementById('dateOfBirth');
            const genderField = document.getElementById('gender');
            const emailField = document.getElementById('email');
            const travellerTypeField = document.getElementById('travellerType');
            
            if (titleField) titleField.value = traveller.title || '';
            if (firstNameField) firstNameField.value = traveller.first_name || '';
            if (lastNameField) lastNameField.value = traveller.last_name || '';
            if (dateOfBirthField) dateOfBirthField.value = traveller.date_of_birth || '';
            if (genderField) genderField.value = traveller.gender || '';
            if (emailField) emailField.value = traveller.email || '';
            if (travellerTypeField) travellerTypeField.value = traveller.passenger_type || '';
            
            // Set phone number in phone input component
            if (traveller.phone_number && this.phoneInput) {
                // Parse phone number into country code and number
                const phoneNumber = traveller.phone_number;
                let countryCode = '+1';
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
                
                this.phoneInput.setValue(countryCode, phone);
            }
            
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
    
    setupPhoneInput() {
        // Initialize or re-initialize the phone number input component
        this.phoneInput = new PhoneNumberInput({
            containerId: 'travellerPhoneInput',
            required: false,
            label: 'Phone Number (Optional)',
            placeholder: 'Enter phone number',
            name: 'phoneNumber',
            countryCode: '+1',
            countryFlag: '🇺🇸',
            countryName: 'United States'
        }).render();
    }
    
    updateDateOfBirthConstraints() {
        const travellerType = document.getElementById('travellerType').value;
        const dateOfBirthField = document.getElementById('dateOfBirth');
        const today = new Date();
        
        if (!travellerType) {
            // Reset constraints
            dateOfBirthField.removeAttribute('min');
            dateOfBirthField.removeAttribute('max');
            return;
        }
        
        let minDate, maxDate;
        
        switch (travellerType) {
            case 'adult':
                // Adults: 12 years or older (no upper limit for practical purposes)
                maxDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
                minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()); // Reasonable upper age limit
                break;
            case 'child':
                // Children: 2-11 years old
                minDate = new Date(today.getFullYear() - 11, today.getMonth(), today.getDate());
                maxDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
                break;
            case 'infant':
                // Infants: under 2 years old (from 2 years ago to today)
                minDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
                maxDate = today; // Today's date
                break;
        }
        
        if (minDate) {
            dateOfBirthField.setAttribute('min', minDate.toISOString().split('T')[0]);
        }
        if (maxDate) {
            dateOfBirthField.setAttribute('max', maxDate.toISOString().split('T')[0]);
        }
    }
    
    validateDateOfBirth() {
        const travellerType = document.getElementById('travellerType').value;
        const dateOfBirth = document.getElementById('dateOfBirth').value;
        const errorElement = document.getElementById('dateValidationError');
        
        if (!travellerType || !dateOfBirth) {
            errorElement.classList.add('hidden');
            return true;
        }
        
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        const ageInYears = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        
        let isValid = true;
        let errorMessage = '';
        
        switch (travellerType) {
            case 'adult':
                if (ageInYears < 12) {
                    isValid = false;
                    errorMessage = 'Adults must be 12 years or older';
                }
                break;
            case 'child':
                if (ageInYears < 2 || ageInYears >= 12) {
                    isValid = false;
                    errorMessage = 'Children must be between 2-11 years old';
                }
                break;
            case 'infant':
                if (ageInYears >= 2) {
                    isValid = false;
                    errorMessage = 'Infants must be under 2 years old';
                }
                break;
        }
        
        if (isValid) {
            errorElement.classList.add('hidden');
        } else {
            errorElement.textContent = errorMessage;
            errorElement.classList.remove('hidden');
        }
        
        return isValid;
    }
    
    closeTravellerModal() {
        const modal = document.getElementById('travellerModal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        this.editingTravellerId = null;
        
        // Clear phone input component
        if (this.phoneInput) {
            this.phoneInput = null;
        }
    }
    
    async saveTraveller() {
        const form = document.getElementById('travellerForm');
        const formData = new FormData(form);
        
        // Get phone number from the phone input component
        const phoneValues = this.phoneInput ? this.phoneInput.getValue() : { fullPhoneNumber: null };
        
        const travellerData = {
            title: formData.get('title'),
            first_name: formData.get('firstName'),
            last_name: formData.get('lastName'),
            date_of_birth: formData.get('dateOfBirth'),
            gender: formData.get('gender'),
            email: formData.get('email') || null, // Optional for children/infants
            phone_number: phoneValues.fullPhoneNumber || null,
            passenger_type: formData.get('travellerType')
        };
        
        // Validate required fields
        const requiredFields = ['title', 'first_name', 'last_name', 'date_of_birth', 'gender', 'passenger_type'];
        const missingFields = requiredFields.filter(field => !travellerData[field]);
        
        if (missingFields.length > 0) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Validate age based on traveller type
        if (!this.validateDateOfBirth()) {
            this.showToast('Please check the date of birth for the selected traveller type', 'error');
            return;
        }
        
        // Validate email format if provided
        if (travellerData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(travellerData.email)) {
                this.showToast('Please enter a valid email address', 'error');
                return;
            }
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