// Support Center Management System
class SupportManager {
    constructor() {
        this.init();
    }
    
    async init() {
        // Initialize navigation and sidebar
        initNavigation();
        initDashboardSidebar('support');
        
        // Check authentication
        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        this.setupEventListeners();
        await this.loadUserInfo();
    }
    
    setupEventListeners() {
        // Support form submission
        document.getElementById('supportForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitSupportRequest();
        });
        
        // FAQ accordion
        document.querySelectorAll('.faq-question').forEach(button => {
            button.addEventListener('click', () => {
                this.toggleFAQ(button);
            });
        });
        
        // Smooth scrolling for quick actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('[onclick*="scrollToSection"]')) {
                e.preventDefault();
            }
        });
    }
    
    async loadUserInfo() {
        try {
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const user = JSON.parse(userData);
                
                // Pre-fill contact form with user data
                document.getElementById('contactName').value = user.display_name || '';
                document.getElementById('contactEmail').value = user.email || '';
            }
        } catch (error) {
            console.error('Failed to load user info:', error);
        }
    }
    
    scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    toggleFAQ(button) {
        const faqItem = button.closest('.faq-item');
        const answer = faqItem.querySelector('.faq-answer');
        const icon = button.querySelector('i');
        
        // Close all other FAQs
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                const otherAnswer = item.querySelector('.faq-answer');
                const otherIcon = item.querySelector('.faq-question i');
                otherAnswer.classList.add('hidden');
                otherIcon.className = 'fas fa-chevron-down text-gray-400';
            }
        });
        
        // Toggle current FAQ
        if (answer.classList.contains('hidden')) {
            answer.classList.remove('hidden');
            icon.className = 'fas fa-chevron-up text-gray-400';
        } else {
            answer.classList.add('hidden');
            icon.className = 'fas fa-chevron-down text-gray-400';
        }
    }
    
    async submitSupportRequest() {
        const form = document.getElementById('supportForm');
        const formData = new FormData(form);
        
        const supportData = {
            name: formData.get('contactName'),
            email: formData.get('contactEmail'),
            subject: formData.get('contactSubject'),
            booking_reference: formData.get('bookingReference') || null,
            message: formData.get('contactMessage'),
            priority: formData.get('contactPriority') || 'normal'
        };
        
        // Validate required fields
        if (!supportData.name || !supportData.email || !supportData.subject || !supportData.message) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = document.getElementById('submitSupportBtn');
        const submitText = document.getElementById('submitSupportText');
        const submitSpinner = document.getElementById('submitSupportSpinner');
        
        submitText.classList.add('hidden');
        submitSpinner.classList.remove('hidden');
        submitBtn.disabled = true;
        
        try {
            const baseUrl = await this.getBaseUrl();
            const token = localStorage.getItem('access_token');
            
            const response = await axios.post(`${baseUrl}/v1/support/tickets`, supportData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            this.showToast('Support request submitted successfully! We\'ll get back to you within 24 hours.', 'success');
            
            // Reset form
            form.reset();
            
            // Re-populate user info
            setTimeout(() => {
                this.loadUserInfo();
            }, 100);
            
        } catch (error) {
            console.error('Failed to submit support request:', error);
            
            if (error.response?.status === 401) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                const message = error.response?.data?.message || 'Failed to submit support request. Please try again.';
                this.showToast(message, 'error');
            }
        } finally {
            // Hide loading state
            submitText.classList.remove('hidden');
            submitSpinner.classList.add('hidden');
            submitBtn.disabled = false;
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
        
        // Auto remove after 5 seconds for success messages (longer for user to read)
        const timeout = type === 'success' ? 5000 : 3000;
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, timeout);
    }
}

// Initialize support manager when page loads
let supportManager;
document.addEventListener('DOMContentLoaded', () => {
    supportManager = new SupportManager();
});