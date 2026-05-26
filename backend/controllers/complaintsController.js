const Complaint = require('../models/Complaint');

exports.getComplaints = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const complaints = await Complaint.find().sort({ createdAt: -1 });
      return res.json(complaints);
    }
    const complaints = await Complaint.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    console.error('getComplaints error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const validateComplaintText = (raw) => {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { error: 'Complaint text is required' };
  }
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 10) {
    return { error: 'Complaint must be at least 10 characters long' };
  }
  if (trimmed.length > 1000) {
    return { error: 'Complaint must not exceed 1000 characters' };
  }
  const letterCount = (trimmed.match(/\p{L}/gu) || []).length;
  if (letterCount < 5) {
    return { error: 'Complaint must contain meaningful text, not just numbers or symbols' };
  }
  const words = trimmed.split(' ').filter((w) => /\p{L}/u.test(w));
  if (words.length < 3) {
    return { error: 'Complaint must contain at least 3 words describing the issue' };
  }
  if (/^(.)\1+$/.test(trimmed.replace(/\s/g, ''))) {
    return { error: 'Complaint cannot be a single repeated character' };
  }
  if (/(.)\1{6,}/.test(trimmed)) {
    return { error: 'Complaint contains too many repeated characters' };
  }
  return { value: trimmed };
};

exports.createComplaint = async (req, res) => {
  try {
    const { complaint } = req.body;
    const { error, value } = validateComplaintText(complaint);
    if (error) {
      return res.status(400).json({ message: error });
    }
    const createdComplaint = await Complaint.create({
      userId: req.user.id,
      userName: req.user.name,
      complaint: value,
    });
    res.status(201).json(createdComplaint);
  } catch (error) {
    console.error('createComplaint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminMessage } = req.body;
    if (!['pending', 'solved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    complaint.status = status;
    if (typeof adminMessage === 'string') {
      complaint.adminMessage = adminMessage;
    }
    await complaint.save();
    res.json(complaint);
  } catch (error) {
    console.error('updateComplaintStatus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
