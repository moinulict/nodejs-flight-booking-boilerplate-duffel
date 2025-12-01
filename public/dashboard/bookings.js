// Cache for airport data (loaded from persistent data source)
window.airportDataCache = {};

// Cache for airline data
window.airlineDataCache = {};

// Load airline data from API
async function loadAirlineDataCache() {
    try {
        const response = await axios.get('/api/airlines');
        const airlines = response.data?.data || response.data?.airlines || [];
        
        // Create a map for quick lookup by IATA code and name
        airlines.forEach(airline => {
            // Index by IATA code (uppercase)
            if (airline.iata) {
                window.airlineDataCache[airline.iata.toUpperCase()] = airline;
            }
            // Index by name (uppercase) for flexible matching
            if (airline.name) {
                window.airlineDataCache[airline.name.toUpperCase()] = airline;
            }
        });
        
        console.log(`✈️ Airline data cache loaded: ${airlines.length} airlines`);
    } catch (error) {
        console.error('❌ Failed to load airline cache:', error);
    }
}

// Get airline logo by name or IATA code
function getAirlineLogo(airlineName) {
    if (!airlineName || !window.airlineDataCache) {
        return null;
    }
    
    const searchKey = airlineName.toUpperCase().trim();
    
    // Try exact match first (by name or IATA)
    let airline = window.airlineDataCache[searchKey];
    
    // If not found, try partial name matching
    if (!airline) {
        const cacheKeys = Object.keys(window.airlineDataCache);
        for (const key of cacheKeys) {
            const cachedAirline = window.airlineDataCache[key];
            // Check if the search term contains or is contained in the airline name
            if (cachedAirline.name && (
                cachedAirline.name.toUpperCase().includes(searchKey) || 
                searchKey.includes(cachedAirline.name.toUpperCase())
            )) {
                airline = cachedAirline;
                break;
            }
        }
    }
    
    // If still not found, try to extract IATA code from the airline name
    if (!airline) {
        const words = airlineName.split(/[\s-]/);
        for (const word of words) {
            const cleanWord = word.trim().toUpperCase();
            if (cleanWord.length === 2 && /^[A-Z]{2}$/.test(cleanWord)) {
                airline = window.airlineDataCache[cleanWord];
                if (airline) break;
            }
        }
    }
    
    return airline?.logo_cdn || null;
}

// Load airport data cache from API
async function loadAirportDataCache() {
    try {
        const response = await axios.get('/api/places?query=');
        // This will return empty since query is empty, so let's fetch all airports differently
        // For now, we'll load on-demand as needed
        console.log('✈️ Airport data cache ready');
    } catch (error) {
        console.error('Failed to load airport cache:', error);
    }
}

// Fetch airport data by IATA code
async function fetchAirportByCode(iataCode) {
    if (!iataCode) return null;
    
    // Check if already cached
    if (window.airportDataCache[iataCode]) {
        return window.airportDataCache[iataCode];
    }
    
    try {
        // Search for the airport by code
        const response = await axios.get(`/api/places?query=${iataCode}`);
        const airports = response.data.data || [];
        const airport = airports.find(a => a.iata_code === iataCode);
        
        if (airport) {
            // Cache it
            window.airportDataCache[iataCode] = airport;
            return airport;
        }
    } catch (error) {
        console.error(`Failed to fetch airport ${iataCode}:`, error);
    }
    
    return null;
}

// My Bookings Management System
class BookingsManager {
    constructor() {
        this.allBookings = [];
        this.currentBookings = [];
        this.previousBookings = [];
        this.activeTab = 'current';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.expandedBookings = new Set(); // Track expanded flight details
        this.init();
    }

    async init() {
        // Initialize navigation and sidebar
        initNavigation();
        initDashboardSidebar('bookings');

        // Load airport and airline data caches
        await loadAirportDataCache();
        await loadAirlineDataCache();

        this.setupEventListeners();
        await this.loadBookings();
    }

    setupEventListeners() {
        // Pagination controls
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');

        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderBookings();
                    // Scroll to top of page smoothly
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }

        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => {
                const maxPage = Math.ceil(this.totalItems / this.itemsPerPage);
                if (this.currentPage < maxPage) {
                    this.currentPage++;
                    this.renderBookings();
                    // Scroll to top of page smoothly
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }
    }

    async loadBookings(skip = 0, limit = 100) {
        try {
            this.showLoadingState();

            // Get authentication token from localStorage
            const token = localStorage.getItem('access_token');
            if (!token) {
                console.error('❌ No authentication token found');
                this.showToast('Please log in to view your bookings', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
                return;
            }

            console.log('🔑 Using auth token:', token.substring(0, 20) + '...');
            console.log('📤 Fetching bookings from API...');
            console.log('🎯 API URL:', `/api/bookings?skip=${skip}&limit=${limit}`);

            const response = await fetch(`/api/bookings?skip=${skip}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📥 API Response Status:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('❌ Authentication failed - redirecting to login');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_data');
                    this.showToast('Session expired. Please log in again.', 'error');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('� Full API Response:', JSON.stringify(data, null, 2));

            if (data.status === "true" && data.data && data.data.items) {
                console.log('✅ Found', data.data.items.length, 'bookings');
                this.allBookings = data.data.items;
                this.processBookings();
                this.renderBookings();
            } else {
                console.error('❌ Invalid API response structure:', data);
                this.hideLoadingState();
                this.showEmptyState();
            }

        } catch (error) {
            console.error('❌ Failed to load bookings:', error);
            this.hideLoadingState();
            this.showToast('Failed to load bookings. Please try again.', 'error');
            this.showEmptyState();
        }
    }

    processBookings() {
        // Separate bookings into current and previous based on status and date
        const now = new Date();

        this.currentBookings = this.allBookings.filter(booking => {
            const status = booking.status?.toLowerCase();
            return status === 'pending' || status === 'confirmed';
        });

        this.previousBookings = this.allBookings.filter(booking => {
            const status = booking.status?.toLowerCase();
            return status === 'completed' || status === 'cancelled' || status === 'flown';
        });
    }

    switchTab(tab) {
        this.activeTab = tab;
        this.currentPage = 1; // Reset to first page
        this.renderBookings();
    }

    renderBookings() {
        this.hideLoadingState();

        const container = document.getElementById('bookingsContainer');
        const emptyState = document.getElementById('emptyState');

        // Show all bookings (no tab filtering)
        const bookingsToShow = this.allBookings;
        this.totalItems = bookingsToShow.length;

        if (bookingsToShow.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            const pagination = document.getElementById('pagination');
            if (pagination) pagination.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedBookings = bookingsToShow.slice(startIndex, endIndex);

        // Render booking cards
        container.innerHTML = paginatedBookings.map(booking => this.renderBookingCard(booking)).join('');

        // Update pagination
        this.updatePagination();
    }

    renderBookingCard(booking) {
        const flightDetails = booking.provider_data?.flightDetails || {};
        const passengers = booking.provider_data?.passengers || [];
        const isExpanded = this.expandedBookings.has(booking.id);

        // Extract route information
        const route = flightDetails.route || 'Route not available';
        const airline = flightDetails.airline || 'Airline not available';
        const airlineCode = flightDetails.airlineCode || null; // Get airline IATA code
        const departureTime = flightDetails.departure || booking.created_at;

        // Format amount
        const amount = booking.provider_data?.amount || (booking.amount_cents / 100);
        const currency = booking.provider_data?.currency || booking.currency || 'USD';
        
        // Get airline logo - prefer airlineCode (IATA) if available, fallback to airline name
        const airlineLogo = airlineCode ? getAirlineLogo(airlineCode) : getAirlineLogo(airline);

        return `
            <div class="flight-card bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200">
                <div class="p-6">
                    <!-- Booking Header -->
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center space-x-4 text-sm text-gray-600">
                            <span><strong>Booking Id:</strong> ${booking.reference_id}</span>
                            <span><strong>PNR:</strong> ${this.extractPNR(booking)}</span>
                        </div>
                        
                        <div class="text-right flex items-center space-x-4">
                            <span class="text-sm text-gray-600">${this.getBookingType(booking)}</span>
                            <button onclick="bookingsManager.toggleDetails('${booking.id}')" 
                                    class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
                                Download Details
                                <i class="fas fa-chevron-down ml-2"></i>
                            </button>
                        </div>
                    </div>
                    <!-- Flight Details Section -->
                    <div class="mb-6">
                        <h4 class="text-sm font-bold text-gray-900 mb-4 pb-4 border-b border-dashed border-gray-300">Flight Details</h4>
                        
                        <!-- Flight Route -->
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-4 w-full">
                                <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    ${airlineLogo 
                                        ? `<img src="${airlineLogo}" alt="${airline}" class="w-6 h-6 object-contain" onerror="this.outerHTML='<i class=\\'fas fa-plane text-yellow-600\\'></i>'">`
                                        : `<i class="fas fa-plane text-yellow-600"></i>`
                                    }
                                </div>
                                    <div class="flex items-center justify-between text-lg font-semibold mb-1 flex-1 w-full">
                                          <span class="flex items-center space-x-2">
                                            <span>${this.getRouteFromString(route).from}</span>
                                            <i class="fas fa-plane text-gray-400"></i>
                                            <span>${this.getRouteFromString(route).to}</span>
                                        </span>
                                        <span class="text-sm text-gray-600">${new Date(departureTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span class="text-sm text-gray-600 font-normal">${this.formatTime(departureTime)} - ${this.calculateArrivalTime(departureTime)}</span>
                                            <span class="text-sm text-gray-600 font-normal">Economy</span>
                                            <span class="text-sm text-gray-600 font-normal">${this.getPassengerSummary(passengers)}</span>
                                            <span class="status-badge ${booking.status?.toLowerCase() || 'pending'} text-xs">${this.formatStatus(booking.status)}</span>
                                    </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Payment Summary -->
                    <div class="flex justify-between items-center pt-4 border-t border-dashed border-gray-300">
                        <div class="text-lg font-semibold">
                            Total: ${currency.toUpperCase()} ${amount.toFixed ? amount.toFixed(2) : amount}
                        </div>
                        
                        <div class="flex items-center space-x-2">
                            <span class="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full">Paid</span>
                            <button onclick="bookingsManager.toggleFlightDetails('${booking.id}')" 
                                    class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
                                Flight Details
                                <i class="fas fa-chevron-${isExpanded ? 'up' : 'down'} ml-2"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Expandable Flight Details -->
                    ${isExpanded ? this.renderExpandedFlightDetails(booking) : ''}
                </div>
            </div>
        `;
    }

    renderExpandedFlightDetails(booking) {
        const flightDetails = booking.provider_data?.flightDetails || {};
        const passengers = booking.provider_data?.passengers || [];
        const route = this.getRouteFromString(flightDetails.route || 'DAC → CXB');

        return `
            <div class="mt-6 pt-6 border-t border-gray-200 bg-gray-50 rounded-lg p-6">
                <!-- Flight Details Tabs -->
                <div class="flex space-x-8 mb-8">
                    <button class="flight-details-tab active pb-3 text-base font-medium border-b-2 border-red-600 text-black">Flight Details</button>
                    <button class="flight-details-tab pb-3 text-base font-medium text-gray-500 hover:text-gray-700">Baggage</button>
                    <button class="flight-details-tab pb-3 text-base font-medium text-gray-500 hover:text-gray-700">Policy</button>
                </div>
                
                <!-- Flight Route Header -->
                <div class="mb-6">
                    <div class="flex items-center mb-8">
                        <div class="w-3 h-3 bg-red-600 rounded-full mr-3"></div>
                        <h5 class="text-lg font-semibold text-red-600">${route.from} - ${route.to} (Depart)</h5>
                    </div>
                    
                    <!-- Flight Timeline -->
                    <div class="relative">
                        <!-- Departure -->
                        <div class="relative flex items-center mb-8">
                            <div class="flex items-center w-full">
                                <!-- Left: Time & Date -->
                                <div style="width: 35%;" class="text-right pr-6">
                                    <div class="text-3xl font-bold text-black mb-1">${this.formatTime(flightDetails.departure)}</div>
                                    <div class="text-sm text-gray-600">${this.formatFullDate(flightDetails.departure)}</div>
                                </div>
                                
                                <!-- Center: Location Icon with Line -->
                                <div class="flex justify-center relative" style="width: 30%;">
                                    <div class="w-3 h-3 bg-gray-400 rounded-full border-2 border-white shadow-sm relative z-10"></div>
                                    <!-- Vertical Line from departure -->
                                    <div class="absolute w-0.5 bg-gray-300 left-1/2 transform -translate-x-1/2 top-3 h-24 z-0"></div>
                                </div>
                                
                                <!-- Right: Location Details -->
                                <div style="width: 35%;" class="pl-6">
                                    <div class="text-lg font-semibold text-black">Departure, ${this.getCityName(route.from)}</div>
                                    <div class="text-sm text-gray-600">${route.from} - ${this.getAirportName(route.from)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Flight Info in Center -->
                        <div class="relative flex items-center mb-8">
                            <div class="flex items-center w-full">
                                <!-- Left: Economy Class -->
                                <div style="width: 35%;" class="text-right pr-6">
                                    <div class="text-red-600 font-semibold">Economy (S)</div>
                                    <div class="text-sm text-gray-600">2A 441</div>
                                </div>
                                
                                <!-- Center: Airplane Icon -->
                                <div class="flex justify-center relative" style="width: 30%;">
                                    <div class="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm relative z-10">
                                        <i class="fas fa-plane text-yellow-600 text-xs"></i>
                                    </div>
                                    <!-- Continue line through airplane -->
                                    <div class="absolute w-0.5 bg-gray-300 left-1/2 transform -translate-x-1/2 -top-6 h-12 z-0"></div>
                                    <div class="absolute w-0.5 bg-gray-300 left-1/2 transform -translate-x-1/2 top-6 h-12 z-0"></div>
                                </div>
                                
                                <!-- Right: Airline Info -->
                                <div style="width: 35%;" class="pl-6">
                                    <div class="font-semibold text-black">${flightDetails.airline || 'Air Astra'}</div>
                                    <div class="text-sm text-gray-600">ATR 72</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Arrival -->
                        <div class="relative flex items-center">
                            <div class="flex items-center w-full">
                                <!-- Left: Time & Date -->
                                <div style="width: 35%;" class="text-right pr-6">
                                    <div class="text-3xl font-bold text-black mb-1">${this.calculateArrivalTime(flightDetails.departure)}</div>
                                    <div class="text-sm text-gray-600">${this.formatFullDate(flightDetails.departure)}</div>
                                </div>
                                
                                <!-- Center: Location Icon -->
                                <div class="flex justify-center relative" style="width: 30%;">
                                    <div class="w-3 h-3 bg-gray-400 rounded-full border-2 border-white shadow-sm relative z-10"></div>
                                    <!-- Line coming to arrival -->
                                    <div class="absolute w-0.5 bg-gray-300 left-1/2 transform -translate-x-1/2 -top-6 h-9 z-0"></div>
                                </div>
                                
                                <!-- Right: Location Details -->
                                <div style="width: 35%;" class="pl-6">
                                    <div class="text-lg font-semibold text-black">Arrival, ${this.getCityName(route.to)}</div>
                                    <div class="text-sm text-gray-600">${route.to} - ${this.getAirportName(route.to)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    formatFullDate(dateString) {
        if (!dateString) return '10 Oct, Friday';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            weekday: 'long'
        });
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

    toggleFlightDetails(bookingId) {
        if (this.expandedBookings.has(bookingId)) {
            this.expandedBookings.delete(bookingId);
        } else {
            this.expandedBookings.add(bookingId);
        }
        this.renderBookings();
    }

    toggleDetails(bookingId) {
        console.log('Download details for booking:', bookingId);
        this.showToast('Download feature coming soon!', 'info');
    }

    updatePagination() {
        const pagination = document.getElementById('pagination');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageNumbers = document.getElementById('pageNumbers');

        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

        if (totalPages <= 1) {
            pagination.classList.add('hidden');
            return;
        }

        pagination.classList.remove('hidden');

        // Update prev/next buttons
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages;

        // Generate page numbers
        pageNumbers.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const button = document.createElement('button');
                button.className = `px-3 py-2 text-sm ${i === this.currentPage ? 'bg-red-600 text-white' : 'text-gray-500 bg-white hover:bg-gray-50'} border border-gray-300 rounded-md`;
                button.textContent = i;
                button.onclick = () => {
                    this.currentPage = i;
                    this.renderBookings();
                    // Scroll to top of page smoothly
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };
                pageNumbers.appendChild(button);
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                const span = document.createElement('span');
                span.className = 'px-2 py-2 text-gray-500';
                span.textContent = '...';
                pageNumbers.appendChild(span);
            }
        }
    }

    showLoadingState() {
        document.getElementById('loadingBookings').style.display = 'flex';
        document.getElementById('bookingsContainer').innerHTML = '';
        document.getElementById('emptyState').classList.add('hidden');
    }

    hideLoadingState() {
        document.getElementById('loadingBookings').style.display = 'none';
    }

    showEmptyState() {
        document.getElementById('emptyState').classList.remove('hidden');
        document.getElementById('bookingsContainer').innerHTML = '';
        document.getElementById('pagination').classList.add('hidden');
    }

    // Utility methods for data extraction and formatting
    extractPNR(booking) {
        return booking.reference_id?.split('-')[1]?.substring(0, 6) || '00H0XU';
    }

    getBookingType(booking) {
        return booking.booking_type === 'flight' ? 'OneWay' : booking.booking_type;
    }

    getRouteFromString(routeString) {
        const parts = routeString.split('→').map(s => s.trim());
        return {
            from: parts[0] || 'DAC',
            to: parts[1] || 'CXB'
        };
    }

    async getCityName(code) {
        // Check if airport data is cached
        if (window.airportDataCache && window.airportDataCache[code]) {
            return window.airportDataCache[code].city;
        }
        
        // Fetch from API
        const airport = await fetchAirportByCode(code);
        return airport ? airport.city : code;
    }

    async getAirportName(code) {
        // Check if airport data is cached
        if (window.airportDataCache && window.airportDataCache[code]) {
            const airport = window.airportDataCache[code];
            return `${airport.name}, ${airport.country}`;
        }
        
        // Fetch from API
        const airport = await fetchAirportByCode(code);
        return airport ? `${airport.name}, ${airport.country}` : `${code} Airport`;
    }

    calculateArrivalTime(departureTime) {
        if (!departureTime) return '08:35';

        const departure = new Date(departureTime);
        departure.setHours(departure.getHours() + 1, departure.getMinutes() + 5); // Add 1hr 5min

        return departure.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    getPassengerSummary(passengers) {
        if (!passengers || passengers.length === 0) return '1 Adult';

        const adults = passengers.filter(p => p.type === 'adult' || !p.type).length;
        const children = passengers.filter(p => p.type === 'child').length;

        let summary = '';
        if (adults > 0) summary += `${adults} Adult${adults > 1 ? 's' : ''}`;
        if (children > 0) summary += `${summary ? ', ' : ''}${children} Child${children > 1 ? 'ren' : ''}`;

        return summary || '1 Adult';
    }

    getBaseUrl() {
        return 'https://api.tripzip.ai'; // From .env API_BASE_URL
    }

    formatStatus(status) {
        if (!status) return 'Pending';
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
        if (!timeString) return '07:30';

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

        return '07:30';
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

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';

        toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md transition-all duration-300`;
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
                toast.classList.add('opacity-0', 'transform', 'translate-x-full');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 3000);
    }
}

// Initialize bookings manager when page loads
let bookingsManager;
document.addEventListener('DOMContentLoaded', () => {
    bookingsManager = new BookingsManager();
});