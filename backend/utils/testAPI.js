const mongoose = require('mongoose');
const GeographicUnit = require('../models/GeographicUnit');
require('dotenv').config();

const testAPI = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicconnect');
    console.log('MongoDB Connected\n');

    // Simulate API call 1: Get states (parent_id = null, type = STATE)
    console.log('Test 1: GET /api/public/geographic-units?type=STATE');
    const filter1 = { parent_id: null, type: 'STATE' };
    const states = await GeographicUnit.find(filter1).sort({ name: 1 });
    console.log(`Filter: ${JSON.stringify(filter1)}`);
    console.log(`Result: ${states.length} states found`);
    if (states.length > 0) {
      console.log(`First state: ${states[0].name} (${states[0]._id})\n`);

      // Simulate API call 2: Get districts (parent_id = stateId, type = DISTRICT)
      const stateId = states[0]._id;
      console.log(`Test 2: GET /api/public/geographic-units?parent_id=${stateId}&type=DISTRICT`);
      const filter2 = { parent_id: stateId, type: 'DISTRICT' };
      const districts = await GeographicUnit.find(filter2).sort({ name: 1 });
      console.log(`Filter: ${JSON.stringify(filter2)}`);
      console.log(`Result: ${districts.length} districts found`);
      if (districts.length > 0) {
        console.log(`First 5 districts:`);
        districts.slice(0, 5).forEach(d => console.log(`   - ${d.name}`));
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testAPI();
