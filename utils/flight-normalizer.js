/**
 * Flight Data Normalizer
 * 
 * This utility normalizes flight data from different providers (Duffel, Amadeus)
 * into a common format that the frontend can consume consistently.
 * 
 * Common Format:
 * - Unified price structure
 * - Consistent datetime formats
 * - Standardized airline/airport codes
 * - Source tracking for each offer
 */

/**
 * Normalize Duffel flight offer to common format
 * @param {Object} duffelOffer - Raw offer from Duffel API
 * @returns {Object} Normalized offer
 */
function normalizeDuffelOffer(duffelOffer) {
    try {
        return {
            // Source tracking
            id: duffelOffer.id,
            source: 'duffel',
            provider_data: {
                offer_id: duffelOffer.id,
                expires_at: duffelOffer.expires_at,
                payment_requirements: duffelOffer.payment_requirements
            },
            
            // Price information
            price: {
                total: parseFloat(duffelOffer.total_amount),
                base: parseFloat(duffelOffer.base_amount || duffelOffer.total_amount),
                currency: duffelOffer.total_currency,
                tax: parseFloat(duffelOffer.tax_amount || 0),
                fees: []
            },
            
            // Backward compatibility - keep old property names
            total_amount: duffelOffer.total_amount,
            total_currency: duffelOffer.total_currency,
            base_amount: duffelOffer.base_amount,
            tax_amount: duffelOffer.tax_amount,
            
            // Flight segments
            slices: duffelOffer.slices.map(slice => ({
                origin: {
                    iata_code: slice.origin.iata_code,
                    city: slice.origin.city_name,
                    airport: slice.origin.name,
                    terminal: slice.segments[0]?.origin_terminal
                },
                destination: {
                    iata_code: slice.destination.iata_code,
                    city: slice.destination.city_name,
                    airport: slice.destination.name,
                    terminal: slice.segments[slice.segments.length - 1]?.destination_terminal
                },
                departure_time: slice.segments[0]?.departing_at,
                arrival_time: slice.segments[slice.segments.length - 1]?.arriving_at,
                duration: slice.duration,
                segments: slice.segments.map(segment => ({
                    departure: {
                        iata_code: segment.origin.iata_code,
                        city: segment.origin.city_name,
                        airport: segment.origin.name,
                        terminal: segment.origin_terminal,
                        time: segment.departing_at
                    },
                    arrival: {
                        iata_code: segment.destination.iata_code,
                        city: segment.destination.city_name,
                        airport: segment.destination.name,
                        terminal: segment.destination_terminal,
                        time: segment.arriving_at
                    },
                    airline: {
                        code: segment.marketing_carrier.iata_code,
                        name: segment.marketing_carrier.name,
                        logo: segment.marketing_carrier.logo_symbol_url
                    },
                    operating_airline: segment.operating_carrier ? {
                        code: segment.operating_carrier.iata_code,
                        name: segment.operating_carrier.name
                    } : null,
                    flight_number: `${segment.marketing_carrier.iata_code}${segment.marketing_carrier_flight_number}`,
                    aircraft: segment.aircraft?.name || 'Unknown',
                    duration: segment.duration,
                    stops: 0
                }))
            })),
            
            // Cabin and passenger info
            cabin_class: duffelOffer.slices[0]?.segments[0]?.passengers[0]?.cabin_class_marketing_name || 'Economy',
            passengers: duffelOffer.passengers || [],
            
            // Additional info
            allowed_checked_bags: duffelOffer.slices[0]?.segments[0]?.passengers[0]?.baggages?.[0]?.quantity || 0,
            refundable: false, // Duffel doesn't provide this directly
            
            // Raw data for booking
            raw_data: duffelOffer
        };
    } catch (error) {
        console.error('Error normalizing Duffel offer:', error);
        return null;
    }
}

/**
 * Normalize Amadeus flight offer to common format
 * @param {Object} amadeusOffer - Raw offer from Amadeus API
 * @param {Object} dictionaries - Amadeus dictionaries for lookups
 * @returns {Object} Normalized offer
 */
function normalizeAmadeusOffer(amadeusOffer, dictionaries = {}) {
    try {
        // Helper to get carrier name from code
        const getCarrierName = (code) => dictionaries.carriers?.[code] || code;
        
        // Helper to get aircraft name from code
        const getAircraftName = (code) => dictionaries.aircraft?.[code] || code;
        
        // Helper to parse ISO duration (PT5H30M -> hours and minutes)
        const parseDuration = (isoDuration) => {
            const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
            if (!match) return isoDuration;
            const hours = parseInt(match[1] || 0);
            const minutes = parseInt(match[2] || 0);
            return `${hours}h ${minutes}m`;
        };
        
        return {
            // Source tracking
            id: `amadeus_${amadeusOffer.id}`,
            source: 'amadeus',
            provider_data: {
                offer_id: amadeusOffer.id,
                source: amadeusOffer.source,
                instant_ticketing_required: amadeusOffer.instantTicketingRequired,
                last_ticketing_date: amadeusOffer.lastTicketingDate
            },
            
            // Price information
            price: {
                total: parseFloat(amadeusOffer.price.grandTotal || amadeusOffer.price.total),
                base: parseFloat(amadeusOffer.price.base),
                currency: amadeusOffer.price.currency,
                tax: parseFloat(amadeusOffer.price.total) - parseFloat(amadeusOffer.price.base),
                fees: amadeusOffer.price.fees || []
            },
            
            // Backward compatibility - keep old property names
            total_amount: (amadeusOffer.price.grandTotal || amadeusOffer.price.total),
            total_currency: amadeusOffer.price.currency,
            base_amount: amadeusOffer.price.base,
            tax_amount: (parseFloat(amadeusOffer.price.total) - parseFloat(amadeusOffer.price.base)).toString(),
            
            // Flight segments
            slices: amadeusOffer.itineraries.map(itinerary => {
                const firstSegment = itinerary.segments[0];
                const lastSegment = itinerary.segments[itinerary.segments.length - 1];
                
                return {
                    origin: {
                        iata_code: firstSegment.departure.iataCode,
                        city: dictionaries.locations?.[firstSegment.departure.iataCode]?.cityCode || firstSegment.departure.iataCode,
                        airport: firstSegment.departure.iataCode,
                        terminal: firstSegment.departure.terminal
                    },
                    destination: {
                        iata_code: lastSegment.arrival.iataCode,
                        city: dictionaries.locations?.[lastSegment.arrival.iataCode]?.cityCode || lastSegment.arrival.iataCode,
                        airport: lastSegment.arrival.iataCode,
                        terminal: lastSegment.arrival.terminal
                    },
                    departure_time: firstSegment.departure.at,
                    arrival_time: lastSegment.arrival.at,
                    duration: parseDuration(itinerary.duration),
                    segments: itinerary.segments.map(segment => ({
                        departure: {
                            iata_code: segment.departure.iataCode,
                            city: dictionaries.locations?.[segment.departure.iataCode]?.cityCode || segment.departure.iataCode,
                            airport: segment.departure.iataCode,
                            terminal: segment.departure.terminal,
                            time: segment.departure.at
                        },
                        arrival: {
                            iata_code: segment.arrival.iataCode,
                            city: dictionaries.locations?.[segment.arrival.iataCode]?.cityCode || segment.arrival.iataCode,
                            airport: segment.arrival.iataCode,
                            terminal: segment.arrival.terminal,
                            time: segment.arrival.at
                        },
                        airline: {
                            code: segment.carrierCode,
                            name: getCarrierName(segment.carrierCode),
                            logo: null // Amadeus doesn't provide logo URLs
                        },
                        operating_airline: segment.operating ? {
                            code: segment.operating.carrierCode,
                            name: getCarrierName(segment.operating.carrierCode)
                        } : null,
                        flight_number: `${segment.carrierCode}${segment.number}`,
                        aircraft: getAircraftName(segment.aircraft?.code),
                        duration: parseDuration(segment.duration),
                        stops: segment.numberOfStops || 0
                    }))
                };
            }),
            
            // Cabin and passenger info
            cabin_class: amadeusOffer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
            passengers: amadeusOffer.travelerPricings || [],
            
            // Additional info
            allowed_checked_bags: amadeusOffer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity || 0,
            refundable: false, // Would need to check fareDetailsBySegment
            
            // Raw data for booking
            raw_data: amadeusOffer
        };
    } catch (error) {
        console.error('Error normalizing Amadeus offer:', error);
        return null;
    }
}

/**
 * Normalize multiple offers from different sources
 * @param {Array} duffelOffers - Array of Duffel offers
 * @param {Array} amadeusOffers - Array of Amadeus offers
 * @param {Object} amadeusDictionaries - Amadeus dictionaries
 * @returns {Array} Combined and normalized offers
 */
function normalizeAllOffers(duffelOffers = [], amadeusOffers = [], amadeusDictionaries = {}) {
    const normalized = [];
    
    // Normalize Duffel offers
    if (duffelOffers && duffelOffers.length > 0) {
        console.log(`📦 Normalizing ${duffelOffers.length} Duffel offers...`);
        duffelOffers.forEach(offer => {
            const normalized_offer = normalizeDuffelOffer(offer);
            if (normalized_offer) {
                normalized.push(normalized_offer);
            }
        });
    }
    
    // Normalize Amadeus offers
    if (amadeusOffers && amadeusOffers.length > 0) {
        console.log(`📦 Normalizing ${amadeusOffers.length} Amadeus offers...`);
        amadeusOffers.forEach(offer => {
            const normalized_offer = normalizeAmadeusOffer(offer, amadeusDictionaries);
            if (normalized_offer) {
                normalized.push(normalized_offer);
            }
        });
    }
    
    console.log(`✅ Total normalized offers: ${normalized.length}`);
    return normalized;
}

/**
 * Sort offers by price (lowest first)
 * @param {Array} offers - Normalized offers
 * @returns {Array} Sorted offers
 */
function sortOffersByPrice(offers) {
    return offers.sort((a, b) => a.price.total - b.price.total);
}

module.exports = {
    normalizeDuffelOffer,
    normalizeAmadeusOffer,
    normalizeAllOffers,
    sortOffersByPrice
};
