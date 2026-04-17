require('dotenv').config();
const mongoose = require('mongoose');
const GeographicUnit = require('../models/GeographicUnit');
const User = require('../models/User');
const Admin = require('../models/Admin');

/**
 * Seed script to populate initial data
 * Run: node utils/seedData.js
 */

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicconnect');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const seedGeographicUnits = async () => {
  try {
    // Clear existing units
    await GeographicUnit.deleteMany({});

    // Create Tamil Nadu State
    const state = await GeographicUnit.create({
      name: 'Tamil Nadu',
      type: 'STATE',
      parent_id: null
    });

    // All 38 districts of Tamil Nadu with their major cities and sample wards
    const districts = [
      { name: 'Ariyalur', city: 'Ariyalur', wards: ['Ward 1 - Thirumanur', 'Ward 2 - Jayankondam'] },
      { name: 'Chengalpattu', city: 'Chengalpattu', wards: ['Ward 1 - Tambaram', 'Ward 2 - Chrompet', 'Ward 3 - Pallavaram'] },
      { name: 'Chennai', city: 'Chennai City', wards: ['Ward 1 - T Nagar', 'Ward 2 - Anna Nagar', 'Ward 3 - Adyar', 'Ward 4 - Velachery', 'Ward 5 - Mylapore', 'Ward 6 - Nungambakkam'] },
      { name: 'Coimbatore', city: 'Coimbatore City', wards: ['Ward 1 - RS Puram', 'Ward 2 - Saibaba Colony', 'Ward 3 - Gandhipuram', 'Ward 4 - Peelamedu'] },
      { name: 'Cuddalore', city: 'Cuddalore', wards: ['Ward 1 - Town Area', 'Ward 2 - Porttown'] },
      { name: 'Dharmapuri', city: 'Dharmapuri', wards: ['Ward 1 - Palacode', 'Ward 2 - Pennagaram'] },
      { name: 'Dindigul', city: 'Dindigul', wards: ['Ward 1 - Begampur', 'Ward 2 - Palani'] },
      { name: 'Erode', city: 'Erode', wards: ['Ward 1 - Surampatti', 'Ward 2 - Bhavani'] },
      { name: 'Kallakurichi', city: 'Kallakurichi', wards: ['Ward 1 - Chinnasalem', 'Ward 2 - Ulundurpet'] },
      { name: 'Kanchipuram', city: 'Kanchipuram', wards: ['Ward 1 - Town Area', 'Ward 2 - Walajabad'] },
      { name: 'Kanyakumari', city: 'Nagercoil', wards: ['Ward 1 - Kottar', 'Ward 2 - Vadasery'] },
      { name: 'Karur', city: 'Karur', wards: ['Ward 1 - Thanthonimalai', 'Ward 2 - Pugalur'] },
      { name: 'Krishnagiri', city: 'Krishnagiri', wards: ['Ward 1 - Hosur', 'Ward 2 - Denkanikottai'] },
      { name: 'Madurai', city: 'Madurai City', wards: ['Ward 1 - Anna Nagar', 'Ward 2 - KK Nagar', 'Ward 3 - Pasumalai', 'Ward 4 - SS Colony'] },
      { name: 'Mayiladuthurai', city: 'Mayiladuthurai', wards: ['Ward 1 - Town Area', 'Ward 2 - Sirkazhi'] },
      { name: 'Nagapattinam', city: 'Nagapattinam', wards: ['Ward 1 - Town Area', 'Ward 2 - Velankanni'] },
      { name: 'Namakkal', city: 'Namakkal', wards: ['Ward 1 - Mohanur', 'Ward 2 - Rasipuram'] },
      { name: 'Nilgiris', city: 'Udhagamandalam (Ooty)', wards: ['Ward 1 - Charring Cross', 'Ward 2 - Coonoor'] },
      { name: 'Perambalur', city: 'Perambalur', wards: ['Ward 1 - Veppanthattai', 'Ward 2 - Kunnam'] },
      { name: 'Pudukkottai', city: 'Pudukkottai', wards: ['Ward 1 - Anna Nagar', 'Ward 2 - Aranthangi'] },
      { name: 'Ramanathapuram', city: 'Ramanathapuram', wards: ['Ward 1 - Paramakudi', 'Ward 2 - Rameswaram'] },
      { name: 'Ranipet', city: 'Ranipet', wards: ['Ward 1 - Arcot', 'Ward 2 - Walajapet'] },
      { name: 'Salem', city: 'Salem City', wards: ['Ward 1 - Fairlands', 'Ward 2 - Ammapet', 'Ward 3 - Hastampatti'] },
      { name: 'Sivaganga', city: 'Sivaganga', wards: ['Ward 1 - Karaikudi', 'Ward 2 - Devakottai'] },
      { name: 'Tenkasi', city: 'Tenkasi', wards: ['Ward 1 - Shencottai', 'Ward 2 - Sankarankovil'] },
      { name: 'Thanjavur', city: 'Thanjavur', wards: ['Ward 1 - Town Area', 'Ward 2 - Kumbakonam', 'Ward 3 - Pattukottai'] },
      { name: 'Theni', city: 'Theni', wards: ['Ward 1 - Periyakulam', 'Ward 2 - Bodinayakanur'] },
      { name: 'Thoothukudi', city: 'Thoothukudi (Tuticorin)', wards: ['Ward 1 - Palayamkottai', 'Ward 2 - Kovilpatti'] },
      { name: 'Tiruchirappalli', city: 'Tiruchirappalli (Trichy)', wards: ['Ward 1 - Srirangam', 'Ward 2 - KK Nagar', 'Ward 3 - Thillai Nagar'] },
      { name: 'Tirunelveli', city: 'Tirunelveli', wards: ['Ward 1 - Palayamkottai', 'Ward 2 - Melapalayam'] },
      { name: 'Tirupathur', city: 'Tirupathur', wards: ['Ward 1 - Ambur', 'Ward 2 - Natrampalli'] },
      { name: 'Tiruppur', city: 'Tiruppur', wards: ['Ward 1 - Avinashi', 'Ward 2 - Dharapuram'] },
      { name: 'Tiruvallur', city: 'Tiruvallur', wards: ['Ward 1 - Poonamallee', 'Ward 2 - Avadi', 'Ward 3 - Ambattur'] },
      { name: 'Tiruvannamalai', city: 'Tiruvannamalai', wards: ['Ward 1 - Town Area', 'Ward 2 - Arani'] },
      { name: 'Tiruvarur', city: 'Tiruvarur', wards: ['Ward 1 - Mannargudi', 'Ward 2 - Town Area'] },
      { name: 'Vellore', city: 'Vellore', wards: ['Ward 1 - Sathuvachari', 'Ward 2 - Katpadi'] },
      { name: 'Viluppuram', city: 'Viluppuram', wards: ['Ward 1 - Tindivanam', 'Ward 2 - Gingee'] },
      { name: 'Virudhunagar', city: 'Virudhunagar', wards: ['Ward 1 - Srivilliputtur', 'Ward 2 - Rajapalayam'] }
    ];

    const createdUnits = {};

    // Create all districts, cities, and wards
    for (const districtData of districts) {
      // Create district
      const district = await GeographicUnit.create({
        name: `${districtData.name} District`,
        type: 'DISTRICT',
        parent_id: state._id
      });

      // Create city/municipality
      const city = await GeographicUnit.create({
        name: districtData.city,
        type: 'CITY',
        parent_id: district._id
      });

      // Create wards
      const wards = [];
      for (const wardName of districtData.wards) {
        const ward = await GeographicUnit.create({
          name: wardName,
          type: 'WARD',
          parent_id: city._id
        });
        wards.push(ward);
      }

      // Store references for Chennai (for admin/user seeding)
      if (districtData.name === 'Chennai') {
        createdUnits.chennaiDistrict = district;
        createdUnits.chennaiCity = city;
        createdUnits.chennaiWard1 = wards[0];
        createdUnits.chennaiWard2 = wards[1];
        createdUnits.chennaiWard3 = wards[2];
        createdUnits.chennaiWard4 = wards[3];
      }
    }

    createdUnits.state = state;

    console.log('✅ Geographic units seeded successfully');
    console.log(`   📊 Total: 1 State, ${districts.length} Districts, ${districts.length} Cities, ${districts.reduce((sum, d) => sum + d.wards.length, 0)} Wards`);
    return createdUnits;
  } catch (error) {
    console.error('Error seeding geographic units:', error);
    throw error;
  }
};

const seedUsers = async (geoUnits) => {
  try {
    // Clear existing users
    await User.deleteMany({});

    // Get a ward for citizen registration (using Ward 1 - T Nagar)
    const ward1 = await GeographicUnit.findOne({ name: 'Ward 1 - T Nagar' });

    // Create sample citizen
    const citizen = await User.create({
      name: 'Rajesh Kumar',
      email: 'citizen@test.com',
      phone: '9876543210',
      password: 'password123',
      role: 'CITIZEN',
      credibility_score: 50,
      geographic_unit_id: ward1._id,
      address: {
        street: '45, Anna Salai, 2nd Floor',
        landmark: 'Near Pondy Bazaar Metro Station',
        pincode: '600017'
      }
    });

    // Create analyst
    const analyst = await User.create({
      name: 'Priya Sharma',
      email: 'analyst@test.com',
      phone: '9876543211',
      password: 'password123',
      role: 'GOVERNMENT_ANALYST'
    });

    // Create super admin
    const superAdmin = await User.create({
      name: 'Admin Master',
      email: 'superadmin@test.com',
      phone: '9876543212',
      password: 'password123',
      role: 'SUPER_ADMIN'
    });

    console.log('✅ Users seeded successfully');
    return { citizen, analyst, superAdmin };
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

const seedAdmins = async (geoUnits) => {
  try {
    // Clear existing admins
    await Admin.deleteMany({});

    // Create Level 1 Admin (assigned to Chennai Ward 1)
    const admin1 = await Admin.create({
      name: 'Officer Level 1',
      email: 'admin1@test.com',
      phone: '9876543213',
      password: 'password123',
      department: 'WATER_SUPPLY',
      level: 1,
      assigned_geographic_unit_ids: [geoUnits.chennaiWard1._id]
    });

    // Create Level 2 Admin (assigned to multiple wards – handles ALL departments)
    const admin2 = await Admin.create({
      name: 'Officer Level 2',
      email: 'admin2@test.com',
      phone: '9876543214',
      password: 'password123',
      department: 'GENERAL',
      level: 2,
      assigned_geographic_unit_ids: [geoUnits.chennaiWard1._id, geoUnits.chennaiWard2._id]
    });

    // Create Level 3 Admin (assigned to Chennai District)
    const admin3 = await Admin.create({
      name: 'Officer Level 3',
      email: 'admin3@test.com',
      phone: '9876543215',
      password: 'password123',
      department: 'WATER_SUPPLY',
      level: 3,
      assigned_geographic_unit_ids: [geoUnits.chennaiDistrict._id]
    });

    console.log('✅ Admins seeded successfully');
    return { admin1, admin2, admin3 };
  } catch (error) {
    console.error('Error seeding admins:', error);
    throw error;
  }
};

const seedData = async () => {
  try {
    console.log('🌱 Starting data seed...\n');

    await connectDB();

    const geoUnits = await seedGeographicUnits();
    const users = await seedUsers(geoUnits);
    const admins = await seedAdmins(geoUnits);

    console.log('\n✨ Database seeded successfully!\n');
    console.log('📝 Test Credentials:');
    console.log('-------------------');
    console.log('Citizen:');
    console.log('  Email: citizen@test.com');
    console.log('  Password: password123\n');
    console.log('Admin Level 1:');
    console.log('  Email: admin1@test.com');
    console.log('  Password: password123\n');
    console.log('Admin Level 2:');
    console.log('  Email: admin2@test.com');
    console.log('  Password: password123\n');
    console.log('Admin Level 3:');
    console.log('  Email: admin3@test.com');
    console.log('  Password: password123\n');
    console.log('Government Analyst:');
    console.log('  Email: analyst@test.com');
    console.log('  Password: password123\n');
    console.log('Super Admin:');
    console.log('  Email: superadmin@test.com');
    console.log('  Password: password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed
seedData();
