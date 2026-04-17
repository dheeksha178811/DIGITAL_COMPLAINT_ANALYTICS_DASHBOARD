require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Admin = require('../models/Admin');
const GeographicUnit = require('../models/GeographicUnit');

/**
 * Add an overdue complaint to test escalation to Level 2
 * Run: node utils/addOverdueComplaint.js
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

const addOverdueComplaint = async () => {
  try {
    // Find existing users
    const citizen = await User.findOne({ email: 'dheeksha@gmail.com' });
    if (!citizen) {
      console.log('❌ Citizen Dheeksha not found. Please ensure user exists with email: dheeksha@gmail.com');
      return;
    }
    console.log('✅ Found citizen:', citizen.name);

    // Find Deepthi (Level 1 officer)
    const deepthi = await Admin.findOne({ email: 'deepthi@gmail.com' });
    if (!deepthi) {
      console.log('❌ Level 1 Officer Deepthi not found. Please ensure admin exists with email: deepthi@gmail.com');
      return;
    }
    console.log('✅ Found Level 1 Officer:', deepthi.name);

    // Find Shamini (Level 2 officer)
    const shamini = await Admin.findOne({ email: 'shamini@gmail.com' });
    if (!shamini) {
      console.log('❌ Level 2 Officer Shamini not found. Please ensure admin exists with email: shamini@gmail.com');
      return;
    }
    console.log('✅ Found Level 2 Officer:', shamini.name);

    // Create an overdue complaint (deadline 10 hours ago)
    const overdueDate = new Date();
    overdueDate.setHours(overdueDate.getHours() - 10); // 10 hours overdue

    const complaint = await Complaint.create({
      title: 'Urgent: Water Supply Disruption - No water for 3 days',
      description: 'There has been no water supply in our area for the past 3 days. Multiple families are affected and we are facing severe difficulties. This needs immediate attention from the authorities.',
      category: 'WATER_SUPPLY',
      geographic_unit_id: citizen.geographic_unit_id,
      location: {
        address: 'Saibaba Colony, Block 1',
        landmark: 'Near JAISRI NAGAR',
        coordinates: {
          latitude: 11.0168,
          longitude: 76.9558
        }
      },
      citizen_id: citizen._id,
      assigned_admin: deepthi._id,
      sla_hours: 24,
      deadline: overdueDate,
      current_escalation_level: 1,
      status: 'OVERDUE',
      impact_level: 'MODERATE',
      vote_count: 15,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Created 3 days ago
    });

    console.log('\n✅ Overdue Complaint Created Successfully!');
    console.log('================================');
    console.log('Complaint ID:', complaint._id);
    console.log('Title:', complaint.title);
    console.log('Category:', complaint.category);
    console.log('Status:', complaint.status);
    console.log('Deadline:', complaint.deadline);
    console.log('Hours Overdue:', Math.round((new Date() - complaint.deadline) / (1000 * 60 * 60)));
    console.log('Assigned to:', deepthi.name, '(Level 1)');
    console.log('Escalation Level:', complaint.current_escalation_level);
    console.log('Created by:', citizen.name);
    console.log('================================');
    console.log('\n✓ This complaint will now appear in:');
    console.log('  - Dheeksha\'s "My Complaints" (as OVERDUE)');
    console.log('  - Deepthi\'s dashboard (Level 1 officer)');
    console.log('  - Shamini\'s dashboard (Level 2 officer - shows overdue Level 1 complaints)');
    console.log('  - Community Feed (for upvoting)');

  } catch (error) {
    console.error('Error creating complaint:', error);
  }
};

const run = async () => {
  await connectDB();
  await addOverdueComplaint();
  mongoose.connection.close();
  console.log('\n✅ Database connection closed');
};

run();
