// Dashboard functionality
class DashboardManager {
    constructor() {
        this.userData = null;
        this.baseUrl = null;
        this.init();
    }
    
    async init() {
        // Initialize navigation and sidebar
        initNavigation();
        initDashboardSidebar('my-account');
        
        // Load user data from localStorage immediately
        this.loadUserDataFromStorage();
        
        await this.loadConfig();
        this.checkAuthentication();
        await this.fetchUserProfile();
        this.setupEventListeners();
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
    
    loadUserDataFromStorage() {
        try {
            const userData = localStorage.getItem('user_data');
            if (userData) {
                this.userData = JSON.parse(userData);
                this.loadUserData();
                console.log('Loaded user data from localStorage:', this.userData);
            }
        } catch (error) {
            console.error('Failed to load user data from localStorage:', error);
        }
    }

    checkAuthentication() {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            // Redirect to login if not authenticated
            window.location.href = '/login';
            return false;
        }
        return true;
    }
    
    async fetchUserProfile() {
        const token = localStorage.getItem('access_token');
        
        if (!token || !this.baseUrl) return;
        
        try {
            const response = await axios.get(`${this.baseUrl}/v1/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data.status === 'true' || response.data.status === true) {
                this.userData = response.data.data;
                // Update localStorage with fresh user data
                localStorage.setItem('user_data', JSON.stringify(this.userData));
                this.loadUserData();
            } else {
                throw new Error('Failed to fetch user profile');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            if (error.response?.status === 401) {
                // Token expired or invalid
                this.logout();
            } else {
                // Try to load from localStorage as fallback
                const userData = localStorage.getItem('user_data');
                if (userData) {
                    try {
                        this.userData = JSON.parse(userData);
                        this.loadUserData();
                    } catch (parseError) {
                        console.error('Failed to parse user data:', parseError);
                        this.logout();
                    }
                }
            }
        }
    }
    
    loadUserData() {
        if (!this.userData) return;
        
        console.log('Loading user data:', this.userData);
        
        // Update profile information
        const displayName = this.userData.display_name || 'User';
        const firstName = this.userData.first_name || 'N/A';
        const lastName = this.userData.last_name || 'N/A';
        const email = this.userData.email || '';
        const credits = this.userData.credits || 0;
        
        // Update various elements with user data (with null checks)
        const welcomeUserEl = document.getElementById('welcomeUser');
        if (welcomeUserEl) welcomeUserEl.textContent = displayName;
        
        const profileNameEl = document.getElementById('profileName');
        if (profileNameEl) profileNameEl.textContent = displayName;
        
        const profileEmailEl = document.getElementById('profileEmail');
        if (profileEmailEl) profileEmailEl.textContent = email;
        
        const displayNameEl = document.getElementById('displayName');
        if (displayNameEl) displayNameEl.textContent = displayName;
        
        const firstNameEl = document.getElementById('firstName');
        if (firstNameEl) firstNameEl.textContent = firstName;
        
        const lastNameEl = document.getElementById('lastName');
        if (lastNameEl) lastNameEl.textContent = lastName;
        
        const mailAddressEl = document.getElementById('mailAddress');
        if (mailAddressEl) mailAddressEl.textContent = email;
        
        const userCreditsEl = document.getElementById('userCredits');
        if (userCreditsEl) userCreditsEl.textContent = credits;
        
        // Update initials
        const initials = this.getInitials(displayName);
        const userInitialsEl = document.getElementById('userInitials');
        if (userInitialsEl) userInitialsEl.textContent = initials;
        
        const profileInitialsEl = document.getElementById('profileInitials');
        if (profileInitialsEl) profileInitialsEl.textContent = initials;
        
        // Update avatar if available
        if (this.userData.avatar_url) {
            // Update main profile avatar
            const profileImageContainer = profileInitialsEl?.parentElement;
            if (profileImageContainer) {
                // Check if avatar image already exists
                let avatarImg = profileImageContainer.querySelector('img.profile-avatar');
                if (!avatarImg) {
                    avatarImg = document.createElement('img');
                    avatarImg.className = 'profile-avatar w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg';
                    profileImageContainer.appendChild(avatarImg);
                }
                avatarImg.src = this.userData.avatar_url;
                avatarImg.style.display = 'block';
                if (profileInitialsEl) profileInitialsEl.style.display = 'none';
            }
            
            // Update navigation avatar if it exists
            const navAvatarContainers = document.querySelectorAll('.w-10.h-10.bg-gradient-to-br, .w-12.h-12.bg-gradient-to-br');
            navAvatarContainers.forEach(container => {
                let navAvatarImg = container.querySelector('img.nav-avatar');
                if (!navAvatarImg) {
                    navAvatarImg = document.createElement('img');
                    navAvatarImg.className = 'nav-avatar w-full h-full rounded-full object-cover';
                    container.appendChild(navAvatarImg);
                }
                navAvatarImg.src = this.userData.avatar_url;
                navAvatarImg.style.display = 'block';
                
                // Hide initials span
                const initialsSpan = container.querySelector('span');
                if (initialsSpan) initialsSpan.style.display = 'none';
            });
        } else {
            // Show initials if no avatar
            const avatarImages = document.querySelectorAll('.profile-avatar, .nav-avatar');
            avatarImages.forEach(img => img.style.display = 'none');
            
            const initialsSpans = document.querySelectorAll('#userInitials, #profileInitials');
            initialsSpans.forEach(span => {
                if (span) span.style.display = 'block';
            });
        }
        
        // Update member since date
        if (this.userData.created_at) {
            const memberDate = new Date(this.userData.created_at);
            const formattedDate = memberDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
            });
            const memberSinceEl = document.getElementById('memberSince');
            if (memberSinceEl) memberSinceEl.textContent = `Member since ${formattedDate}`;
        }
    }
    
    getInitials(name) {
        if (!name) return 'U';
        
        const names = name.trim().split(' ');
        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase();
        }
        
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    
    setupEventListeners() {
        // Edit Profile Modal
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.showEditProfileModal();
            });
        }
        
        const closeEditModal = document.getElementById('closeEditModal');
        if (closeEditModal) {
            closeEditModal.addEventListener('click', () => {
                this.hideEditProfileModal();
            });
        }
        
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.hideEditProfileModal();
            });
        }
        
        // Close modal when clicking outside
        const editProfileModal = document.getElementById('editProfileModal');
        if (editProfileModal) {
            editProfileModal.addEventListener('click', (e) => {
                if (e.target.id === 'editProfileModal') {
                    this.hideEditProfileModal();
                }
            });
        }
        
        // Avatar upload functionality
        const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
        const avatarInput = document.getElementById('avatarInput');
        
        if (uploadAvatarBtn && avatarInput) {
            uploadAvatarBtn.addEventListener('click', () => {
                avatarInput.click();
            });
            
            avatarInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.handleAvatarUpload(e.target.files[0]);
                }
            });
        }
        
        // Profile form submission
        const editProfileForm = document.getElementById('editProfileForm');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
            
            // Enable save button when form changes
            editProfileForm.addEventListener('input', () => {
                this.validateEditForm();
            });
        }
    }
    
    showEditProfileModal() {
        const modal = document.getElementById('editProfileModal');
        if (modal && this.userData) {
            // Populate form with current user data
            this.populateEditForm();
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }
    
    populateEditForm() {
        if (!this.userData) return;
        
        // Basic information
        const displayName = document.getElementById('editDisplayName');
        if (displayName) displayName.value = this.userData.display_name || '';
        
        const email = document.getElementById('editEmail');
        if (email) email.value = this.userData.email || '';
        
        const firstName = document.getElementById('editFirstName');
        if (firstName) firstName.value = this.userData.first_name || '';
        
        const lastName = document.getElementById('editLastName');
        if (lastName) lastName.value = this.userData.last_name || '';
        
        const phone = document.getElementById('editPhone');
        if (phone) phone.value = this.userData.phone || '';
        
        const gender = document.getElementById('editGender');
        if (gender) gender.value = this.userData.gender || '';
        
        const dateOfBirth = document.getElementById('editDateOfBirth');
        if (dateOfBirth) dateOfBirth.value = this.userData.date_of_birth || '';
        
        const nationality = document.getElementById('editNationality');
        if (nationality) nationality.value = this.userData.nationality || '';
        
        // Address information
        const presentAddress = document.getElementById('editPresentAddress');
        if (presentAddress) presentAddress.value = this.userData.present_address || '';
        
        const permanentAddress = document.getElementById('editPermanentAddress');
        if (permanentAddress) permanentAddress.value = this.userData.permanent_address || '';
        
        // Update avatar in modal
        const initials = this.getInitials(this.userData.display_name || 'User');
        const editProfileInitials = document.getElementById('editProfileInitials');
        if (editProfileInitials) editProfileInitials.textContent = initials;
        
        // Show avatar if exists
        if (this.userData.avatar_url) {
            const avatarPreview = document.getElementById('avatarPreview');
            const currentAvatar = document.getElementById('currentAvatar');
            
            if (avatarPreview && currentAvatar) {
                avatarPreview.src = this.userData.avatar_url;
                avatarPreview.classList.remove('hidden');
                editProfileInitials.classList.add('hidden');
            }
        }
        
        // Reset form validation
        this.validateEditForm();
    }
    
    hideEditProfileModal() {
        const modal = document.getElementById('editProfileModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            
            // Reset form
            const form = document.getElementById('editProfileForm');
            if (form) form.reset();
            
            // Reset avatar preview
            const avatarPreview = document.getElementById('avatarPreview');
            const editProfileInitials = document.getElementById('editProfileInitials');
            
            if (avatarPreview) {
                avatarPreview.classList.add('hidden');
                avatarPreview.src = '';
            }
            
            if (editProfileInitials) {
                editProfileInitials.classList.remove('hidden');
            }
            
            // Reset upload progress
            this.hideUploadProgress();
        }
    }
    
    validateEditForm() {
        const displayName = document.getElementById('editDisplayName')?.value?.trim();
        const email = document.getElementById('editEmail')?.value?.trim();
        const saveBtn = document.getElementById('saveProfileBtn');
        
        const isValid = displayName && email && this.isValidEmail(email);
        
        if (saveBtn) {
            saveBtn.disabled = !isValid;
            if (isValid) {
                saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }
        
        return isValid;
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    async handleAvatarUpload(file) {
        try {
            // Validate file
            if (!this.validateAvatarFile(file)) {
                return;
            }
            
            // Show upload progress
            this.showUploadProgress();
            
            // Step 1: Generate upload URL
            const uploadUrls = await this.generateAvatarUploadUrl(file.name, file.type);
            
            // Step 2: Upload file to the generated URL
            await this.uploadFileToUrl(file, uploadUrls.upload_url);
            
            // Step 3: Update user data with new avatar URL
            this.userData.avatar_url = uploadUrls.download_url;
            localStorage.setItem('user_data', JSON.stringify(this.userData));
            
            // Step 4: Update UI
            this.updateAvatarPreview(uploadUrls.download_url);
            this.loadUserData(); // Refresh main profile display
            
            this.hideUploadProgress();
            this.showToast('Avatar updated successfully!', 'success');
            
        } catch (error) {
            console.error('Avatar upload failed:', error);
            this.hideUploadProgress();
            
            if (error.response?.status === 401) {
                this.handleAuthError();
            } else {
                this.showToast('Failed to upload avatar. Please try again.', 'error');
            }
        }
    }
    
    validateAvatarFile(file) {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showToast('Please select a valid image file (JPEG, PNG, GIF, or WebP)', 'error');
            return false;
        }
        
        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            this.showToast('Image size must be less than 5MB', 'error');
            return false;
        }
        
        return true;
    }
    
    async generateAvatarUploadUrl(fileName, contentType) {
        const token = localStorage.getItem('access_token');
        
        const response = await axios.post(`${this.baseUrl}/v1/users/generate-avatar-url?file_name=${encodeURIComponent(fileName)}&content_type=${encodeURIComponent(contentType)}`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Handle the API response structure
        if (response.data.status === 'true' || response.data.status === true) {
            return response.data.data; // Return the nested data object with download_url and upload_url
        } else {
            throw new Error(response.data.message || 'Failed to generate upload URL');
        }
    }
    
    async uploadFileToUrl(file, uploadUrl) {
        // Upload file directly to the provided URL (usually S3 or similar)
        const response = await axios.put(uploadUrl, file, {
            headers: {
                'Content-Type': file.type
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                this.updateUploadProgress(percentCompleted);
            }
        });
        
        return response;
    }
    
    updateAvatarPreview(avatarUrl) {
        const avatarPreview = document.getElementById('avatarPreview');
        const editProfileInitials = document.getElementById('editProfileInitials');
        
        if (avatarPreview && editProfileInitials) {
            avatarPreview.src = avatarUrl;
            avatarPreview.classList.remove('hidden');
            editProfileInitials.classList.add('hidden');
        }
    }
    
    showUploadProgress() {
        const progressContainer = document.getElementById('uploadProgress');
        if (progressContainer) {
            progressContainer.classList.remove('hidden');
        }
        this.updateUploadProgress(0);
    }
    
    updateUploadProgress(percent) {
        const progressBar = document.getElementById('uploadProgressBar');
        const progressText = document.getElementById('uploadProgressText');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (progressText) {
            if (percent < 100) {
                progressText.textContent = `Uploading... ${percent}%`;
            } else {
                progressText.textContent = 'Processing...';
            }
        }
    }
    
    hideUploadProgress() {
        const progressContainer = document.getElementById('uploadProgress');
        if (progressContainer) {
            progressContainer.classList.add('hidden');
        }
    }
    
    async updateProfile() {
        if (!this.validateEditForm()) {
            this.showToast('Please fill in all required fields correctly', 'error');
            return;
        }
        
        try {
            // Show loading state
            const saveBtn = document.getElementById('saveProfileBtn');
            const saveText = document.getElementById('saveText');
            const saveSpinner = document.getElementById('saveSpinner');
            
            if (saveBtn) saveBtn.disabled = true;
            if (saveText) saveText.classList.add('hidden');
            if (saveSpinner) saveSpinner.classList.remove('hidden');
            
            // Gather form data
            const formData = {
                display_name: document.getElementById('editDisplayName')?.value?.trim(),
                email: document.getElementById('editEmail')?.value?.trim(),
                first_name: document.getElementById('editFirstName')?.value?.trim(),
                last_name: document.getElementById('editLastName')?.value?.trim(),
                phone: document.getElementById('editPhone')?.value?.trim(),
                gender: document.getElementById('editGender')?.value,
                date_of_birth: document.getElementById('editDateOfBirth')?.value,
                nationality: document.getElementById('editNationality')?.value?.trim(),
                present_address: document.getElementById('editPresentAddress')?.value?.trim(),
                permanent_address: document.getElementById('editPermanentAddress')?.value?.trim()
            };
            
            // Remove empty values
            Object.keys(formData).forEach(key => {
                if (formData[key] === '' || formData[key] === null || formData[key] === undefined) {
                    delete formData[key];
                }
            });
            
            const token = localStorage.getItem('access_token');
            
            const response = await axios.put(`${this.baseUrl}/v1/users/profile`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Update local storage with new data
            if (response.data.status === 'true' || response.data.status === true) {
                // Merge the updated data with existing user data
                this.userData = { ...this.userData, ...response.data.data };
                localStorage.setItem('user_data', JSON.stringify(this.userData));
                
                this.showToast('Profile updated successfully!', 'success');
                this.loadUserData(); // Refresh display
                this.hideEditProfileModal();
            } else {
                throw new Error(response.data.message || 'Failed to update profile');
            }
            
        } catch (error) {
            console.error('Failed to update profile:', error);
            
            if (error.response?.status === 401) {
                this.handleAuthError();
            } else if (error.response?.status === 400) {
                const message = error.response?.data?.message || 'Invalid profile data';
                this.showToast(message, 'error');
            } else {
                this.showToast('Failed to update profile. Please try again.', 'error');
            }
        } finally {
            // Hide loading state
            const saveBtn = document.getElementById('saveProfileBtn');
            const saveText = document.getElementById('saveText');
            const saveSpinner = document.getElementById('saveSpinner');
            
            if (saveText) saveText.classList.remove('hidden');
            if (saveSpinner) saveSpinner.classList.add('hidden');
            if (saveBtn) saveBtn.disabled = false;
            
            this.validateEditForm(); // Re-validate to set proper button state
        }
    }
    
    handleAuthError() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        
        this.showToast('Session expired. Please login again.', 'error');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
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
    
    async getBaseUrl() {
        return this.baseUrl;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});