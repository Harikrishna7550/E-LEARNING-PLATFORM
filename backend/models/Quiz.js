const mongoose = require('mongoose');
const applyJsonTransform = require('./plugins/toJSONTransform');

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['single', 'multiple', 'text'], default: 'single' },
  question: { type: String, required: true },
  options: { type: [String], default: [] },
  correctAnswer: { type: mongoose.Schema.Types.Mixed, required: true },
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    courseId: { type: String, required: true },
    courseTitle: { type: String, required: true },
    instructorId: { type: String, required: true },
    instructorName: { type: String, required: true },
    questions: { type: [questionSchema], default: [] },
    published: { type: Boolean, default: false },
    deadline: { type: Date },
    maxAttempts: { type: Number, default: 1 },
    hasTimeLimit: { type: Boolean, default: false },
    timeLimit: { type: Number, default: 0 },
    passingPercentage: { type: Number, default: 70 },
    hasPassingPercentage: { type: Boolean, default: true },
    showScoreToStudent: { type: Boolean, default: true },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

applyJsonTransform(quizSchema);
applyJsonTransform(questionSchema);

module.exports = mongoose.model('Quiz', quizSchema);
