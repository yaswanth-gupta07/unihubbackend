const Review = require('../models/Review');
const Job = require('../models/Job');

/**
 * Create a review for a freelancer
 * POST /api/reviews
 */
const createReview = async (req, res) => {
  try {
    const { jobId, rating, comment } = req.body;

    if (!jobId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'jobId and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Get the job (use lean() for read-only query)
    const job = await Job.findById(jobId)
      .populate('assignedTo', '_id')
      .populate('postedBy', '_id')
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if user is the job owner (client) - handle both populated and ObjectId
    const postedById = job.postedBy?._id?.toString() || job.postedBy?.toString();
    if (postedById !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the job owner can create a review',
      });
    }

    // Check if job is COMPLETED
    if (job.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `Cannot review job. Current status: ${job.status}`,
      });
    }

    // Check if review already exists (use lean() for read-only check)
    const existingReview = await Review.findOne({ jobId }).lean();
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this job',
      });
    }

    // Check if job has assigned freelancer
    if (!job.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Job has no assigned freelancer',
      });
    }

    // Get freelancer ID (handle both populated and ObjectId)
    const freelancerId = job.assignedTo?._id?.toString() || job.assignedTo?.toString();

    // Create review
    const review = await Review.create({
      jobId,
      freelancerId: freelancerId,
      clientId: req.user._id,
      rating,
      comment: comment || '',
    });

    // Update job status to CLOSED after review is created (need to fetch as document for .save())
    const jobDoc = await Job.findById(jobId);
    if (jobDoc) {
      jobDoc.status = 'CLOSED';
      await jobDoc.save();
    }

    await review.populate('freelancerId', 'name email');
    await review.populate('clientId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review },
    });
  } catch (error) {
    console.error('Create review error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this job',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
    });
  }
};

/**
 * Get reviews for a freelancer
 * GET /api/reviews/freelancer/:freelancerId
 */
const getFreelancerReviews = async (req, res) => {
  try {
    const { freelancerId } = req.params;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { freelancerId };
    
    // Get total count for pagination metadata
    const total = await Review.countDocuments(query);

    const reviews = await Review.find(query)
      .populate('clientId', 'name email')
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance (read-only query)

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating: avgRating,
        totalReviews: reviews.length,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get freelancer reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
    });
  }
};

/**
 * Get review for a specific job
 * GET /api/reviews/job/:jobId
 */
const getJobReview = async (req, res) => {
  try {
    const { jobId } = req.params;

    const review = await Review.findOne({ jobId })
      .populate('freelancerId', 'name email')
      .populate('clientId', 'name email')
      .populate('jobId', 'title')
      .lean(); // Use lean() for better performance (read-only query)

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { review },
    });
  } catch (error) {
    console.error('Get job review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
    });
  }
};

module.exports = {
  createReview,
  getFreelancerReviews,
  getJobReview,
};

