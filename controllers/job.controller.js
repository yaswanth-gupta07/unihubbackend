const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');

/**
 * Create a new job
 * POST /api/jobs
 */
const createJob = async (req, res) => {
  try {
    const { title, category, description, budget, deadline, experienceLevel, skillsRequired } = req.body;

    // Validate required fields
    if (!title || !category || !description || !budget || !deadline || !experienceLevel) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: title, category, description, budget, deadline, experienceLevel',
      });
    }

    // Check if user has completed profile (university is required)
    if (!req.user.university) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile (university is required) before posting jobs',
      });
    }

    // Validate deadline is in the future
    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be in the future',
      });
    }

    // Create job
    const job = await Job.create({
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      budget: parseFloat(budget),
      deadline: new Date(deadline),
      experienceLevel,
      skillsRequired: Array.isArray(skillsRequired) ? skillsRequired.map(s => s.trim()).filter(s => s.length > 0) : [],
      postedBy: req.user._id,
      university: req.user.university,
      status: 'OPEN',
    });

    // Populate postedBy field
    await job.populate('postedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: { job },
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
    });
  }
};

/**
 * Get job feed for freelancers
 * GET /api/jobs
 * Filters: university == user.university, postedBy != user._id, status == OPEN
 * Query params: search, category, experienceLevel, minBudget, maxBudget
 */
const getJobs = async (req, res) => {
  try {
    // Check if user has completed profile
    if (!req.user.university) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile (university is required)',
      });
    }

    // Build query
    const query = {
      university: req.user.university,
      postedBy: { $ne: req.user._id },
      status: 'OPEN',
    };

    // Search filter - search in title, description, and skills
    const searchText = req.query.search?.trim();
    if (searchText) {
      query.$or = [
        { title: { $regex: searchText, $options: 'i' } },
        { description: { $regex: searchText, $options: 'i' } },
        { skillsRequired: { $in: [new RegExp(searchText, 'i')] } },
      ];
    }

    // Category filter
    if (req.query.category) {
      query.category = { $regex: req.query.category.trim(), $options: 'i' };
    }

    // Experience level filter
    if (req.query.experienceLevel) {
      query.experienceLevel = req.query.experienceLevel;
    }

    // Budget range filters
    if (req.query.minBudget || req.query.maxBudget) {
      query.budget = {};
      if (req.query.minBudget) {
        query.budget.$gte = parseFloat(req.query.minBudget);
      }
      if (req.query.maxBudget) {
        query.budget.$lte = parseFloat(req.query.maxBudget);
      }
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const total = await Job.countDocuments(query);

    // Fetch jobs with pagination
    const jobs = await Job.find(query)
      .populate('postedBy', 'name email university')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance (read-only query)

    // Get all job IDs
    const jobIds = jobs.map(job => job._id);

    // Get proposal counts in a single aggregation query (much faster than N queries)
    const proposalCounts = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } },
    ]);

    // Create a map for quick lookup
    const proposalCountMap = {};
    proposalCounts.forEach(item => {
      proposalCountMap[item._id.toString()] = item.count;
    });

    // Add proposal count to each job
    const jobsWithProposals = jobs.map(job => ({
      ...job,
      proposalCount: proposalCountMap[job._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      data: { 
        jobs: jobsWithProposals, 
        count: jobsWithProposals.length,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
    });
  }
};

/**
 * Get jobs posted by current user (client)
 * GET /api/jobs/my
 */
const getMyJobs = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { postedBy: req.user._id };
    
    // Get total count for pagination metadata
    const total = await Job.countDocuments(query);

    // Fetch jobs with pagination
    const jobs = await Job.find(query)
      .populate('postedBy', 'name email university')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance (read-only query)

    res.status(200).json({
      success: true,
      data: { 
        jobs, 
        count: jobs.length,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your jobs',
    });
  }
};

/**
 * Get single job by ID
 * GET /api/jobs/:id
 * CAMPUS-ONLY RULE: User can only access jobs from their own university
 */
const getJobById = async (req, res) => {
  try {
    // Check if user has completed profile
    if (!req.user.university) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile (university is required)',
      });
    }

    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email university')
      .populate('assignedTo', 'name email university')
      .lean(); // Use lean() for better performance (read-only query)

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // CAMPUS-ONLY SECURITY: Verify user can only access jobs from their university
    if (job.university !== req.user.university) {
      return res.status(403).json({
        success: false,
        message: 'You can only access jobs from your university',
      });
    }

    // Add proposal count
    const Application = require('../models/Application');
    const proposalCount = await Application.countDocuments({ jobId: job._id });
    const jobObj = { ...job, proposalCount };

    res.status(200).json({
      success: true,
      data: { job: jobObj },
    });
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
    });
  }
};

/**
 * Client selects freelancer and starts job
 * PUT /api/jobs/:id/start
 */
const startJob = async (req, res) => {
  try {
    const { freelancerId } = req.body;

    if (!freelancerId) {
      return res.status(400).json({
        success: false,
        message: 'freelancerId is required',
      });
    }

    // Don't use lean() here - need Mongoose document for .save()
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if user is the job owner
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the job owner can start a job',
      });
    }

    // Check if job is OPEN
    if (job.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        message: `Cannot start job. Current status: ${job.status}`,
      });
    }

    // Verify freelancer exists and is from same university (use lean() for read-only check)
    const freelancer = await User.findById(freelancerId).lean();
    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer not found',
      });
    }

    if (freelancer.university !== job.university) {
      return res.status(400).json({
        success: false,
        message: 'Freelancer must be from the same university',
      });
    }

    // Mark all other applications for this job as DECLINED
    const Application = require('../models/Application');
    await Application.updateMany(
      { 
        jobId: job._id,
        freelancerId: { $ne: freelancerId }
      },
      { status: 'DECLINED' }
    );

    // Mark the accepted application as ACCEPTED (if status field exists)
    await Application.updateOne(
      { 
        jobId: job._id,
        freelancerId: freelancerId
      },
      { status: 'ACCEPTED' }
    );

    // Update job
    job.status = 'IN_PROGRESS';
    job.assignedTo = freelancerId;
    await job.save();

    await job.populate('assignedTo', 'name email university');

    res.status(200).json({
      success: true,
      message: 'Job started successfully',
      data: { job },
    });
  } catch (error) {
    console.error('Start job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start job',
    });
  }
};

/**
 * Client marks job as completed
 * PUT /api/jobs/:id/complete
 */
const completeJob = async (req, res) => {
  try {
    // Don't use lean() here - need Mongoose document for .save()
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if user is the job owner
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the job owner can mark job as completed',
      });
    }

    // Check if job is IN_PROGRESS
    if (job.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete job. Current status: ${job.status}`,
      });
    }

    // Update job status
    job.status = 'COMPLETED';
    await job.save();

    await job.populate('assignedTo', 'name email university');

    res.status(200).json({
      success: true,
      message: 'Job marked as completed',
      data: { job },
    });
  } catch (error) {
    console.error('Complete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete job',
    });
  }
};

/**
 * Freelancer marks their work as complete
 * PUT /api/jobs/:id/submit-work
 */
const submitWork = async (req, res) => {
  try {
    // Don't use lean() here - need Mongoose document for .save()
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if user is the assigned freelancer
    if (!job.assignedTo || job.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned freelancer can submit work',
      });
    }

    // Check if job is IN_PROGRESS
    if (job.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit work. Current status: ${job.status}`,
      });
    }

    // Update job status to COMPLETED (waiting for client approval)
    job.status = 'COMPLETED';
    await job.save();

    await job.populate('postedBy', 'name email university');
    await job.populate('assignedTo', 'name email university');

    res.status(200).json({
      success: true,
      message: 'Work submitted successfully. Waiting for client approval.',
      data: { job },
    });
  } catch (error) {
    console.error('Submit work error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit work',
    });
  }
};

/**
 * Freelancer confirms job completion (closes the job after client approval)
 * PUT /api/jobs/:id/confirm
 */
const confirmJob = async (req, res) => {
  try {
    // Don't use lean() here - need Mongoose document for .save()
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if user is the assigned freelancer
    if (!job.assignedTo || job.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned freelancer can confirm job completion',
      });
    }

    // Check if job is COMPLETED
    if (job.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm job. Current status: ${job.status}`,
      });
    }

    // Update job status
    job.status = 'CLOSED';
    await job.save();

    await job.populate('postedBy', 'name email university');

    res.status(200).json({
      success: true,
      message: 'Job confirmed and closed',
      data: { job },
    });
  } catch (error) {
    console.error('Confirm job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm job',
    });
  }
};

/**
 * Get completed jobs count for a freelancer
 * GET /api/jobs/freelancer/:freelancerId/completed
 */
const getFreelancerCompletedJobs = async (req, res) => {
  try {
    const { freelancerId } = req.params;

    // Count completed or closed jobs assigned to this freelancer
    const count = await Job.countDocuments({
      assignedTo: freelancerId,
      status: { $in: ['COMPLETED', 'CLOSED'] },
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Get freelancer completed jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completed jobs count',
    });
  }
};

/**
 * Get jobs assigned to current freelancer
 * GET /api/jobs/assigned
 * CAMPUS-ONLY RULE: Only returns jobs from user's university
 */
const getAssignedJobs = async (req, res) => {
  try {
    // Check if user has completed profile
    if (!req.user.university) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile (university is required)',
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { 
      assignedTo: req.user._id,
      university: req.user.university, // Ensure campus-only filtering
    };

    // Get total count for pagination metadata
    const total = await Job.countDocuments(query);

    // CAMPUS-ONLY FILTER: Only return jobs from user's university
    const jobs = await Job.find(query)
      .populate('postedBy', 'name email university')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance (read-only query)

    res.status(200).json({
      success: true,
      data: { 
        jobs, 
        count: jobs.length,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get assigned jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned jobs',
    });
  }
};

module.exports = {
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
};

