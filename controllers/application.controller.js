const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

/**
 * Apply for a job
 * POST /api/applications
 */
const createApplication = async (req, res) => {
  try {
    const { 
      jobId, 
      message, 
      coverLetter,
      phone, 
      budget,
      pricingType,
      deliveryDays,
      skills,
      portfolioLink,
      agreementAccepted
    } = req.body;

    // Validate required fields
    if (!jobId || !message || !phone) {
      return res.status(400).json({
        success: false,
        message: 'jobId, message, and phone are required',
      });
    }

    // Check if user has completed profile
    if (!req.user.university) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before applying to jobs',
      });
    }

    // Find job (use lean() for read-only query before checks)
    const job = await Job.findById(jobId).populate('postedBy', 'name email').lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if job is OPEN
    if (job.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications',
      });
    }

    // Check if user is trying to apply to their own job (handle both populated and ObjectId)
    const postedById = job.postedBy?._id?.toString() || job.postedBy?.toString();
    if (postedById === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot apply to your own job',
      });
    }

    // Check if user is from same university
    if (job.university !== req.user.university) {
      return res.status(403).json({
        success: false,
        message: 'You can only apply to jobs from your university',
      });
    }

    // Check if already applied (use lean() for read-only check)
    const existingApplication = await Application.findOne({
      jobId,
      freelancerId: req.user._id,
    }).lean();

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job',
      });
    }

    // Create application
    const application = await Application.create({
      jobId,
      freelancerId: req.user._id,
      message: message.trim(),
      coverLetter: coverLetter ? coverLetter.trim() : message.trim(), // Use coverLetter if provided, else use message
      phone: phone ? phone.trim() : undefined,
      budget: budget ? Number(budget) : undefined,
      pricingType: pricingType ? pricingType.trim() : undefined,
      deliveryDays: deliveryDays ? Number(deliveryDays) : undefined,
      skills: Array.isArray(skills) ? skills.map(s => s.trim()).filter(s => s) : [],
      portfolioLink: portfolioLink ? portfolioLink.trim() : undefined,
      agreementAccepted: agreementAccepted === true || agreementAccepted === 'true',
    });

    // Populate application data
    await application.populate('freelancerId', 'name email');
    await application.populate('jobId', 'title');

    // Send email notification to job owner (client)
    const clientEmail = job.postedBy.email;
    const clientName = job.postedBy.name || 'Client';
    const freelancerName = req.user.name || req.user.email;
    const freelancerEmail = req.user.email;

    const emailSubject = 'New Application for Your Job on UniHub';
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 10px;
              border: 1px solid #ddd;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .info-section {
              background-color: #fff;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #4CAF50;
            }
            .label {
              font-weight: bold;
              color: #555;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Job Application</h2>
            </div>
            <p>Hello ${clientName},</p>
            <p>You have received a new application for your job posting on UniHub.</p>
            
            <div class="info-section">
              <p><span class="label">Job Title:</span> ${job.title}</p>
            </div>
            
            <div class="info-section">
              <p><span class="label">Freelancer Name:</span> ${freelancerName}</p>
              <p><span class="label">Freelancer Email:</span> ${freelancerEmail}</p>
              ${phone ? `<p><span class="label">Phone:</span> ${phone}</p>` : ''}
            </div>
            
            <div class="info-section">
              <p><span class="label">Message:</span></p>
              <p>${message}</p>
            </div>
            
            <p>Please log in to your UniHub app to view all applications and manage your job posting.</p>
            
            <div class="footer">
              <p>© UniHub - Connecting University Communities</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await sendEmail(clientEmail, emailSubject, emailHtml);
    } catch (emailError) {
      console.error('Failed to send application email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. The job owner has been notified via email.',
      data: { application },
    });
  } catch (error) {
    console.error('Create application error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
    });
  }
};

/**
 * Get applications for freelancer (applications they submitted)
 * GET /api/applications/freelancer
 * CAMPUS-ONLY RULE: Only returns applications for jobs from user's university
 */
const getFreelancerApplications = async (req, res) => {
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

    const query = { freelancerId: req.user._id };
    
    // Get total count (will need to filter after populate, so approximate)
    const totalBeforeFilter = await Application.countDocuments(query);

    // CAMPUS-ONLY FILTER: Only return applications for jobs from user's university
    const applications = await Application.find(query)
      .select('coverLetter budget pricingType deliveryDays skills portfolioLink phone agreementAccepted status createdAt message')
      .populate({
        path: 'jobId',
        match: { university: req.user.university }, // Filter by university
        select: 'title category budget deadline experienceLevel status postedBy university',
        populate: {
          path: 'postedBy',
          select: 'name email university',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance (read-only query)

    // Filter out applications where jobId is null (due to university mismatch)
    const filteredApplications = applications.filter(app => app.jobId !== null);
    const total = filteredApplications.length; // Approximate after filtering

    res.status(200).json({
      success: true,
      data: { 
        applications: filteredApplications, 
        count: filteredApplications.length,
        total: totalBeforeFilter, // Use approximate total
        page,
        limit,
        totalPages: Math.ceil(totalBeforeFilter / limit),
      },
    });
  } catch (error) {
    console.error('Get freelancer applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
    });
  }
};

/**
 * Get applications for client (applications for their jobs)
 * GET /api/applications/client
 * CAMPUS-ONLY RULE: Only returns applications for jobs from user's university
 */
const getClientApplications = async (req, res) => {
  try {
    // Check if user has completed profile
    if (!req.user.university) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile (university is required)',
      });
    }

    // CAMPUS-ONLY FILTER: Find all jobs posted by the user from their university
    const jobs = await Job.find({ 
      postedBy: req.user._id,
      university: req.user.university, // Ensure campus-only filtering
    }).select('_id');
    const jobIds = jobs.map(job => job._id);

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { jobId: { $in: jobIds } };
    
    // Get total count (will need to filter after populate, so approximate)
    const totalBeforeFilter = await Application.countDocuments(query);

    // Find all applications for these jobs
    // Also filter freelancers by university to ensure campus-only
    const applications = await Application.find(query)
      .select('coverLetter budget pricingType deliveryDays skills portfolioLink phone agreementAccepted status createdAt message')
      .populate({
        path: 'jobId',
        match: { university: req.user.university }, // Double-check university match
        select: 'title category budget deadline experienceLevel status university',
      })
      .populate({
        path: 'freelancerId',
        match: { university: req.user.university }, // Only freelancers from same university
        select: 'name email university skills about',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance (read-only query)

    // Filter out applications where jobId or freelancerId is null (due to university mismatch)
    const filteredApplications = applications.filter(
      app => app.jobId !== null && app.freelancerId !== null
    );

    res.status(200).json({
      success: true,
      data: { 
        applications: filteredApplications, 
        count: filteredApplications.length,
        total: totalBeforeFilter, // Use approximate total
        page,
        limit,
        totalPages: Math.ceil(totalBeforeFilter / limit),
      },
    });
  } catch (error) {
    console.error('Get client applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
    });
  }
};

/**
 * Delete/decline an application
 * DELETE /api/applications/:id
 */
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // Don't use lean() - need Mongoose document for .save()
    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Check if the user is the client (job owner) or the freelancer who applied (use lean() for read-only check)
    const job = await Job.findById(application.jobId).lean();
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    const postedById = job.postedBy?._id?.toString() || job.postedBy?.toString();
    const isClient = postedById === req.user._id.toString();
    const isFreelancer = application.freelancerId.toString() === req.user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this application',
      });
    }

    // Mark application as declined instead of deleting
    application.status = 'DECLINED';
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Application declined successfully',
    });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
    });
  }
};

module.exports = {
  createApplication,
  getFreelancerApplications,
  getClientApplications,
  deleteApplication,
};

