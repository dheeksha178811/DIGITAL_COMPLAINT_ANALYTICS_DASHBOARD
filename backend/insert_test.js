const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Admin = require('./models/Admin');
const Complaint = require('./models/Complaint');

async function insertOverdueComplaint() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicconnect', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const citizenNameRegex = new RegExp('DHEEKSHA', 'i');
    const citizen = await User.findOne({ name: citizenNameRegex });
    if (!citizen) {
      console.log('Citizen DHEEKSHA not found!');
      process.exit(1);
    }

    const level1Admin = await Admin.findOne({ name: new RegExp('deepthi', 'i'), level: 1 });
    if (!level1Admin) {
      console.log('Level 1 Admin deepthi not found!');
      process.exit(1);
    }

    const level2Admin = await Admin.findOne({ name: new RegExp('shamini', 'i'), level: 2 });
    if (!level2Admin) {
      console.log('Level 2 Admin shamini not found!');
      process.exit(1);
    }

    const geographic_unit_id = level1Admin.assigned_geographic_unit_ids[0] || citizen.geographic_unit_id;
    const category = level1Admin.department || 'GENERAL';

    // Create an overdue complaint
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // SLA hours is typically 48 for some, 24 for others
    const sla_hours = 24;
    const deadline = new Date(yesterday.getTime() - (sla_hours * 60 * 60 * 1000));

    const newComplaint = new Complaint({
      title: 'Water pipe broke on Main Street (Test Overdue)',
      description: 'The main water pipe has been broken for days. Needs urgent fixing.',
      category: category,
      status: 'ASSIGNED',
      citizen_id: citizen._id,
      geographic_unit_id: geographic_unit_id,
      assigned_admin: level1Admin._id,
      location: {
        address: '123 Main Street',
        landmark: 'Near the park',
        coordinates: {
          latitude: 13.0827,
          longitude: 80.2707
        }
      },
      sla_hours: sla_hours,
      deadline: deadline, // Deadline is way past (yesterday minus sla hours)
      createdAt: new Date(deadline.getTime() - (sla_hours * 60 * 60 * 1000)), // Created even earlier
      current_escalation_level: 1,
      impact_level: 'HIGH'
    });

    await newComplaint.save();
    console.log(`Complaint created successfully for ${citizen.name}!`);
    console.log(`Assigned to Level 1 Admin: ${level1Admin.name}`);
    console.log(`Complaint ID: ${newComplaint._id}`);
    console.log(`Deadline was: ${deadline}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

insertOverdueComplaint();
