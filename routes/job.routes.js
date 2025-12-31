const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const {
  createJob,
  getJobs,
  getMyJobs,
  getAssignedJobs,
  getJobById,
  startJob,
  completeJob,
  submitWork,
  confirmJob,
  getFreelancerCompletedJobs,
} = require('../controllers/job.controller');

// All job routes require authentication
router.use(authenticate);

router.post('/', createJob);
router.get('/', getJobs);
router.get('/my', getMyJobs);
router.get('/assigned', getAssignedJobs);
router.get('/freelancer/:freelancerId/completed', getFreelancerCompletedJobs);
router.get('/:id', getJobById);
router.put('/:id/start', startJob);
router.put('/:id/complete', completeJob);
router.put('/:id/submit-work', submitWork);
router.put('/:id/confirm', confirmJob);

module.exports = router;

