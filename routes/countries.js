const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Get all countries
router.get('/countries', (req, res) => {
  try {
    const countriesPath = path.join(__dirname, '..', 'data', 'countries.json');
    const countriesData = fs.readFileSync(countriesPath, 'utf8');
    const countries = JSON.parse(countriesData);
    
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('Failed to load countries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load countries',
      details: error.message
    });
  }
});

// Search countries by name or nationality
router.get('/countries/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query parameter "q" is required'
      });
    }
    
    const countriesPath = path.join(__dirname, '..', 'data', 'countries.json');
    const countriesData = fs.readFileSync(countriesPath, 'utf8');
    const countries = JSON.parse(countriesData);
    
    const searchTerm = q.toLowerCase();
    const filteredCountries = countries.filter(country => 
      country.name.toLowerCase().includes(searchTerm) ||
      country.nationality.toLowerCase().includes(searchTerm) ||
      country.code.toLowerCase().includes(searchTerm)
    );
    
    res.json({
      success: true,
      data: filteredCountries,
      count: filteredCountries.length
    });
  } catch (error) {
    console.error('Failed to search countries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search countries',
      details: error.message
    });
  }
});

module.exports = router;
