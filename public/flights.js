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
    
    // Wait for airport data to be set, then trigger search if we have URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('departure_id') && urlParams.has('arrival_id')) {
        // Use a longer delay and multiple checks to ensure everything is loaded
        const trySearch = (attempt = 1, maxAttempts = 5) => {
            setTimeout(() => {
                console.log(`🔍 Search attempt ${attempt}/${maxAttempts}`);
                
                const origin = document.getElementById('origin');
                const destination = document.getElementById('destination');
                const departureDate = document.getElementById('departureDate');
                
                console.log('📊 Form status check:', {
                    originValue: origin?.value || 'EMPTY',
                    destinationValue: destination?.value || 'EMPTY',
                    departureDateValue: departureDate?.value || 'EMPTY',
                    originIata: origin?.getAttribute('data-iata') || 'MISSING',
                    destinationIata: destination?.getAttribute('data-iata') || 'MISSING'
                });
                
                if (origin?.value && destination?.value && departureDate?.value &&
                    origin.getAttribute('data-iata') && destination.getAttribute('data-iata')) {
                    console.log('✅ All requirements met, starting search');
                    performSearch();
                } else if (attempt < maxAttempts) {
                    console.warn(`⚠️ Form not ready yet, retrying in ${attempt * 500}ms...`);
                    trySearch(attempt + 1, maxAttempts);
                } else {
                    console.error('❌ Failed to initialize form properly after multiple attempts');
                }
            }, attempt * 1000); // Increasing delay
        };
        
        trySearch();
    }
    
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

    // Price range sliders
    const priceMinSlider = document.getElementById('priceMin');
    const priceMaxSlider = document.getElementById('priceMax');
    const priceMinValue = document.getElementById('priceMinValue');
    const priceMaxValue = document.getElementById('priceMaxValue');
    const rangeTrackFill = document.getElementById('rangeTrackFill');
    
    function updateRangeTrackFill() {
        if (!priceMinSlider || !priceMaxSlider || !rangeTrackFill) return;
        
        const min = parseInt(priceMinSlider.min);
        const max = parseInt(priceMinSlider.max);
        const minVal = parseInt(priceMinSlider.value);
        const maxVal = parseInt(priceMaxSlider.value);
        
        const minPercent = ((minVal - min) / (max - min)) * 100;
        const maxPercent = ((maxVal - min) / (max - min)) * 100;
        
        rangeTrackFill.style.left = minPercent + '%';
        rangeTrackFill.style.width = (maxPercent - minPercent) + '%';
    }
    
    if (priceMinSlider && priceMaxSlider) {
        // Initialize the track fill
        updateRangeTrackFill();
        
        priceMinSlider.addEventListener('input', function() {
            const minVal = parseInt(this.value);
            const maxVal = parseInt(priceMaxSlider.value);
            
            if (minVal >= maxVal) {
                this.value = maxVal - 50;
            }
            
            priceMinValue.textContent = parseInt(this.value).toLocaleString();
            updateRangeTrackFill();
            applyFilters();
        });
        
        priceMaxSlider.addEventListener('input', function() {
            const minVal = parseInt(priceMinSlider.value);
            const maxVal = parseInt(this.value);
            
            if (maxVal <= minVal) {
                this.value = minVal + 50;
            }
            
            priceMaxValue.textContent = parseInt(this.value).toLocaleString();
            updateRangeTrackFill();
            applyFilters();
        });
    }
    
    // Airline filter checkboxes will be added dynamically
    
    // Passenger dropdown functionality
    setupPassengerDropdown();
    
    // Booking modal event listeners
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBookingBtn = document.getElementById('cancelBooking');
    const bookingForm = document.getElementById('bookingForm');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeBookingModal);
    }
    
    if (cancelBookingBtn) {
        cancelBookingBtn.addEventListener('click', closeBookingModal);
    }
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processBooking();
        });
    }
});

function resetAllFilters() {
    resetPriceFilter();
    resetStopsFilter();
    resetAirlineFilters();
    console.log('🔄 All filters reset');
}

function setupPassengerDropdown() {
    const dropdown = document.getElementById('passengerDropdown');
    const menu = document.getElementById('passengerMenu');
    
    dropdown.addEventListener('click', function() {
        menu.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!dropdown.contains(event.target) && !menu.contains(event.target)) {
            menu.classList.add('hidden');
        }
    });
}

// Passenger counter functions
function incrementPassenger(type) {
    const countElement = document.getElementById(`${type}Count`);
    let count = parseInt(countElement.textContent);
    
    const maxLimits = { adults: 9, children: 8, infants: 8 };
    
    if (count < maxLimits[type]) {
        count++;
        countElement.textContent = count;
        updatePassengerSummary();
    }
}

function decrementPassenger(type) {
    const countElement = document.getElementById(`${type}Count`);
    let count = parseInt(countElement.textContent);
    
    const minLimits = { adults: 1, children: 0, infants: 0 };
    
    if (count > minLimits[type]) {
        count--;
        countElement.textContent = count;
        updatePassengerSummary();
    }
}

async function initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    console.log('📋 Initializing from URL:', window.location.search);
    
    // Set trip type
    const tripType = urlParams.get('type') === '2' ? 'roundTrip' : 'oneWay';
    const tripTypeRadio = document.querySelector(`input[name="tripType"][value="${tripType}"]`);
    if (tripTypeRadio) {
        tripTypeRadio.checked = true;
        console.log('✅ Set trip type:', tripType);
    }
    
    // Set origin and destination
    const departureId = urlParams.get('departure_id');
    const arrivalId = urlParams.get('arrival_id');
    
    console.log('🛫 Setting airports:', { departureId, arrivalId });
    
    let airportsSet = true;
    
    if (departureId) {
        const result = await setAirportFromCode(departureId, 'origin');
        if (!result) airportsSet = false;
    }
    
    if (arrivalId) {
        const result = await setAirportFromCode(arrivalId, 'destination');
        if (!result) airportsSet = false;
    }
    
    if (!airportsSet) {
        console.warn('⚠️ Some airports could not be set properly');
    }
    
    // Set dates
    const outboundDate = urlParams.get('outbound_date');
    if (outboundDate) {
        const departureDateInput = document.getElementById('departureDate');
        if (departureDateInput) {
            departureDateInput.value = outboundDate;
            console.log('✅ Set departure date:', outboundDate);
        }
    }
    
    const returnDate = urlParams.get('return_date');
    if (returnDate && tripType === 'roundTrip') {
        const returnDateInput = document.getElementById('returnDate');
        if (returnDateInput) {
            returnDateInput.value = returnDate;
            document.getElementById('returnDateContainer').classList.remove('hidden');
            console.log('✅ Set return date:', returnDate);
        }
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
    
    console.log('🎯 URL initialization complete');
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
                
                return true; // Success
            } else {
                console.error(`❌ Input element not found: ${inputId}`);
                return false;
            }
        } else {
            console.warn(`⚠️ Airport not found for code: ${code}`);
            
            // Try to set the code directly if no airport found
            const input = document.getElementById(inputId);
            if (input) {
                input.value = `${code} Airport (${code})`;
                input.setAttribute('data-iata', code);
                input.setAttribute('data-city', code);
                input.setAttribute('data-type', 'airport');
                console.log(`⚠️ Set fallback for ${inputId}:`, code);
                return true;
            }
            return false;
        }
    } catch (error) {
        console.error('❌ Error setting airport from code:', error);
        
        // Fallback: set the code directly
        const input = document.getElementById(inputId);
        if (input) {
            input.value = `${code} Airport (${code})`;
            input.setAttribute('data-iata', code);
            input.setAttribute('data-city', code);
            input.setAttribute('data-type', 'airport');
            console.log(`🔄 Set error fallback for ${inputId}:`, code);
            return true;
        }
        return false;
    }
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
    const adults = parseInt(document.getElementById('adultsCount').textContent) || 1;
    const children = parseInt(document.getElementById('childrenCount').textContent) || 0;
    const infants = parseInt(document.getElementById('infantsCount').textContent) || 0;
    
    const summary = document.getElementById('passengerSummary');
    let summaryText = `${adults} Adult${adults > 1 ? 's' : ''}`;
    
    if (children > 0) {
        summaryText += `, ${children} Child${children > 1 ? 'ren' : ''}`;
    }
    
    if (infants > 0) {
        summaryText += `, ${infants} Infant${infants > 1 ? 's' : ''}`;
    }
    
    summary.textContent = summaryText;
}

// Airport dropdown initialization and autocomplete
function initializeAirportDropdowns() {
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');
    
    setupAirportAutocomplete(originInput, 'originSuggestions');
    setupAirportAutocomplete(destinationInput, 'destinationSuggestions');
}

function setupAirportAutocomplete(input, dropdownId) {
    if (!input) return;
    
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    let timeoutId;
    
    input.addEventListener('input', function() {
        const query = this.value.trim();
        
        clearTimeout(timeoutId);
        
        if (query.length < 2) {
            dropdown.classList.add('hidden');
            return;
        }
        
        timeoutId = setTimeout(() => {
            searchAirports(query, dropdown, input);
        }, 300);
    });
    
    input.addEventListener('blur', function() {
        setTimeout(() => {
            dropdown.classList.add('hidden');
        }, 200);
    });
    
    input.addEventListener('focus', function() {
        if (this.value.trim().length >= 2) {
            searchAirports(this.value.trim(), dropdown, input);
        }
    });
}

async function searchAirports(query, dropdown, input) {
    try {
        console.log(`🔍 Searching airports for: "${query}"`);
        const response = await axios.get(`/api/places?query=${query}`);
        const places = response.data;
        
        console.log(`Found ${places.length} places:`, places);
        
        dropdown.innerHTML = '';
        
        if (places.length === 0) {
            dropdown.innerHTML = '<div class="px-4 py-2 text-gray-500">No airports found</div>';
        } else {
            places.forEach(place => {
                const item = document.createElement('div');
                item.className = 'px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-200';
                item.innerHTML = `
                    <div class="font-medium">${place.name}</div>
                    <div class="text-sm text-gray-500">${place.iata_code}</div>
                `;
                
                item.addEventListener('click', function() {
                    input.value = `${place.name} (${place.iata_code})`;
                    input.setAttribute('data-iata', place.iata_code);
                    input.setAttribute('data-city', place.iata_code);
                    input.setAttribute('data-type', 'airport');
                    dropdown.classList.add('hidden');
                });
                
                dropdown.appendChild(item);
            });
        }
        
        dropdown.classList.remove('hidden');
    } catch (error) {
        console.error('Error searching airports:', error);
        dropdown.innerHTML = '<div class="px-4 py-2 text-red-500">Error loading airports</div>';
        dropdown.classList.remove('hidden');
    }
}

// Flight search functionality
async function performSearch() {
    console.log('🔍 Starting flight search...');
    
    const origin = document.getElementById('origin');
    const destination = document.getElementById('destination');
    const departureDate = document.getElementById('departureDate');
    const returnDate = document.getElementById('returnDate');
    const tripType = document.querySelector('input[name="tripType"]:checked');
    
    console.log('📋 Form validation check:', {
        originValue: origin?.value,
        destinationValue: destination?.value,
        departureDateValue: departureDate?.value,
        originIata: origin?.getAttribute('data-iata'),
        destinationIata: destination?.getAttribute('data-iata')
    });
    
    if (!origin?.value || !destination?.value || !departureDate?.value) {
        console.error('❌ Missing required field values');
        alert('Please fill in all required fields (From, To, Departure Date)');
        return;
    }
    
    const originCode = origin.getAttribute('data-iata');
    const destinationCode = destination.getAttribute('data-iata');
    
    if (!originCode || !destinationCode) {
        console.error('❌ Missing IATA codes:', { originCode, destinationCode });
        alert('Please select valid airports from the dropdown suggestions');
        return;
    }
    
    // Get passenger counts
    const adults = parseInt(document.getElementById('adultsCount')?.textContent) || 1;
    const children = parseInt(document.getElementById('childrenCount')?.textContent) || 0;
    const infants = parseInt(document.getElementById('infantsCount')?.textContent) || 0;
    
    const searchData = {
        origin: originCode,
        destination: destinationCode,
        departureDate: departureDate.value,
        passengers: []
    };
    
    // Add passengers
    for (let i = 0; i < adults; i++) {
        searchData.passengers.push({ type: 'adult' });
    }
    for (let i = 0; i < children; i++) {
        searchData.passengers.push({ type: 'child' });
    }
    for (let i = 0; i < infants; i++) {
        searchData.passengers.push({ type: 'infant_without_seat' });
    }
    
    if (tripType.value === 'roundTrip' && returnDate.value) {
        searchData.returnDate = returnDate.value;
    }
    
    // Add cabin class
    searchData.cabinClass = 'economy';
    
    console.log('🛫 Search parameters:', searchData);
    
    // Show loading state
    const loadingState = document.getElementById('loadingState');
    const flightResults = document.getElementById('flightResults');
    const resultsHeader = document.getElementById('resultsHeader');
    const flightSummary = document.getElementById('flightSummary');
    
    if (loadingState) loadingState.classList.remove('hidden');
    if (flightResults) flightResults.classList.add('hidden');
    if (resultsHeader) resultsHeader.classList.add('hidden');
    if (flightSummary) flightSummary.classList.add('hidden');
    
    try {
        console.log('🚀 Making API request to /api/search-flights');
        const response = await axios.post('/api/search-flights', searchData);
        
        console.log('✈️ Flight search response:', response.data);
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
            console.log(`📊 Processing ${response.data.data.length} flights`);
            allFlights = response.data.data;
            filteredFlights = [...allFlights];
            displayFlights(filteredFlights);
            updateAirlineFilters();
        } else if (response.data.success && response.data.data && response.data.data.length === 0) {
            console.warn('⚠️ No flights found in response');
            displayNoFlights();
        } else {
            console.warn('⚠️ Search failed or invalid response:', response.data);
            displaySearchError();
        }
    } catch (error) {
        console.error('❌ Flight search error:', error);
        if (error.response) {
            console.error('❌ Error response:', error.response.data);
            if (error.response.status === 500) {
                console.error('❌ Server error - check server logs');
            }
        }
        displaySearchError();
    }
}

function displayFlights(flights) {
    const resultsContainer = document.getElementById('flightResults');
    const resultsCount = document.getElementById('resultsCount');
    const resultsHeader = document.getElementById('resultsHeader');
    const loadingState = document.getElementById('loadingState');
    const flightSummary = document.getElementById('flightSummary');
    
    console.log(`📊 Displaying ${flights.length} flights`);
    
    // Hide loading state
    if (loadingState) {
        loadingState.classList.add('hidden');
    }
    
    if (flights.length === 0) {
        displayNoFlights();
        return;
    }
    
    // Show results header and set count
    if (resultsHeader) {
        resultsHeader.classList.remove('hidden');
    }
    
    if (resultsCount) {
        resultsCount.textContent = `${flights.length} flight${flights.length > 1 ? 's' : ''} found`;
    }
    
    // Show and populate flight summary
    if (flightSummary) {
        flightSummary.classList.remove('hidden');
        populateFlightSummary(flights);
    }
    
    // Show results container
    if (resultsContainer) {
        resultsContainer.classList.remove('hidden');
        
        resultsContainer.innerHTML = flights.map(offer => {
            const slice = offer.slices[0];
            const segment = slice.segments[0];
            
            const departureTime = moment(segment.departing_at).format('HH:mm');
            const arrivalTime = moment(segment.arriving_at).format('HH:mm');
            const duration = moment.duration(slice.duration).humanize();
            
            const airline = segment.marketing_carrier?.name || segment.operating_carrier?.name || 'Unknown Airline';
            const flightNumber = segment.marketing_carrier_flight_number || segment.operating_carrier_flight_number;
            
            const stopInfo = slice.segments.length > 1 ? `${slice.segments.length - 1} stop${slice.segments.length > 2 ? 's' : ''}` : 'Direct';
            
            return `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
                    <div class="flex items-center justify-between mb-6">
                        <!-- Flight Route and Time -->
                        <div class="flex items-center space-x-8 flex-1">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-gray-900">${departureTime}</div>
                                <div class="text-sm font-medium text-gray-600 mt-1">${segment.origin.iata_code}</div>
                                <div class="text-xs text-gray-500">${segment.origin.city_name || segment.origin.name}</div>
                            </div>
                            
                            <div class="flex-1 relative">
                                <div class="flex items-center">
                                    <div class="w-2 h-2 bg-orange-400 rounded-full"></div>
                                    <div class="flex-1 border-t-2 border-dashed border-gray-300 mx-2"></div>
                                    <div class="w-2 h-2 bg-orange-400 rounded-full"></div>
                                </div>
                                <div class="text-center mt-2">
                                    <div class="text-sm font-medium text-gray-700">${duration}</div>
                                    <div class="text-xs text-gray-500 mt-1">${stopInfo}</div>
                                </div>
                            </div>
                            
                            <div class="text-center">
                                <div class="text-2xl font-bold text-gray-900">${arrivalTime}</div>
                                <div class="text-sm font-medium text-gray-600 mt-1">${segment.destination.iata_code}</div>
                                <div class="text-xs text-gray-500">${segment.destination.city_name || segment.destination.name}</div>
                            </div>
                        </div>
                        
                        <!-- Price Section -->
                        <div class="text-right ml-8">
                            <div class="text-3xl font-bold text-orange-600">${offer.total_currency} ${parseFloat(offer.total_amount).toLocaleString()}</div>
                            <div class="text-sm text-gray-500 mt-1">per person</div>
                        </div>
                    </div>
                    
                    <!-- Airline and Action -->
                    <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                                <i class="fas fa-plane text-white text-sm"></i>
                            </div>
                            <div>
                                <div class="text-sm font-semibold text-gray-900">${airline}</div>
                                <div class="text-xs text-gray-500">${flightNumber}</div>
                            </div>
                        </div>
                        
                        <button onclick="selectFlight('${offer.id}')" 
                                class="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                            <i class="fas fa-arrow-right mr-2"></i>
                            Select Flight
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ Flight results displayed successfully');
    } else {
        console.error('❌ Results container not found!');
    }
}

function populateFlightSummary(flights) {
    if (!flights || flights.length === 0) return;
    
    // Find cheapest flight
    const cheapest = flights.reduce((min, flight) => 
        parseFloat(flight.total_amount) < parseFloat(min.total_amount) ? flight : min
    );
    
    // Find fastest flight (shortest duration)
    const fastest = flights.reduce((min, flight) => {
        const currentDuration = moment.duration(flight.slices[0].duration).asMinutes();
        const minDuration = moment.duration(min.slices[0].duration).asMinutes();
        return currentDuration < minDuration ? flight : min;
    });
    
    // Find earliest flight (earliest departure)
    const earliest = flights.reduce((early, flight) => {
        const currentDeparture = moment(flight.slices[0].segments[0].departing_at);
        const earlyDeparture = moment(early.slices[0].segments[0].departing_at);
        return currentDeparture.isBefore(earlyDeparture) ? flight : early;
    });
    
    // Populate cheapest flight card
    updateSummaryCard('cheapest', cheapest);
    
    // Populate fastest flight card
    updateSummaryCard('fastest', fastest);
    
    // Populate earliest flight card
    updateSummaryCard('earliest', earliest);
    
    console.log('📊 Flight summary populated', { 
        cheapest: cheapest.total_amount, 
        fastest: moment.duration(fastest.slices[0].duration).humanize(),
        earliest: moment(earliest.slices[0].segments[0].departing_at).format('HH:mm')
    });
}

function updateSummaryCard(type, flight) {
    const slice = flight.slices[0];
    const segment = slice.segments[0];
    
    // Update card based on type - show only the most relevant info
    if (type === 'cheapest') {
        // Show only price
        const price = `${flight.total_currency} ${parseFloat(flight.total_amount).toLocaleString()}`;
        document.getElementById('cheapestPrice').textContent = price;
    } else if (type === 'fastest') {
        // Show only duration
        const duration = moment.duration(slice.duration).humanize();
        document.getElementById('fastestDuration').textContent = duration;
    } else if (type === 'earliest') {
        // Show only departure time
        const departureTime = moment(segment.departing_at).format('HH:mm');
        document.getElementById('earliestTime').textContent = departureTime;
    }
    
    // Add click handler to scroll to the flight
    const card = document.getElementById(`${type}Flight`);
    if (card) {
        card.onclick = () => scrollToFlight(flight.id);
    }
}

function scrollToFlight(flightId) {
    // Find the flight card element and scroll to it
    const flightCards = document.querySelectorAll('#flightResults > div');
    flightCards.forEach((card, index) => {
        const selectButton = card.querySelector('button[onclick*="selectFlight"]');
        if (selectButton && selectButton.getAttribute('onclick').includes(flightId)) {
            card.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Add a temporary highlight effect
            card.style.boxShadow = '0 0 20px rgba(242, 98, 60, 0.3)';
            card.style.border = '2px solid #F2623C';
            
            setTimeout(() => {
                card.style.boxShadow = '';
                card.style.border = '';
            }, 2000);
        }
    });
}

function displayNoFlights() {
    const resultsContainer = document.getElementById('flightResults');
    const resultsCount = document.getElementById('resultsCount');
    const resultsHeader = document.getElementById('resultsHeader');
    const loadingState = document.getElementById('loadingState');
    const flightSummary = document.getElementById('flightSummary');
    
    console.log('📭 Displaying no flights message');
    
    // Hide loading state and flight summary
    if (loadingState) {
        loadingState.classList.add('hidden');
    }
    
    if (flightSummary) {
        flightSummary.classList.add('hidden');
    }
    
    if (resultsHeader) {
        resultsHeader.classList.remove('hidden');
    }
    
    if (resultsCount) {
        resultsCount.textContent = 'No flights found';
    }
    
    if (resultsContainer) {
        resultsContainer.classList.remove('hidden');
        resultsContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-8 text-center">
                <i class="fas fa-search text-gray-400 text-4xl mb-4"></i>
                <div class="text-gray-500 text-lg mb-4">No flights found for your search criteria</div>
                <div class="text-gray-400">Try adjusting your search parameters</div>
            </div>
        `;
    }
}

function displaySearchError() {
    const resultsContainer = document.getElementById('flightResults');
    const resultsCount = document.getElementById('resultsCount');
    const resultsHeader = document.getElementById('resultsHeader');
    const loadingState = document.getElementById('loadingState');
    const flightSummary = document.getElementById('flightSummary');
    
    console.log('❌ Displaying search error message');
    
    // Hide loading state and flight summary
    if (loadingState) {
        loadingState.classList.add('hidden');
    }
    
    if (flightSummary) {
        flightSummary.classList.add('hidden');
    }
    
    if (resultsHeader) {
        resultsHeader.classList.remove('hidden');
    }
    
    if (resultsCount) {
        resultsCount.textContent = 'Search error';
    }
    
    if (resultsContainer) {
        resultsContainer.classList.remove('hidden');
        resultsContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-8 text-center">
                <i class="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
                <div class="text-red-500 text-lg mb-4">Error searching for flights</div>
                <div class="text-gray-400">Please try again later</div>
            </div>
        `;
    }
}

// Flight selection and booking
function selectFlight(offerId) {
    selectedOffer = allFlights.find(offer => offer.id === offerId);
    if (selectedOffer) {
        openBookingModal();
    }
}

function openBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.classList.remove('hidden');
    
    // Populate flight details
    const flightDetails = document.getElementById('selectedFlightInfo');
    const slice = selectedOffer.slices[0];
    const segment = slice.segments[0];
    
    const departureTime = moment(segment.departing_at).format('HH:mm');
    const arrivalTime = moment(segment.arriving_at).format('HH:mm');
    const airline = segment.marketing_carrier?.name || segment.operating_carrier?.name || 'Unknown Airline';
    
    flightDetails.innerHTML = `
        <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between items-center">
                <div>
                    <div class="font-semibold">${segment.origin.iata_code} → ${segment.destination.iata_code}</div>
                    <div class="text-sm text-gray-600">${airline}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-orange-600">${selectedOffer.total_currency} ${parseFloat(selectedOffer.total_amount).toLocaleString()}</div>
                    <div class="text-sm text-gray-600">${departureTime} - ${arrivalTime}</div>
                </div>
            </div>
        </div>
    `;
    
    // Generate passenger forms
    generatePassengerForms();
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.classList.add('hidden');
}

function generatePassengerForms() {
    const container = document.getElementById('passengerForms');
    const adults = parseInt(document.getElementById('adultsCount').textContent) || 1;
    const children = parseInt(document.getElementById('childrenCount').textContent) || 0;
    const infants = parseInt(document.getElementById('infantsCount').textContent) || 0;
    
    let formsHTML = '';
    let passengerIndex = 0;
    
    // Adult forms
    for (let i = 0; i < adults; i++) {
        formsHTML += generatePassengerForm('adult', passengerIndex, i + 1);
        passengerIndex++;
    }
    
    // Children forms
    for (let i = 0; i < children; i++) {
        formsHTML += generatePassengerForm('child', passengerIndex, i + 1);
        passengerIndex++;
    }
    
    // Infant forms
    for (let i = 0; i < infants; i++) {
        formsHTML += generatePassengerForm('infant_without_seat', passengerIndex, i + 1);
        passengerIndex++;
    }
    
    container.innerHTML = formsHTML;
    
    // Initialize country code displays for all adult passengers
    const totalForms = adults + children + infants;
    for (let i = 0; i < adults; i++) {
        initializeCountryCodeDisplay(i);
    }
}

function generatePassengerForm(type, index, number) {
    const isAdult = type === 'adult';
    const displayType = type === 'infant_without_seat' ? 'Infant' : type.charAt(0).toUpperCase() + type.slice(1);
    
    return `
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 class="font-semibold text-gray-800 mb-3">${displayType} ${number}</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <select id="title_${index}" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                        <option value="">Select Title</option>
                        <option value="mr">Mr</option>
                        <option value="ms">Ms</option>
                        <option value="mrs">Mrs</option>
                        <option value="miss">Miss</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select id="gender_${index}" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                        <option value="">Select Gender</option>
                        <option value="m">Male</option>
                        <option value="f">Female</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input type="text" id="firstName_${index}" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input type="text" id="lastName_${index}" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <input type="date" id="dob_${index}" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                </div>
                ${isAdult ? `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" id="email_${index}" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <div class="flex gap-2">
                        <div class="relative w-40">
                            <input type="text" id="phoneCodeSearch_${index}" placeholder="Search country..." 
                                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                   onfocus="showCountryDropdown(${index})"
                                   oninput="filterCountryCodes(${index})">
                            <input type="hidden" id="phoneCode_${index}" value="+880">
                            <div id="countryDropdown_${index}" class="hidden absolute z-50 w-72 bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                                <!-- Countries will be populated here -->
                            </div>
                        </div>
                        <input type="tel" id="phone_${index}" class="flex-1 border border-gray-300 rounded-lg px-3 py-2" placeholder="1234567890" required>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Enter phone without country code</p>
                </div>
                ` : ''}
            </div>
            <input type="hidden" id="type_${index}" value="${type}">
        </div>
    `;
}

async function processBooking() {
    if (!selectedOffer) return;
    
    const passengers = [];
    const adults = parseInt(document.getElementById('adultsCount').textContent) || 1;
    const children = parseInt(document.getElementById('childrenCount').textContent) || 0;
    const infants = parseInt(document.getElementById('infantsCount').textContent) || 0;
    
    let passengerIndex = 0;
    const totalPassengers = adults + children + infants;
    
    // Validate and collect passenger data
    for (let i = 0; i < totalPassengers; i++) {
        const title = document.getElementById(`title_${i}`).value;
        const gender = document.getElementById(`gender_${i}`).value;
        const firstName = document.getElementById(`firstName_${i}`).value;
        const lastName = document.getElementById(`lastName_${i}`).value;
        const dob = document.getElementById(`dob_${i}`).value;
        const type = document.getElementById(`type_${i}`).value;
        
        if (!title || !gender || !firstName || !lastName || !dob) {
            alert(`Please fill in all required fields for passenger ${i + 1}`);
            return;
        }
        
        // Get the passenger ID from the offer's passengers array
        // This ID was generated by Duffel when the offer was created
        const passengerId = selectedOffer.passengers[i]?.id;
        if (!passengerId) {
            alert(`Unable to find passenger ID for passenger ${i + 1}`);
            return;
        }
        
        const passenger = {
            id: passengerId,  // REQUIRED: ID from the offer's passengers array
            type: type,
            title: title,
            given_name: firstName,
            family_name: lastName,
            born_on: dob,
            gender: gender
        };
        
        // Add email and phone for adults
        if (type === 'adult') {
            const email = document.getElementById(`email_${i}`).value;
            const phoneCode = document.getElementById(`phoneCode_${i}`).value;
            const phone = document.getElementById(`phone_${i}`).value;
            
            if (!email || !phone) {
                alert(`Please fill in email and phone for passenger ${i + 1}`);
                return;
            }
            
            // Format phone number in E.164 format (country code + number)
            const formattedPhone = `${phoneCode}${phone.replace(/^0+/, '')}`; // Remove leading zeros
            
            passenger.email = email;
            passenger.phone_number = formattedPhone;
        }
        
        passengers.push(passenger);
    }
    
    const bookingData = {
        offer_id: selectedOffer.id,
        passenger_count: totalPassengers,
        passengers: passengers,
        total_amount: selectedOffer.total_amount,
        total_currency: selectedOffer.total_currency
    };
    
    try {
        console.log('📤 Sending booking request:', bookingData);
        
        const response = await axios.post('/api/book-flight', bookingData);
        
        console.log('✅ Booking response:', response.data);
        
        // Duffel API returns { data: { ...orderData } }
        if (response.data && response.data.data) {
            showBookingConfirmation(response.data.data);
            closeBookingModal();
        } else {
            alert('Booking failed: ' + (response.data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Booking error:', error);
        const errorMsg = error.response?.data?.details?.errors?.[0]?.message || error.response?.data?.error || error.message || 'Unknown error';
        alert('Booking failed: ' + errorMsg);
    }
}

// Filter and sort functionality
function applyFilters() {
    if (!allFlights || allFlights.length === 0) {
        console.warn('⚠️ No flights available to filter');
        return;
    }
    
    // Get filter values
    const minPrice = parseInt(document.getElementById('priceMin')?.value) || 0;
    const maxPrice = parseInt(document.getElementById('priceMax')?.value) || 10000;
    
    // Get selected stops
    const selectedStops = Array.from(document.querySelectorAll('.stops-filter:checked'))
        .map(cb => cb.value);
    
    // Get selected airlines
    const selectedAirlines = Array.from(document.querySelectorAll('input[name="airline"]:checked'))
        .map(cb => cb.value);
    
    console.log('🔍 Applying filters:', { minPrice, maxPrice, selectedStops, selectedAirlines });
    
    // Filter flights
    filteredFlights = allFlights.filter(offer => {
        const slice = offer.slices[0];
        const stops = slice.segments.length - 1;
        const price = parseFloat(offer.total_amount);
        const airline = slice.segments[0].marketing_carrier?.name || slice.segments[0].operating_carrier?.name;
        
        // Apply price filter
        if (price < minPrice || price > maxPrice) return false;
        
        // Apply stops filter
        if (selectedStops.length > 0) {
            const stopCategory = stops === 0 ? '0' : stops === 1 ? '1' : '2+';
            if (!selectedStops.includes(stopCategory)) return false;
        }
        
        // Apply airline filter
        if (selectedAirlines.length > 0 && !selectedAirlines.includes(airline)) return false;
        
        return true;
    });
    
    // Sort flights by price (cheapest first)
    filteredFlights.sort((a, b) => {
        return parseFloat(a.total_amount) - parseFloat(b.total_amount);
    });
    
    console.log(`📊 Filtered ${filteredFlights.length} flights from ${allFlights.length} total`);
    displayFlights(filteredFlights);
}

function updateAirlineFilters() {
    const container = document.getElementById('airlinesFilter');
    
    if (!container) {
        console.warn('⚠️ Airlines filter container not found, skipping filter update');
        return;
    }
    
    if (!allFlights || allFlights.length === 0) {
        console.warn('⚠️ No flights available for airline filtering');
        container.innerHTML = '<div class="text-gray-500 text-sm">No airlines available</div>';
        return;
    }
    
    const airlines = [...new Set(allFlights.map(offer => {
        const segment = offer.slices[0].segments[0];
        return segment.marketing_carrier?.name || segment.operating_carrier?.name;
    }))].filter(Boolean);
    
    console.log(`✈️ Found ${airlines.length} unique airlines:`, airlines);
    
    container.innerHTML = airlines.map(airline => `
        <label class="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer">
            <div class="flex items-center">
                <input type="checkbox" name="airline" value="${airline}" 
                       onchange="applyFilters()" class="mr-3 text-orange-600 focus:ring-orange-500 rounded">
                <span class="text-gray-800 font-medium">${airline}</span>
            </div>
            <i class="fas fa-plane text-orange-400"></i>
        </label>
    `).join('');
}

function resetAirlineFilters() {
    const checkboxes = document.querySelectorAll('input[name="airline"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    applyFilters();
    console.log('🔄 Airline filters reset');
}

function resetPriceFilter() {
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const priceMinValue = document.getElementById('priceMinValue');
    const priceMaxValue = document.getElementById('priceMaxValue');
    
    if (priceMin && priceMax) {
        priceMin.value = 0;
        priceMax.value = 10000;
        if (priceMinValue) priceMinValue.textContent = '0';
        if (priceMaxValue) priceMaxValue.textContent = '10,000';
        
        // Update the visual track fill
        const rangeTrackFill = document.getElementById('rangeTrackFill');
        if (rangeTrackFill) {
            rangeTrackFill.style.left = '0%';
            rangeTrackFill.style.width = '100%';
        }
        
        applyFilters();
        console.log('🔄 Price filter reset');
    }
}

function resetStopsFilter() {
    const checkboxes = document.querySelectorAll('.stops-filter');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    applyFilters();
    console.log('🔄 Stops filter reset');
}

function showBookingConfirmation(orderData) {
    const confirmation = document.getElementById('bookingConfirmation');
    const details = document.getElementById('confirmationDetails');
    
    // Get flight details from the order
    const firstSlice = orderData.slices[0];
    const firstSegment = firstSlice.segments[0];
    const passenger = orderData.passengers[0];
    
    // Format departure and arrival times
    const departureTime = moment(firstSegment.departing_at).format('MMM DD, YYYY [at] HH:mm');
    const arrivalTime = moment(firstSegment.arriving_at).format('MMM DD, YYYY [at] HH:mm');
    
    // Calculate total stops
    const totalStops = firstSlice.segments.length - 1;
    
    details.innerHTML = `
        <div class="text-left space-y-6">
            <!-- Success Header -->
            <div class="text-center">
                <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                <p class="text-gray-600">Your flight has been successfully booked</p>
            </div>

            <!-- Booking Reference -->
            <div class="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 rounded-lg p-4 text-center">
                <p class="text-sm text-gray-600 mb-1">Booking Reference</p>
                <p class="text-3xl font-bold text-orange-600 tracking-wider">${orderData.booking_reference}</p>
                <p class="text-xs text-gray-500 mt-2">Order ID: ${orderData.id}</p>
            </div>

            <!-- Flight Details -->
            <div class="border-2 border-gray-200 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                    Flight Information
                </h4>
                <div class="space-y-2 text-sm">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Airline:</span>
                        <span class="font-semibold">${firstSegment.operating_carrier.name} (${firstSegment.operating_carrier.iata_code})</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Flight Number:</span>
                        <span class="font-semibold">${firstSegment.operating_carrier.iata_code}-${firstSegment.operating_carrier_flight_number}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Route:</span>
                        <span class="font-semibold">${firstSlice.origin.iata_code} → ${firstSlice.destination.iata_code}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Departure:</span>
                        <span class="font-semibold">${departureTime}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Arrival:</span>
                        <span class="font-semibold">${arrivalTime}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Stops:</span>
                        <span class="font-semibold">${totalStops === 0 ? 'Non-stop' : `${totalStops} stop${totalStops > 1 ? 's' : ''}`}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Cabin Class:</span>
                        <span class="font-semibold capitalize">${firstSegment.passengers[0].cabin_class}</span>
                    </div>
                </div>
            </div>

            <!-- Passenger Details -->
            <div class="border-2 border-gray-200 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Passenger Information
                </h4>
                <div class="space-y-2 text-sm">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Name:</span>
                        <span class="font-semibold">${passenger.title.toUpperCase()}. ${passenger.given_name} ${passenger.family_name}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Email:</span>
                        <span class="font-semibold">${passenger.email}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Phone:</span>
                        <span class="font-semibold">${passenger.phone_number}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Date of Birth:</span>
                        <span class="font-semibold">${moment(passenger.born_on).format('MMM DD, YYYY')}</span>
                    </div>
                </div>
            </div>

            <!-- Payment Details -->
            <div class="border-2 border-gray-200 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    Payment Information
                </h4>
                <div class="space-y-2 text-sm">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Base Fare:</span>
                        <span class="font-semibold">${orderData.base_currency} ${parseFloat(orderData.base_amount).toLocaleString()}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Taxes & Fees:</span>
                        <span class="font-semibold">${orderData.tax_currency} ${parseFloat(orderData.tax_amount).toLocaleString()}</span>
                    </div>
                    <div class="flex items-center justify-between border-t-2 border-gray-300 pt-2 mt-2">
                        <span class="text-gray-900 font-bold">Total Amount:</span>
                        <span class="text-xl font-bold text-orange-600">${orderData.total_currency} ${parseFloat(orderData.total_amount).toLocaleString()}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Payment Status:</span>
                        <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            ${orderData.payment_status.awaiting_payment ? 'Pending' : 'PAID'}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">Booking Type:</span>
                        <span class="px-3 py-1 ${orderData.live_mode ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'} rounded-full text-xs font-semibold">
                            ${orderData.live_mode ? 'LIVE BOOKING' : 'TEST MODE'}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Important Notice -->
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div class="flex">
                    <svg class="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                    </svg>
                    <div class="text-sm">
                        <p class="font-semibold text-blue-800">Important Information</p>
                        <p class="text-blue-700 mt-1">A confirmation email has been sent to <strong>${passenger.email}</strong>. Please save your booking reference for future use.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    confirmation.classList.remove('hidden');
}

// Close booking confirmation modal
function closeBookingConfirmation() {
    const confirmation = document.getElementById('bookingConfirmation');
    confirmation.classList.add('hidden');
}

// Swap origin and destination
function swapOriginDestination() {
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');
    
    // Swap values
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

// Debug function to test search manually
function testSearch() {
    console.log('🧪 Manual test search triggered');
    
    // Set test data
    const origin = document.getElementById('origin');
    const destination = document.getElementById('destination');
    const departureDate = document.getElementById('departureDate');
    
    if (origin && destination && departureDate) {
        origin.value = 'Hazrat Shahjalal International Airport (DAC)';
        origin.setAttribute('data-iata', 'DAC');
        
        destination.value = 'Netaji Subhash Chandra Bose International Airport (CCU)';
        destination.setAttribute('data-iata', 'CCU');
        
        departureDate.value = '2025-10-31';
        
        console.log('🧪 Test data set, calling performSearch()');
        performSearch();
    } else {
        console.error('❌ Required form elements not found');
    }
}

// Make testSearch available globally for debugging
window.testSearch = testSearch;

// Country codes data
const countryCodes = [
    { name: 'Afghanistan', code: '+93', abbr: 'AF' },
    { name: 'Albania', code: '+355', abbr: 'AL' },
    { name: 'Algeria', code: '+213', abbr: 'DZ' },
    { name: 'Argentina', code: '+54', abbr: 'AR' },
    { name: 'Australia', code: '+61', abbr: 'AU' },
    { name: 'Austria', code: '+43', abbr: 'AT' },
    { name: 'Bahrain', code: '+973', abbr: 'BH' },
    { name: 'Bangladesh', code: '+880', abbr: 'BD' },
    { name: 'Belgium', code: '+32', abbr: 'BE' },
    { name: 'Brazil', code: '+55', abbr: 'BR' },
    { name: 'Canada', code: '+1', abbr: 'CA' },
    { name: 'China', code: '+86', abbr: 'CN' },
    { name: 'Denmark', code: '+45', abbr: 'DK' },
    { name: 'Egypt', code: '+20', abbr: 'EG' },
    { name: 'France', code: '+33', abbr: 'FR' },
    { name: 'Germany', code: '+49', abbr: 'DE' },
    { name: 'Hong Kong', code: '+852', abbr: 'HK' },
    { name: 'India', code: '+91', abbr: 'IN' },
    { name: 'Indonesia', code: '+62', abbr: 'ID' },
    { name: 'Iran', code: '+98', abbr: 'IR' },
    { name: 'Iraq', code: '+964', abbr: 'IQ' },
    { name: 'Ireland', code: '+353', abbr: 'IE' },
    { name: 'Italy', code: '+39', abbr: 'IT' },
    { name: 'Japan', code: '+81', abbr: 'JP' },
    { name: 'Jordan', code: '+962', abbr: 'JO' },
    { name: 'Kuwait', code: '+965', abbr: 'KW' },
    { name: 'Malaysia', code: '+60', abbr: 'MY' },
    { name: 'Mexico', code: '+52', abbr: 'MX' },
    { name: 'Nepal', code: '+977', abbr: 'NP' },
    { name: 'Netherlands', code: '+31', abbr: 'NL' },
    { name: 'New Zealand', code: '+64', abbr: 'NZ' },
    { name: 'Norway', code: '+47', abbr: 'NO' },
    { name: 'Oman', code: '+968', abbr: 'OM' },
    { name: 'Pakistan', code: '+92', abbr: 'PK' },
    { name: 'Philippines', code: '+63', abbr: 'PH' },
    { name: 'Poland', code: '+48', abbr: 'PL' },
    { name: 'Qatar', code: '+974', abbr: 'QA' },
    { name: 'Russia', code: '+7', abbr: 'RU' },
    { name: 'Saudi Arabia', code: '+966', abbr: 'SA' },
    { name: 'Singapore', code: '+65', abbr: 'SG' },
    { name: 'South Africa', code: '+27', abbr: 'ZA' },
    { name: 'South Korea', code: '+82', abbr: 'KR' },
    { name: 'Spain', code: '+34', abbr: 'ES' },
    { name: 'Sri Lanka', code: '+94', abbr: 'LK' },
    { name: 'Sweden', code: '+46', abbr: 'SE' },
    { name: 'Switzerland', code: '+41', abbr: 'CH' },
    { name: 'Thailand', code: '+66', abbr: 'TH' },
    { name: 'Turkey', code: '+90', abbr: 'TR' },
    { name: 'United Arab Emirates', code: '+971', abbr: 'AE' },
    { name: 'United Kingdom', code: '+44', abbr: 'GB' },
    { name: 'United States', code: '+1', abbr: 'US' },
    { name: 'Vietnam', code: '+84', abbr: 'VN' }
];

// Show country dropdown
function showCountryDropdown(index) {
    const dropdown = document.getElementById(`countryDropdown_${index}`);
    const searchInput = document.getElementById(`phoneCodeSearch_${index}`);
    
    // Populate dropdown
    populateCountryDropdown(index, countryCodes);
    
    dropdown.classList.remove('hidden');
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== searchInput) {
                dropdown.classList.add('hidden');
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

// Filter country codes based on search
function filterCountryCodes(index) {
    const searchInput = document.getElementById(`phoneCodeSearch_${index}`);
    const searchTerm = searchInput.value.toLowerCase();
    
    const filtered = countryCodes.filter(country => 
        country.name.toLowerCase().includes(searchTerm) ||
        country.code.includes(searchTerm) ||
        country.abbr.toLowerCase().includes(searchTerm)
    );
    
    populateCountryDropdown(index, filtered);
}

// Populate country dropdown
function populateCountryDropdown(index, countries) {
    const dropdown = document.getElementById(`countryDropdown_${index}`);
    
    if (countries.length === 0) {
        dropdown.innerHTML = '<div class="px-4 py-2 text-gray-500 text-sm">No countries found</div>';
        return;
    }
    
    dropdown.innerHTML = countries.map(country => `
        <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between text-sm"
             onclick="selectCountryCode(${index}, '${country.code}', '${country.name}', '${country.abbr}')">
            <span class="font-medium">${country.name}</span>
            <span class="text-gray-600">${country.code}</span>
        </div>
    `).join('');
}

// Select country code
function selectCountryCode(index, code, name, abbr) {
    const searchInput = document.getElementById(`phoneCodeSearch_${index}`);
    const hiddenInput = document.getElementById(`phoneCode_${index}`);
    const dropdown = document.getElementById(`countryDropdown_${index}`);
    
    hiddenInput.value = code;
    searchInput.value = `${code} (${abbr})`;
    dropdown.classList.add('hidden');
}

// Initialize country code display on form generation
function initializeCountryCodeDisplay(index) {
    const searchInput = document.getElementById(`phoneCodeSearch_${index}`);
    const hiddenInput = document.getElementById(`phoneCode_${index}`);
    
    if (searchInput && hiddenInput) {
        // Set default to Bangladesh
        const defaultCountry = countryCodes.find(c => c.code === '+880');
        if (defaultCountry) {
            searchInput.value = `${defaultCountry.code} (${defaultCountry.abbr})`;
        }
    }
}

// Make functions globally available
window.showCountryDropdown = showCountryDropdown;
window.filterCountryCodes = filterCountryCodes;
window.selectCountryCode = selectCountryCode;