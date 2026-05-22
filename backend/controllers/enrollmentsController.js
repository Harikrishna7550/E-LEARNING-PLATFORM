const Enrollment = require('../models/Enrollment');

exports.getEnrollments = async (req, res) => {
  try {
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'instructor';
    const filter = isPrivileged ? {} : { userId: req.user.id };
    const enrollments = await Enrollment.find(filter).sort({ enrolledAt: -1 });
    res.json(enrollments);
  } catch (error) {
    console.error('getEnrollments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createEnrollment = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' });
    }
    const existing = await Enrollment.findOne({ userId: req.user.id, courseId });
    if (existing) {
      return res.status(200).json(existing);
    }
    const enrollment = await Enrollment.create({
      userId: req.user.id,
      courseId,
      enrolledAt: new Date(),
      lastActive: new Date(),
    });
    res.status(201).json(enrollment);
  } catch (error) {
    console.error('createEnrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateLastActive = async (req, res) => {
  try {
    const { courseId } = req.params;
    const enrollment = await Enrollment.findOneAndUpdate(
      { userId: req.user.id, courseId },
      { lastActive: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.json(enrollment);
  } catch (error) {
    console.error('updateLastActive error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
