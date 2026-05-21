const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const QuizAttempt = require('../models/QuizAttempt');

exports.getQuizzes = async (req, res) => {
  try {
    const query = req.user && req.user.role === 'admin' ? {} : { published: true };
    const quizzes = await Quiz.find(query).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    console.error('getQuizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyQuizzes = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = req.user.role === 'admin' ? {} : { instructorId: userId };
    const quizzes = await Quiz.find(query).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    console.error('getMyQuizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      questions,
      maxAttempts,
      passingPercentage,
      showScoreToStudent,
      hasPassingPercentage,
      hasTimeLimit,
      timeLimit,
      deadline,
    } = req.body;
    const user = req.user;
    if (!['instructor', 'admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden: only instructors can create quizzes' });
    }
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (course.instructorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: can only create quizzes for your own course' });
    }
    const quiz = await Quiz.create({
      title,
      description,
      courseId,
      courseTitle: course.title,
      instructorId: user.id,
      instructorName: user.name,
      questions: questions || [],
      maxAttempts: maxAttempts || 1,
      passingPercentage: passingPercentage || 70,
      hasPassingPercentage: hasPassingPercentage !== undefined ? hasPassingPercentage : true,
      hasTimeLimit: hasTimeLimit !== undefined ? hasTimeLimit : false,
      timeLimit: timeLimit || 0,
      deadline: deadline ? new Date(deadline) : undefined,
      showScoreToStudent: showScoreToStudent !== false,
      published: false,
    });
    res.status(201).json(quiz);
  } catch (error) {
    console.error('createQuiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const user = req.user;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    if (quiz.instructorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: can only update your own quiz' });
    }
    Object.assign(quiz, req.body);
    await quiz.save();
    res.json(quiz);
  } catch (error) {
    console.error('updateQuiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const user = req.user;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    if (quiz.instructorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: can only delete your own quiz' });
    }
    await Promise.all([
      Quiz.deleteOne({ _id: quizId }),
      QuizAttempt.deleteMany({ quizId: quizId.toString() }),
    ]);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('deleteQuiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
