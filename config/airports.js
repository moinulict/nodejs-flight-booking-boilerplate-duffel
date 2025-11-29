const fs = require('fs');
const path = require('path');

// Load local airports data from persistent data folder
let localAirports = [];

try {
  const airportsData = fs.readFileSync(path.join(__dirname, '..', 'data', 'airports.json'), 'utf8');
  localAirports = JSON.parse(airportsData).airports;
  console.log(`📍 Loaded ${localAirports.length} airports from persistent data source (data/airports.json)`);
} catch (error) {
  console.error('❌ Failed to load airports data from data/airports.json:', error.message);
  console.error('Please ensure data/airports.json exists and is properly formatted');
}

module.exports = { localAirports };
