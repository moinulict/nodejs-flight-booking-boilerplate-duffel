// Flight search and display functionality
let selectedOffer = null;
let allFlights = [];
let filteredFlights = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Flights page loaded, initializing...');
    
    // Initialize airport dropdowns
    initializeAirportDropdowns();
    
    // Initialize from URL parameters
    await initializeFromURL();
    
    // Wait a moment for airport data to be set, then trigger search
    setTimeout(() => {
        console.log('🔍 Triggering automatic search...');
        performSearch();
    }, 1000);
    
    // Event listeners
    document.getElementById('flightSearchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        performSearch();
    });

    // Trip type change handler
    document.querySelectorAll('input[name="tripType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const returnDateContainer = document.getElementById('returnDateContainer');
            if (this.value === 'roundTrip') {
                returnDateContainer.classList.remove('hidden');
            } else {
                returnDateContainer.classList.add('hidden');
                document.getElementById('returnDate').value = '';
            }
        });
    });

    // Sort and filter handlers
    document.getElementById('sortBy').addEventListener('change', applyFilters);
    document.getElementById('maxStops').addEventListener('change', applyFilters);
    document.getElementById('priceRange').addEventListener('input', function() {
        document.getElementById('priceValue').textContent = '$' + this.value;
        applyFilters();
    });
    
    // Airline filter checkboxes will be added dynamically
});

function setPassengerCount(type, count) {
    const countElement = document.getElementById(`${type}Count`);
    if (countElement) {
        countElement.textContent = count;
        
        // Store count as data attribute for easy access
        countElement.setAttribute('data-count', count);
        
        console.log(`Set ${type} count to:`, count);
    }
}

function updatePassengerSummary() {
let selectedOffer = null;
let allFlights = [];
let filteredFlights = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize search form from URL parameters
    initializeFromURL();
    
    // Set up event listeners
    setupEventListeners();
    
    // Perform search if parameters are present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('departure_id') && urlParams.has('arrival_id')) {
        performSearch();
    }
});

function initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Set trip type
    const tripType = urlParams.get('type') === '2' ? 'roundTrip' : 'oneWay';
    document.querySelector(`input[name="tripType"][value="${tripType}"]`).checked = true;
    
    // Set origin and destination
    const departureId = urlParams.get('departure_id');
    const arrivalId = urlParams.get('arrival_id');
    
    if (departureId) {
        setAirportFromCode(departureId, 'origin');
    }
    
    if (arrivalId) {
        setAirportFromCode(arrivalId, 'destination');
    }
    
    // Set dates
    const outboundDate = urlParams.get('outbound_date');
    if (outboundDate) {
        document.getElementById('departureDate').value = outboundDate;
    }
    
    const returnDate = urlParams.get('return_date');
    if (returnDate && tripType === 'roundTrip') {
        document.getElementById('returnDate').value = returnDate;
        document.getElementById('returnDateContainer').classList.remove('hidden');
    }
    
    // Set passengers
    const adults = parseInt(urlParams.get('adults')) || 1;
    const children = parseInt(urlParams.get('children')) || 0;
    const infants = parseInt(urlParams.get('infants')) || 0;
    
    setPassengerCount('adults', adults);
    setPassengerCount('children', children);
    setPassengerCount('infants', infants);
    
    // Update passenger summary
    updatePassengerSummary();
}

async function setAirportFromCode(code, inputId) {
    try {
        console.log(`🔍 Setting airport from code: ${code} for input: ${inputId}`);
        
        // First try to find in local database
        const response = await axios.get(`/api/places?query=${code}`);
        const places = response.data;
        
        console.log(`📍 Found ${places.length} places for code ${code}:`, places);
        
        const airport = places.find(p => p.iata_code === code);
        if (airport) {
            const input = document.getElementById(inputId);
            if (input) {
                const displayText = `${airport.name} (${airport.iata_code})`;
                input.value = displayText;
                input.setAttribute('data-iata', airport.iata_code);
                input.setAttribute('data-city', airport.iata_code);
                input.setAttribute('data-type', 'airport');
                
                console.log(`✅ Set ${inputId}:`, {
                    value: displayText,
                    iata: airport.iata_code
                });
            } else {
                console.error(`❌ Input element not found: ${inputId}`);
            }
        } else {
            console.warn(`⚠️  Airport not found for code: ${code}`);
        }
    } catch (error) {
        console.error('❌ Error setting airport from code:', error);
    }
}

function setupEventListeners() {
    // Search form submission
    document.getElementById('flightSearchForm').addEventListener('submit', handleFlightSearch);
    
    // Trip type change
    document.querySelectorAll('input[name="tripType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const returnContainer = document.getElementById('returnDateContainer');
            if (this.value === 'roundTrip') {
                returnContainer.classList.remove('hidden');
            } else {
                returnContainer.classList.add('hidden');
            }
        });
    });
    
    // Passenger dropdown
    setupPassengerDropdown();
    
    // Airport search
    setupPlaceSearch('origin', 'originSuggestions');
    setupPlaceSearch('destination', 'destinationSuggestions');
    
    // Filter event listeners
    setupFilterListeners();
    
    // Booking modal
    setupBookingModal();
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];
    document.getElementById('departureDate').value = defaultDate;
}

function setupFilterListeners() {
    // Price range filters
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    
    priceMin.addEventListener('input', updatePriceRange);
    priceMax.addEventListener('input', updatePriceRange);
    
    // Stops filters
    document.querySelectorAll('.stops-filter').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
}

async function handleFlightSearch(e) {
    e.preventDefault();
    
    const origin = document.getElementById('origin').getAttribute('data-iata');
    const destination = document.getElementById('destination').getAttribute('data-iata');
    const departureDate = document.getElementById('departureDate').value;
    const tripType = document.querySelector('input[name="tripType"]:checked').value;
    const returnDate = tripType === 'roundTrip' ? document.getElementById('returnDate').value : null;
    
    if (!origin || !destination || !departureDate) {
        showError('Please fill in all required fields');
        return;
    }
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    params.set('type', tripType === 'roundTrip' ? '2' : '1');
    params.set('departure_id', origin);
    params.set('arrival_id', destination);
    params.set('outbound_date', departureDate);
    if (returnDate) {
        params.set('return_date', returnDate);
    }
    params.set('adults', getPassengerCount('adults'));
    params.set('travel_class', '1'); // Economy
    params.set('fare_type', '1'); // Regular
    
    // Update URL without page reload
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
    
    // Perform the search
    await performSearch();
}

async function performSearch() {
    const origin = document.getElementById('origin').getAttribute('data-iata');
    const destination = document.getElementById('destination').getAttribute('data-iata');
    const departureDate = document.getElementById('departureDate').value;
    const tripType = document.querySelector('input[name="tripType"]:checked').value;
    const returnDate = tripType === 'roundTrip' ? document.getElementById('returnDate').value : null;
    
    if (!origin || !destination || !departureDate) {
        return;
    }
    
    showLoading(true);
    hideResults();
    
    try {
        const passengers = buildPassengerArray();
        
        const searchData = {
            origin,
            destination,
            departureDate,
            returnDate,
            passengers,
            cabinClass: 'economy'
        };
        
        const response = await axios.post('/api/search-flights', searchData);
        
        if (response.data && response.data.length > 0) {
            allFlights = response.data;
            filteredFlights = [...allFlights];
            displayFlightResults(filteredFlights);
            setupFilters(filteredFlights);
            showResults();
        } else {
            showNoResults();
        }
        
    } catch (error) {
        console.error('Search error:', error);
        showError('Failed to search flights. Please try again.');
        showNoResults();
    } finally {
        showLoading(false);
    }
}

function displayFlightResults(flights) {
    const resultsContainer = document.getElementById('flightResults');
    const resultsHeader = document.getElementById('resultsHeader');
    
    // Update results header
    const airlineCount = new Set(flights.map(f => f.slices[0].segments[0].marketing_carrier.name)).size;
    resultsHeader.querySelector('h2').textContent = `Showing ${flights.length} Flights & ${airlineCount} Airlines`;
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Setup filters
    setupFilters(flights);
    
    // Generate flight cards
    flights.forEach(flight => {
        const flightCard = createFlightCard(flight);
        resultsContainer.appendChild(flightCard);
    });
}

function createFlightCard(flight) {
    const slice = flight.slices[0];
    const segment = slice.segments[0];
    const lastSegment = slice.segments[slice.segments.length - 1];
    
    const stops = slice.segments.length - 1;
    const duration = slice.duration;
    
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200';
    
    card.innerHTML = `
        <div class="flex justify-between items-center">
            <div class="flex-1">
                <div class="flex items-center space-x-6">
                    <!-- Airline -->
                    <div class="flex items-center space-x-2">
                        <img src="https://images.kiwi.com/airlines/64/${segment.marketing_carrier.iata_code}.png" 
                             alt="${segment.marketing_carrier.name}" class="w-8 h-8" 
                             onerror="this.style.display='none'">
                        <span class="font-medium text-gray-800">${segment.marketing_carrier.name}</span>
                    </div>
                    
                    <!-- Flight Times -->
                    <div class="flex items-center space-x-4 flex-1">
                        <div class="text-center">
                            <div class="text-xl font-bold text-gray-800">${moment(segment.departing_at).format('HH:mm')}</div>
                            <div class="text-sm text-gray-600">${segment.origin.iata_code}</div>
                        </div>
                        
                        <div class="flex-1 relative">
                            <div class="flex items-center justify-center">
                                <div class="flex-1 border-t-2 border-gray-300"></div>
                                <div class="px-2 text-xs text-gray-500">${formatDuration(duration)}</div>
                                <div class="flex-1 border-t-2 border-gray-300"></div>
                            </div>
                            <div class="text-center text-xs text-gray-500 mt-1">
                                ${stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}
                            </div>
                        </div>
                        
                        <div class="text-center">
                            <div class="text-xl font-bold text-gray-800">${moment(lastSegment.arriving_at).format('HH:mm')}</div>
                            <div class="text-sm text-gray-600">${lastSegment.destination.iata_code}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Price and Book Button -->
            <div class="text-right ml-6">
                <div class="text-2xl font-bold text-green-600 mb-2">
                    ${flight.total_currency} ${parseFloat(flight.total_amount).toLocaleString()}
                </div>
                <button onclick="openBookingModal('${flight.id}')" 
                        class="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition duration-200 font-medium">
                    Book Now
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function formatDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return duration;
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

function setupFilters(flights) {
    setupAirlinesFilter(flights);
}

function setupAirlinesFilter(flights) {
    const airlines = {};
    
    flights.forEach(flight => {
        const carrier = flight.slices[0].segments[0].marketing_carrier;
        const airlineName = carrier.name;
        const airlineCode = carrier.iata_code;
        
        if (!airlines[airlineName]) {
            airlines[airlineName] = {
                name: airlineName,
                code: airlineCode,
                count: 0
            };
        }
        airlines[airlineName].count++;
    });
    
    const airlinesFilter = document.getElementById('airlinesFilter');
    airlinesFilter.innerHTML = '';
    
    Object.values(airlines).forEach(airline => {
        const label = document.createElement('label');
        label.className = 'flex items-center justify-between';
        label.innerHTML = `
            <div class="flex items-center">
                <input type="checkbox" class="airline-filter mr-2 text-orange-600 focus:ring-orange-500" 
                       value="${airline.name}" checked>
                <span class="text-gray-700">${airline.name}</span>
            </div>
            <span class="text-sm text-gray-500">${airline.count}</span>
        `;
        
        label.querySelector('input').addEventListener('change', applyFilters);
        airlinesFilter.appendChild(label);
    });
}

function applyFilters() {
    const priceMin = parseInt(document.getElementById('priceMin').value);
    const priceMax = parseInt(document.getElementById('priceMax').value);
    
    const allowedStops = Array.from(document.querySelectorAll('.stops-filter:checked')).map(cb => cb.value);
    const allowedAirlines = Array.from(document.querySelectorAll('.airline-filter:checked')).map(cb => cb.value);
    
    filteredFlights = allFlights.filter(flight => {
        const price = parseFloat(flight.total_amount);
        const stops = flight.slices[0].segments.length - 1;
        const airlineName = flight.slices[0].segments[0].marketing_carrier.name;
        
        // Price filter
        if (price < priceMin || price > priceMax) return false;
        
        // Stops filter
        const stopsCategory = stops === 0 ? '0' : stops === 1 ? '1' : '2+';
        if (!allowedStops.includes(stopsCategory)) return false;
        
        // Airlines filter
        if (!allowedAirlines.includes(airlineName)) return false;
        
        return true;
    });
    
    displayFlightResults(filteredFlights);
    
    if (filteredFlights.length === 0) {
        showNoResults();
    } else {
        showResults();
    }
}

function updatePriceRange() {
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const priceMinValue = document.getElementById('priceMinValue');
    const priceMaxValue = document.getElementById('priceMaxValue');
    
    let minVal = parseInt(priceMin.value);
    let maxVal = parseInt(priceMax.value);
    
    if (minVal > maxVal - 100) {
        if (priceMin === document.activeElement) {
            maxVal = minVal + 100;
            priceMax.value = maxVal;
        } else {
            minVal = maxVal - 100;
            priceMin.value = minVal;
        }
    }
    
    priceMinValue.textContent = minVal.toLocaleString();
    priceMaxValue.textContent = maxVal.toLocaleString();
    
    applyFilters();
}

// Reset filter functions
function resetPriceFilter() {
    document.getElementById('priceMin').value = 0;
    document.getElementById('priceMax').value = 10000;
    updatePriceRange();
}

function resetStopsFilter() {
    document.querySelectorAll('.stops-filter').forEach(cb => cb.checked = true);
    applyFilters();
}

function resetAirlineFilters() {
    document.querySelectorAll('.airline-filter').forEach(cb => cb.checked = true);
    applyFilters();
}

// UI state management
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    loadingState.style.display = show ? 'block' : 'none';
}

function showResults() {
    document.getElementById('resultsHeader').classList.remove('hidden');
    document.getElementById('flightResults').classList.remove('hidden');
    document.getElementById('noResults').classList.add('hidden');
    document.getElementById('loadingState').style.display = 'none';
}

function hideResults() {
    document.getElementById('resultsHeader').classList.add('hidden');
    document.getElementById('flightResults').classList.add('hidden');
    document.getElementById('noResults').classList.add('hidden');
}

function showNoResults() {
    document.getElementById('resultsHeader').classList.add('hidden');
    document.getElementById('flightResults').classList.add('hidden');
    document.getElementById('noResults').classList.remove('hidden');
    document.getElementById('loadingState').style.display = 'none';
}

function showError(message) {
    alert(message); // Simple error handling - could be enhanced with better UI
}

// Include all the existing functions from app.js for passenger management, place search, and booking
// ... (I'll include the essential functions here)

// Passenger management functions
let passengerCounts = { adults: 1, children: 0, infants: 0 };

function setupPassengerDropdown() {
    const dropdown = document.getElementById('passengerDropdown');
    const menu = document.getElementById('passengerMenu');
    
    dropdown.addEventListener('click', function(e) {
        e.preventDefault();
        menu.classList.toggle('hidden');
    });
    
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
}

function incrementPassenger(type) {
    const totalPassengers = passengerCounts.adults + passengerCounts.children + passengerCounts.infants;
    if (totalPassengers >= 9) return;
    
    if (type === 'infants' && passengerCounts.infants >= passengerCounts.adults) return;
    
    passengerCounts[type]++;
    updatePassengerDisplay();
    updatePassengerSummary();
}

function decrementPassenger(type) {
    if (type === 'adults' && passengerCounts.adults <= 1) return;
    if (passengerCounts[type] <= 0) return;
    
    passengerCounts[type]--;
    updatePassengerDisplay();
    updatePassengerSummary();
}

function updatePassengerDisplay() {
    document.getElementById('adultsCount').textContent = passengerCounts.adults;
    document.getElementById('childrenCount').textContent = passengerCounts.children;
    document.getElementById('infantsCount').textContent = passengerCounts.infants;
}

function setPassengerCount(type, count) {
    const countElement = document.getElementById(`${type}Count`);
    if (countElement) {
        countElement.textContent = count;
        
        // Store count as data attribute for easy access
        countElement.setAttribute('data-count', count);
        
        console.log(`Set ${type} count to:`, count);
    }
}

function updatePassengerSummary() {
    const total = passengerCounts.adults + passengerCounts.children + passengerCounts.infants;
    let summary = '';
    
    if (passengerCounts.adults > 0) {
        summary += `${passengerCounts.adults} Adult${passengerCounts.adults > 1 ? 's' : ''}`;
    }
    if (passengerCounts.children > 0) {
        if (summary) summary += ', ';
        summary += `${passengerCounts.children} Child${passengerCounts.children > 1 ? 'ren' : ''}`;
    }
    if (passengerCounts.infants > 0) {
        if (summary) summary += ', ';
        summary += `${passengerCounts.infants} Infant${passengerCounts.infants > 1 ? 's' : ''}`;
    }
    
    document.getElementById('passengerSummary').textContent = summary;
}

function getPassengerCount(type) {
    return passengerCounts[type];
}

function setPassengerCount(type, count) {
    passengerCounts[type] = count;
    updatePassengerDisplay();
    updatePassengerSummary();
}

function buildPassengerArray() {
    const passengers = [];
    
    for (let i = 0; i < passengerCounts.adults; i++) {
        passengers.push({ type: 'adult' });
    }
    for (let i = 0; i < passengerCounts.children; i++) {
        passengers.push({ type: 'child' });
    }
    for (let i = 0; i < passengerCounts.infants; i++) {
        passengers.push({ type: 'infant_without_seat' });
    }
    
    return passengers;
}

// Place search functionality
function setupPlaceSearch(inputId, suggestionsId) {
    const input = document.getElementById(inputId);
    const suggestionsDiv = document.getElementById(suggestionsId);
    
    let searchTimeout;
    
    input.addEventListener('input', function() {
        const query = this.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length === 0) {
            showPopularDestinations(suggestionsDiv, input);
            return;
        }
        
        if (query.length < 2) {
            suggestionsDiv.classList.add('hidden');
            return;
        }
        
        searchTimeout = setTimeout(() => {
            searchPlaces(query, suggestionsDiv, input);
        }, 300);
    });
    
    input.addEventListener('focus', function() {
        if (this.value.length === 0) {
            showPopularDestinations(suggestionsDiv, input);
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.classList.add('hidden');
        }
    });
}

async function searchPlaces(query, suggestionsDiv, input) {
    try {
        const response = await axios.get(`/api/places?query=${encodeURIComponent(query)}`);
        const places = response.data || [];
        
        displayPlaceSuggestions(places, suggestionsDiv, input);
    } catch (error) {
        console.error('Place search error:', error);
        suggestionsDiv.classList.add('hidden');
    }
}

function displayPlaceSuggestions(places, suggestionsDiv, input) {
    if (places.length === 0) {
        suggestionsDiv.classList.add('hidden');
        return;
    }

    const html = places.map(place => {
        const displayText = place.name;
        const subText = `${place.iata_code} • ${place.city}, ${place.country}`;
        
        return `
            <div class="place-suggestion p-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center space-x-3" 
                 onclick="selectPlace('${place.iata_code}', '${escapeHtml(displayText)}', '${place.iata_code}', '${input.id}', '${suggestionsDiv.id}', '${place.type}')">
                <div class="flex-shrink-0">
                    <i class="fas fa-plane text-gray-400"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                        <div class="font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(displayText)}</div>
                        <span class="place-type-badge airport-badge flex-shrink-0">Airport</span>
                    </div>
                    <div class="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(subText)}</div>
                </div>
            </div>
        `;
    }).join('');

    suggestionsDiv.innerHTML = html;
    suggestionsDiv.classList.remove('hidden');
}

function selectPlace(iataCode, name, cityCode, inputId, suggestionsId, type) {
    const input = document.getElementById(inputId);
    const suggestionsDiv = document.getElementById(suggestionsId);
    
    const displayText = `${name} (${iataCode})`;
    
    input.value = displayText;
    input.setAttribute('data-iata', iataCode);
    input.setAttribute('data-city', cityCode);
    input.setAttribute('data-type', type);
    suggestionsDiv.classList.add('hidden');
}

function showPopularDestinations(suggestionsDiv, input) {
    const popularAirports = [
        { name: 'London Heathrow Airport', iata_code: 'LHR', type: 'airport', city: 'London', country: 'United Kingdom' },
        { name: 'John F. Kennedy International Airport', iata_code: 'JFK', type: 'airport', city: 'New York', country: 'United States' },
        { name: 'Charles de Gaulle Airport', iata_code: 'CDG', type: 'airport', city: 'Paris', country: 'France' },
        { name: 'Dubai International Airport', iata_code: 'DXB', type: 'airport', city: 'Dubai', country: 'United Arab Emirates' }
    ];

    const html = `
        <div class="p-2 bg-gray-50 border-b border-gray-200">
            <div class="text-xs text-gray-500 font-medium">Popular Airports</div>
        </div>
    ` + popularAirports.map(place => {
        return `
            <div class="place-suggestion p-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center space-x-3" 
                 onclick="selectPlace('${place.iata_code}', '${escapeHtml(place.name)}', '${place.iata_code}', '${input.id}', '${suggestionsDiv.id}', '${place.type}')">
                <div class="flex-shrink-0">
                    <i class="fas fa-plane text-gray-400"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                        <div class="font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(place.name)}</div>
                        <span class="place-type-badge airport-badge flex-shrink-0">Airport</span>
                    </div>
                    <div class="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">${place.iata_code} • ${place.city}, ${place.country}</div>
                </div>
            </div>
        `;
    }).join('');

    suggestionsDiv.innerHTML = html;
    suggestionsDiv.classList.remove('hidden');
}

function swapOriginDestination() {
    const origin = document.getElementById('origin');
    const destination = document.getElementById('destination');
    
    const tempValue = origin.value;
    const tempIata = origin.getAttribute('data-iata');
    const tempCity = origin.getAttribute('data-city');
    const tempType = origin.getAttribute('data-type');
    
    origin.value = destination.value;
    origin.setAttribute('data-iata', destination.getAttribute('data-iata') || '');
    origin.setAttribute('data-city', destination.getAttribute('data-city') || '');
    origin.setAttribute('data-type', destination.getAttribute('data-type') || '');
    
    destination.value = tempValue;
    destination.setAttribute('data-iata', tempIata || '');
    destination.setAttribute('data-city', tempCity || '');
    destination.setAttribute('data-type', tempType || '');
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Booking functionality (simplified for flights page)
function setupBookingModal() {
    const closeModal = document.getElementById('closeModal');
    const cancelBooking = document.getElementById('cancelBooking');
    const bookingForm = document.getElementById('bookingForm');
    
    closeModal.addEventListener('click', closeBookingModal);
    cancelBooking.addEventListener('click', closeBookingModal);
    bookingForm.addEventListener('submit', handleBookingSubmission);
}

function openBookingModal(offerId) {
    const flight = allFlights.find(f => f.id === offerId);
    if (!flight) return;
    
    selectedOffer = flight;
    
    const modal = document.getElementById('bookingModal');
    const selectedFlightInfo = document.getElementById('selectedFlightInfo');
    const passengerForms = document.getElementById('passengerForms');
    
    selectedFlightInfo.innerHTML = createSelectedFlightSummary(flight);
    passengerForms.innerHTML = createPassengerForms();
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function createSelectedFlightSummary(offer) {
    const slice = offer.slices[0];
    const segment = slice.segments[0];
    
    return `
        <h4 class="font-semibold text-gray-800 mb-2">Selected Flight</h4>
        <div class="flex justify-between items-center">
            <div>
                <div class="font-medium">${segment.origin.iata_code} → ${segment.destination.iata_code}</div>
                <div class="text-sm text-gray-600">
                    ${moment(segment.departing_at).format('MMM DD, YYYY HH:mm')} - 
                    ${moment(segment.arriving_at).format('HH:mm')}
                </div>
                <div class="text-sm text-gray-600">${segment.marketing_carrier.name}</div>
            </div>
            <div class="text-right">
                <div class="font-bold text-green-600">
                    ${offer.total_currency} ${parseFloat(offer.total_amount).toLocaleString()}
                </div>
            </div>
        </div>
    `;
}

function createPassengerForms() {
    const passengers = buildPassengerArray();
    
    return passengers.map((passenger, index) => `
        <div class="border border-gray-200 rounded-lg p-4">
            <h4 class="font-semibold text-gray-800 mb-4">
                Passenger ${index + 1} (${passenger.type.charAt(0).toUpperCase() + passenger.type.slice(1)})
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <select name="passengers[${index}].title"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select Title (Optional)</option>
                        <option value="mr">Mr</option>
                        <option value="ms">Ms</option>
                        <option value="mrs">Mrs</option>
                        <option value="miss">Miss</option>
                        <option value="dr">Dr</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input type="text" name="passengers[${index}].given_name" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Required">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input type="text" name="passengers[${index}].family_name" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Required">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <input type="date" name="passengers[${index}].born_on" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select name="passengers[${index}].gender"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select Gender (Optional)</option>
                        <option value="m">Male</option>
                        <option value="f">Female</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="passengers[${index}].email"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Optional">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" name="passengers[${index}].phone_number"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Optional">
                </div>
            </div>
            
            <input type="hidden" name="passengers[${index}].type" value="${passenger.type}">
        </div>
    `).join('');
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    selectedOffer = null;
}

async function handleBookingSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const passengers = [];
    
    const passengerCount = buildPassengerArray().length;
    
    for (let i = 0; i < passengerCount; i++) {
        const passengerData = {
            id: `passenger_${Date.now()}_${i}`,
            type: formData.get(`passengers[${i}].type`),
            given_name: formData.get(`passengers[${i}].given_name`),
            family_name: formData.get(`passengers[${i}].family_name`),
            born_on: formData.get(`passengers[${i}].born_on`)
        };
        
        const title = formData.get(`passengers[${i}].title`);
        if (title && title.trim()) {
            passengerData.title = title;
        }
        
        const gender = formData.get(`passengers[${i}].gender`);
        if (gender && gender.trim()) {
            passengerData.gender = gender;
        }
        
        const email = formData.get(`passengers[${i}].email`);
        if (email && email.trim()) {
            passengerData.email = email;
        }
        
        const phoneNumber = formData.get(`passengers[${i}].phone_number`);
        if (phoneNumber && phoneNumber.trim()) {
            passengerData.phone_number = phoneNumber;
        }
        
        passengers.push(passengerData);
    }
    
    try {
        showLoadingOverlay(true);
        
        const response = await axios.post('/api/book-flight', {
            offer_id: selectedOffer.id,
            passengers: passengers
        });
        
        showBookingConfirmation(response.data.data);
        closeBookingModal();
        
    } catch (error) {
        console.error('Booking error:', error);
        showError('Failed to complete booking. Please try again.');
    } finally {
        showLoadingOverlay(false);
    }
}

function showBookingConfirmation(orderData) {
    const confirmation = document.getElementById('bookingConfirmation');
    const details = document.getElementById('confirmationDetails');
    
    details.innerHTML = `
        <div class="text-left">
            <h3 class="font-semibold text-gray-800 mb-4">Booking Details</h3>
            <div class="space-y-2">
                <div><strong>Booking Reference:</strong> ${orderData.booking_reference}</div>
                <div><strong>Total Amount:</strong> ${orderData.total_currency} ${parseFloat(orderData.total_amount).toLocaleString()}</div>
                <div><strong>Status:</strong> <span class="text-green-600 font-medium">${orderData.live_mode ? 'Confirmed' : 'Test Booking'}</span></div>
            </div>
        </div>
    `;
    
    confirmation.classList.remove('hidden');
    
    setTimeout(() => {
        confirmation.classList.add('hidden');
    }, 5000);
}

function showLoadingOverlay(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}