require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Admin = require('../models/Admin');
const Complaint = require('../models/Complaint');
const Notice = require('../models/Notice');

/**
 * Script to clear all user/complaint/notice data from MongoDB.
 * Geographic Units (states, districts, cities, wards) are PRESERVED
 * so that the registration dropdowns continue to work.
 *
 * Run with: node utils/clearData.js
 */

const connectDB = async () => {
    await mongoose.connect(
        process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicconnect'
    );
    console.log('MongoDB connected.');
};

const clearData = async () => {
    try {
        await connectDB();

        // Clear all transactional / user data
        const [users, admins, complaints, notices] = await Promise.all([
            User.deleteMany({}),
            Admin.deleteMany({}),
            Complaint.deleteMany({}),
            Notice.deleteMany({})
        ]);

        // Also clear votes if the Vote model exists
        try {
            const Vote = require('../models/Vote');
            const votes = await Vote.deleteMany({});
            console.log(`  🗑  Votes deleted    : ${votes.deletedCount}`);
        } catch (_) {
            // Vote model may not be loaded — ignore
        }

        console.log('\n✅ Mock data cleared successfully!\n');
        console.log('  🗑  Citizens deleted : ' + users.deletedCount);
        console.log('  🗑  Admins deleted   : ' + admins.deletedCount);
        console.log('  🗑  Complaints del.  : ' + complaints.deletedCount);
        console.log('  🗑  Notices deleted  : ' + notices.deletedCount);
        console.log('\n  ✔  Geographic Units (states/districts/cities/wards) are untouched.\n');
        console.log('  You can now register fresh users through the application.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        process.exit(1);
    }
};

clearData();
