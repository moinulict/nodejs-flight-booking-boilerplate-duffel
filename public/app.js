// Global variables
let selectedOffer = null;
let searchResults = null;
let passengerCounts = {
    adults: 1,
    children: 0,
    infants: 0
};
let selectedCabinClass = 'economy';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    setDefaultDates();
    updatePassengerDisplay();
    updateTripTypeDisplay();
});

function initializeForm() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('departureDate').setAttribute('min', today);
    document.getElementById('returnDate').setAttribute('min', today);
}

function setupEventListeners() {
    // Search form submission
    document.getElementById('searchForm').addEventListener('submit', handleFlightSearch);
    
    // Airport/place search with debouncing
    setupPlaceSearch('origin', 'originSuggestions');
    setupPlaceSearch('destination', 'destinationSuggestions');
    
    // Trip type radio buttons
    document.querySelectorAll('input[name="tripType"]').forEach(radio => {
        radio.addEventListener('change', updateTripTypeDisplay);
    });
    
    // Traveller dropdown button
    document.getElementById('travellerDropdownBtn').addEventListener('click', toggleTravellerDropdown);
    
    // Cabin class radio buttons
    document.querySelectorAll('input[name="cabinClass"]').forEach(radio => {
        radio.addEventListener('change', function() {
            selectedCabinClass = this.value;
            updateTravellerSummary();
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('travellerDropdown');
        const button = document.getElementById('travellerDropdownBtn');
        
        if (!dropdown.contains(e.target) && !button.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
    
    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeBookingModal);
    document.getElementById('cancelBooking').addEventListener('click', closeBookingModal);
    
    // Booking form submission
    document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmission);
    
    // Update return date minimum when departure date changes
    document.getElementById('departureDate').addEventListener('change', function() {
        const returnDateInput = document.getElementById('returnDate');
        returnDateInput.setAttribute('min', this.value);
        if (returnDateInput.value && returnDateInput.value < this.value) {
            returnDateInput.value = '';
        }
    });
}

function setDefaultDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    document.getElementById('departureDate').value = tomorrow.toISOString().split('T')[0];
}

function incrementPassenger(type) {
    const maxPassengers = {
        adults: 9,
        children: 8,
        infants: 8
    };
    
    if (passengerCounts[type] < maxPassengers[type]) {
        // Special rule: infants cannot exceed adults
        if (type === 'infants' && passengerCounts.infants >= passengerCounts.adults) {
            showError('Number of infants cannot exceed number of adults');
            return;
        }
        
        passengerCounts[type]++;
        updatePassengerDisplay();
    }
}

function decrementPassenger(type) {
    const minPassengers = {
        adults: 1,
        children: 0,
        infants: 0
    };
    
    if (passengerCounts[type] > minPassengers[type]) {
        passengerCounts[type]--;
        
        // If reducing adults, ensure infants don't exceed adults
        if (type === 'adults' && passengerCounts.infants > passengerCounts.adults) {
            passengerCounts.infants = passengerCounts.adults;
        }
        
        updatePassengerDisplay();
    }
}

function updatePassengerDisplay() {
    // Update dropdown display counts
    document.getElementById('adultsCountDropdown').textContent = passengerCounts.adults;
    document.getElementById('childrenCountDropdown').textContent = passengerCounts.children;
    document.getElementById('infantsCountDropdown').textContent = passengerCounts.infants;
    
    // Update traveller summary in main form
    updateTravellerSummary();
    
    // Update button states
    updateButtonStates();
}

function updatePassengerSummary() {
    const summaryParts = [];
    
    if (passengerCounts.adults > 0) {
        summaryParts.push(`${passengerCounts.adults} ${passengerCounts.adults === 1 ? 'Adult' : 'Adults'}`);
    }
    
    if (passengerCounts.children > 0) {
        summaryParts.push(`${passengerCounts.children} ${passengerCounts.children === 1 ? 'Child' : 'Children'}`);
    }
    
    if (passengerCounts.infants > 0) {
        summaryParts.push(`${passengerCounts.infants} ${passengerCounts.infants === 1 ? 'Infant' : 'Infants'}`);
    }
    
    const totalPassengers = passengerCounts.adults + passengerCounts.children + passengerCounts.infants;
    const summary = summaryParts.join(', ') + ` (${totalPassengers} total)`;
    
    document.getElementById('passengerSummary').textContent = summary;
}

function updateTravellerSummary() {
    const totalPassengers = passengerCounts.adults + passengerCounts.children + passengerCounts.infants;
    
    // Create summary text
    const summaryParts = [];
    if (passengerCounts.adults > 0) {
        summaryParts.push(`${passengerCounts.adults} ${passengerCounts.adults === 1 ? 'Adult' : 'Adults'}`);
    }
    if (passengerCounts.children > 0) {
        summaryParts.push(`${passengerCounts.children} ${passengerCounts.children === 1 ? 'Child' : 'Children'}`);
    }
    if (passengerCounts.infants > 0) {
        summaryParts.push(`${passengerCounts.infants} ${passengerCounts.infants === 1 ? 'Infant' : 'Infants'}`);
    }
    
    const travellerText = summaryParts.join(', ');
    document.getElementById('travellerSummaryInline').textContent = travellerText;
}

function updateTripTypeDisplay() {
    const tripType = document.querySelector('input[name="tripType"]:checked').value;
    const returnDateContainer = document.getElementById('returnDateContainer');
    
    if (tripType === 'oneWay') {
        returnDateContainer.style.display = 'none';
        document.getElementById('returnDate').value = '';
    } else {
        returnDateContainer.style.display = 'block';
    }
}

function swapOriginDestination() {
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');
    
    const tempValue = originInput.value;
    const tempIata = originInput.getAttribute('data-iata');
    const tempCity = originInput.getAttribute('data-city');
    const tempType = originInput.getAttribute('data-type');
    
    originInput.value = destinationInput.value;
    originInput.setAttribute('data-iata', destinationInput.getAttribute('data-iata') || '');
    originInput.setAttribute('data-city', destinationInput.getAttribute('data-city') || '');
    originInput.setAttribute('data-type', destinationInput.getAttribute('data-type') || '');
    
    destinationInput.value = tempValue;
    destinationInput.setAttribute('data-iata', tempIata || '');
    destinationInput.setAttribute('data-city', tempCity || '');
    destinationInput.setAttribute('data-type', tempType || '');
}

function toggleTravellerDropdown() {
    const dropdown = document.getElementById('travellerDropdown');
    dropdown.classList.toggle('hidden');
}

function closeTravellerDropdown() {
    document.getElementById('travellerDropdown').classList.add('hidden');
}

function updateButtonStates() {
    // Get modal buttons
    const adultsButtons = document.querySelectorAll('button[onclick*="adults"]');
    const childrenButtons = document.querySelectorAll('button[onclick*="children"]');
    const infantsButtons = document.querySelectorAll('button[onclick*="infants"]');
    
    // Adults - minimum 1, maximum 9
    adultsButtons.forEach(btn => {
        if (btn.onclick.toString().includes('decrement')) {
            btn.disabled = passengerCounts.adults <= 1;
        } else {
            btn.disabled = passengerCounts.adults >= 9;
        }
    });
    
    // Children - minimum 0, maximum 8
    childrenButtons.forEach(btn => {
        if (btn.onclick.toString().includes('decrement')) {
            btn.disabled = passengerCounts.children <= 0;
        } else {
            btn.disabled = passengerCounts.children >= 8;
        }
    });
    
    // Infants - minimum 0, maximum 8, cannot exceed adults
    infantsButtons.forEach(btn => {
        if (btn.onclick.toString().includes('decrement')) {
            btn.disabled = passengerCounts.infants <= 0;
        } else {
            btn.disabled = passengerCounts.infants >= 8 || passengerCounts.infants >= passengerCounts.adults;
        }
    });
}

function setupPlaceSearch(inputId, suggestionsId) {
    const input = document.getElementById(inputId);
    const suggestionsDiv = document.getElementById(suggestionsId);
    let debounceTimer;

    input.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        const query = this.value.trim();
        
        if (query.length === 0) {
            showPopularDestinations(suggestionsDiv, input);
            return;
        }
        
        if (query.length < 2) {
            suggestionsDiv.classList.add('hidden');
            return;
        }

        debounceTimer = setTimeout(() => {
            searchPlaces(query, suggestionsDiv, input);
        }, 300);
    });

    input.addEventListener('focus', function() {
        if (this.value.trim().length === 0) {
            showPopularDestinations(suggestionsDiv, input);
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.classList.add('hidden');
        }
    });
}

function showPopularDestinations(suggestionsDiv, input) {
    const popularAirports = [
        { name: 'London Heathrow Airport', iata_code: 'LHR', type: 'airport', city: 'London', country: 'United Kingdom' },
        { name: 'John F. Kennedy International Airport', iata_code: 'JFK', type: 'airport', city: 'New York', country: 'United States' },
        { name: 'Charles de Gaulle Airport', iata_code: 'CDG', type: 'airport', city: 'Paris', country: 'France' },
        { name: 'Dubai International Airport', iata_code: 'DXB', type: 'airport', city: 'Dubai', country: 'United Arab Emirates' },
        { name: 'Singapore Changi Airport', iata_code: 'SIN', type: 'airport', city: 'Singapore', country: 'Singapore' },
        { name: 'Los Angeles International Airport', iata_code: 'LAX', type: 'airport', city: 'Los Angeles', country: 'United States' },
        { name: 'Amsterdam Airport Schiphol', iata_code: 'AMS', type: 'airport', city: 'Amsterdam', country: 'Netherlands' },
        { name: 'Frankfurt Airport', iata_code: 'FRA', type: 'airport', city: 'Frankfurt', country: 'Germany' }
    ];

    const html = `
        <div class="p-2 bg-gray-50 border-b border-gray-200">
            <div class="text-xs text-gray-500 font-medium">Popular Airports</div>
        </div>
    ` + popularAirports.map(place => {
        const icon = 'fas fa-plane';
        const badgeClass = 'airport-badge';
        
        return `
            <div class="place-suggestion p-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center space-x-3" 
                 onclick="selectPlace('${place.iata_code}', '${escapeHtml(place.name)}', '${place.iata_code}', '${input.id}', '${suggestionsDiv.id}', '${place.type}')">
                <div class="flex-shrink-0">
                    <i class="${icon} text-gray-400"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                        <div class="font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(place.name)}</div>
                        <span class="place-type-badge ${badgeClass} flex-shrink-0">Airport</span>
                    </div>
                    <div class="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">${place.iata_code} • ${place.city}, ${place.country}</div>
                </div>
            </div>
        `;
    }).join('');

    suggestionsDiv.innerHTML = html;
    suggestionsDiv.classList.remove('hidden');
}

async function searchPlaces(query, suggestionsDiv, input) {
    try {
        console.log('🔍 Searching for:', query);
        const response = await axios.get(`/api/places?query=${encodeURIComponent(query)}`);
        const places = response.data.data || [];
        console.log('🛬 Found places:', places);
        
        displayPlaceSuggestions(places, suggestionsDiv, input);
    } catch (error) {
        console.error('Place search error:', error);
        suggestionsDiv.classList.add('hidden');
    }
}

function displayPlaceSuggestions(places, suggestionsDiv, input) {
    console.log('🎯 displayPlaceSuggestions called with:', places.length, 'places');
    console.log('📋 Places data:', places);
    
    if (places.length === 0) {
        suggestionsDiv.classList.add('hidden');
        return;
    }

    const html = places.map((place, index) => {
        // Only handle airports since we're filtering out cities
        const displayText = `${place.name}`;
        const subText = `${place.iata_code} • ${place.city}, ${place.country}`;
        const badgeClass = 'airport-badge';
        const icon = 'fas fa-plane';
        
        console.log(`🏢 Place ${index + 1}:`, {
            iata_code: place.iata_code,
            name: place.name,
            displayText,
            subText,
            type: place.type,
            inputId: input.id,
            suggestionsId: suggestionsDiv.id
        });
        
        const onclickHandler = `selectPlace('${place.iata_code}', '${escapeHtml(displayText)}', '${place.iata_code}', '${input.id}', '${suggestionsDiv.id}', '${place.type}')`;
        console.log(`🖱️  Click handler for ${place.name}:`, onclickHandler);
        
        return `
            <div class="place-suggestion p-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center space-x-3" 
                 onclick="${onclickHandler}">
                <div class="flex-shrink-0">
                    <i class="${icon} text-gray-400"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                        <div class="font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(displayText)}</div>
                        <span class="place-type-badge ${badgeClass} flex-shrink-0">Airport</span>
                    </div>
                    <div class="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(subText)}</div>
                </div>
            </div>
        `;
    }).join('');

    console.log('🎨 Generated HTML length:', html.length);
    suggestionsDiv.innerHTML = html;
    suggestionsDiv.classList.remove('hidden');
    console.log('✅ Suggestions displayed and made visible');
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

function getCountryName(countryCode) {
    const countries = {
        'US': 'United States',
        'GB': 'United Kingdom',
        'CA': 'Canada',
        'AU': 'Australia',
        'DE': 'Germany',
        'FR': 'France',
        'IT': 'Italy',
        'ES': 'Spain',
        'NL': 'Netherlands',
        'BE': 'Belgium',
        'CH': 'Switzerland',
        'AT': 'Austria',
        'SE': 'Sweden',
        'NO': 'Norway',
        'DK': 'Denmark',
        'FI': 'Finland',
        'IE': 'Ireland',
        'PT': 'Portugal',
        'GR': 'Greece',
        'TR': 'Turkey',
        'PL': 'Poland',
        'CZ': 'Czech Republic',
        'HU': 'Hungary',
        'RO': 'Romania',
        'BG': 'Bulgaria',
        'HR': 'Croatia',
        'SI': 'Slovenia',
        'SK': 'Slovakia',
        'LT': 'Lithuania',
        'LV': 'Latvia',
        'EE': 'Estonia',
        'JP': 'Japan',
        'KR': 'South Korea',
        'CN': 'China',
        'IN': 'India',
        'TH': 'Thailand',
        'SG': 'Singapore',
        'MY': 'Malaysia',
        'ID': 'Indonesia',
        'PH': 'Philippines',
        'VN': 'Vietnam',
        'BR': 'Brazil',
        'AR': 'Argentina',
        'MX': 'Mexico',
        'CL': 'Chile',
        'CO': 'Colombia',
        'PE': 'Peru',
        'UY': 'Uruguay',
        'ZA': 'South Africa',
        'EG': 'Egypt',
        'MA': 'Morocco',
        'KE': 'Kenya',
        'NG': 'Nigeria',
        'RU': 'Russia',
        'UA': 'Ukraine',
        'IL': 'Israel',
        'AE': 'UAE',
        'SA': 'Saudi Arabia',
        'QA': 'Qatar',
        'KW': 'Kuwait',
        'OM': 'Oman',
        'JO': 'Jordan',
        'LB': 'Lebanon',
        'NZ': 'New Zealand'
    };
    return countries[countryCode] || countryCode;
}

function selectPlace(iataCode, name, cityCode, inputId, suggestionsId, type) {
    console.log('🔍 selectPlace called with:', {
        iataCode,
        name,
        cityCode,
        inputId,
        suggestionsId,
        type
    });
    
    const input = document.getElementById(inputId);
    const suggestionsDiv = document.getElementById(suggestionsId);
    
    console.log('📝 Found elements:', {
        input: input ? 'found' : 'NOT FOUND',
        suggestionsDiv: suggestionsDiv ? 'found' : 'NOT FOUND'
    });
    
    if (!input) {
        console.error('❌ Input element not found:', inputId);
        return;
    }
    
    if (!suggestionsDiv) {
        console.error('❌ Suggestions div not found:', suggestionsId);
        return;
    }
    
    // Format the display text based on type
    let displayText = '';
    if (type === 'city') {
        displayText = `${name} (${iataCode})`;
    } else {
        displayText = `${name} (${iataCode})`;
    }
    
    console.log('💫 Setting values:', {
        displayText,
        previousValue: input.value,
        previousDataIata: input.getAttribute('data-iata')
    });
    
    input.value = displayText;
    input.setAttribute('data-iata', iataCode);
    input.setAttribute('data-city', cityCode);
    input.setAttribute('data-type', type);
    suggestionsDiv.classList.add('hidden');
    
    console.log('✅ Selection complete:', {
        newValue: input.value,
        newDataIata: input.getAttribute('data-iata'),
        newDataCity: input.getAttribute('data-city'),
        newDataType: input.getAttribute('data-type')
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

    // Build URL parameters for flights page
    const params = new URLSearchParams();
    params.set('type', tripType === 'roundTrip' ? '2' : '1');
    params.set('departure_id', origin);
    params.set('arrival_id', destination);
    params.set('outbound_date', departureDate);
    if (returnDate) {
        params.set('return_date', returnDate);
    }
    params.set('adults', passengerCounts.adults);
    if (passengerCounts.children > 0) {
        params.set('children', passengerCounts.children);
    }
    if (passengerCounts.infants > 0) {
        params.set('infants', passengerCounts.infants);
    }
    params.set('travel_class', '1'); // Economy
    params.set('fare_type', '1'); // Regular
    
    // Redirect to flights page with search parameters
    window.location.href = `/flights.html?${params.toString()}`;
}

function buildPassengerArray() {
    const passengers = [];
    
    // Add adults
    for (let i = 0; i < passengerCounts.adults; i++) {
        passengers.push({ type: 'adult' });
    }
    
    // Add children
    for (let i = 0; i < passengerCounts.children; i++) {
        passengers.push({ type: 'child' });
    }
    
    // Add infants
    for (let i = 0; i < passengerCounts.infants; i++) {
        passengers.push({ type: 'infant_without_seat' });
    }
    
    return passengers;
}

function displayFlightResults(offers) {
    const flightsList = document.getElementById('flightsList');
    const flightResults = document.getElementById('flightResults');
    
    // Store current flights for sorting
    currentFlights = offers || [];
    
    if (!offers || offers.length === 0) {
        flightsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-plane text-4xl mb-4"></i>
                <p>No flights found for your search criteria.</p>
            </div>
        `;
        flightResults.classList.remove('hidden');
        return;
    }

    // Initialize filters
    initializeFilters(offers);
    
    // Initial sort by price (cheapest first)
    sortFlights('price');
    flightResults.classList.remove('hidden');
}

function createFlightCard(offer) {
    const slice = offer.slices[0];
    const segment = slice.segments[0];
    
    const departureTime = moment(segment.departing_at).format('HH:mm');
    const arrivalTime = moment(segment.arriving_at).format('HH:mm');
    const departureDate = moment(segment.departing_at).format('MMM DD');
    const duration = moment.duration(slice.duration).humanize();
    
    const stops = slice.segments.length - 1;
    const stopText = stops === 0 ? 'Non-stop' : `${stops} stop${stops > 1 ? 's' : ''}`;
    
    return `
        <div class="flight-card bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center space-x-4 mb-4">
                        <div class="flex items-center space-x-2">
                            <img src="https://images.kiwi.com/airlines/64/${segment.marketing_carrier.iata_code}.png" 
                                 alt="${segment.marketing_carrier.name}" class="w-8 h-8" 
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iI0Y5RkFGQiIvPgo8cGF0aCBkPSJNMTYgOEwxOCAxNEgxMEwxNiA4WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K'">
                            <span class="font-medium text-gray-800">${segment.marketing_carrier.name}</span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4 items-center">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-gray-800">${departureTime}</div>
                            <div class="text-sm text-gray-600">${segment.origin.iata_code}</div>
                            <div class="text-xs text-gray-500">${departureDate}</div>
                        </div>
                        
                        <div class="text-center">
                            <div class="text-sm text-gray-600 mb-1">${duration}</div>
                            <div class="flex items-center justify-center">
                                <div class="w-16 h-px bg-gray-300"></div>
                                <i class="fas fa-plane text-gray-400 mx-2"></i>
                                <div class="w-16 h-px bg-gray-300"></div>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">${stopText}</div>
                        </div>
                        
                        <div class="text-center">
                            <div class="text-2xl font-bold text-gray-800">${arrivalTime}</div>
                            <div class="text-sm text-gray-600">${segment.destination.iata_code}</div>
                            <div class="text-xs text-gray-500">${departureDate}</div>
                        </div>
                    </div>
                </div>
                
                <div class="text-right ml-6">
                    <div class="text-2xl font-bold text-green-600 mb-2">
                        ${offer.total_currency} ${parseFloat(offer.total_amount).toLocaleString()}
                    </div>
                    <button onclick="selectFlight('${offer.id}')" 
                            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200">
                        Select Flight
                    </button>
                </div>
            </div>
            
            ${offer.slices.length > 1 ? createReturnFlightInfo(offer.slices[1]) : ''}
        </div>
    `;
}

function createReturnFlightInfo(returnSlice) {
    const segment = returnSlice.segments[0];
    const departureTime = moment(segment.departing_at).format('HH:mm');
    const arrivalTime = moment(segment.arriving_at).format('HH:mm');
    const departureDate = moment(segment.departing_at).format('MMM DD');
    const duration = moment.duration(returnSlice.duration).humanize();
    
    const stops = returnSlice.segments.length - 1;
    const stopText = stops === 0 ? 'Non-stop' : `${stops} stop${stops > 1 ? 's' : ''}`;
    
    return `
        <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="text-sm text-gray-600 mb-2">Return Flight</div>
            <div class="grid grid-cols-3 gap-4 items-center">
                <div class="text-center">
                    <div class="text-lg font-semibold text-gray-800">${departureTime}</div>
                    <div class="text-sm text-gray-600">${segment.origin.iata_code}</div>
                    <div class="text-xs text-gray-500">${departureDate}</div>
                </div>
                
                <div class="text-center">
                    <div class="text-sm text-gray-600 mb-1">${duration}</div>
                    <div class="flex items-center justify-center">
                        <div class="w-12 h-px bg-gray-300"></div>
                        <i class="fas fa-plane text-gray-400 mx-2"></i>
                        <div class="w-12 h-px bg-gray-300"></div>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">${stopText}</div>
                </div>
                
                <div class="text-center">
                    <div class="text-lg font-semibold text-gray-800">${arrivalTime}</div>
                    <div class="text-sm text-gray-600">${segment.destination.iata_code}</div>
                    <div class="text-xs text-gray-500">${departureDate}</div>
                </div>
            </div>
        </div>
    `;
}

function selectFlight(offerId) {
    selectedOffer = searchResults.offers.find(offer => offer.id === offerId);
    if (selectedOffer) {
        showBookingModal();
    }
}

function showBookingModal() {
    const modal = document.getElementById('bookingModal');
    const flightInfo = document.getElementById('selectedFlightInfo');
    const passengerForms = document.getElementById('passengerForms');
    
    // Display selected flight info
    flightInfo.innerHTML = createSelectedFlightSummary(selectedOffer);
    
    // Generate passenger forms
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
    
    // Parse passenger data from form
    const passengerCount = buildPassengerArray().length;
    
    for (let i = 0; i < passengerCount; i++) {
        const passengerData = {
            id: `passenger_${Date.now()}_${i}`, // Generate unique passenger ID
            type: formData.get(`passengers[${i}].type`),
            given_name: formData.get(`passengers[${i}].given_name`),
            family_name: formData.get(`passengers[${i}].family_name`),
            born_on: formData.get(`passengers[${i}].born_on`)
        };
        
        // Add optional fields only if they have values
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
        showLoading(true);
        
        console.log('🎫 Booking data being sent:', {
            offer_id: selectedOffer.id,
            passengers: passengers
        });
        
        const response = await axios.post('/api/book-flight', {
            offer_id: selectedOffer.id,
            passengers: passengers
        });
        
        console.log('✅ Booking response received:', response.data);
        showBookingConfirmation(response.data.data);
        closeBookingModal();
        
    } catch (error) {
        console.error('❌ Booking error:', error);
        console.error('📄 Error response:', error.response?.data);
        
        let errorMessage = 'Failed to complete booking. Please try again.';
        if (error.response?.data?.details?.errors) {
            const validationErrors = error.response.data.details.errors;
            const missingFields = validationErrors
                .filter(err => err.code === 'validation_required')
                .map(err => err.message)
                .join(', ');
            if (missingFields) {
                errorMessage = `Please check required fields: ${missingFields}`;
            }
        }
        showError(errorMessage);
    } finally {
        showLoading(false);
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
            
            <div class="mt-4">
                <h4 class="font-medium text-gray-800 mb-2">Flight Information</h4>
                ${orderData.slices.map(slice => 
                    slice.segments.map(segment => `
                        <div class="bg-white p-3 rounded border">
                            <div class="font-medium">${segment.origin.iata_code} → ${segment.destination.iata_code}</div>
                            <div class="text-sm text-gray-600">
                                ${moment(segment.departing_at).format('MMM DD, YYYY HH:mm')} - 
                                ${moment(segment.arriving_at).format('HH:mm')}
                            </div>
                            <div class="text-sm text-gray-600">${segment.marketing_carrier.name} ${segment.marketing_carrier_flight_number}</div>
                        </div>
                    `).join('')
                ).join('')}
            </div>
        </div>
    `;
    
    // Hide other sections and show confirmation
    hideResults();
    document.getElementById('searchForm').closest('.bg-white').style.display = 'none';
    confirmation.classList.remove('hidden');
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function hideResults() {
    document.getElementById('flightResults').classList.add('hidden');
}

function showError(message) {
    // Create and show error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50';
    errorDiv.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// Flight sorting functionality
let currentFlights = [];
let currentSortType = 'price';

function sortFlights(sortType) {
    console.log('🔄 Sorting flights by:', sortType);
    
    // Use filtered flights if available, otherwise use all current flights
    const flightsToSort = filteredFlights && filteredFlights.length > 0 ? filteredFlights : currentFlights;
    
    if (!flightsToSort || flightsToSort.length === 0) {
        console.log('❌ No flights to sort');
        return;
    }
    
    currentSortType = sortType;
    
    // Update active button styling
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active-sort');
        btn.classList.add('border-gray-300', 'text-gray-700');
        btn.classList.remove('border-orange-600', 'text-orange-600');
    });
    
    // Fix the ID mapping
    let buttonId;
    switch(sortType) {
        case 'price':
            buttonId = 'sortPrice';
            break;
        case 'duration':
            buttonId = 'sortDuration';
            break;
        case 'departure':
            buttonId = 'sortDeparture';
            break;
    }
    
    const activeBtn = document.getElementById(buttonId);
    if (activeBtn) {
        activeBtn.classList.add('active-sort');
        activeBtn.classList.remove('border-gray-300', 'text-gray-700');
        activeBtn.classList.add('border-orange-600', 'text-orange-600');
    }
    
    // Sort flights based on type
    let sortedFlights = [...flightsToSort];
    
    switch (sortType) {
        case 'price':
            sortedFlights.sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount));
            break;
        case 'duration':
            sortedFlights.sort((a, b) => {
                const durationA = moment.duration(a.slices[0].duration).asMinutes();
                const durationB = moment.duration(b.slices[0].duration).asMinutes();
                return durationA - durationB;
            });
            break;
        case 'departure':
            sortedFlights.sort((a, b) => {
                const timeA = moment(a.slices[0].segments[0].departing_at);
                const timeB = moment(b.slices[0].segments[0].departing_at);
                return timeA - timeB;
            });
            break;
    }
    
    // Update filtered flights with sorted order
    filteredFlights = sortedFlights;
    
    // Update the flight list display
    const flightsList = document.getElementById('flightsList');
    const html = sortedFlights.map(offer => createFlightCard(offer)).join('');
    flightsList.innerHTML = html;
    
    // Update sort button details
    updateSortButtonDetails(sortedFlights);
}

function updateSortButtonDetails(flights) {
    if (!flights || flights.length === 0) return;
    
    // Update cheapest price
    const cheapest = Math.min(...flights.map(f => parseFloat(f.total_amount)));
    document.getElementById('cheapestPrice').textContent = `৳ ${cheapest.toLocaleString()}`;
    
    // Update fastest duration
    const fastest = Math.min(...flights.map(f => moment.duration(f.slices[0].duration).asMinutes()));
    const fastestHours = Math.floor(fastest / 60);
    const fastestMins = fastest % 60;
    document.getElementById('fastestDuration').textContent = `${fastestHours}h ${fastestMins}m`;
    
    // Update earliest departure
    const earliest = flights.reduce((earliest, flight) => {
        const flightTime = moment(flight.slices[0].segments[0].departing_at);
        return !earliest || flightTime.isBefore(earliest) ? flightTime : earliest;
    }, null);
    if (earliest) {
        document.getElementById('earliestTime').textContent = earliest.format('HH:mm');
    }
    
    // Update results header
    const resultsHeader = document.getElementById('resultsHeader');
    const airlineCount = new Set(flights.map(f => f.slices[0].segments[0].marketing_carrier.name)).size;
    resultsHeader.textContent = `Showing ${flights.length} Flights & ${airlineCount} Airlines`;
}

// Flight filtering functionality
let allFlights = [];
let filteredFlights = [];

function initializeFilters(flights) {
    allFlights = flights;
    filteredFlights = flights;
    
    // Setup price range
    setupPriceRange(flights);
    
    // Setup airlines filter
    setupAirlinesFilter(flights);
    
    // Setup filter event listeners
    setupFilterEventListeners();
}

function setupPriceRange(flights) {
    const prices = flights.map(f => parseFloat(f.total_amount));
    const minPrice = Math.floor(Math.min(...prices));
    const maxPrice = Math.ceil(Math.max(...prices));
    
    const minSlider = document.getElementById('priceRangeMin');
    const maxSlider = document.getElementById('priceRangeMax');
    const minDisplay = document.getElementById('minPriceDisplay');
    const maxDisplay = document.getElementById('maxPriceDisplay');
    
    minSlider.min = minPrice;
    minSlider.max = maxPrice;
    minSlider.value = minPrice;
    
    maxSlider.min = minPrice;
    maxSlider.max = maxPrice;
    maxSlider.value = maxPrice;
    
    minDisplay.textContent = `৳ ${minPrice.toLocaleString()}`;
    maxDisplay.textContent = `৳ ${maxPrice.toLocaleString()}`;
}

function setupAirlinesFilter(flights) {
    const airlines = {};
    
    flights.forEach(flight => {
        const carrier = flight.slices[0].segments[0].marketing_carrier;
        const airlineName = carrier.name;
        const price = parseFloat(flight.total_amount);
        
        if (!airlines[airlineName]) {
            airlines[airlineName] = {
                name: airlineName,
                minPrice: price,
                count: 1
            };
        } else {
            airlines[airlineName].minPrice = Math.min(airlines[airlineName].minPrice, price);
            airlines[airlineName].count++;
        }
    });
    
    const airlinesContainer = document.getElementById('airlinesFilter');
    airlinesContainer.innerHTML = '';
    
    Object.entries(airlines)
        .sort(([,a], [,b]) => a.minPrice - b.minPrice)
        .forEach(([airlineName, data]) => {
            const airlineDiv = document.createElement('div');
            airlineDiv.className = 'flex items-center justify-between';
            airlineDiv.innerHTML = `
                <label class="flex items-center space-x-3 cursor-pointer flex-1">
                    <input type="checkbox" class="airline-filter w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" 
                           data-airline="${airlineName}" checked>
                    <span class="text-gray-700 text-sm">${airlineName}</span>
                </label>
                <span class="text-xs text-gray-500">৳ ${data.minPrice.toLocaleString()}</span>
            `;
            airlinesContainer.appendChild(airlineDiv);
        });
}

function setupFilterEventListeners() {
    // Price range sliders
    const minSlider = document.getElementById('priceRangeMin');
    const maxSlider = document.getElementById('priceRangeMax');
    const minDisplay = document.getElementById('minPriceDisplay');
    const maxDisplay = document.getElementById('maxPriceDisplay');
    const track = document.getElementById('priceRangeTrack');
    
    function updateTrack() {
        const min = parseInt(minSlider.value);
        const max = parseInt(maxSlider.value);
        const minPercent = ((min - minSlider.min) / (minSlider.max - minSlider.min)) * 100;
        const maxPercent = ((max - maxSlider.min) / (maxSlider.max - maxSlider.min)) * 100;
        
        track.style.left = minPercent + '%';
        track.style.width = (maxPercent - minPercent) + '%';
    }
    
    minSlider.addEventListener('input', function() {
        if (parseInt(this.value) >= parseInt(maxSlider.value)) {
            this.value = parseInt(maxSlider.value) - 1;
        }
        minDisplay.textContent = `৳ ${parseInt(this.value).toLocaleString()}`;
        updateTrack();
    });
    
    maxSlider.addEventListener('input', function() {
        if (parseInt(this.value) <= parseInt(minSlider.value)) {
            this.value = parseInt(minSlider.value) + 1;
        }
        maxDisplay.textContent = `৳ ${parseInt(this.value).toLocaleString()}`;
        updateTrack();
    });
    
    // Initialize track
    updateTrack();
    
    // Auto-apply filters when price range changes
    minSlider.addEventListener('change', applyFilters);
    maxSlider.addEventListener('change', applyFilters);
    
    // Auto-apply filters when stops change
    document.getElementById('nonStop').addEventListener('change', applyFilters);
    document.getElementById('oneStop').addEventListener('change', applyFilters);
    document.getElementById('multiStop').addEventListener('change', applyFilters);
}

function applyFilters() {
    if (!allFlights || allFlights.length === 0) return;
    
    let filtered = [...allFlights];
    
    // Price filter
    const minPrice = parseInt(document.getElementById('priceRangeMin').value);
    const maxPrice = parseInt(document.getElementById('priceRangeMax').value);
    filtered = filtered.filter(flight => {
        const price = parseFloat(flight.total_amount);
        return price >= minPrice && price <= maxPrice;
    });
    
    // Stops filter
    const nonStop = document.getElementById('nonStop').checked;
    const oneStop = document.getElementById('oneStop').checked;
    const multiStop = document.getElementById('multiStop').checked;
    
    if (nonStop || oneStop || multiStop) {
        filtered = filtered.filter(flight => {
            const stops = flight.slices[0].segments.length - 1;
            return (nonStop && stops === 0) || 
                   (oneStop && stops === 1) || 
                   (multiStop && stops >= 2);
        });
    }
    
    // Airlines filter
    const selectedAirlines = Array.from(document.querySelectorAll('.airline-filter:checked'))
        .map(checkbox => checkbox.dataset.airline);
    
    if (selectedAirlines.length > 0) {
        filtered = filtered.filter(flight => {
            const airlineName = flight.slices[0].segments[0].marketing_carrier.name;
            return selectedAirlines.includes(airlineName);
        });
    }
    
    filteredFlights = filtered;
    
    // Update display
    displayFilteredFlights(filtered);
    updateSortButtonDetails(filtered);
}

function displayFilteredFlights(flights) {
    const flightsList = document.getElementById('flightsList');
    if (flights.length === 0) {
        flightsList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-plane text-white/50 text-4xl mb-4"></i>
                <h3 class="text-lg font-medium text-white mb-2">No flights found</h3>
                <p class="text-white/70">Try adjusting your filters to see more results.</p>
            </div>
        `;
    } else {
        const html = flights.map(offer => createFlightCard(offer)).join('');
        flightsList.innerHTML = html;
    }
    
    // Update results header
    const resultsHeader = document.getElementById('resultsHeader');
    const airlineCount = new Set(flights.map(f => f.slices[0].segments[0].marketing_carrier.name)).size;
    resultsHeader.textContent = `Showing ${flights.length} Flights & ${airlineCount} Airlines`;
}

function resetAirlineFilters() {
    document.querySelectorAll('.airline-filter').forEach(checkbox => {
        checkbox.checked = true;
    });
    applyFilters();
}