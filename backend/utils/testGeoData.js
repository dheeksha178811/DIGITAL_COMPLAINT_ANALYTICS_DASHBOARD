const mongoose = require('mongoose');
const GeographicUnit = require('../models/GeographicUnit');
require('dotenv').config();

const testGeoData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicconnect');
    console.log('MongoDB Connected\n');

    // Test 1: Get all states
    const states = await GeographicUnit.find({ parent_id: null, type: 'STATE' });
    console.log(`✅ States (${states.length}):`);
    states.forEach(s => console.log(`   - ${s.name} (ID: ${s._id})`));

    if (states.length > 0) {
      // Test 2: Get all districts for first state
      const stateId = states[0]._id;
      const districts = await GeographicUnit.find({ parent_id: stateId, type: 'DISTRICT' });
      console.log(`\n✅ Districts for ${states[0].name} (${districts.length}):`);
      districts.slice(0, 5).forEach(d => console.log(`   - ${d.name} (ID: ${d._id})`));
      if (districts.length > 5) {
        console.log(`   ... and ${districts.length - 5} more`);
      }

      if (districts.length > 0) {
        // Test 3: Get all cities for first district
        const districtId = districts[0]._id;
        const cities = await GeographicUnit.find({ parent_id: districtId });
        console.log(`\n✅ Cities for ${districts[0].name} (${cities.length}):`);
        cities.forEach(c => console.log(`   - ${c.name} (${c.type}) (ID: ${c._id})`));

        if (cities.length > 0) {
          // Test 4: Get all wards for first city
          const cityId = cities[0]._id;
          const wards = await GeographicUnit.find({ parent_id: cityId });
          console.log(`\n✅ Wards for ${cities[0].name} (${wards.length}):`);
          wards.forEach(w => console.log(`   - ${w.name}`));
        }
      }
    }

    // Test 5: Total counts
    const totalStates = await GeographicUnit.countDocuments({ type: 'STATE' });
    const totalDistricts = await GeographicUnit.countDocuments({ type: 'DISTRICT' });
    const totalCities = await GeographicUnit.countDocuments({ type: 'CITY' });
    const totalWards = await GeographicUnit.countDocuments({ type: 'WARD' });

    console.log('\n📊 Total Counts:');
    console.log(`   States: ${totalStates}`);
    console.log(`   Districts: ${totalDistricts}`);
    console.log(`   Cities: ${totalCities}`);
    console.log(`   Wards: ${totalWards}`);
    console.log(`   GRAND TOTAL: ${totalStates + totalDistricts + totalCities + totalWards} geographic units`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testGeoData();
