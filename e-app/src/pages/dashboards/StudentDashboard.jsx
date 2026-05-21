import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Navbar from "../../components/layout/Navbar";
import Profile from "../Profile";
import CourseList from "../../components/courses/CourseList";
import CourseCard from "../../components/courses/CourseCard";
import CoursePlayer from "../../components/courses/CoursePlayer";
import QuizTaker from "../../components/quizzes/QuizTaker";
import StudentOwnPerformanceDashboard from "../../components/StudentOwnPerformanceDashboard";

// Student Dashboard - shows courses, progress, quizzes and ratings
export default function StudentDashboard() {
  // Get current user and logout function from auth context
  const { user, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  // Track which tab is currently active (dashboard, courses, quizzes, etc)
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Store which course student is currently viewing
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courseProgress, setCourseProgress] = useState({});
  const [quizzes, setQuizzes] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [courseRatings, setCourseRatings] = useState({});
  // Track if student is currently taking a quiz
  const [takingQuiz, setTakingQuiz] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [expandedQuizAttempts, setExpandedQuizAttempts] = useState({});
  // For rating form - which course to rate
  const [ratingCourseId, setRatingCourseId] = useState("");
  // For rating form - course star rating
  const [courseRatingValue, setCourseRatingValue] = useState(5);
  // For rating form - instructor star rating
  const [instructorRatingValue, setInstructorRatingValue] = useState(5);
  // For rating form - comment text
  const [ratingComment, setRatingComment] = useState("");

  const API_BASE = "http://localhost:5000/api";

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, enrollmentsRes, progressRes, quizzesRes, complaintsRes, quizAttemptsRes, ratingsRes] = await Promise.all([
          fetch(`${API_BASE}/courses`, { credentials: "include" }),
          fetch(`${API_BASE}/enrollments`, { credentials: "include" }),
          fetch(`${API_BASE}/progress`, { credentials: "include" }),
          fetch(`${API_BASE}/quizzes`, { credentials: "include" }),
          fetch(`${API_BASE}/complaints`, { credentials: "include" }),
          fetch(`${API_BASE}/quiz-attempts`, { credentials: "include" }),
          fetch(`${API_BASE}/ratings`, { credentials: "include" }),
        ]);
        if (coursesRes.ok) setCourses(await coursesRes.json());
        if (enrollmentsRes.ok) setEnrollments(await enrollmentsRes.json());
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          const progressMap = {};
          progressData.forEach(p => progressMap[p.courseId] = p);
          setCourseProgress(progressMap);
        }
        if (quizzesRes.ok) setQuizzes(await quizzesRes.json());
        if (complaintsRes.ok) setComplaints(await complaintsRes.json());
        if (quizAttemptsRes.ok) setQuizAttempts(await quizAttemptsRes.json());
        if (ratingsRes.ok) {
          const ratingsData = await ratingsRes.json();
          const ratingsMap = {};
          ratingsData.forEach(r => ratingsMap[r.courseId] = r);
          setCourseRatings(ratingsMap);
        }
      } catch (error) {
        console.error("Failed to fetch student data", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // No localStorage sync for student dashboard data

  // Get only courses that student is enrolled in
  const enrolledCourses = (enrollments || [])
    .filter((e) => e.userId === user.id)
    .map((e) => (courses || []).find((c) => c._id === e.courseId))
    .filter(Boolean);
  // Get list of enrolled course IDs
  const enrolledCourseIds = enrolledCourses.map((c) => c._id);
  // Get courses that are 100% completed
  const completedCourses = enrolledCourses.filter(
    (course) => (courseProgress[course._id]?.progress || 0) >= 100,
  );
  // Get completed courses that haven't been rated yet
  const pendingRatingCourses = completedCourses.filter(
    (course) => !courseRatings[course.id],
  );

  const availableQuizzes = quizzes.filter((q) => {
    if (!q.published || !enrolledCourseIds.includes(q.courseId)) return false;
    if (q.deadline && new Date() > new Date(q.deadline)) return false;
    const userAttempts = quizAttempts.filter(
      (a) => a.quizId === q.id && a.studentId === user.id,
    );
    if (q.maxAttempts && userAttempts.length >= q.maxAttempts) return false;
    return true;
  });

  const availableCourses = (courses || []).filter(
    (c) =>
      !(enrollments || []).some(
        (e) => e.userId === user.id && e.courseId === c.id,
      ),
  );

  const attemptsByQuiz = quizAttempts
    .filter((attempt) => attempt.studentId === user.id)
    .reduce((group, attempt) => {
      (group[attempt.quizId] = group[attempt.quizId] || []).push(attempt);
      return group;
    }, {});

  const completedQuizzes = Object.values(attemptsByQuiz)
    .map((attempts) => {
      const bestAttempt = attempts.reduce((best, attempt) => {
        const bestScore = best ? best.score : -Infinity;
        const currentScore = attempt.score;
        if (
          currentScore > bestScore ||
          (currentScore === bestScore && new Date(attempt.completedAt) > new Date(best.completedAt))
        ) {
          return attempt;
        }
        return best;
      }, null);
      const quiz = quizzes.find((q) => q.id === bestAttempt.quizId);
      const course = courses.find((c) => c.id === quiz?.courseId);
      return {
        ...bestAttempt,
        quizTitle: quiz?.title || "Unknown Quiz",
        courseTitle: course?.title || "Unknown Course",
        quiz,
        attemptCount: attempts.length,
        attempts: attempts
          .map((a) => ({ ...a, quiz }))
          .sort(
          (a, b) => new Date(b.completedAt) - new Date(a.completedAt),
        ),
      };
    })
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  const toggleQuizAttempts = (quizId) => {
    setExpandedQuizAttempts((prev) => ({
      ...prev,
      [quizId]: !prev[quizId],
    }));
  };

  const recentActivity = [
    ...completedCourses.map((course) => ({
      type: "course",
      title: `Completed course: ${course.title}`,
      date: courseProgress[course.id]?.completedAt
        ? new Date(courseProgress[course.id].completedAt)
        : null,
    })),
    ...completedQuizzes.map((attempt) => ({
      type: "quiz",
      title: `Completed quiz: ${attempt.quizTitle}`,
      date: attempt.completedAt ? new Date(attempt.completedAt) : null,
      score: attempt.score,
    })),
  ]
    .filter((item) => item.date)
    .sort((a, b) => b.date - a.date)
    .slice(0, 5);

  const enroll = async (courseId) => {
    try {
      const response = await fetch(`${API_BASE}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId }),
      });
      if (response.ok) {
        const enrollment = await response.json();
        setEnrollments([...enrollments, enrollment]);
        toast.success("Enrolled successfully!");
      } else {
        toast.error("Failed to enroll");
      }
    } catch (error) {
      console.error("Error enrolling", error);
      toast.error("Error enrolling");
    }
  };

  // Update lastActive when student accesses course content
  const updateLastActive = async (courseId) => {
    try {
      const response = await fetch(`${API_BASE}/enrollments/course/${courseId}/last-active`, {
        method: "PUT",
        credentials: "include",
      });
      if (response.ok) {
        const updated = await response.json();
        setEnrollments(prev => prev.map(e => e._id === updated._id ? updated : e));
      }
    } catch (error) {
      console.error("Error updating last active", error);
    }
  };

  const handleTopicComplete = async (courseId, topic) => {
    try {
      const response = await fetch(`${API_BASE}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, topic }),
      });
      if (response.ok) {
        const updated = await response.json();
        setCourseProgress(prev => ({ ...prev, [courseId]: updated }));
      }
    } catch (error) {
      console.error("Error updating progress", error);
    }
  };

  const fileComplaint = async (complaint) => {
    try {
      const response = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ complaint }),
      });
      if (response.ok) {
        const newComplaint = await response.json();
        setComplaints([...complaints, newComplaint]);
        toast.success("Complaint raised successfully");
      } else {
        toast.error('Failed to file complaint');
      }
    } catch (error) {
      console.error('Error filing complaint:', error);
      toast.error('Error filing complaint');
    }
  };

  const handleQuizComplete = async (attemptData) => {
    try {
      const response = await fetch(`${API_BASE}/quiz-attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(attemptData),
      });
      if (response.ok) {
        const newAttempt = await response.json();
        setQuizAttempts([...quizAttempts, newAttempt]);
        toast.success("Quiz submitted!");
      } else {
        toast.error('Failed to submit quiz attempt');
      }
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      toast.error('Error submitting quiz attempt');
    }
  };

  useEffect(() => {
    if (pendingRatingCourses.length > 0 && !ratingCourseId) {
      setRatingCourseId(pendingRatingCourses[0].id);
    }
  }, [pendingRatingCourses, ratingCourseId]);

  const saveCourseRating = async (courseId) => {
    if (!courseId) return;
    try {
      const response = await fetch(`${API_BASE}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseId,
          courseRating: Number(courseRatingValue),
          instructorRating: Number(instructorRatingValue),
          comment: ratingComment,
        }),
      });
      if (!response.ok) {
        toast.error("Failed to save rating");
        return;
      }
      const saved = await response.json();
      setCourseRatings((prev) => ({ ...prev, [courseId]: saved }));
      const nextRatingCourse = pendingRatingCourses.find(
        (course) => course.id !== courseId,
      );
      setCourseRatingValue(5);
      setInstructorRatingValue(5);
      setRatingComment("");
      setRatingCourseId(nextRatingCourse?.id || "");
      toast.success("Rating saved");
    } catch (error) {
      console.error("Error saving rating", error);
      toast.error("Error saving rating");
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 dashboard-shell">
      <Navbar />

      <div
        className="d-flex flex-grow-1"
        style={{ minHeight: "calc(100vh - 56px)" }}
      >
        <div
          className={`dashboard-sidebar app-sidebar bg-white shadow-sm p-3 ${isMenuOpen ? "d-block position-fixed top-0 start-0 vh-100" : "d-none d-lg-block"}`}
          style={{
            width: isMenuOpen ? "85%" : "250px",
            maxWidth: isMenuOpen ? "320px" : "250px",
            minHeight: "100%",
            zIndex: isMenuOpen ? 1052 : "auto",
          }}
        >
          <h5 className="text-primary mb-4">Student Menu</h5>
          <ul className="nav flex-column">
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "dashboard" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <i className="bi bi-house-door me-2"></i>Dashboard
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "Enrolled Courses" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("Enrolled Courses")}
              >
                <i className="bi bi-collection me-2"></i>Enrolled Courses
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "Completed Courses" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("Completed Courses")}
              >
                <i className="bi bi-check-square-fill me-2"></i>Completed
                Courses
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "browse" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("browse")}
              >
                <i className="bi bi-search me-2"></i>Browse Courses
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "quizzes" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("quizzes")}
              >
                <i className="bi bi-question-circle me-2"></i>Available Quizzes
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "completed-quizzes" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("completed-quizzes")}
              >
                <i className="bi bi-check-circle me-2"></i>Completed Quizzes
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "performance" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("performance")}
              >
                <i className="bi bi-graph-up me-2"></i>Performance
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "profile" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("profile")}
              >
                <i className="bi bi-person me-2"></i>Profile
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "complaints" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("complaints")}
              >
                <i className="bi bi-exclamation-triangle me-2"></i>Complaints
              </button>
            </li>
          </ul>
        </div>

        {isMenuOpen && (
          <div
            className="d-lg-none"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              zIndex: 1050,
            }}
            onClick={() => setIsMenuOpen(false)}
          ></div>
        )}

        <div className="flex-grow-1 p-4">
          <button
            className="btn btn-outline-primary d-lg-none mb-3"
            onClick={() => setIsMenuOpen(true)}
          >
            <i className="bi bi-list me-2"></i>Menu
          </button>
          {activeTab === "dashboard" && (
            <div>
              <div
                style={{ backgroundColor: "#0DCAF0", color: "white" }}
                className="p-5 mb-4 rounded shadow"
              >
                <h1 className="display-4">Welcome back, {user.name}!</h1>
                <p className="lead">Continue your learning journey.</p>
              </div>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <div
                    className="card text-center shadow"
                    style={{ cursor: "pointer" }}
                    onClick={() => setActiveTab("Enrolled Courses")}
                    onKeyDown={(event) => event.key === "Enter" && setActiveTab("Enrolled Courses")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="card-body">
                      <i className="bi bi-book display-4 text-primary"></i>
                      <h5 className="card-title">Enrolled Courses</h5>
                      <p className="card-text display-4">
                        {enrolledCourses.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div
                    className="card text-center shadow"
                    style={{ cursor: "pointer" }}
                    onClick={() => setActiveTab("Completed Courses")}
                    onKeyDown={(event) => event.key === "Enter" && setActiveTab("Completed Courses")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="card-body">
                      <i className="bi bi-trophy display-4 text-success"></i>
                      <h5 className="card-title">Completed Courses</h5>
                      <p className="card-text display-4">
                        {completedCourses.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div
                    className="card text-center shadow"
                    style={{ cursor: "pointer" }}
                    onClick={() => setActiveTab("browse")}
                    onKeyDown={(event) => event.key === "Enter" && setActiveTab("browse")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="card-body">
                      <i className="bi bi-book display-4 text-info"></i>
                      <h5 className="card-title">Available Courses</h5>
                      <p className="card-text display-4">{courses.length}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div
                    className="card text-center shadow"
                    style={{ cursor: "pointer" }}
                    onClick={() => setActiveTab("quizzes")}
                    onKeyDown={(event) => event.key === "Enter" && setActiveTab("quizzes")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="card-body">
                      <i className="bi bi-question-circle display-4 text-warning"></i>
                      <h5 className="card-title">Available Quizzes</h5>
                      <p className="card-text display-4">
                        {availableQuizzes.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-4 mb-3">
                  <div className="card text-center shadow-sm border-primary">
                    <div className="card-body">
                      <h6 className="card-title text-uppercase">
                        Avg Course Rating
                      </h6>
                      <p className="display-4 text-primary">
                        {Object.values(courseRatings).length
                          ? (
                              Object.values(courseRatings).reduce(
                                (sum, r) => sum + (r.courseRating || 0),
                                0,
                              ) / Object.values(courseRatings).length
                            ).toFixed(1)
                          : "0.0"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card text-center shadow-sm border-success">
                    <div className="card-body">
                      <h6 className="card-title text-uppercase">
                        Avg Instructor Rating
                      </h6>
                      <p className="display-4 text-success">
                        {Object.values(courseRatings).length
                          ? (
                              Object.values(courseRatings).reduce(
                                (sum, r) => sum + (r.instructorRating || 0),
                                0,
                              ) / Object.values(courseRatings).length
                            ).toFixed(1)
                          : "0.0"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card text-center shadow-sm border-warning">
                    <div className="card-body">
                      <h6 className="card-title text-uppercase">
                        Total Rated Courses
                      </h6>
                      <p className="display-4 text-warning">
                        {Object.keys(courseRatings).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <h4>Recent Activity</h4>
              {recentActivity.length > 0 ? (
                <ul className="list-group">
                  {recentActivity.map((item, idx) => (
                    <li
                      key={idx}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{item.title}</strong>
                        <div className="text-muted small">
                          {item.date.toLocaleString()}
                        </div>
                      </div>
                      <span
                        className={`badge ${item.type === "course" ? "bg-success" : "bg-primary"} rounded-pill`}
                      >
                        {item.type === "course"
                          ? "Course"
                          : `Quiz ${item.score ?? ""}`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">
                  No recent activity yet. Start completing courses and quizzes
                </p>
              )}
            </div>
          )}

          {activeTab === "Enrolled Courses" && (
            <div>
              <h2 className="mb-4 fw-bold text-dark">My Enrolled Courses</h2>
              <div className="row g-4">
                {enrolledCourses.map((course) => {
                  const progress = courseProgress[course._id]?.progress || 0;
                  return (
                    <div key={course._id} className="col-md-6 col-lg-4">
                      <CourseCard
                        course={course}
                        onView={() => {
                          setSelectedCourse(course);
                          setActiveTab("view-course");
                        }}
                        onViewQuizzes={() => setActiveTab("quizzes")}
                        isEnrolled={true}
                        userRole="student"
                        progress={progress}
                      />
                    </div>
                  );
                })}
                {enrolledCourses.length === 0 && (
                  <div className="col-12">
                    <div className="text-center py-5">
                      <i className="bi bi-info-circle display-4 text-muted mb-3"></i>
                      <h5 className="text-muted">No enrolled courses yet</h5>
                      <p className="text-muted">
                        Browse available courses and enroll to start learning
                      </p>
                      <button
                        className="btn btn-primary mt-3"
                        onClick={() => setActiveTab("browse")}
                      >
                        Browse Courses
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "browse" && (
            <div>
              <h2 className="mb-4 fw-bold text-dark">Explore New Skills</h2>
              <CourseList
                courses={availableCourses}
                onViewCourse={(course) => {
                  setSelectedCourse(course);
                  setActiveTab("view-course");
                }}
                onEnrollCourse={enroll}
                enrolledCourseIds={enrolledCourseIds}
              />
            </div>
          )}

          {activeTab === "Completed Courses" && (
            <div>
              <h2 className="mb-4 fw-bold text-dark">Completed Courses</h2>
              {pendingRatingCourses.length > 0 && (
                <div className="alert alert-info">
                  <h5 className="alert-heading">Rate Completed Course</h5>
                  <p>
                    Please help improve the platform by rating the course and
                    instructor.
                  </p>
                  <div className="mb-3">
                    <label className="form-label">Course</label>
                    <select
                      className="form-select"
                      value={ratingCourseId}
                      onChange={(e) => setRatingCourseId(e.target.value)}
                    >
                      {pendingRatingCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Course Rating</label>
                      <div>
                        {[1, 2, 3, 4, 5].map((score) => (
                          <i
                            key={score}
                            className={`bi ${score <= courseRatingValue ? "bi-star-fill text-warning" : "bi-star text-secondary"}`}
                            style={{
                              cursor: "pointer",
                              fontSize: "1.4rem",
                              marginRight: "4px",
                            }}
                            onClick={() => setCourseRatingValue(score)}
                          ></i>
                        ))}
                        <span className="ms-2">{courseRatingValue} / 5</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Instructor Rating</label>
                      <div>
                        {[1, 2, 3, 4, 5].map((score) => (
                          <i
                            key={score}
                            className={`bi ${score <= instructorRatingValue ? "bi-star-fill text-info" : "bi-star text-secondary"}`}
                            style={{
                              cursor: "pointer",
                              fontSize: "1.4rem",
                              marginRight: "4px",
                            }}
                            onClick={() => setInstructorRatingValue(score)}
                          ></i>
                        ))}
                        <span className="ms-2">
                          {instructorRatingValue} / 5
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Comments</label>
                    <textarea
                      className="form-control"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      rows={2}
                      placeholder="What did you like? Any improvement suggestions?"
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => saveCourseRating(ratingCourseId)}
                  >
                    Submit Rating
                  </button>
                </div>
              )}
              <div className="row g-4">
                {completedCourses.map((course) => (
                  <div key={course._id} className="col-md-6 col-lg-4">
                    <CourseCard
                      course={course}
                      onView={() => {
                        setSelectedCourse(course);
                        setActiveTab("view-course");
                      }}
                      onViewQuizzes={() => setActiveTab("quizzes")}
                      isEnrolled={true}
                      userRole="student"
                      progress={100}
                    />
                  </div>
                ))}
                {completedCourses.length === 0 && (
                  <div className="col-12">
                    <div className="text-center py-5">
                      <i className="bi bi-info-circle display-4 text-muted mb-3"></i>
                      <h5 className="text-muted">No courses completed yet</h5>
                      <p className="text-muted">
                        Once you finish all topics in a course, it will be shown
                        here.
                      </p>
                      <button
                        className="btn btn-primary mt-3"
                        onClick={() => setActiveTab("browse")}
                      >
                        Browse Courses
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "quizzes" && !takingQuiz && (
            <div>
              <h2 className="mb-4">Available Quizzes</h2>
              <div className="row">
                {availableQuizzes.map((quiz) => {
                  const userAttempts = quizAttempts.filter(
                    (a) => a.quizId === quiz.id && a.studentId === user.id,
                  );
                  const canTakeQuiz =
                    !quiz.maxAttempts || userAttempts.length < quiz.maxAttempts;

                  return (
                    <div key={quiz.id} className="col-md-4 mb-4">
                      <div className="card shadow h-100">
                        <div className="card-body d-flex flex-column">
                          <h5 className="card-title">{quiz.title}</h5>
                          <p className="card-text">
                            Course:{" "}
                            {
                              (courses || []).find(
                                (c) => c.id === quiz.courseId,
                              )?.title
                            }
                          </p>
                          <p className="text-muted small">
                            Questions: {quiz.totalQuestions}
                          </p>
                          {quiz.deadline && (
                            <p className="text-muted small">
                              Deadline:{" "}
                              {new Date(quiz.deadline).toLocaleDateString()}
                            </p>
                          )}
                          {userAttempts.length > 0 && (
                            <p className="text-muted small">
                              Attempts: {userAttempts.length}/
                              {quiz.maxAttempts || "8"}
                              {userAttempts.length > 0 && (
                                <span className="ms-2">
                                  Best Score:{" "}
                                  {Math.max(
                                    ...userAttempts.map((a) => a.score),
                                  )}
                                  %
                                </span>
                              )}
                            </p>
                          )}
                          <div className="mt-auto">
                            {canTakeQuiz ? (
                              <button
                                className="btn btn-success w-100"
                                onClick={() => setTakingQuiz(quiz)}
                              >
                                <i className="bi bi-play-circle me-2"></i>Take
                                Quiz
                              </button>
                            ) : (
                              <button
                                className="btn btn-secondary w-100"
                                disabled
                              >
                                <i className="bi bi-x-circle me-2"></i>Max
                                Attempts Reached
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {availableQuizzes.length === 0 && (
                  <div className="col-12">
                    <div className="text-center py-5">
                      <i className="bi bi-info-circle display-4 text-muted mb-3"></i>
                      <h5 className="text-muted">No quizzes available</h5>
                      <p className="text-muted">
                        Quizzes will appear here when your instructors publish
                        them
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "completed-quizzes" && (
            <div>
              <h2 className="mb-4 fw-bold text-dark">Completed Quizzes</h2>
              <div className="row">
                {completedQuizzes.map((attempt, index) => (
                  <div key={attempt.id || attempt._id || index} className="col-md-6 mb-4">
                    <div className="card shadow h-100">
                      <div className="card-body">
                        <h5 className="card-title">{attempt.quizTitle}</h5>
                        <p className="text-muted">
                          Course: {attempt.courseTitle}
                        </p>
                        <div className="row text-center mb-3">
                          <div className="col-6">
                            <div className="p-2 bg-light rounded">
                              <div className="h4 text-primary fw-bold">
                                {attempt.score}%
                              </div>
                              <small className="text-muted">Score</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="p-2 bg-light rounded">
                              <div
                                className={`h4 fw-bold ${attempt.quiz?.hasPassingPercentage && attempt.quiz?.passingPercentage ? (attempt.score >= attempt.quiz.passingPercentage ? "text-success" : "text-danger") : attempt.score >= 70 ? "text-success" : "text-danger"}`}
                              >
                                {attempt.quiz?.hasPassingPercentage &&
                                attempt.quiz?.passingPercentage
                                  ? attempt.score >=
                                    attempt.quiz.passingPercentage
                                    ? "Passed"
                                    : "Failed"
                                  : attempt.score >= 70
                                    ? "Passed"
                                    : "Failed"}
                              </div>
                              <small className="text-muted">Status</small>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted small mb-2">
                          Completed on:{" "}
                          {new Date(attempt.completedAt).toLocaleDateString()}
                        </p>
                        {attempt.quiz?.hasPassingPercentage &&
                          attempt.quiz?.passingPercentage && (
                            <p className="text-muted small mb-0">
                              Passing Score: {attempt.quiz.passingPercentage}%
                            </p>
                          )}
                        {attempt.attemptCount > 1 && (
                          <div className="mt-3">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              type="button"
                              onClick={() => toggleQuizAttempts(attempt.quizId)}
                            >
                              {expandedQuizAttempts[attempt.quizId]
                                ? "Hide all attempts"
                                : `View all ${attempt.attemptCount} attempts`}
                            </button>
                          </div>
                        )}
                        {expandedQuizAttempts[attempt.quizId] && (
                          <div className="mt-4 table-responsive">
                            <table className="table table-sm table-bordered">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Score</th>
                                  <th>Status</th>
                                  <th>Passing</th>
                                </tr>
                              </thead>
                              <tbody>
                                {attempt.attempts.map((history) => (
                                  <tr
                                    key={history.id || history._id || history.completedAt}
                                  >
                                    <td>
                                      {new Date(history.completedAt).toLocaleDateString()}
                                    </td>
                                    <td>{history.score}%</td>
                                    <td>
                                      {(history.quiz?.hasPassingPercentage &&
                                        history.quiz?.passingPercentage
                                        ? history.score >= history.quiz.passingPercentage
                                          ? "Passed"
                                          : "Failed"
                                        : history.score >= 70
                                        ? "Passed"
                                        : "Failed")}
                                    </td>
                                    <td>
                                      {history.quiz?.hasPassingPercentage &&
                                      history.quiz?.passingPercentage
                                        ? `${history.quiz.passingPercentage}%`
                                        : "70%"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {completedQuizzes.length === 0 && (
                  <div className="col-12">
                    <div className="text-center py-5">
                      <i className="bi bi-check-circle display-4 text-muted mb-3"></i>
                      <h5 className="text-muted">No completed quizzes yet</h5>
                      <p className="text-muted">
                        Complete some quizzes to see them here
                      </p>
                      <button
                        className="btn btn-primary mt-3"
                        onClick={() => setActiveTab("quizzes")}
                      >
                        Take a Quiz
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "performance" && (
            <StudentOwnPerformanceDashboard
              user={user}
              enrolledCourses={enrolledCourses}
              courseProgress={courseProgress}
              quizAttempts={quizAttempts}
              quizzes={quizzes}
              courseRatings={courseRatings}
            />
          )}

          {takingQuiz && (
            <QuizTaker
              quiz={takingQuiz}
              studentId={user.id}
              onComplete={handleQuizComplete}
              onClose={() => setTakingQuiz(null)}
            />
          )}

          {activeTab === "profile" && (
            <div>
              <Profile />
            </div>
          )}

          {activeTab === "complaints" && (
            <div>
              <h2 className="mb-4">File a Complaint</h2>
              <div className="card shadow">
                <div className="card-body">
                  <ComplaintForm onSubmit={fileComplaint} />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="mb-3">Your Submitted Complaints</h4>
                {complaints.length === 0 ? (
                  <div className="alert alert-info">No complaints filed yet. Your submitted complaints will appear here.</div>
                ) : (
                  <div className="row g-3">
                    {complaints.map((c) => (
                      <div key={c.id || c._id} className="col-12">
                        <div className="card shadow-sm border-start border-4 rounded-3">
                          <div className="card-body d-flex flex-column flex-md-row justify-content-between gap-3 align-items-start">
                            <div>
                              <p className="mb-2 fw-bold">{c.complaint}</p>
                              {c.createdAt && (
                                <small className="text-muted">Submitted: {new Date(c.createdAt).toLocaleString()}</small>
                              )}
                              {c.adminMessage && (
                                <div className="alert alert-light border-start border-4 border-info mt-3">
                                  <strong>Admin guidance:</strong>
                                  <p className="mb-0 mt-1">{c.adminMessage}</p>
                                </div>
                              )}
                            </div>
                            <div className="text-end">
                              <span className={`badge ${c.status === "solved" ? "bg-success" : "bg-warning text-dark"}`}>
                                {c.status === "solved" ? "Solved" : "Pending"}
                              </span>
                              {c.status === "solved" && <div className="text-success small mt-1">Resolution visible to student.</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "view-course" && selectedCourse && (
            <CoursePlayer
              course={selectedCourse}
              isEnrolled={(enrollments || []).some(
                (e) => e.userId === user.id && e.courseId === selectedCourse.id,
              )}
              onEnroll={enroll}
              onBack={() => {
                setSelectedCourse(null);
                setActiveTab("browse");
              }}
              onTopicComplete={handleTopicComplete}
              onUpdateLastActive={updateLastActive}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ComplaintForm({ onSubmit }) {
  const [complaint, setComplaint] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(complaint);
    setComplaint("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        className="form-control"
        rows="4"
        value={complaint}
        onChange={(e) => setComplaint(e.target.value)}
        placeholder="Describe your complaint..."
        required
      />
      <button className="btn btn-warning mt-2">Submit Complaint</button>
    </form>
  );
}
