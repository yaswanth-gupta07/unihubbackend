const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const {
  createApplication,
  getFreelancerApplications,
  getClientApplications,
  deleteApplication,
} = require('../controllers/application.controller');

// All application routes require authentication
router.use(authenticate);

router.post('/', createApplication);
router.get('/freelancer', getFreelancerApplications);
router.get('/client', getClientApplications);
router.delete('/:id', deleteApplication);

module.exports = router;

