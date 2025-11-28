const fs = require('fs');
const path = require('path');

// Load local airports data
let localAirports = [];

try {
  const airportsData = fs.readFileSync(path.join(__dirname, '..', 'airports.json'), 'utf8');
  localAirports = JSON.parse(airportsData).airports;
  console.log(`📍 Loaded ${localAirports.length} airports from local database`);
} catch (error) {
  console.error('❌ Failed to load local airports data:', error.message);
}

module.exports = { localAirports };
