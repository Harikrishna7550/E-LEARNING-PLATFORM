import React, { useState } from "react";
import ManualQuizCreator from "../forms/ManualQuizCreator";
import QuizPreview from "./QuizPreview";
import QuizPublish from "./QuizPublish";
import QuizAnalytics from "./QuizAnalytics";
import { useToast } from "../../context/ToastContext";

// QuizManagement - instructor interface to create, edit, publish and manage quizzes
const QuizManagement = ({
  courses,
  quizzes,
  onCreateQuiz,
  onUpdateQuiz,
  onPublishQuiz,
  onDeleteQuiz,
  onExtendDeadline,
  quizAttempts = [],
  users = [],
}) => {
  const toast = useToast();
  // Track active tab (create, preview, publish, analytics)
  const [activeSubTab, setActiveSubTab] = useState("create");
  // Store currently selected quiz for editing/publishing
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  // Show/hide publish modal popup
  const [showPublishModal, setShowPublishModal] = useState(false);
  // Show/hide extend deadline modal
  const [showExtendModal, setShowExtendModal] = useState(false);
  // Data for extending quiz deadline
  const [extendData, setExtendData] = useState({
    newDeadline: "",
    newDeadlineTime: "23:59",
  });

  // Safety checks - ensure data is always arrays
  const safeCourses = Array.isArray(courses) ? courses : [];
  const safeQuizzes = Array.isArray(quizzes) ? quizzes : [];

  // Separate draft quizzes from published ones
  const createdQuizzes = safeQuizzes.filter((q) => q && !q.published);
  const publishedQuizzes = safeQuizzes.filter((q) => q && q.published);

  const handleQuizClick = (quiz) => {
    setSelectedQuiz(quiz);
    setActiveSubTab("preview");
  };

  const handlePublishClick = (quiz) => {
    setSelectedQuiz(quiz);
    setShowPublishModal(true);
  };

  const handleExtendClick = (quiz) => {
    setSelectedQuiz(quiz);
    setShowExtendModal(true);
    // Pre-fill with current deadline
    if (quiz.deadline) {
      const deadlineDate = new Date(quiz.deadline);
      setExtendData({
        newDeadline: deadlineDate.toISOString().split("T")[0],
        newDeadlineTime: deadlineDate.toTimeString().substring(0, 5),
      });
    }
  };

  const handleExtendConfirm = () => {
    if (selectedQuiz && extendData.newDeadline) {
      const newDeadline = new Date(
        `${extendData.newDeadline}T${extendData.newDeadlineTime}:00`,
      );
      if (newDeadline <= new Date()) {
        toast.warning("New deadline must be in the future.");
        return;
      }
      onExtendDeadline(selectedQuiz.id, newDeadline.toISOString());
      setShowExtendModal(false);
      setSelectedQuiz(null);
      setExtendData({ newDeadline: "", newDeadlineTime: "23:59" });
      toast.success("Deadline extended successfully!");
    }
  };

  const handlePublishConfirm = (publishData) => {
    if (selectedQuiz && selectedQuiz.id) {
      onPublishQuiz(selectedQuiz.id, publishData);
      setShowPublishModal(false);
      setSelectedQuiz(null);
      setActiveSubTab("published");
    } else {
      toast.error("Error: Quiz not found");
      setShowPublishModal(false);
    }
  };

  const handleDeleteQuiz = (quiz) => {
    if (!onDeleteQuiz) return;
    if (window.confirm(`Are you sure you want to delete the quiz "${quiz.title}"? This cannot be undone.`)) {
      onDeleteQuiz(quiz.id || quiz._id);
      if (selectedQuiz && (selectedQuiz.id === quiz.id || selectedQuiz._id === quiz._id)) {
        setSelectedQuiz(null);
        setActiveSubTab("created");
      }
      toast.success("Quiz deleted successfully.");
    }
  };

  const handleEndQuiz = (quiz) => {
    if (
      window.confirm(
        `Are you sure you want to end the quiz "${quiz.title}"? This will make it unavailable to students.`,
      )
    ) {
      // Update quiz to unpublish it (move to created quizzes)
      const updatedQuiz = {
        ...quiz,
        published: false,
        endedAt: new Date().toISOString(),
      };
      onUpdateQuiz(quiz.id, updatedQuiz);
      toast.success("Quiz ended successfully!");
    }
  };

  return (
    <div className="container-fluid">
      {/* Sub Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm rounded mb-4">
        <div className="container-fluid">
          <div className="navbar-nav mx-auto">
            <button
              className={`nav-link mx-3 ${activeSubTab === "create" ? "text-primary fw-bold" : "text-dark"}`}
              onClick={() => setActiveSubTab("create")}
            >
              <i className="bi bi-plus-circle me-2"></i>Create Quiz
            </button>
            <button
              className={`nav-link mx-3 ${activeSubTab === "created" ? "text-primary fw-bold" : "text-dark"}`}
              onClick={() => setActiveSubTab("created")}
            >
              <i className="bi bi-list-check me-2"></i>Created Quizzes
            </button>
            <button
              className={`nav-link mx-3 ${activeSubTab === "published" ? "text-primary fw-bold" : "text-dark"}`}
              onClick={() => setActiveSubTab("published")}
            >
              <i className="bi bi-check-circle me-2"></i>Published Quizzes
            </button>
            <button
              className={`nav-link mx-3 ${activeSubTab === "analytics" ? "text-primary fw-bold" : "text-dark"}`}
              onClick={() => setActiveSubTab("analytics")}
            >
              <i className="bi bi-bar-chart me-2"></i>Analytics
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      {activeSubTab === "create" && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow border-0">
              <div className="card-body">
                <h5 className="card-title fw-bold mb-3">Create Manual Quiz</h5>
                <QuizCreatorWrapper
                  courses={safeCourses}
                  onCreateQuiz={onCreateQuiz}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "created" && (
        <div>
          <h4 className="mb-4 fw-bold">Created Quizzes</h4>
          <div className="row">
            {createdQuizzes.map((quiz) => (
              <div key={quiz.id} className="col-md-4 mb-4">
                <div className="card shadow border-0 h-100">
                  <div className="card-body d-flex flex-column">
                    <h6 className="fw-bold mb-2">{quiz.title}</h6>
                    <p className="small text-muted mb-2">
                      Course:{" "}
                      {safeCourses.find((c) => c.id === quiz.courseId)?.title}
                    </p>
                    <p className="small text-muted mb-3">
                      Questions: {quiz.totalQuestions}
                    </p>
                    <div className="mt-auto d-flex flex-wrap gap-2 justify-content-between align-items-center">
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleQuizClick(quiz)}
                        >
                          <i className="bi bi-eye me-1"></i>Preview
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handlePublishClick(quiz)}
                        >
                          <i className="bi bi-upload me-1"></i>Publish
                        </button>
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteQuiz(quiz)}
                      >
                        <i className="bi bi-trash me-1"></i>Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {createdQuizzes.length === 0 && (
              <div className="col-12">
                <div className="text-center py-5">
                  <i className="bi bi-info-circle display-4 text-muted mb-3"></i>
                  <h5 className="text-muted">No created quizzes yet</h5>
                  <p className="text-muted">
                    Create your first quiz to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "preview" && selectedQuiz && (
        <QuizPreview
          quiz={selectedQuiz}
          onBack={() => setActiveSubTab("created")}
          onUpdate={(updatedQuiz) => {
            if (selectedQuiz && selectedQuiz.id) {
              onUpdateQuiz(selectedQuiz.id, updatedQuiz);
            }
          }}
        />
      )}

      {activeSubTab === "published" && (
        <div>
          <h4 className="mb-4 fw-bold">Published Quizzes</h4>
          <div className="row">
            {publishedQuizzes.map((quiz) => (
              <div key={quiz.id} className="col-md-4 mb-4">
                <div className="card shadow border-0 h-100">
                  <div className="card-body d-flex flex-column">
                    <h6 className="fw-bold mb-2">{quiz.title}</h6>
                    <p className="small text-muted mb-1">
                      Course:{" "}
                      {safeCourses.find((c) => c.id === quiz.courseId)?.title}
                    </p>
                    <p className="small text-muted mb-1">
                      Deadline: {new Date(quiz.deadline).toLocaleDateString()}
                    </p>
                    <p className="small text-muted mb-3">
                      Attempts: {quiz.maxAttempts}
                    </p>
                    <div className="mt-auto">
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleExtendClick(quiz)}
                      >
                        <i className="bi bi-calendar-plus me-1"></i>Extend
                        Deadline
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleEndQuiz(quiz)}
                      >
                        <i className="bi bi-x-circle me-1"></i>End Quiz
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {publishedQuizzes.length === 0 && (
              <div className="col-12">
                <div className="text-center py-5">
                  <i className="bi bi-check-circle display-4 text-muted mb-3"></i>
                  <h5 className="text-muted">No published quizzes yet</h5>
                  <p className="text-muted">Publish a quiz to see it here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "analytics" && (
        <QuizAnalytics
          quizzes={publishedQuizzes}
          courses={safeCourses}
          quizAttempts={quizAttempts}
          users={users}
        />
      )}

      {showPublishModal && selectedQuiz && (
        <QuizPublish
          quiz={selectedQuiz}
          courses={safeCourses}
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublishConfirm}
        />
      )}

      {showExtendModal && selectedQuiz && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">Extend Quiz Deadline</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowExtendModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    New Deadline Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={extendData.newDeadline}
                    onChange={(e) =>
                      setExtendData({
                        ...extendData,
                        newDeadline: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    New Deadline Time (IST)
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    value={extendData.newDeadlineTime}
                    onChange={(e) =>
                      setExtendData({
                        ...extendData,
                        newDeadlineTime: e.target.value,
                      })
                    }
                    required
                  />
                  <div className="form-text">
                    Time in Indian Standard Time (IST, UTC+5:30)
                  </div>
                </div>
                {extendData.newDeadline && (
                  <div className="alert alert-info">
                    <strong>New Deadline Preview:</strong>
                    <br />
                    {new Date(
                      `${extendData.newDeadline}T${extendData.newDeadlineTime}:00`,
                    ).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowExtendModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleExtendConfirm}
                >
                  <i className="bi bi-calendar-plus me-2"></i>Extend Deadline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPublishModal && selectedQuiz && (
        <QuizPublish
          quiz={selectedQuiz}
          courses={safeCourses}
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublishConfirm}
        />
      )}
    </div>
  );
};

// Wrapper for quiz creation
const QuizCreatorWrapper = ({ courses, onCreateQuiz }) => {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const toast = useToast();

  const safeCourses = courses || [];

  const handleCreateQuiz = (quizData) => {
    if (!selectedCourseId) {
      toast.warning("Please select a course for the quiz.");
      return;
    }
    const quiz = {
      courseId: selectedCourseId,
      ...quizData,
    };
    onCreateQuiz(quiz);
    toast.success("Quiz created successfully!");
  };

  return (
    <div>
      <div className="mb-3">
        <label className="form-label fw-bold">Associated Course</label>
        <select
          className="form-select"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
        >
          <option value="">Choose a course...</option>
          {safeCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      {selectedCourseId && <ManualQuizCreator onCreate={handleCreateQuiz} />}
    </div>
  );
};

export default QuizManagement;
