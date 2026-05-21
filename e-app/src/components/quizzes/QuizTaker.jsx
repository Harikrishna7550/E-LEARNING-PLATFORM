import React, { useState, useEffect } from "react";

// QuizTaker - student interface to answer quiz questions and get results
const QuizTaker = ({ quiz, studentId, onComplete, onClose }) => {
  // Track current question being displayed
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Store student's answers to each question
  const [answers, setAnswers] = useState({});
  // Time remaining in seconds for the quiz
  const [timeLeft, setTimeLeft] = useState(null);
  // Record when quiz started (for time tracking)
  const [startTime] = useState(new Date());
  // Show results after quiz is completed
  const [showResults, setShowResults] = useState(false);
  // Store student's final score
  const [score, setScore] = useState(0);
  // Track if quiz has started
  const [quizStarted, setQuizStarted] = useState(false);
  // Track if student accepted quiz instructions
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);

  // Safety check for quiz and questions
  if (
    !quiz ||
    !quiz.questions ||
    !Array.isArray(quiz.questions) ||
    quiz.questions.length === 0
  ) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="text-center">
              <i className="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
              <h5 className="text-muted">
                Quiz is not available or has no questions
              </h5>
              <button
                className="btn btn-secondary mt-3"
                onClick={() => window.location.reload()}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rawCurrentQuestion = quiz.questions[currentQuestionIndex];
  // Normalize legacy/backend field names — accept either questionText or question
  const currentQuestion = {
    ...rawCurrentQuestion,
    questionText:
      rawCurrentQuestion.questionText ?? rawCurrentQuestion.question ?? "",
    options: Array.isArray(rawCurrentQuestion.options)
      ? rawCurrentQuestion.options
      : [],
  };
  const totalQuestions = quiz.questions.length;

  const hasPassingPercentage =
    typeof quiz.hasPassingPercentage === "boolean"
      ? quiz.hasPassingPercentage
      : quiz.passingPercentage !== undefined;
  const effectivePassingPercentage =
    hasPassingPercentage && quiz.passingPercentage !== undefined
      ? quiz.passingPercentage
      : 70;

  const passed = score >= effectivePassingPercentage;

  // Calculate time left if deadline exists
  useEffect(() => {
    if (quiz.deadline) {
      const deadline = new Date(quiz.deadline);
      const now = new Date();
      const diff = deadline - now;

      if (diff > 0) {
        setTimeLeft(Math.floor(diff / 1000));
      } else {
        // Quiz expired
        handleSubmitQuiz();
      }
    }
  }, [quiz.deadline]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionJump = (index) => {
    setCurrentQuestionIndex(index);
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    quiz.questions.forEach((question) => {
      const userAnswer = answers[question.id];
      if (question.type === "single") {
        if (userAnswer === question.correctAnswer) {
          correctAnswers++;
        }
      } else if (question.type === "multiple") {
        const correctSet = new Set(question.correctAnswer);
        const userSet = new Set(userAnswer || []);
        if (
          correctSet.size === userSet.size &&
          [...correctSet].every((ans) => userSet.has(ans))
        ) {
          correctAnswers++;
        }
      } else if (question.type === "text") {
        const expected = (question.correctAnswer || "")
          .toString()
          .trim()
          .toLowerCase();
        const given = (userAnswer || "").toString().trim().toLowerCase();
        if (expected && given && expected === given) {
          correctAnswers++;
        }
      }
    });
    return Math.round((correctAnswers / totalQuestions) * 100);
  };

  const handleSubmitQuiz = () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);

    const attemptData = {
      quizId: quiz.id,
      studentId,
      answers,
      score: finalScore,
      completedAt: new Date().toISOString(),
      timeSpent: Math.floor((new Date() - startTime) / 1000),
    };

    onComplete(attemptData);
  };

  if (showResults) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow border-0">
              <div className="card-body text-center py-5">
                <div
                  className={`display-1 mb-4 ${passed ? "text-success" : score >= 50 ? "text-warning" : "text-danger"}`}
                >
                  {passed ? "🎉" : score >= 50 ? "👍" : "😞"}
                </div>
                <h2 className="mb-3">Quiz Completed!</h2>
                <p className={`lead mb-4 ${passed ? "text-success" : "text-danger"}`}>
                  {quiz.showScoreToStudent
                    ? passed
                      ? "Congratulations! You passed the quiz."
                      : `Unfortunately, you failed. You needed ${effectivePassingPercentage}% to pass.`
                    : passed
                      ? "Congratulations! You passed."
                      : "Unfortunately, you failed."}
                </p>
                {quiz.showScoreToStudent ? (
                  <>
                    <div className="mb-4">
                      <div className="display-4 fw-bold mb-2">{score}%</div>
                      <p className="text-muted">Your Score</p>
                    </div>

                    <div className="row text-center mb-4">
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded">
                          <h5>Correct Answers</h5>
                          <div className="h4 text-success">
                            {Math.round((score / 100) * totalQuestions)}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded">
                          <h5>Total Questions</h5>
                          <div className="h4">{totalQuestions}</div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded">
                          <h5>Status</h5>
                          <div
                            className={`h4 ${
                              score >= effectivePassingPercentage
                                ? "text-success"
                                : "text-danger"
                            }`}
                          >
                            {score >= effectivePassingPercentage
                              ? "Passed ✓"
                              : "Failed ✗"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {hasPassingPercentage && quiz.passingPercentage !== undefined && (
                      <div className="alert alert-info mb-4">
                        <strong>Passing Score:</strong> {quiz.passingPercentage}%{" "}
                        <br />
                        <strong>Your Score:</strong> {score}% <br />
                        <strong>Result:</strong>{" "}
                        {score >= quiz.passingPercentage
                          ? "✓ You Passed!"
                          : "✗ You did not pass. Required: " +
                            quiz.passingPercentage +
                            "%"}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mb-4">
                    <div className={`p-4 rounded ${
                      passed
                        ? "bg-success bg-opacity-10 text-success"
                        : "bg-danger bg-opacity-10 text-danger"
                    }`}>
                      <div className="h2 mb-2">
                        {passed ? "Passed" : "Failed"}
                      </div>
                      <p className="mb-1">
                        Your quiz result has been recorded.
                      </p>
                      {hasPassingPercentage && quiz.passingPercentage !== undefined && (
                        <p className="mb-0">
                          Required: {quiz.passingPercentage}% to pass.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => {
                    if (typeof onClose === "function") {
                      onClose();
                    } else {
                      window.location.reload();
                    }
                  }}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Instructions screen
  if (!quizStarted) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow border-0">
              <div className="card-header bg-primary text-white text-center">
                <h3 className="mb-0">{quiz.title}</h3>
              </div>
              <div className="card-body p-4">
                <h4 className="mb-4 text-center">Quiz Instructions</h4>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card bg-light border-0">
                      <div className="card-body">
                        <h6 className="fw-bold text-primary mb-3">
                          <i className="bi bi-info-circle me-2"></i>Quiz Details
                        </h6>
                        <ul className="list-unstyled">
                          <li className="mb-2">
                            <strong>Total Questions:</strong> {totalQuestions}
                          </li>
                          <li className="mb-2">
                            <strong>Maximum Attempts:</strong>{" "}
                            {quiz.maxAttempts || "Unlimited"}
                          </li>
                          {quiz.hasTimeLimit && quiz.timeLimit > 0 && (
                            <li className="mb-2">
                              <strong>Time Limit:</strong> {quiz.timeLimit}{" "}
                              minutes
                            </li>
                          )}
                          {quiz.deadline && (
                            <li className="mb-2">
                              <strong>Deadline:</strong>{" "}
                              {new Date(quiz.deadline).toLocaleString("en-IN", {
                                timeZone: "Asia/Kolkata",
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}{" "}
                              IST
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-light border-0">
                      <div className="card-body">
                        <h6 className="fw-bold text-success mb-3">
                          <i className="bi bi-trophy me-2"></i>Passing Criteria
                        </h6>
                        <div className="mb-3">
                          {hasPassingPercentage ? (
                            <div>
                              <div className="h5 text-success mb-2">
                                {effectivePassingPercentage}%
                              </div>
                              <p className="mb-0">
                                You need to score at least {effectivePassingPercentage}% to pass this quiz.
                              </p>
                            </div>
                          ) : (
                            <div>
                              <div className="h5 text-success mb-2">70%</div>
                              <p className="mb-0">
                                You need to score at least 70% to pass this quiz.
                              </p>
                            </div>
                          )}
                        </div>
                        {quiz.showScoreToStudent ? (
                          <p className="text-muted small mb-0">
                            <i className="bi bi-eye me-1"></i>Your score will be
                            shown after completion
                          </p>
                        ) : (
                          <p className="text-muted small mb-0">
                            <i className="bi bi-eye-slash me-1"></i>Only
                            pass/fail status will be shown
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="alert alert-warning">
                  <h6>
                    <i className="bi bi-exclamation-triangle me-2"></i>Important
                    Instructions
                  </h6>
                  <ul className="mb-0">
                    <li>Read each question carefully before answering</li>
                    <li>
                      You can navigate between questions using the question
                      numbers
                    </li>
                    <li>You can change your answers before submitting</li>
                    {quiz.hasTimeLimit && quiz.timeLimit > 0 && (
                      <li>
                        The quiz has a time limit of {quiz.timeLimit} minutes
                      </li>
                    )}
                    <li>Once submitted, you cannot change your answers</li>
                    <li>Make sure you have a stable internet connection</li>
                  </ul>
                </div>

                <div className="form-check mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="acceptInstructions"
                    checked={instructionsAccepted}
                    onChange={(e) => setInstructionsAccepted(e.target.checked)}
                  />
                  <label
                    className="form-check-label fw-bold"
                    htmlFor="acceptInstructions"
                  >
                    I have read and understood the instructions
                  </label>
                </div>

                <div className="text-center">
                  <button
                    className="btn btn-success btn-lg px-5"
                    disabled={!instructionsAccepted}
                    onClick={() => {
                      setQuizStarted(true);
                      if (quiz.hasTimeLimit && quiz.timeLimit > 0) {
                        setTimeLeft(quiz.timeLimit * 60);
                      }
                    }}
                  >
                    <i className="bi bi-play-circle me-2"></i>Start Quiz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow border-0">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <h4 className="mb-1">{quiz.title}</h4>
                  <p className="text-muted mb-0">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </p>
                </div>
                <div className="col-md-6 text-end">
                  {timeLeft !== null && (
                    <div className="d-inline-block">
                      <span className="badge bg-danger fs-6 p-2">
                        <i className="bi bi-clock me-1"></i>
                        Time Left: {formatTime(timeLeft)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Question Navigation */}
        <div className="col-md-3 mb-4">
          <div className="card shadow border-0">
            <div className="card-header bg-primary text-white">
              <h6 className="mb-0">Questions</h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {quiz.questions.map((_, index) => (
                  <button
                    key={index}
                    className={`btn btn-sm ${
                      index === currentQuestionIndex
                        ? "btn-primary"
                        : answers[quiz.questions[index].id]
                          ? "btn-success"
                          : "btn-outline-secondary"
                    }`}
                    onClick={() => handleQuestionJump(index)}
                  >
                    {index + 1}
                    {answers[quiz.questions[index].id] && (
                      <i className="bi bi-check-circle ms-1"></i>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Question Display */}
        <div className="col-md-9">
          <div className="card shadow border-0">
            <div className="card-body">
              <h5 className="mb-4">{currentQuestion.questionText}</h5>

              <div className="mb-4">
                {currentQuestion.type === "single" ? (
                  <div>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          id={`option-${index}`}
                          value={option}
                          checked={answers[currentQuestion.id] === option}
                          onChange={(e) =>
                            handleAnswerChange(
                              currentQuestion.id,
                              e.target.value,
                            )
                          }
                        />
                        <label
                          className="form-check-label w-100"
                          htmlFor={`option-${index}`}
                        >
                          <div className="p-3 border rounded hover-bg-light">
                            <strong>{String.fromCharCode(65 + index)})</strong>{" "}
                            {option}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : currentQuestion.type === "text" ? (
                  <div>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Type your answer here..."
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(currentQuestion.id, e.target.value)
                      }
                    />
                  </div>
                ) : (
                  <div>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`option-${index}`}
                          value={option}
                          checked={(answers[currentQuestion.id] || []).includes(
                            option,
                          )}
                          onChange={(e) => {
                            const currentAnswers =
                              answers[currentQuestion.id] || [];
                            const newAnswers = currentAnswers.includes(option)
                              ? currentAnswers.filter((ans) => ans !== option)
                              : [...currentAnswers, option];
                            handleAnswerChange(currentQuestion.id, newAnswers);
                          }}
                        />
                        <label
                          className="form-check-label w-100"
                          htmlFor={`option-${index}`}
                        >
                          <div className="p-3 border rounded hover-bg-light">
                            <strong>{String.fromCharCode(65 + index)})</strong>{" "}
                            {option}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="d-flex justify-content-between">
                <button
                  className="btn btn-outline-primary"
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                >
                  <i className="bi bi-chevron-left me-1"></i>Previous
                </button>

                <div>
                  {currentQuestionIndex === totalQuestions - 1 ? (
                    <button
                      className="btn btn-success"
                      onClick={handleSubmitQuiz}
                    >
                      <i className="bi bi-check-circle me-1"></i>Submit Quiz
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleNext}>
                      Next<i className="bi bi-chevron-right ms-1"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;
