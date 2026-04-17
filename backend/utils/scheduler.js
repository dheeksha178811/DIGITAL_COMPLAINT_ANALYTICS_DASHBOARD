const cron = require('node-cron');
const slaService = require('../modules/sla/slaService');
const escalationService = require('../modules/escalation/escalationService');
const Complaint = require('../models/Complaint');

/**
 * Background job scheduler for automated tasks
 */

/**
 * Initialize cron jobs
 */
exports.initScheduler = () => {
  // Check for overdue complaints every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('Running SLA check...');
      const overdueCount = await slaService.checkAndMarkOverdue();
      console.log(`Marked ${overdueCount} complaints as overdue`);
      
      // Auto-escalate overdue complaints
      if (overdueCount > 0) {
        await autoEscalateOverdue();
      }
    } catch (error) {
      console.error('Error in SLA check cron:', error);
    }
  });

  console.log('Scheduler initialized - SLA monitoring active');
};

/**
 * Auto-escalate overdue complaints
 */
async function autoEscalateOverdue() {
  try {
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
  } catch (error) {
    console.error('Error auto-escalating:', error);
  }
}
