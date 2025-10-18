// Shared Navigation Component
class NavigationComponent {
    constructor(currentPage = '') {
        this.currentPage = currentPage;
        this.init();
    }
    
    init() {
        this.renderNavigation();
        this.setupAuthButtons();
        this.setupEventListeners();
    }
    
    renderNavigation() {
        const navHTML = `
            <header class="bg-white shadow-sm fixed w-full top-0 z-50">
                <div class="container mx-auto px-4 lg:px-8">
                    <div class="flex items-center justify-between h-20">
                        <!-- Logo -->
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                                <i class="fas fa-plane text-white text-xl"></i>
                            </div>
                            <a href="/" class="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent hover:opacity-80 transition">
                                Soft Flight
                            </a>
                        </div>
                        
                        <!-- Desktop Navigation -->
                        <nav class="hidden md:flex items-center space-x-8">
                            <a href="/" class="nav-link text-gray-700 hover:text-orange-600 font-medium ${(this.currentPage === 'home' || this.currentPage === 'flights') ? 'text-orange-600' : ''}">Flights</a>
                            <a href="/#about" class="nav-link text-gray-700 hover:text-orange-600 font-medium">About Us</a>
                            <a href="/#contact" class="nav-link text-gray-700 hover:text-orange-600 font-medium">Contact Us</a>
                        </nav>
                        
                        <!-- Auth Buttons -->
                        <div class="hidden md:flex items-center space-x-4" id="authButtons">
                            <!-- Will be populated by JavaScript based on auth state -->
                        </div>
                        
                        <!-- Mobile Menu Button -->
                        <button class="md:hidden text-gray-700 hover:text-orange-600" id="mobileMenuBtn">
                            <i class="fas fa-bars text-2xl"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Mobile Menu -->
                <div class="md:hidden hidden bg-white border-t" id="mobileMenu">
                    <div class="container mx-auto px-4 py-4 space-y-3">
                        <a href="/" class="block py-2 text-gray-700 hover:text-orange-600 font-medium ${(this.currentPage === 'home' || this.currentPage === 'flights') ? 'text-orange-600' : ''}">Flights</a>
                        <a href="/#about" class="block py-2 text-gray-700 hover:text-orange-600 font-medium">About Us</a>
                        <a href="/#contact" class="block py-2 text-gray-700 hover:text-orange-600 font-medium">Contact Us</a>
                        <hr class="my-3">
                        <div id="mobileAuthButtons">
                            <!-- Will be populated by JavaScript based on auth state -->
                        </div>
                    </div>
                </div>
            </header>
        `;
        
        // Insert navigation at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', navHTML);
    }
    
    setupAuthButtons() {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user_data');
        const authButtons = document.getElementById('authButtons');
        const mobileAuthButtons = document.getElementById('mobileAuthButtons');
        
        if (token && userData) {
            // User is logged in
            try {
                const user = JSON.parse(userData);
                const displayName = user.display_name || 'User';
                const initials = this.getInitials(displayName);
                
                // Desktop auth buttons with dropdown
                authButtons.innerHTML = `
                    <div class="relative">
                        <!-- User Profile Dropdown -->
                        <button id="userDropdownBtn" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-md">
                                <span class="text-white font-bold text-sm">${initials}</span>
                            </div>
                            <div class="text-left">
                                <p class="text-sm font-medium text-gray-900">${displayName}</p>
                            </div>
                            <i class="fas fa-chevron-down text-gray-400 text-sm ml-2"></i>
                        </button>
                            
                        
                        <!-- Dropdown Menu -->
                        <div id="userDropdown" class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 hidden">
                            <div class="px-4 py-3 border-b border-gray-100">
                                <div class="flex items-center space-x-3">
                                    <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                                        <span class="text-white font-bold">${initials}</span>
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-900">${displayName}</p>
                                        <p class="text-sm text-gray-500">${user.email || 'user@email.com'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="py-2">
                                <a href="/dashboard" class="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                                    <i class="fas fa-user w-5 text-gray-400"></i>
                                    <span>Profile</span>
                                </a>
                                <a href="/dashboard/bookings" class="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                                    <i class="fas fa-calendar-alt w-5 text-gray-400"></i>
                                    <span>My Bookings</span>
                                </a>
                                <a href="/dashboard/travellers" class="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                                    <i class="fas fa-users w-5 text-gray-400"></i>
                                    <span>Travellers</span>
                                </a>
                                <a href="/dashboard/support" class="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                                    <i class="fas fa-headset w-5 text-gray-400"></i>
                                    <span>Support</span>
                                </a>
                            </div>
                            
                            <div class="border-t border-gray-100 py-2">
                                <button id="navLogoutBtn" class="flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                                    <i class="fas fa-sign-out-alt w-5"></i>
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Mobile auth buttons
                mobileAuthButtons.innerHTML = `
                    <div class="flex items-center py-3 border-b border-gray-100">
                        <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-3">
                            <span class="text-white font-bold text-sm">${initials}</span>
                        </div>
                        <div>
                            <p class="font-medium text-gray-900">${displayName}</p>
                            <p class="text-sm text-gray-500">${user.email || 'user@email.com'}</p>
                        </div>
                    </div>
                    
                    <div class="py-2 space-y-1">
                        <a href="/dashboard" class="flex items-center space-x-3 py-2 text-gray-700 hover:text-orange-600 font-medium">
                            <i class="fas fa-user w-5"></i>
                            <span>Profile</span>
                        </a>
                        <a href="/dashboard/bookings" class="flex items-center space-x-3 py-2 text-gray-700 hover:text-orange-600 font-medium">
                            <i class="fas fa-calendar-alt w-5"></i>
                            <span>My Bookings</span>
                        </a>
                        <a href="/dashboard/travellers" class="flex items-center space-x-3 py-2 text-gray-700 hover:text-orange-600 font-medium">
                            <i class="fas fa-users w-5"></i>
                            <span>Travellers</span>
                        </a>
                        <a href="/dashboard/support" class="flex items-center space-x-3 py-2 text-gray-700 hover:text-orange-600 font-medium">
                            <i class="fas fa-headset w-5"></i>
                            <span>Support</span>
                        </a>
                        <button id="mobileLogoutBtn" class="flex items-center space-x-3 py-2 text-red-600 hover:text-red-700 font-medium w-full text-left">
                            <i class="fas fa-sign-out-alt w-5"></i>
                            <span>Sign Out</span>
                        </button>
                    </div>
                `;
            } catch (error) {
                console.error('Failed to parse user data:', error);
                this.renderGuestButtons(authButtons, mobileAuthButtons);
            }
        } else {
            // User is not logged in
            this.renderGuestButtons(authButtons, mobileAuthButtons);
        }
    }
    
    renderGuestButtons(authButtons, mobileAuthButtons) {
        // Desktop auth buttons
        authButtons.innerHTML = `
            <button class="text-gray-700 hover:text-orange-600 font-medium px-4 py-2 transition" id="loginBtn">
                Login
            </button>
            <a href="/signup" class="bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 transition font-medium shadow-lg ${this.currentPage === 'signup' ? 'bg-orange-700' : ''}">
                Sign Up
            </a>
        `;
        
        // Mobile auth buttons
        mobileAuthButtons.innerHTML = `
            <button class="block w-full text-left py-2 text-gray-700 hover:text-orange-600 font-medium" id="loginBtnMobile">
                Login
            </button>
            <a href="/signup" class="block w-full bg-orange-600 text-white py-2.5 rounded-lg hover:bg-orange-700 transition font-medium text-center ${this.currentPage === 'signup' ? 'bg-orange-700' : ''}">
                Sign Up
            </a>
        `;
    }
    
    getInitials(name) {
        if (!name) return 'U';
        
        const names = name.trim().split(' ');
        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase();
        }
        
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    
    async handleLogout() {
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
            console.error('Logout error:', error);
        }
        
        // Clear local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        
        // Show success message
        this.showToast('Logged out successfully', 'success');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
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
    
    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
        
        // Login button handlers (using event delegation for dynamically created buttons)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'loginBtn' || e.target.id === 'loginBtnMobile') {
                window.location.href = '/login';
            }
        });
        
        // User dropdown handlers (bind to instance)
        const navigationInstance = this;
        
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                const dropdownBtn = document.getElementById('userDropdownBtn');
                const dropdown = document.getElementById('userDropdown');
                
                if (dropdownBtn && e.target.closest('#userDropdownBtn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    // Toggle dropdown
                    if (dropdown) {
                        dropdown.classList.toggle('hidden');
                    }
                } else if (dropdown && !dropdown.contains(e.target)) {
                    // Close dropdown when clicking outside
                    dropdown.classList.add('hidden');
                }
                
                // Handle logout buttons
                if (e.target.id === 'navLogoutBtn' || e.target.id === 'mobileLogoutBtn' || 
                    e.target.closest('#navLogoutBtn') || e.target.closest('#mobileLogoutBtn')) {
                    e.preventDefault();
                    navigationInstance.handleLogout();
                }
            });
        }, 100);
        
        // Close mobile menu when clicking on a link
        const mobileLinks = document.querySelectorAll('#mobileMenu a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mobileMenu) {
                    mobileMenu.classList.add('hidden');
                }
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileMenu && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
}

// Global navigation instance
let globalNavigation = null;

// Function to initialize navigation (can be called manually)
function initNavigation(currentPage = '') {
    // Detect current page from URL path if not provided
    if (!currentPage) {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') {
            currentPage = 'home';
        } else if (path === '/signup' || path === '/signup.html') {
            currentPage = 'signup';
        } else if (path === '/flights' || path === '/flights.html') {
            currentPage = 'flights';
        } else if (path === '/login' || path === '/login.html') {
            currentPage = 'login';
        } else if (path === '/forgot-password' || path === '/forgot-password.html') {
            currentPage = 'forgot-password';
        } else if (path.startsWith('/dashboard')) {
            currentPage = 'dashboard';
        }
    }
    
    // Initialize navigation
    if (!globalNavigation) {
        globalNavigation = new NavigationComponent(currentPage);
    }
    
    return globalNavigation;
}

// Auto-initialize navigation for non-dashboard pages
document.addEventListener('DOMContentLoaded', () => {
    // Only auto-initialize if not in dashboard (dashboard pages will call initNavigation manually)
    if (!window.location.pathname.startsWith('/dashboard')) {
        initNavigation();
    }
});