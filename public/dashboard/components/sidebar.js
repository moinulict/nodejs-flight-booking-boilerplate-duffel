// Shared Dashboard Sidebar Component
class DashboardSidebar {
    constructor(activeSection = 'my-account') {
        this.activeSection = activeSection;
        this.init();
    }
    
    init() {
        this.renderSidebar();
        this.setupEventListeners();
        this.loadUserInfo();
    }
    
    renderSidebar() {
        const sidebarHTML = `
            <div class="h-full flex flex-col">
                
                <nav class="flex-1 mt-6">
                    <div class="px-4 space-y-2">
                        <a href="/dashboard" class="sidebar-link ${this.activeSection === 'my-account' ? 'active' : ''} flex items-center space-x-3 px-4 py-3 rounded-lg" data-section="my-account">
                            <i class="fas fa-th-large text-gray-500 w-5"></i>
                            <span class="font-medium">My Account</span>
                        </a>
                        
                        <a href="/dashboard/travellers" class="sidebar-link ${this.activeSection === 'travellers' ? 'active' : ''} flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900" data-section="travellers">
                            <i class="fas fa-users text-gray-500 w-5"></i>
                            <span class="font-medium">Travellers</span>
                        </a>
                        
                        <a href="/dashboard/bookings" class="sidebar-link ${this.activeSection === 'bookings' ? 'active' : ''} flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900" data-section="bookings">
                            <i class="fas fa-calendar-alt text-gray-500 w-5"></i>
                            <span class="font-medium">My Bookings</span>
                        </a>
                        
                        <a href="/dashboard/change-password" class="sidebar-link ${this.activeSection === 'change-password' ? 'active' : ''} flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900" data-section="change-password">
                            <i class="fas fa-lock text-gray-500 w-5"></i>
                            <span class="font-medium">Change Password</span>
                        </a>
                        
                        <a href="/dashboard/support" class="sidebar-link ${this.activeSection === 'support' ? 'active' : ''} flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900" data-section="support">
                            <i class="fas fa-headset text-gray-500 w-5"></i>
                            <span class="font-medium">Support</span>
                        </a>
                    </div>
                </nav>
            </div>
        `;
        
        // Insert sidebar into the sidebar container
        const sidebarContainer = document.querySelector('aside');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = sidebarHTML;
        }
    }
    
    setupEventListeners() {
        // Sidebar navigation
        const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all links
                sidebarLinks.forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                link.classList.add('active');
            });
        });
        
        // Note: Logout is now handled by main navigation
    }
    
    async loadUserInfo() {
        try {
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const user = JSON.parse(userData);
                // Update any user-specific sidebar elements if needed
                console.log('User loaded in sidebar:', user.display_name);
            }
        } catch (error) {
            console.error('Failed to load user info in sidebar:', error);
        }
    }
    

}

// Utility function to initialize sidebar
function initDashboardSidebar(activeSection = 'my-account') {
    return new DashboardSidebar(activeSection);
}