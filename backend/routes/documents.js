const express = require('express');
const Document = require('../models/Document');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Submit document for verification
router.post('/submit', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'PDF document is required' });
    }

    // Check if user already has a pending or approved document
    const existingDocument = await Document.findOne({
      user: req.user._id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingDocument) {
      return res.status(400).json({ 
        message: 'You already have a document submission. Please wait for review or resubmit after rejection.' 
      });
    }

    const document = new Document({
      user: req.user._id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: 'pdf'
    });

    await document.save();
    await document.populate('user', 'name email');

    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's document status
router.get('/my-documents', auth, async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user._id })
      .sort({ submissionDate: -1 });

    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pending documents (Admin only)
router.get('/pending', adminAuth, async (req, res) => {
  try {
    const documents = await Document.find({ status: 'pending' })
      .populate('user', 'name email')
      .sort({ submissionDate: -1 });

    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Review document (Admin only)
router.put('/review/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.status = status;
    document.reviewDate = new Date();
    document.reviewedBy = req.user._id;

    await document.save();

    // If approved, update user verification status
    if (status === 'approved') {
      await User.findByIdAndUpdate(document.user, { isVerified: true });
    }

    await document.populate('user', 'name email');
    res.json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete document request (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document request deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
