// Flight search and display functionality
let selectedOffer = null;
let allFlights = [];
let filteredFlights = [];
let airlinesData = {}; // Cache for airline data

// Helper function to get airline logo
function getAirlineLogo(airlineCode, airlineName) {
    // If we have the airline in our cache, use the CDN logo
    if (airlinesData[airlineCode?.toUpperCase()]) {
        return airlinesData[airlineCode.toUpperCase()].logo_cdn;
    }
    
    // Fallback: Try to construct logo URL from IATA code
    if (airlineCode && airlineCode.length === 2) {
        return `https://images.kiwi.com/airlines/64/${airlineCode.toUpperCase()}.png`;
    }
    
    // Ultimate fallback: return null to use default icon
    return null;
}

// Load airlines data
async function loadAirlinesData() {
    try {
        const response = await axios.get('/api/airlines');
        if (response.data.success) {
            // Create a map for quick lookup by IATA code
            response.data.data.forEach(airline => {
                airlinesData[airline.iata.toUpperCase()] = airline;
            });
            console.log(`✅ Loaded ${Object.keys(airlinesData).length} airline logos`);
        }
    } catch (error) {
        console.error('❌ Failed to load airlines data:', error);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Flights page loaded, initializing...');
    
    // Load airlines data for logos
    await loadAirlinesData();
    
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
        // Collapse form on mobile after search
        setTimeout(() => {
            collapseMobileSearchForm();
        }, 500);
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
    
    // Modal Price range sliders
    const priceMinSliderModal = document.getElementById('priceMinModal');
    const priceMaxSliderModal = document.getElementById('priceMaxModal');
    const priceMinValueModal = document.getElementById('priceMinValueModal');
    const priceMaxValueModal = document.getElementById('priceMaxValueModal');
    const rangeTrackFillModal = document.getElementById('rangeTrackFillModal');
    
    function updateModalPriceTrack() {
        if (!priceMinSliderModal || !priceMaxSliderModal || !rangeTrackFillModal) return;
        
        const min = parseInt(priceMinSliderModal.min);
        const max = parseInt(priceMinSliderModal.max);
        const minVal = parseInt(priceMinSliderModal.value);
        const maxVal = parseInt(priceMaxSliderModal.value);
        
        const minPercent = ((minVal - min) / (max - min)) * 100;
        const maxPercent = ((maxVal - min) / (max - min)) * 100;
        
        rangeTrackFillModal.style.left = minPercent + '%';
        rangeTrackFillModal.style.width = (maxPercent - minPercent) + '%';
    }
    
    window.updateModalPriceTrack = updateModalPriceTrack;
    
    if (priceMinSliderModal && priceMaxSliderModal) {
        updateModalPriceTrack();
        
        priceMinSliderModal.addEventListener('input', function() {
            const minVal = parseInt(this.value);
            const maxVal = parseInt(priceMaxSliderModal.value);
            
            if (minVal >= maxVal) {
                this.value = maxVal - 50;
            }
            
            priceMinValueModal.textContent = parseInt(this.value).toLocaleString();
            updateModalPriceTrack();
        });
        
        priceMaxSliderModal.addEventListener('input', function() {
            const minVal = parseInt(priceMinSliderModal.value);
            const maxVal = parseInt(this.value);
            
            if (maxVal <= minVal) {
                this.value = minVal + 50;
            }
            
            priceMaxValueModal.textContent = parseInt(this.value).toLocaleString();
            updateModalPriceTrack();
        });
    }
    
    // Make updatePriceTrack globally available
    window.updatePriceTrack = updateRangeTrackFill;
    
    // Airline filter checkboxes will be added dynamically
    
    // Passenger dropdown functionality
    setupPassengerDropdown();
});

function resetAllFilters() {
    resetPriceFilter();
    resetStopsFilter();
    resetAirlineFilters();
    console.log('🔄 All filters reset');
}

// Modal Filter Functions
function openFilterModal() {
    const modal = document.getElementById('filterModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Sync modal filters with desktop filters
    syncFiltersToModal();
}

function closeFilterModal() {
    const modal = document.getElementById('filterModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function syncFiltersToModal() {
    // Sync price range
    const priceMin = document.getElementById('priceMin').value;
    const priceMax = document.getElementById('priceMax').value;
    document.getElementById('priceMinModal').value = priceMin;
    document.getElementById('priceMaxModal').value = priceMax;
    document.getElementById('priceMinValueModal').textContent = parseInt(priceMin).toLocaleString();
    document.getElementById('priceMaxValueModal').textContent = parseInt(priceMax).toLocaleString();
    updateModalPriceTrack();
    
    // Sync stops checkboxes
    const stopsFilters = document.querySelectorAll('.stops-filter');
    const stopsFiltersModal = document.querySelectorAll('.stops-filter-modal');
    stopsFilters.forEach((checkbox, index) => {
        stopsFiltersModal[index].checked = checkbox.checked;
    });
    
    // Sync airline checkboxes
    const airlineFilters = document.querySelectorAll('input[name="airline"]');
    const airlineFiltersModal = document.querySelectorAll('input[name="airline-modal"]');
    airlineFilters.forEach((checkbox, index) => {
        if (airlineFiltersModal[index]) {
            airlineFiltersModal[index].checked = checkbox.checked;
        }
    });
}

function applyModalFilters() {
    // Sync modal filters back to desktop filters
    const priceMinModal = document.getElementById('priceMinModal').value;
    const priceMaxModal = document.getElementById('priceMaxModal').value;
    document.getElementById('priceMin').value = priceMinModal;
    document.getElementById('priceMax').value = priceMaxModal;
    document.getElementById('priceMinValue').textContent = parseInt(priceMinModal).toLocaleString();
    document.getElementById('priceMaxValue').textContent = parseInt(priceMaxModal).toLocaleString();
    updatePriceTrack();
    
    // Sync stops
    const stopsFiltersModal = document.querySelectorAll('.stops-filter-modal');
    const stopsFilters = document.querySelectorAll('.stops-filter');
    stopsFiltersModal.forEach((checkbox, index) => {
        stopsFilters[index].checked = checkbox.checked;
    });
    
    // Sync airlines
    const airlineFiltersModal = document.querySelectorAll('input[name="airline-modal"]');
    const airlineFilters = document.querySelectorAll('input[name="airline"]');
    airlineFiltersModal.forEach((checkbox, index) => {
        if (airlineFilters[index]) {
            airlineFilters[index].checked = checkbox.checked;
        }
    });
    
    // Apply filters and close modal
    applyFilters();
    updateFilterBadge();
    closeFilterModal();
}

function resetAllFiltersModal() {
    resetPriceFilterModal();
    resetStopsFilterModal();
    resetAirlineFiltersModal();
}

function resetPriceFilterModal() {
    document.getElementById('priceMinModal').value = 0;
    document.getElementById('priceMaxModal').value = 10000;
    document.getElementById('priceMinValueModal').textContent = '0';
    document.getElementById('priceMaxValueModal').textContent = '10,000';
    updateModalPriceTrack();
}

function resetStopsFilterModal() {
    document.querySelectorAll('.stops-filter-modal').forEach(checkbox => {
        checkbox.checked = true;
    });
}

function resetAirlineFiltersModal() {
    document.querySelectorAll('input[name="airline-modal"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

function updateFilterBadge() {
    const priceMin = parseInt(document.getElementById('priceMin').value);
    const priceMax = parseInt(document.getElementById('priceMax').value);
    const stopsChecked = document.querySelectorAll('.stops-filter:checked').length;
    const airlinesChecked = document.querySelectorAll('input[name="airline"]:checked').length;
    
    let activeFilters = 0;
    if (priceMin > 0 || priceMax < 10000) activeFilters++;
    if (stopsChecked < 3) activeFilters++;
    if (airlinesChecked > 0) activeFilters++;
    
    const badge = document.getElementById('mobileFilterBadge');
    if (activeFilters > 0) {
        badge.textContent = activeFilters;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeFilterModal();
    }
});

// Close modal on backdrop click
document.getElementById('filterModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'filterModal') {
        closeFilterModal();
    }
});

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

// Mobile Search Form Toggle
function toggleMobileSearchForm() {
    const formContainer = document.getElementById('searchFormContainer');
    const summary = document.getElementById('mobileSearchSummary');
    
    // Check if we're on mobile (window width < 1024px which is lg breakpoint)
    if (window.innerWidth >= 1024) {
        return; // Don't toggle on desktop
    }
    
    // Toggle visibility
    if (formContainer.classList.contains('hidden')) {
        formContainer.classList.remove('hidden');
        summary.classList.add('hidden');
        // Scroll to form
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        formContainer.classList.add('hidden');
        summary.classList.remove('hidden');
        updateMobileSearchSummary();
    }
}

// Update Mobile Search Summary
function updateMobileSearchSummary() {
    const tripType = document.querySelector('input[name="tripType"]:checked')?.value;
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const departureDate = document.getElementById('departureDate').value;
    const returnDate = document.getElementById('returnDate').value;
    
    // Update trip type
    const tripTypeText = tripType === 'roundTrip' ? 'Round Trip' : 'One Way';
    document.getElementById('summaryTripType').textContent = tripTypeText;
    
    // Update route
    document.getElementById('summaryOrigin').textContent = origin || '-';
    document.getElementById('summaryDestination').textContent = destination || '-';
    
    // Update date
    let dateText = '-';
    if (departureDate) {
        const depDate = moment(departureDate).format('MMM D, YYYY');
        if (tripType === 'roundTrip' && returnDate) {
            const retDate = moment(returnDate).format('MMM D, YYYY');
            dateText = `${depDate} - ${retDate}`;
        } else {
            dateText = depDate;
        }
    }
    document.getElementById('summaryDate').textContent = dateText;
    
    // Update passengers
    document.getElementById('summaryPassengers').textContent = document.getElementById('passengerSummary').textContent;
}

// Collapse search form on mobile after successful search
function collapseMobileSearchForm() {
    if (window.innerWidth < 1024) { // Only on mobile
        const formContainer = document.getElementById('searchFormContainer');
        const summary = document.getElementById('mobileSearchSummary');
        
        formContainer.classList.add('hidden');
        summary.classList.remove('hidden');
        updateMobileSearchSummary();
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
    
    // Update mobile summary if we have search parameters
    if (departureId && arrivalId && outboundDate) {
        updateMobileSearchSummary();
        // Show summary and hide form on mobile
        if (window.innerWidth < 1024) {
            const formContainer = document.getElementById('searchFormContainer');
            const summary = document.getElementById('mobileSearchSummary');
            formContainer.classList.add('hidden');
            summary.classList.remove('hidden');
        }
    }
    
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

// Helper function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

async function searchAirports(query, dropdown, input) {
    try {
        console.log(`🔍 Searching airports for: "${query}"`);
        dropdown.innerHTML = '<div class="p-3 text-gray-500 text-center"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>';
        dropdown.classList.remove('hidden');
        
        const response = await axios.get(`/api/places?query=${encodeURIComponent(query)}`);
        
        // Handle both formats: { data: [] } or direct array
        let places = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
            places = response.data.data;
        } else if (Array.isArray(response.data)) {
            places = response.data;
        } else {
            console.error('Invalid response format:', response.data);
            dropdown.innerHTML = '<div class="p-3 text-red-500 text-center">Invalid response from server</div>';
            return;
        }
        
        console.log(`✅ Found ${places.length} places:`, places);
        
        if (places.length === 0) {
            dropdown.innerHTML = '<div class="p-3 text-gray-500 text-center">No airports found</div>';
            dropdown.classList.remove('hidden');
            return;
        }
        
        // Build the HTML with the same style as landing page
        const html = places.map(place => {
            const icon = 'fas fa-plane';
            const badgeClass = 'airport-badge';
            const displayText = place.name;
            const subText = `${place.iata_code} • ${place.city}, ${place.country}`;
            
            return `
                <div class="place-suggestion p-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center space-x-3 hover:bg-gray-50" 
                     data-iata="${place.iata_code}" 
                     data-name="${escapeHtml(place.name)}" 
                     data-city="${place.city}"
                     data-type="airport">
                    <div class="flex-shrink-0">
                        <i class="${icon} text-gray-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-2">
                            <div class="font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(displayText)}</div>
                            <span class="place-type-badge ${badgeClass} flex-shrink-0 text-xs px-2 py-0.5 rounded">Airport</span>
                        </div>
                        <div class="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(subText)}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        dropdown.innerHTML = html;
        dropdown.classList.remove('hidden');
        
        // Add click handlers to all suggestions
        dropdown.querySelectorAll('.place-suggestion').forEach(item => {
            item.addEventListener('click', function() {
                const iata = this.getAttribute('data-iata');
                const name = this.getAttribute('data-name');
                const city = this.getAttribute('data-city');
                
                input.value = `${name} (${iata})`;
                input.setAttribute('data-iata', iata);
                input.setAttribute('data-city', city);
                input.setAttribute('data-type', 'airport');
                dropdown.classList.add('hidden');
            });
        });
        
    } catch (error) {
        console.error('❌ Error searching airports:', error);
        console.error('Error details:', error.response?.data || error.message);
        dropdown.innerHTML = '<div class="p-3 text-red-500 text-center">Error loading airports. Please try again.</div>';
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
    
    // Detailed logging
    console.log(`\n📊 ===== DISPLAYING FLIGHTS =====`);
    console.log(`Total flights to display: ${flights.length}`);
    
    // Count by source
    const sourceCount = { duffel: 0, amadeus: 0, other: 0 };
    const airlines = new Set();
    flights.forEach(flight => {
        if (flight.source === 'duffel') sourceCount.duffel++;
        else if (flight.source === 'amadeus') sourceCount.amadeus++;
        else sourceCount.other++;
        
        const seg = flight.slices[0]?.segments[0];
        const airline = seg?.airline?.name || seg?.marketing_carrier?.name || seg?.operating_carrier?.name;
        if (airline) airlines.add(airline);
    });
    
    console.log(`\n✈️  By Source:`);
    console.log(`   - Duffel: ${sourceCount.duffel} flights`);
    console.log(`   - Amadeus: ${sourceCount.amadeus} flights`);
    if (sourceCount.other > 0) console.log(`   - Other: ${sourceCount.other} flights`);
    console.log(`\n🏢 Unique Airlines: ${airlines.size}`);
    console.log(`   Airlines: ${Array.from(airlines).sort().join(', ')}`);
    console.log(`================================\n`);
    
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
            const firstSegment = slice.segments[0];
            const lastSegment = slice.segments[slice.segments.length - 1];
            
            // Use normalized structure - check both old and new formats for backwards compatibility
            const departureTime = moment(firstSegment.departure?.time || firstSegment.departing_at).format('HH:mm');
            const arrivalTime = moment(lastSegment.arrival?.time || lastSegment.arriving_at).format('HH:mm');
            const departureDate = moment(firstSegment.departure?.time || firstSegment.departing_at).format('MMM DD');
            const arrivalDate = moment(lastSegment.arrival?.time || lastSegment.arriving_at).format('MMM DD');
            const duration = moment.duration(slice.duration).humanize();
            
            // Calculate stops: number of segments minus 1
            const numStops = slice.segments.length - 1;
            const stopInfo = numStops === 0 ? 'Direct' : `${numStops} stop${numStops > 1 ? 's' : ''}`;
            
            // Get airline info - support both normalized and old format
            const airline = firstSegment.airline?.name || firstSegment.marketing_carrier?.name || firstSegment.operating_carrier?.name || 'Unknown Airline';
            const airlineCode = firstSegment.airline?.code || firstSegment.marketing_carrier?.iata_code || firstSegment.operating_carrier?.iata_code || '';
            const flightNumber = firstSegment.flight_number || firstSegment.marketing_carrier_flight_number || firstSegment.operating_carrier_flight_number || '';
            
            // Get airline logo
            const airlineLogo = getAirlineLogo(airlineCode, airline);
            
            // Get data source for debugging badge
            const dataSource = offer.source || 'unknown';
            const sourceBadge = dataSource === 'duffel' 
                ? '<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">Duffel</span>'
                : dataSource === 'amadeus'
                ? '<span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-semibold">Amadeus</span>'
                : '<span class="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold">Unknown</span>';
            
            // Get cabin class
            const cabinClass = slice.segments[0].passengers?.[0]?.cabin_class_marketing_name || 
                               slice.segments[0].passengers?.[0]?.cabin_class || 
                               'Economy';
            
            // Generate segment details for the route column
            const segmentsHtml = slice.segments.map((seg, idx) => {
                // Support both normalized and old format
                const segDepartTime = moment(seg.departure?.time || seg.departing_at).format('HH:mm');
                const segArriveTime = moment(seg.arrival?.time || seg.arriving_at).format('HH:mm');
                const segDuration = seg.duration ? moment.duration(seg.duration).humanize() : '';
                const segAirline = seg.airline?.name || seg.marketing_carrier?.name || seg.operating_carrier?.name || 'Unknown';
                const segFlightNum = seg.flight_number || seg.marketing_carrier_flight_number || seg.operating_carrier_flight_number || '';
                
                // Get origin and destination IATA codes (support both formats)
                const originIata = seg.departure?.iata_code || seg.origin?.iata_code || 'N/A';
                const destIata = seg.arrival?.iata_code || seg.destination?.iata_code || 'N/A';
                const destCity = seg.arrival?.city || seg.destination?.city_name || seg.destination?.name || destIata;
                
                // Calculate layover if not the last segment
                let layoverHtml = '';
                if (idx < slice.segments.length - 1) {
                    const nextSeg = slice.segments[idx + 1];
                    const currentArrival = seg.arrival?.time || seg.arriving_at;
                    const nextDeparture = nextSeg.departure?.time || nextSeg.departing_at;
                    const layoverMinutes = moment(nextDeparture).diff(moment(currentArrival), 'minutes');
                    const layoverHours = Math.floor(layoverMinutes / 60);
                    const layoverMins = layoverMinutes % 60;
                    const layoverText = layoverHours > 0 ? `${layoverHours}h ${layoverMins}m` : `${layoverMins}m`;
                    
                    layoverHtml = `
                        <div class="flex items-center py-2 px-3 bg-gray-50 rounded text-xs text-gray-600">
                            <i class="fas fa-clock mr-2 text-gray-400"></i>
                            <span>Layover ${layoverText} in ${destCity}</span>
                        </div>
                    `;
                }
                
                return `
                    <div class="py-2">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2 lg:space-x-4 flex-1">
                                <div class="text-center min-w-[50px] lg:min-w-[60px]">
                                    <div class="text-sm font-bold text-gray-900">${segDepartTime}</div>
                                    <div class="text-xs font-semibold text-orange-600">${originIata}</div>
                                </div>
                                
                                <div class="flex items-center flex-1 px-2 lg:px-3">
                                    <div class="flex-1 border-t border-gray-300 relative">
                                        <i class="fas fa-plane text-orange-400 text-xs absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1"></i>
                                    </div>
                                </div>
                                
                                <div class="text-center min-w-[50px] lg:min-w-[60px]">
                                    <div class="text-sm font-bold text-gray-900">${segArriveTime}</div>
                                    <div class="text-xs font-semibold text-orange-600">${destIata}</div>
                                </div>
                                
                                <div class="text-xs text-gray-500 min-w-[60px] lg:min-w-[80px] hidden lg:block">${segDuration}</div>
                            </div>
                            <div class="text-xs text-gray-500 ml-2 lg:ml-3 hidden lg:block">${segAirline} ${segFlightNum}</div>
                        </div>
                        <div class="text-xs text-gray-500 text-center mt-1 lg:hidden">${segDuration} • ${segAirline} ${segFlightNum}</div>
                    </div>
                    ${layoverHtml}
                `;
            }).join('');
            
            return `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-4 hover:shadow-md hover:border-orange-300 transition-all duration-200">
                    <!-- Mobile: Rows Layout | Desktop: 3 Columns Layout -->
                    
                    <!-- Mobile Layout (Stacked Rows) -->
                    <div class="lg:hidden space-y-4">
                        <!-- Row 1: Airline -->
                        <div class="flex items-center space-x-3 pb-4 border-b border-gray-200">
                            <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md border border-gray-200 flex-shrink-0 p-2">
                                ${airlineLogo ? 
                                    `<img src="${airlineLogo}" alt="${airline}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-plane text-orange-500 text-lg\\'></i>';">` :
                                    `<i class="fas fa-plane text-orange-500 text-lg"></i>`
                                }
                            </div>
                            <div class="flex-1">
                                <div class="text-sm font-bold text-gray-900 leading-tight">${airline}</div>
                                <div class="text-xs text-gray-500 mt-1">${flightNumber}</div>
                                <div class="mt-1">${sourceBadge}</div>
                            </div>
                        </div>
                        
                        <!-- Row 2: Flight Details -->
                        <div class="pb-4 border-b border-gray-200">
                            <!-- Main Route Summary -->
                            <div class="flex items-center justify-between mb-3">
                                <div class="text-center flex-shrink-0">
                                    <div class="text-xl font-bold text-gray-900">${departureTime}</div>
                                    <div class="text-xs font-semibold text-gray-700 mt-1">${firstSegment.departure?.iata_code || firstSegment.origin?.iata_code || 'N/A'}</div>
                                    <div class="text-xs text-gray-400 mt-1">${departureDate}</div>
                                </div>
                                
                                <div class="flex-1 px-2">
                                    <div class="relative">
                                        <div class="flex items-center justify-center">
                                            <div class="flex-1 border-t-2 border-dashed border-gray-300"></div>
                                            ${numStops > 0 ? `
                                                ${Array(numStops).fill(0).map(() => `
                                                    <div class="w-2 h-2 bg-orange-400 rounded-full mx-1"></div>
                                                    <div class="flex-1 border-t-2 border-dashed border-gray-300"></div>
                                                `).join('')}
                                            ` : ''}
                                        </div>
                                        <div class="text-center mt-2">
                                            <div class="text-xs font-medium text-gray-600">${duration}</div>
                                            <div class="text-xs text-gray-500">${stopInfo}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="text-center flex-shrink-0">
                                    <div class="text-xl font-bold text-gray-900">${arrivalTime}</div>
                                    <div class="text-xs font-semibold text-gray-700 mt-1">${lastSegment.arrival?.iata_code || lastSegment.destination?.iata_code || 'N/A'}</div>
                                    <div class="text-xs text-gray-400 mt-1">${arrivalDate}</div>
                                </div>
                            </div>
                            
                            <!-- Detailed Segments (if multiple stops) -->
                            ${numStops > 0 ? `
                                <div class="mt-3 pt-3 border-t border-gray-100">
                                    <div class="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide flex items-center">
                                        <i class="fas fa-route mr-2"></i>
                                        Flight Details (${slice.segments.length} segments)
                                    </div>
                                    <div class="space-y-1">
                                        ${segmentsHtml}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Row 3: Price & Action -->
                        <div class="flex items-center justify-between">
                            <!-- Price -->
                            <div class="text-left">
                                <div class="text-xs text-gray-500 mb-1">${cabinClass}</div>
                                <div class="text-2xl font-bold text-orange-600">${offer.total_currency} ${parseFloat(offer.total_amount).toLocaleString()}</div>
                                <div class="text-xs text-gray-500 mt-1">per person</div>
                            </div>
                            
                            <!-- Select Button -->
                            <button onclick="selectFlight('${offer.id}')" 
                                    class="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                                <span>Select</span>
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Desktop Layout (3 Columns) -->
                    <div class="hidden lg:grid grid-cols-12 gap-6">
                        <!-- Column 1: Airline (2 cols) -->
                        <div class="col-span-2">
                            <div class="flex flex-col items-center justify-center text-center space-y-2">
                                <div class="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-md border border-gray-200 p-3">
                                    ${airlineLogo ? 
                                        `<img src="${airlineLogo}" alt="${airline}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-plane text-orange-500 text-2xl\\'></i>';">` :
                                        `<i class="fas fa-plane text-orange-500 text-2xl"></i>`
                                    }
                                </div>
                                <div>
                                    <div class="text-sm font-bold text-gray-900 leading-tight">${airline}</div>
                                    <div class="text-xs text-gray-500 mt-1">${flightNumber}</div>
                                    <div class="mt-2">${sourceBadge}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Column 2: Route & Segments (7 cols) -->
                        <div class="col-span-7 border-l border-r border-gray-200 px-6">
                            <!-- Main Route Summary -->
                            <div class="flex items-center justify-between mb-3">
                                <div class="text-center flex-shrink-0">
                                    <div class="text-2xl font-bold text-gray-900">${departureTime}</div>
                                    <div class="text-sm font-semibold text-gray-700 mt-1">${firstSegment.departure?.iata_code || firstSegment.origin?.iata_code || 'N/A'}</div>
                                    <div class="text-xs text-gray-500">${firstSegment.departure?.city || firstSegment.origin?.city_name || firstSegment.origin?.name || ''}</div>
                                    <div class="text-xs text-gray-400 mt-1">${departureDate}</div>
                                </div>
                                
                                <div class="flex-1 px-4">
                                    <div class="relative">
                                        <div class="flex items-center justify-center">
                                            <div class="flex-1 border-t-2 border-dashed border-gray-300"></div>
                                            ${numStops > 0 ? `
                                                ${Array(numStops).fill(0).map(() => `
                                                    <div class="w-2 h-2 bg-orange-400 rounded-full mx-1"></div>
                                                    <div class="flex-1 border-t-2 border-dashed border-gray-300"></div>
                                                `).join('')}
                                            ` : ''}
                                        </div>
                                        <div class="text-center mt-2">
                                            <div class="text-xs font-medium text-gray-600">${duration}</div>
                                            <div class="text-xs text-gray-500">${stopInfo}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="text-center flex-shrink-0">
                                    <div class="text-2xl font-bold text-gray-900">${arrivalTime}</div>
                                    <div class="text-sm font-semibold text-gray-700 mt-1">${lastSegment.arrival?.iata_code || lastSegment.destination?.iata_code || 'N/A'}</div>
                                    <div class="text-xs text-gray-500">${lastSegment.arrival?.city || lastSegment.destination?.city_name || lastSegment.destination?.name || ''}</div>
                                    <div class="text-xs text-gray-400 mt-1">${arrivalDate}</div>
                                </div>
                            </div>
                            
                            <!-- Detailed Segments (if multiple stops) -->
                            ${numStops > 0 ? `
                                <div class="mt-4 pt-3 border-t border-gray-100">
                                    <div class="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide flex items-center">
                                        <i class="fas fa-route mr-2"></i>
                                        Flight Details (${slice.segments.length} segments)
                                    </div>
                                    <div class="space-y-1">
                                        ${segmentsHtml}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Column 3: Price & Action (3 cols) -->
                        <div class="col-span-3">
                            <div class="flex flex-col items-end space-y-4">
                                <!-- Price -->
                                <div class="text-right">
                                    <div class="text-xs text-gray-500 mb-1">${cabinClass}</div>
                                    <div class="text-3xl font-bold text-orange-600">${offer.total_currency} ${parseFloat(offer.total_amount).toLocaleString()}</div>
                                    <div class="text-xs text-gray-500 mt-1">per person</div>
                                </div>
                                
                                <!-- Select Button -->
                                <button onclick="selectFlight('${offer.id}')" 
                                        class="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                                    <span>Select Flight</span>
                                    <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                        
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
        const currentSeg = flight.slices[0].segments[0];
        const earlySeg = early.slices[0].segments[0];
        const currentDeparture = moment(currentSeg.departure?.time || currentSeg.departing_at);
        const earlyDeparture = moment(earlySeg.departure?.time || earlySeg.departing_at);
        return currentDeparture.isBefore(earlyDeparture) ? flight : early;
    });
    
    // Populate cheapest flight card
    updateSummaryCard('cheapest', cheapest);
    
    // Populate fastest flight card
    updateSummaryCard('fastest', fastest);
    
    // Populate earliest flight card
    updateSummaryCard('earliest', earliest);
    
    const earliestSeg = earliest.slices[0].segments[0];
    console.log('📊 Flight summary populated', { 
        cheapest: cheapest.total_amount, 
        fastest: moment.duration(fastest.slices[0].duration).humanize(),
        earliest: moment(earliestSeg.departure?.time || earliestSeg.departing_at).format('HH:mm')
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
        const departureTime = moment(segment.departure?.time || segment.departing_at).format('HH:mm');
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
    // Check if user is authenticated before allowing booking
    const token = localStorage.getItem('access_token');
    if (!token) {
        // Show login prompt and redirect
        if (confirm('You need to log in to book flights. Would you like to go to the login page?')) {
            // Store the current search parameters for after login
            const currentUrl = window.location.href;
            localStorage.setItem('redirect_after_login', currentUrl);
            window.location.href = '/login';
        }
        return;
    }
    
    selectedOffer = allFlights.find(offer => offer.id === offerId);
    if (selectedOffer) {
        // Redirect directly to booking summary instead of opening modal
        redirectToBookingSummary(selectedOffer);
    }
}

// New function to redirect to booking summary
function redirectToBookingSummary(offer) {
    console.log('🛫 Redirecting to booking summary with offer:', offer);
    
    // Get passenger counts from the current search
    const adults = parseInt(document.getElementById('adultsCount')?.textContent) || 1;
    const children = parseInt(document.getElementById('childrenCount')?.textContent) || 0;
    const infants = parseInt(document.getElementById('infantsCount')?.textContent) || 0;
    
    // Clear any existing booking data before storing new one
    localStorage.removeItem('pending_booking_data');
    console.log('🧹 Cleared old booking data');
    
    // CRITICAL: Get passenger IDs from the offer - these are required for Duffel booking
    const passengersFromOffer = offer.passengers || [];
    console.log('👥 Passengers from selected offer (with IDs):', passengersFromOffer);
    
    // Prepare booking data for the summary page
    const firstSeg = offer.slices[0].segments[0];
    const originIata = firstSeg.departure?.iata_code || firstSeg.origin?.iata_code || 'N/A';
    const destIata = firstSeg.arrival?.iata_code || firstSeg.destination?.iata_code || 'N/A';
    const airline = firstSeg.airline?.name || firstSeg.marketing_carrier?.name || firstSeg.operating_carrier?.name || 'Unknown';
    const departureTime = firstSeg.departure?.time || firstSeg.departing_at;
    
    const bookingData = {
        offer_id: offer.id,
        total_amount: offer.total_amount,
        total_currency: offer.total_currency,
        data_source: 'duffel', // Track the flight data source (duffel, amadeus, sabre, etc.)
        offer: offer, // Store complete offer for detailed display
        flightDetails: {
            route: `${originIata} → ${destIata}`,
            airline: airline,
            departure: departureTime
        },
        searchData: {
            passengers: adults + children + infants,
            adults: adults,
            children: children,
            infants: infants
        },
        passengers: passengersFromOffer, // Include passengers with their Duffel IDs
        offer_request_passengers: passengersFromOffer // Store original passenger data for reference
    };
    
    // Store booking data for summary page
    localStorage.setItem('pending_booking_data', JSON.stringify(bookingData));
    
    // Store the current URL for the back button
    localStorage.setItem('original_search_url', window.location.href);
    
    // Start the booking timer - store the start timestamp
    const timerStartTime = Date.now();
    localStorage.setItem('booking_timer_start', timerStartTime.toString());
    console.log('⏰ Booking timer started at:', new Date(timerStartTime).toISOString());
    
    console.log('✅ Booking data saved, redirecting to summary page...');
    
    // Redirect to booking summary page
    window.location.href = '/booking-summary.html';
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
    
    // Get selected airlines (normalize to lowercase for comparison)
    const selectedAirlines = Array.from(document.querySelectorAll('input[name="airline"]:checked'))
        .map(cb => cb.value.toLowerCase());
    
    console.log('🔍 Applying filters:', { minPrice, maxPrice, selectedStops, selectedAirlines });
    
    // Filter flights
    filteredFlights = allFlights.filter(offer => {
        const slice = offer.slices[0];
        const stops = slice.segments.length - 1;
        const price = parseFloat(offer.total_amount);
        const firstSeg = slice.segments[0];
        const airline = firstSeg.airline?.name || firstSeg.marketing_carrier?.name || firstSeg.operating_carrier?.name;
        
        // Apply price filter
        if (price < minPrice || price > maxPrice) return false;
        
        // Apply stops filter
        if (selectedStops.length > 0) {
            const stopCategory = stops === 0 ? '0' : stops === 1 ? '1' : '2+';
            if (!selectedStops.includes(stopCategory)) return false;
        }
        
        // Apply airline filter (case-insensitive comparison)
        if (selectedAirlines.length > 0 && !selectedAirlines.includes(airline?.toLowerCase())) return false;
        
        return true;
    });
    
    // Sort flights by price (cheapest first)
    filteredFlights.sort((a, b) => {
        return parseFloat(a.total_amount) - parseFloat(b.total_amount);
    });
    
    console.log(`📊 Filtered ${filteredFlights.length} flights from ${allFlights.length} total`);
    displayFlights(filteredFlights);
    updateFilterBadge();
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
    
    // Support both normalized and old format for airline names
    // Use a Map to track airlines by lowercase name but keep the original casing and code
    const airlinesMap = new Map();
    allFlights.forEach(offer => {
        const segment = offer.slices[0].segments[0];
        const airlineName = segment.airline?.name || segment.marketing_carrier?.name || segment.operating_carrier?.name || 'Unknown';
        const airlineCode = segment.airline?.code || segment.marketing_carrier?.iata_code || segment.operating_carrier?.iata_code || '';
        if (airlineName !== 'Unknown') {
            const lowerName = airlineName.toLowerCase();
            // Keep the first occurrence's casing (usually the correctly formatted one)
            if (!airlinesMap.has(lowerName)) {
                airlinesMap.set(lowerName, { name: airlineName, code: airlineCode });
            }
        }
    });
    
    const airlines = Array.from(airlinesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`✈️ Found ${airlines.length} unique airlines:`, airlines.map(a => a.name));
    
    container.innerHTML = airlines.map(airline => {
        const logoUrl = getAirlineLogo(airline.code, airline.name);
        return `
            <label class="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100">
                <div class="flex items-center">
                    <input type="checkbox" name="airline" value="${airline.name}" 
                           onchange="applyFilters()" class="mr-3 text-orange-600 focus:ring-orange-500 rounded">
                    ${logoUrl ? 
                        `<div class="w-8 h-8 mr-3 flex items-center justify-center">
                            <img src="${logoUrl}" alt="${airline.name}" class="max-w-full max-h-full object-contain" 
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                            <i class="fas fa-plane text-orange-400 text-sm" style="display:none;"></i>
                         </div>` :
                        `<i class="fas fa-plane text-orange-400 text-sm mr-3"></i>`
                    }
                    <span class="text-gray-800 font-medium">${airline.name}</span>
                </div>
            </label>
        `;
    }).join('');
    
    // Also populate modal airline filters
    const modalContainer = document.getElementById('airlinesFilterModal');
    if (modalContainer) {
        modalContainer.innerHTML = airlines.map(airline => `
            <label class="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer">
                <div class="flex items-center">
                    <input type="checkbox" name="airline-modal" value="${airline}" 
                           class="mr-3 text-orange-600 focus:ring-orange-500 rounded">
                    <span class="text-gray-800 font-medium">${airline}</span>
                </div>
                <i class="fas fa-plane text-orange-400"></i>
            </label>
        `).join('');
    }
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