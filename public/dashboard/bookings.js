// Bookings Management System
class BookingsManager {
    constructor() {
        this.bookings = [];
        this.currentFilter = '';
        this.selectedBookingId = null;
        this.init();
    }
    
    async init() {
        // Initialize navigation and sidebar
        initNavigation();
        initDashboardSidebar('bookings');
        
        // Check authentication
        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        this.setupEventListeners();
        await this.loadBookings();
    }
    
    setupEventListeners() {
        // Status filter
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.renderBookings();
        });
        
        // Modal controls
        document.getElementById('closeBookingModal').addEventListener('click', () => {
            this.closeBookingModal();
        });
        
        document.getElementById('cancelCancelBtn').addEventListener('click', () => {
            this.closeCancelModal();
        });
        
        document.getElementById('confirmCancelBtn').addEventListener('click', () => {
            this.cancelBooking();
        });
        
        // Close modals on outside click
        document.getElementById('bookingModal').addEventListener('click', (e) => {
            if (e.target.id === 'bookingModal') {
                this.closeBookingModal();
            }
        });
        
        document.getElementById('cancelModal').addEventListener('click', (e) => {
            if (e.target.id === 'cancelModal') {
                this.closeCancelModal();
            }
        });
    }
    
    async loadBookings() {
        try {
            const baseUrl = await this.getBaseUrl();
            const token = localStorage.getItem('access_token');
            
            const response = await axios.get(`${baseUrl}/v1/bookings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            this.bookings = response.data.data || [];
            this.renderBookings();
            
        } catch (error) {
            console.error('Failed to load bookings:', error);
            this.hideLoadingState();
            
            if (error.response?.status === 401) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                this.showToast('Failed to load bookings', 'error');
            }
        }
    }
    
    renderBookings() {
        this.hideLoadingState();
        
        const container = document.getElementById('bookingsContainer');
        const emptyState = document.getElementById('emptyState');
        
        let filteredBookings = this.bookings;
        if (this.currentFilter) {
            filteredBookings = this.bookings.filter(booking => 
                booking.status?.toLowerCase() === this.currentFilter.toLowerCase()
            );
        }
        
        if (filteredBookings.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        container.innerHTML = filteredBookings.map(booking => `
            <div class="dashboard-card mb-6">
                <div class="p-6">
                    <!-- Booking Header -->
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <div class="flex items-center space-x-3 mb-2">
                                <h3 class="text-lg font-semibold text-gray-900">
                                    ${booking.departure_city || 'N/A'} → ${booking.arrival_city || 'N/A'}
                                </h3>
                                <span class="status-badge status-${booking.status?.toLowerCase() || 'unknown'}">
                                    ${this.formatStatus(booking.status)}
                                </span>
                            </div>
                            <div class="flex items-center space-x-4 text-sm text-gray-600">
                                <span><i class="fas fa-ticket-alt mr-1"></i> ${booking.booking_reference || booking.id}</span>
                                <span><i class="fas fa-calendar mr-1"></i> ${this.formatDate(booking.departure_date)}</span>
                                ${booking.total_amount ? `<span><i class="fas fa-dollar-sign mr-1"></i> ${booking.total_amount} ${booking.currency || 'USD'}</span>` : ''}
                            </div>
                        </div>
                        
                        <div class="flex items-center space-x-2">
                            <button onclick="bookingsManager.viewBookingDetails('${booking.id}')" 
                                    class="btn-secondary text-sm">
                                View Details
                            </button>
                            ${booking.status?.toLowerCase() === 'confirmed' ? `
                                <button onclick="bookingsManager.showCancelModal('${booking.id}')" 
                                        class="text-red-600 hover:text-red-700 text-sm px-3 py-1 rounded">
                                    Cancel
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Flight Information -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Departure -->
                        <div class="text-center">
                            <div class="text-sm text-gray-500 mb-1">Departure</div>
                            <div class="font-semibold text-lg">${this.formatTime(booking.departure_time)}</div>
                            <div class="text-sm text-gray-600">${booking.departure_airport || 'N/A'}</div>
                            <div class="text-xs text-gray-500">${this.formatDate(booking.departure_date)}</div>
                        </div>
                        
                        <!-- Flight Duration -->
                        <div class="text-center flex flex-col justify-center">
                            <div class="flex items-center justify-center space-x-2 mb-2">
                                <div class="w-3 h-3 rounded-full bg-orange-600"></div>
                                <div class="flex-1 h-0.5 bg-gray-300"></div>
                                <i class="fas fa-plane text-orange-600"></i>
                                <div class="flex-1 h-0.5 bg-gray-300"></div>
                                <div class="w-3 h-3 rounded-full bg-orange-600"></div>
                            </div>
                            <div class="text-sm text-gray-600">${booking.duration || 'N/A'}</div>
                            <div class="text-xs text-gray-500">${booking.stops ? `${booking.stops} stops` : 'Direct'}</div>
                        </div>
                        
                        <!-- Arrival -->
                        <div class="text-center">
                            <div class="text-sm text-gray-500 mb-1">Arrival</div>
                            <div class="font-semibold text-lg">${this.formatTime(booking.arrival_time)}</div>
                            <div class="text-sm text-gray-600">${booking.arrival_airport || 'N/A'}</div>
                            <div class="text-xs text-gray-500">${this.formatDate(booking.arrival_date)}</div>
                        </div>
                    </div>
                    
                    <!-- Passengers -->
                    ${booking.passengers && booking.passengers.length > 0 ? `
                        <div class="mt-6 pt-6 border-t border-gray-200">
                            <div class="flex items-center justify-between">
                                <div class="text-sm text-gray-600">
                                    <i class="fas fa-users mr-2"></i>
                                    ${booking.passengers.length} Passenger${booking.passengers.length > 1 ? 's' : ''}
                                </div>
                                <div class="text-sm text-gray-600">
                                    ${booking.airline ? `<i class="fas fa-plane mr-2"></i>${booking.airline}` : ''}
                                    ${booking.flight_number ? ` • Flight ${booking.flight_number}` : ''}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
    
    async viewBookingDetails(bookingId) {
        try {
            const baseUrl = await this.getBaseUrl();
            const token = localStorage.getItem('access_token');
            
            const response = await axios.get(`${baseUrl}/v1/bookings/${bookingId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const booking = response.data.data;
            this.renderBookingDetails(booking);
            this.openBookingModal();
            
        } catch (error) {
            console.error('Failed to load booking details:', error);
            this.showToast('Failed to load booking details', 'error');
        }
    }
    
    renderBookingDetails(booking) {
        const content = document.getElementById('bookingDetailsContent');
        
        content.innerHTML = `
            <!-- Booking Summary -->
            <div class="mb-8">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-2">
                            ${booking.departure_city || 'N/A'} → ${booking.arrival_city || 'N/A'}
                        </h3>
                        <div class="flex items-center space-x-4 text-gray-600">
                            <span class="status-badge status-${booking.status?.toLowerCase() || 'unknown'}">
                                ${this.formatStatus(booking.status)}
                            </span>
                            <span><i class="fas fa-ticket-alt mr-1"></i> ${booking.booking_reference || booking.id}</span>
                        </div>
                    </div>
                    ${booking.total_amount ? `
                        <div class="text-right">
                            <div class="text-2xl font-bold text-gray-900">${booking.total_amount} ${booking.currency || 'USD'}</div>
                            <div class="text-sm text-gray-600">Total Price</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Flight Details -->
            <div class="mb-8">
                <h4 class="text-lg font-semibold text-gray-900 mb-4">Flight Details</h4>
                <div class="bg-gray-50 rounded-lg p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h5 class="font-medium text-gray-900 mb-3">Departure</h5>
                            <div class="space-y-2 text-sm">
                                <div><strong>Time:</strong> ${this.formatTime(booking.departure_time)}</div>
                                <div><strong>Date:</strong> ${this.formatDate(booking.departure_date)}</div>
                                <div><strong>Airport:</strong> ${booking.departure_airport || 'N/A'}</div>
                                <div><strong>Terminal:</strong> ${booking.departure_terminal || 'TBD'}</div>
                            </div>
                        </div>
                        
                        <div>
                            <h5 class="font-medium text-gray-900 mb-3">Arrival</h5>
                            <div class="space-y-2 text-sm">
                                <div><strong>Time:</strong> ${this.formatTime(booking.arrival_time)}</div>
                                <div><strong>Date:</strong> ${this.formatDate(booking.arrival_date)}</div>
                                <div><strong>Airport:</strong> ${booking.arrival_airport || 'N/A'}</div>
                                <div><strong>Terminal:</strong> ${booking.arrival_terminal || 'TBD'}</div>
                            </div>
                        </div>
                    </div>
                    
                    ${booking.airline || booking.flight_number ? `
                        <div class="mt-4 pt-4 border-t border-gray-200">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                ${booking.airline ? `<div><strong>Airline:</strong> ${booking.airline}</div>` : ''}
                                ${booking.flight_number ? `<div><strong>Flight:</strong> ${booking.flight_number}</div>` : ''}
                                ${booking.aircraft_type ? `<div><strong>Aircraft:</strong> ${booking.aircraft_type}</div>` : ''}
                                ${booking.duration ? `<div><strong>Duration:</strong> ${booking.duration}</div>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Passengers -->
            ${booking.passengers && booking.passengers.length > 0 ? `
                <div class="mb-8">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Passengers</h4>
                    <div class="space-y-4">
                        ${booking.passengers.map((passenger, index) => `
                            <div class="bg-gray-50 rounded-lg p-4">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h5 class="font-medium text-gray-900">${passenger.first_name} ${passenger.last_name}</h5>
                                        <div class="text-sm text-gray-600 space-y-1 mt-2">
                                            <div><strong>Type:</strong> ${passenger.type || 'Adult'}</div>
                                            ${passenger.seat_number ? `<div><strong>Seat:</strong> ${passenger.seat_number}</div>` : ''}
                                            ${passenger.meal_preference ? `<div><strong>Meal:</strong> ${passenger.meal_preference}</div>` : ''}
                                        </div>
                                    </div>
                                    ${passenger.ticket_number ? `
                                        <div class="text-sm text-gray-600">
                                            <strong>Ticket:</strong> ${passenger.ticket_number}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Booking Actions -->
            <div class="flex justify-between items-center pt-6 border-t border-gray-200">
                <div class="text-sm text-gray-600">
                    Booked on ${this.formatDateTime(booking.created_at)}
                </div>
                
                <div class="flex space-x-3">
                    ${booking.status?.toLowerCase() === 'confirmed' ? `
                        <button onclick="bookingsManager.downloadTicket('${booking.id}')" 
                                class="btn-secondary text-sm">
                            <i class="fas fa-download mr-2"></i>
                            Download Ticket
                        </button>
                        <button onclick="bookingsManager.showCancelModal('${booking.id}')" 
                                class="btn-danger text-sm">
                            <i class="fas fa-times mr-2"></i>
                            Cancel Booking
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    openBookingModal() {
        const modal = document.getElementById('bookingModal');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    closeBookingModal() {
        const modal = document.getElementById('bookingModal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    showCancelModal(bookingId) {
        this.selectedBookingId = bookingId;
        document.getElementById('cancelModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    closeCancelModal() {
        document.getElementById('cancelModal').classList.add('hidden');
        document.body.style.overflow = '';
        this.selectedBookingId = null;
    }
    
    async cancelBooking() {
        if (!this.selectedBookingId) return;
        
        try {
            const baseUrl = await this.getBaseUrl();
            const token = localStorage.getItem('access_token');
            
            await axios.delete(`${baseUrl}/v1/bookings/${this.selectedBookingId}/cancel`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            this.showToast('Booking cancelled successfully', 'success');
            this.closeCancelModal();
            this.closeBookingModal();
            await this.loadBookings();
            
        } catch (error) {
            console.error('Failed to cancel booking:', error);
            this.showToast('Failed to cancel booking', 'error');
        }
    }
    
    async downloadTicket(bookingId) {
        try {
            const baseUrl = await this.getBaseUrl();
            const token = localStorage.getItem('access_token');
            
            const response = await axios.get(`${baseUrl}/v1/bookings/${bookingId}/ticket`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                responseType: 'blob'
            });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ticket-${bookingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Failed to download ticket:', error);
            this.showToast('Failed to download ticket', 'error');
        }
    }
    
    hideLoadingState() {
        const loading = document.getElementById('loadingBookings');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    formatStatus(status) {
        if (!status) return 'Unknown';
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    formatTime(timeString) {
        if (!timeString) return 'N/A';
        // If it's already in HH:MM format, return as is
        if (/^\d{2}:\d{2}$/.test(timeString)) return timeString;
        
        // If it's a full datetime, extract time
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        }
        
        return timeString;
    }
    
    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
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

// Initialize bookings manager when page loads
let bookingsManager;
document.addEventListener('DOMContentLoaded', () => {
    bookingsManager = new BookingsManager();
});