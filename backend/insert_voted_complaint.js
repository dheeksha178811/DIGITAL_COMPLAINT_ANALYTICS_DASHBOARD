const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Admin = require('./models/Admin');
const Complaint = require('./models/Complaint');

async function insertVotedComplaint() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicconnect', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const citizenNameRegex = new RegExp('manimegalai', 'i');
    const citizen = await User.findOne({ name: citizenNameRegex });
    if (!citizen) {
      console.log('Citizen manimegalai not found!');
      process.exit(1);
    }

    const level1Admin = await Admin.findOne({ level: 1 });
    if (!level1Admin) {
      console.log('Level 1 Admin not found!');
      process.exit(1);
    }

    const geographic_unit_id = level1Admin.assigned_geographic_unit_ids[0] || citizen.geographic_unit_id;
    const category = level1Admin.department !== 'GENERAL' ? level1Admin.department : 'PUBLIC_HEALTH';

    const newComplaint = new Complaint({
      title: 'Community Flagged: Open Manhole [>15 Votes Threshold Surpassed]',
      description: 'More than 15 citizens have highly voted this as a critical issue. The threshold is surpassed, requiring immediate Level 1 Officer attention.',
      category: category,
      status: 'SUBMITTED',
      citizen_id: citizen._id,
      geographic_unit_id: geographic_unit_id,
      assigned_admin: level1Admin._id,
      location: {
        address: 'MG Road Junction',
        landmark: 'Near the bus stop'
      },
      sla_hours: 48,
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      vote_count: 17, // > 15
      current_escalation_level: 1,
      impact_level: 'HIGH'
    });

    await newComplaint.save();
    console.log(`Complaint created successfully for ${citizen.name} with 17 votes!`);
    console.log(`Title: ${newComplaint.title}`);
    console.log(`Assigned Admin: ${level1Admin.name}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

insertVotedComplaint();
