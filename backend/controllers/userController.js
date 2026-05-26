const { getAllUsers, deleteUserById, findUserById } = require('../services/userService');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Rating = require('../models/Rating');
const Complaint = require('../models/Complaint');

exports.getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    if (req.user.role === 'instructor') {
      const safeUsers = users.map((u) => {
        const obj = u.toJSON ? u.toJSON() : u;
        return {
          id: obj.id,
          _id: obj._id,
          name: obj.name,
          email: obj.email,
          role: obj.role,
        };
      });
      return res.json(safeUsers);
    }
    res.json(users);
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await findUserById(id);
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    const idStr = id.toString();

    if (target.role === 'instructor') {
      const courses = await Course.find({ instructorId: idStr }).select('_id');
      const courseIds = courses.map((c) => c._id.toString());
      const quizzes = await Quiz.find({ courseId: { $in: courseIds } }).select('_id');
      const quizIds = quizzes.map((q) => q._id.toString());

      await Promise.all([
        Course.deleteMany({ instructorId: idStr }),
        courseIds.length ? Enrollment.deleteMany({ courseId: { $in: courseIds } }) : Promise.resolve(),
        courseIds.length ? Progress.deleteMany({ courseId: { $in: courseIds } }) : Promise.resolve(),
        courseIds.length ? Rating.deleteMany({ courseId: { $in: courseIds } }) : Promise.resolve(),
        courseIds.length ? Quiz.deleteMany({ courseId: { $in: courseIds } }) : Promise.resolve(),
        quizIds.length ? QuizAttempt.deleteMany({ quizId: { $in: quizIds } }) : Promise.resolve(),
      ]);
    } else if (target.role === 'student') {
      await Promise.all([
        Enrollment.deleteMany({ userId: idStr }),
        Progress.deleteMany({ userId: idStr }),
        Rating.deleteMany({ userId: idStr }),
        QuizAttempt.deleteMany({ studentId: idStr }),
        Complaint.deleteMany({ userId: idStr }),
      ]);
    }

    await deleteUserById(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
