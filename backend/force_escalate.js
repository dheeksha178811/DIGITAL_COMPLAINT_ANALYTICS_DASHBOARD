const mongoose = require('mongoose');
require('dotenv').config();

const slaService = require('./modules/sla/slaService');
const escalationService = require('./modules/escalation/escalationService');
const Complaint = require('./models/Complaint');

async function forceEscalate() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicconnect', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB for forced escalation');

    console.log('Running SLA check...');
    const overdueCount = await slaService.checkAndMarkOverdue();
    console.log(`Marked ${overdueCount} complaints as overdue`);

    const overdueComplaints = await Complaint.find({
      status: 'OVERDUE',
      current_escalation_level: { $lt: 3 }
    });

    for (const complaint of overdueComplaints) {
      await escalationService.escalateComplaint(
        complaint._id,
        'SLA_BREACH',
        'Automatically escalated due to SLA breach'
      );
    }

    console.log(`Auto-escalated ${overdueComplaints.length} overdue complaints`);

    process.exit(0);
  } catch (error) {
    console.error('Error auto-escalating:', error);
    process.exit(1);
  }
}

forceEscalate();
