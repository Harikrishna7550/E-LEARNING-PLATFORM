import React, { useState } from "react";
import { useToast } from "../../context/ToastContext";

// ManualQuizCreator - form to create quizzes with questions and options
const ManualQuizCreator = ({ onCreate }) => {
  const toast = useToast();
  // Store quiz title
  const [quizTitle, setQuizTitle] = useState("");
  // Current question being drafted (not yet saved)
  const [currentQuestion, setCurrentQuestion] = useState({
    id: Date.now(),
    type: "single",
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "",
  });

  // List of finalized questions (ready to be published)
  const [finalizedQuestions, setFinalizedQuestions] = useState([]);
  // Track which question is being edited by its ID
  const [isEditing, setIsEditing] = useState(null);

  // Change question type (single choice or multiple choice)
  const handleTypeChange = (e) => {
    const type = e.target.value;
    setCurrentQuestion({
      ...currentQuestion,
      type,
      // For text type, options aren't needed; otherwise keep 4 slots
      options: type === "text" ? [] : ["", "", "", ""],
      // Reset correct answer based on question type
      correctAnswer: type === "multiple" ? [] : "",
    });
  };

  // Save current question to the finalized list
  const saveQuestionToPreview = () => {
    if (!currentQuestion.questionText.trim()) {
      toast.warning("Please enter question text");
      return;
    }

    const correctAnswerMissing =
      currentQuestion.type === "text"
        ? !currentQuestion.correctAnswer?.toString().trim()
        : currentQuestion.type === "multiple"
        ? !Array.isArray(currentQuestion.correctAnswer) || currentQuestion.correctAnswer.length === 0
        : !currentQuestion.correctAnswer;

    if (correctAnswerMissing) {
      toast.warning("Please select or enter the correct answer before saving this question.");
      return;
    }

    // For text type, ensure options are empty so previews/quiz takers don't render boxes
    const sanitized =
      currentQuestion.type === "text"
        ? { ...currentQuestion, options: [] }
        : currentQuestion;

    if (isEditing) {
      setFinalizedQuestions(
        finalizedQuestions.map((q) => (q.id === isEditing ? sanitized : q)),
      );
      setIsEditing(null);
    } else {
      setFinalizedQuestions([
        ...finalizedQuestions,
        { ...sanitized, id: Date.now() },
      ]);
    }

    // Reset draft for next question
    setCurrentQuestion({
      id: Date.now(),
      type: "single",
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: "",
    });
  };

  const editQuestion = (id) => {
    const qToEdit = finalizedQuestions.find((q) => q.id === id);
    setCurrentQuestion(qToEdit);
    setIsEditing(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteQuestion = (id) => {
    setFinalizedQuestions(finalizedQuestions.filter((q) => q.id !== id));
  };

  const handleFinalSubmit = () => {
    if (!quizTitle) {
      toast.warning("Please enter a Quiz Title");
      return;
    }
    if (finalizedQuestions.length === 0) {
      toast.warning("Add at least one question");
      return;
    }

    onCreate({
      title: quizTitle,
      questions: finalizedQuestions.map((q) => ({
        id: String(q.id),
        type: q.type,
        question: q.questionText,
        options: q.type === "text" ? [] : q.options,
        correctAnswer: q.correctAnswer,
      })),
      totalQuestions: finalizedQuestions.length,
      createdAt: new Date().toISOString(),
      published: false,
    });

    // Reset form completely after publishing
    setQuizTitle("");
    setFinalizedQuestions([]);
    setCurrentQuestion({
      id: Date.now(),
      type: "single",
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: "",
    });
    setIsEditing(null);

    toast.success("Quiz published! You can now create a new quiz.");
  };

  return (
    <div className="container-fluid min-vh-100 bg-light py-5">
      <div className="container" style={{ maxWidth: "900px" }}>
        {/* --- SECTION 1: QUIZ HEADER --- */}
        <div className="card shadow-sm border-0 rounded-4 mb-4">
          <div className="card-body p-4 text-center">
            <h2 className="fw-bold mb-3">Create New Quiz</h2>
            <input
              type="text"
              className="form-control form-control-lg text-center border-0 bg-light rounded-3"
              placeholder="Enter Quiz Title Here..."
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
            />
          </div>
        </div>

        {/* --- SECTION 2: QUESTION CREATOR (DRAFTING AREA) --- */}
        <div
          className="card shadow border-primary border-top-0 rounded-4 mb-5"
          style={{ borderTop: "5px solid" }}
        >
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 fw-bold text-primary">
              <i
                className={`bi ${isEditing ? "bi-pencil-square" : "bi-plus-circle-fill"} me-2`}
              ></i>
              {isEditing ? "Edit Question" : "Add New Question"}
            </h5>
          </div>
          <div className="card-body p-4">
            <div className="row g-3 mb-4">
              <div className="col-md-8">
                <label className="form-label fw-semibold">Question Text</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={currentQuestion.questionText}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      questionText: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Response Type</label>
                <select
                  className="form-select"
                  value={currentQuestion.type}
                  onChange={handleTypeChange}
                >
                  <option value="single">Single Choice (Radio)</option>
                  <option value="multiple">Multiple Choice (Checkboxes)</option>
                  <option value="text">Short Answer</option>
                </select>
              </div>
            </div>

            {currentQuestion.type !== "text" && (
              <div className="row g-2 mb-4">
                {currentQuestion.options.map((opt, i) => (
                  <div key={i} className="col-6">
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-muted small">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <input
                        className="form-control border-start-0"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...currentQuestion.options];
                          newOpts[i] = e.target.value;
                          setCurrentQuestion({
                            ...currentQuestion,
                            options: newOpts,
                          });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Answer Selector Logic */}
            <div className="bg-light p-3 rounded-3 border">
              <p className="small fw-bold text-uppercase text-muted mb-2">
                Mark Correct Answer
              </p>

              {currentQuestion.type === "single" && (
                <div className="d-flex flex-wrap gap-3">
                  {currentQuestion.options.map((opt, i) => (
                    <div className="form-check" key={i}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="correct"
                        checked={currentQuestion.correctAnswer === opt}
                        onChange={() =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            correctAnswer: opt,
                          })
                        }
                      />
                      <label className="form-check-label small">
                        {opt || `Option ${i + 1}`}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion.type === "multiple" && (
                <div className="d-flex flex-wrap gap-3">
                  {currentQuestion.options.map((opt, i) => (
                    <div className="form-check" key={i}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={currentQuestion.correctAnswer.includes(opt)}
                        onChange={() => {
                          const prev = currentQuestion.correctAnswer;
                          const next = prev.includes(opt)
                            ? prev.filter((x) => x !== opt)
                            : [...prev, opt];
                          setCurrentQuestion({
                            ...currentQuestion,
                            correctAnswer: next,
                          });
                        }}
                      />
                      <label className="form-check-label small">
                        {opt || `Option ${i + 1}`}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion.type === "text" && (
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter accepted keyword..."
                  value={currentQuestion.correctAnswer}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      correctAnswer: e.target.value,
                    })
                  }
                />
              )}
            </div>

            <button
              onClick={saveQuestionToPreview}
              className="btn btn-primary w-100 mt-4 py-2 fw-bold rounded-pill"
            >
              {isEditing ? "Update Question" : "Save & Add to Preview"}
            </button>
          </div>
        </div>

        {/* --- SECTION 3: LIVE PREVIEW AREA --- */}
        <div className="mb-5">
          <div className="d-flex align-items-center mb-4">
            <hr className="flex-grow-1" />
            <span className="px-3 fw-bold text-muted small">
              LIVE PREVIEW ({finalizedQuestions.length})
            </span>
            <hr className="flex-grow-1" />
          </div>

          {finalizedQuestions.length === 0 && (
            <div className="text-center py-5 bg-white rounded-4 border border-dashed">
              <i className="bi bi-eye-slash text-muted display-4"></i>
              <p className="text-muted mt-2">No questions added yet.</p>
            </div>
          )}

          {finalizedQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden transition-all hover-shadow"
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="fw-bold mb-0">
                    <span className="text-primary me-2">Q{idx + 1}.</span>{" "}
                    {q.questionText}
                  </h5>
                  <div className="btn-group shadow-sm rounded-pill overflow-hidden">
                    <button
                      onClick={() => editQuestion(q.id)}
                      className="btn btn-white btn-sm px-3 hover-blue"
                    >
                      <i className="bi bi-pencil text-primary"></i>
                    </button>
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="btn btn-white btn-sm px-3 hover-red"
                    >
                      <i className="bi bi-trash text-danger"></i>
                    </button>
                  </div>
                </div>

                {q.type !== "text" && (
                  <div className="row g-2 mb-3">
                    {q.options.map((opt, i) => (
                      <div key={i} className="col-md-6">
                        <div
                          className={`p-2 rounded-3 border small d-flex align-items-center ${
                            (
                              Array.isArray(q.correctAnswer)
                                ? q.correctAnswer.includes(opt)
                                : q.correctAnswer === opt
                            )
                              ? "bg-success-subtle border-success text-success fw-bold"
                              : "bg-white"
                          }`}
                        >
                          <i
                            className={`bi ${q.type === "multiple" ? "bi-check2-square" : "bi-circle"} me-2`}
                          ></i>
                          {opt}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {q.type === "text" && (
                  <div className="p-2 bg-light border-start border-primary border-4 rounded small">
                    <strong>Correct Key:</strong> {q.correctAnswer}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* --- SECTION 4: FINAL SUBMISSION --- */}
        {finalizedQuestions.length > 0 && (
          <div className="text-center">
            <button
              onClick={handleFinalSubmit}
              className="btn btn-success btn-lg px-5 py-3 rounded-pill fw-bold shadow hover-scale"
            >
              <i className="bi bi-cloud-upload-fill me-2"></i> Publish Quiz Now
            </button>
          </div>
        )}
      </div>

      <style>{`
        .hover-shadow:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; transition: all 0.3s ease; }
        .hover-scale:hover { transform: scale(1.05); transition: 0.3s; }
        .hover-red:hover { background-color: #fee2e2 !important; }
        .hover-blue:hover { background-color: #dbeafe !important; }
        .btn-white { background: white; border: 1px solid #dee2e6; }
      `}</style>
    </div>
  );
};

export default ManualQuizCreator;
