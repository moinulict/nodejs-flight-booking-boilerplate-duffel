const express = require('express');
const { localAirports } = require('../config/airports');

const router = express.Router();

// Search places (airports only) - Local fallback implementation
router.get('/places', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({ data: [] });
    }

    const searchQuery = query.trim().toLowerCase();
    
    // Filter to only show airports (not cities)
    const matchedPlaces = localAirports.filter(place => {
      // Only include airports, exclude cities
      if (place.type !== 'airport') {
        return false;
      }
      
      const nameMatch = place.name.toLowerCase().includes(searchQuery);
      const cityMatch = place.city.toLowerCase().includes(searchQuery);
      const countryMatch = place.country.toLowerCase().includes(searchQuery);
      const codeMatch = place.iata_code.toLowerCase().includes(searchQuery);
      
      return nameMatch || cityMatch || countryMatch || codeMatch;
    });

    // Sort results: exact matches first, then alphabetically
    const sortedPlaces = matchedPlaces.sort((a, b) => {
      const aNameLower = a.name.toLowerCase();
      const bNameLower = b.name.toLowerCase();
      const aCityLower = a.city.toLowerCase();
      const bCityLower = b.city.toLowerCase();
      
      // Check for exact matches
      const aExact = aNameLower === searchQuery || a.iata_code.toLowerCase() === searchQuery || aCityLower === searchQuery;
      const bExact = bNameLower === searchQuery || b.iata_code.toLowerCase() === searchQuery || bCityLower === searchQuery;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Alphabetical order by airport name
      return a.name.localeCompare(b.name);
    });
    
    console.log(`🔍 Airport search query: "${query}" - Found ${sortedPlaces.length} airports`);
    res.json({ data: sortedPlaces.slice(0, 10) }); // Limit to 10 results
    
  } catch (error) {
    console.error('Places search error:', error.message);
    res.status(500).json({ 
      error: 'Failed to search places',
      details: error.message 
    });
  }
});

// Get popular airports - Returns frequently searched airports from data
router.get('/popular-airports', async (req, res) => {
  try {
    // Define popular airport codes (most searched international hubs)
    const popularCodes = ['LHR', 'JFK', 'CDG', 'DXB', 'SIN', 'LAX', 'AMS', 'FRA'];
    
    // Filter airports from the persistent data
    const popularAirports = localAirports.filter(airport => 
      popularCodes.includes(airport.iata_code) && airport.type === 'airport'
    );
    
    // Sort by the order in popularCodes array
    const sortedPopular = popularCodes
      .map(code => popularAirports.find(airport => airport.iata_code === code))
      .filter(airport => airport !== undefined);
    
    console.log(`✈️  Loaded ${sortedPopular.length} popular airports from persistent data`);
    res.json({ 
      success: true,
      data: sortedPopular 
    });
    
  } catch (error) {
    console.error('Popular airports error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to load popular airports',
      details: error.message 
    });
  }
});

module.exports = router;
