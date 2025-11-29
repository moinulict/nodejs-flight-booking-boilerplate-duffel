const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Load airlines data
let airlinesData = null;

async function loadAirlinesData() {
    if (!airlinesData) {
        try {
            const data = await fs.readFile(path.join(__dirname, '../data/airlines.json'), 'utf8');
            airlinesData = JSON.parse(data);
            console.log(`✅ Loaded ${airlinesData.airlines.length} airlines from data/airlines.json`);
        } catch (error) {
            console.error('❌ Failed to load airlines data:', error);
            airlinesData = { airlines: [] };
        }
    }
    return airlinesData;
}

// Get all airlines
router.get('/airlines', async (req, res) => {
    try {
        const data = await loadAirlinesData();
        res.json({
            success: true,
            data: data.airlines
        });
    } catch (error) {
        console.error('❌ Error fetching airlines:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load airlines data'
        });
    }
});

// Get airline by IATA code
router.get('/airlines/:iata', async (req, res) => {
    try {
        const { iata } = req.params;
        const data = await loadAirlinesData();
        
        const airline = data.airlines.find(a => 
            a.iata.toLowerCase() === iata.toLowerCase()
        );
        
        if (airline) {
            res.json({
                success: true,
                data: airline
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Airline not found'
            });
        }
    } catch (error) {
        console.error('❌ Error fetching airline:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load airline data'
        });
    }
});

// Get airline logo URL by code or name
router.get('/airlines/logo/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const data = await loadAirlinesData();
        
        // Try to find by IATA code first, then by name
        let airline = data.airlines.find(a => 
            a.iata.toLowerCase() === identifier.toLowerCase()
        );
        
        if (!airline) {
            airline = data.airlines.find(a => 
                a.name.toLowerCase() === identifier.toLowerCase()
            );
        }
        
        if (airline) {
            res.json({
                success: true,
                data: {
                    logo: airline.logo,
                    logo_cdn: airline.logo_cdn,
                    iata: airline.iata,
                    name: airline.name
                }
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Airline not found'
            });
        }
    } catch (error) {
        console.error('❌ Error fetching airline logo:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load airline logo'
        });
    }
});

module.exports = router;
