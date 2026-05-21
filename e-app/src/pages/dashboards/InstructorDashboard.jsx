import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Navbar from "../../components/layout/Navbar";
import ManualQuizCreator from "../../components/forms/ManualQuizCreator";
import InstructorProfile from "../InstructorProfile";
import CourseForm from "../../components/courses/CourseForm";
import CourseCard from "../../components/courses/CourseCard";
import CoursePlayer from "../../components/courses/CoursePlayer";
import CoursePreview from "../../components/courses/CoursePreview";
import QuizManagement from "../../components/quizzes/QuizManagement";
import ErrorBoundary from "../../components/ErrorBoundary";
import InstructorAnalytics from "../../components/InstructorAnalytics";
import StudentPerformanceDashboard from "../../components/StudentPerformanceDashboard";

// Instructor Dashboard - manage courses, quizzes, student performance
export default function InstructorDashboard() {
  // Get current user, logout and all users from auth context
  const { user, logout, users } = useAuth();
  const toast = useToast();
  const location = useLocation();
  // Track which tab is currently active
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Search box to find students by name
  const [studentSearch, setStudentSearch] = useState("");
  // Store selected student's performance data
  const [selectedStudentAnalytics, setSelectedStudentAnalytics] =
    useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  

  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewMode, setPreviewMode] = useState(null); // 'create' | 'edit'
  const [previewActiveTopic, setPreviewActiveTopic] = useState(0);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [courseProgress, setCourseProgress] = useState({});
  const [courseRatings, setCourseRatings] = useState({});

  const API_BASE = "http://localhost:5000/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, allCoursesRes, enrollmentsRes, quizzesRes, complaintsRes, quizAttemptsRes, progressRes, ratingsRes] = await Promise.all([
          fetch(`${API_BASE}/courses/my`, { credentials: "include" }),
          fetch(`${API_BASE}/courses`, { credentials: "include" }),
          fetch(`${API_BASE}/enrollments`, { credentials: "include" }),
          fetch(`${API_BASE}/quizzes/my`, { credentials: "include" }),
          fetch(`${API_BASE}/complaints`, { credentials: "include" }),
          fetch(`${API_BASE}/quiz-attempts`, { credentials: "include" }),
          fetch(`${API_BASE}/progress`, { credentials: "include" }),
          fetch(`${API_BASE}/ratings`, { credentials: "include" }),
        ]);
        if (coursesRes.ok) setCourses(await coursesRes.json());
        if (allCoursesRes.ok) setAllCourses(await allCoursesRes.json());
        if (enrollmentsRes.ok) setEnrollments(await enrollmentsRes.json());
        if (quizzesRes.ok) setQuizzes(await quizzesRes.json());
        if (complaintsRes.ok) setComplaints(await complaintsRes.json());
        if (quizAttemptsRes.ok) setQuizAttempts(await quizAttemptsRes.json());
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          const progressMap = {};
          progressData.forEach(p => progressMap[p.courseId] = p);
          setCourseProgress(progressMap);
        }
        if (ratingsRes.ok) {
          const ratingsData = await ratingsRes.json();
          const ratingsMap = {};
          ratingsData.forEach(r => ratingsMap[r.courseId] = r);
          setCourseRatings(ratingsMap);
        }
      } catch (error) {
        console.error("Failed to fetch instructor data", error);
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

  // No persistent browser storage for instructor data

  // Get only courses created by this instructor
  const myCourses = (courses || []).filter((c) => c.instructorId === user.id);
  // Get only enrollments for this instructor's courses
  const myEnrollments = (enrollments || []).filter((e) =>
    (myCourses || []).some((c) => c._id === e.courseId),
  );
  // Get only quizzes for this instructor's courses
  const myQuizzes = (quizzes || []).filter((q) =>
    (myCourses || []).some((c) => c._id === q.courseId),
  );

  // Function to add new course
  const addCourse = async (courseData) => {
    try {
      const response = await fetch(`${API_BASE}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(courseData),
      });
      if (response.ok) {
        const newCourse = await response.json();
        setCourses([...courses, newCourse]);
        setActiveTab("courses");
        toast.success("Course Published Successfully!");
      } else {
        toast.error("Failed to publish course");
      }
    } catch (error) {
      console.error("Error publishing course", error);
      toast.error("Error publishing course");
    }
  };

  const updateCourse = async (courseId, courseData) => {
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(courseData),
      });
      if (response.ok) {
        const updatedCourse = await response.json();
        setCourses(
          courses.map((course) =>
            course._id === updatedCourse._id || course.id === updatedCourse.id
              ? updatedCourse
              : course,
          ),
        );
        setEditingCourse(null);
        setActiveTab("courses");
        toast.success("Course updated successfully");
      } else {
        toast.error("Failed to update course");
      }
    } catch (error) {
      console.error("Error updating course", error);
      toast.error("Error updating course");
    }
  };

  const addQuiz = async (quiz) => {
    try {
      const response = await fetch(`${API_BASE}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(quiz),
      });
      if (response.ok) {
        const newQuiz = await response.json();
        setQuizzes([...quizzes, newQuiz]);
      } else {
        toast.error("Failed to create quiz");
      }
    } catch (error) {
      console.error("Error creating quiz", error);
      toast.error("Error creating quiz");
    }
  };

  const updateQuiz = async (quizId, updatedQuiz) => {
    try {
      const response = await fetch(`${API_BASE}/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedQuiz),
      });
      if (response.ok) {
        const updated = await response.json();
        setQuizzes(quizzes.map((q) => (q._id === quizId ? updated : q)));
      } else {
        toast.error("Failed to update quiz");
      }
    } catch (error) {
      console.error("Error updating quiz", error);
      toast.error("Error updating quiz");
    }
  };
  const publishQuiz = async (quizId, publishData) => {
    try {
      const response = await fetch(`${API_BASE}/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(publishData),
      });
      if (response.ok) {
        const updated = await response.json();
        setQuizzes(quizzes.map((q) => (q._id === quizId ? updated : q)));
      } else {
        toast.error("Failed to publish quiz");
      }
    } catch (error) {
      console.error("Error publishing quiz", error);
      toast.error("Error publishing quiz");
    }
  };
  const deleteQuiz = async (quizId) => {
    try {
      const response = await fetch(`${API_BASE}/quizzes/${quizId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setQuizzes(quizzes.filter((q) => (q._id || q.id) !== quizId));
        toast.success("Quiz deleted successfully");
      } else {
        toast.error("Failed to delete quiz");
      }
    } catch (error) {
      console.error("Error deleting quiz", error);
      toast.error("Error deleting quiz");
    }
  };
  const extendDeadline = async (quizId, newDeadline) => {
    try {
      const response = await fetch(`${API_BASE}/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deadline: newDeadline }),
      });
      if (response.ok) {
        const updated = await response.json();
        setQuizzes(quizzes.map((q) => (q._id === quizId ? updated : q)));
      } else {
        toast.error("Failed to extend deadline");
      }
    } catch (error) {
      console.error("Error extending deadline", error);
      toast.error("Error extending deadline");
    }
  };

  const deleteCourse = async (courseId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this course? All enrollment data for this course will be lost.",
      )
    ) {
      try {
        const response = await fetch(`${API_BASE}/courses/${courseId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (response.ok) {
          setCourses(courses.filter((c) => c._id !== courseId));
          setEnrollments(enrollments.filter((e) => e.courseId !== courseId));
          toast.success("Course deleted successfully");
        } else {
          toast.error("Failed to delete course");
        }
      } catch (error) {
        console.error("Error deleting course", error);
        toast.error("Error deleting course");
      }
    }
  };

  const totalCourses = myCourses.length;
  const totalEnrollments = myEnrollments.length;
  const totalQuizzes = myQuizzes.length;
  const activeStudents = new Set(myEnrollments.map((e) => e.userId)).size;

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
          <h5 className="text-primary mb-4">Instructor Menu</h5>
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
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "all-platform-courses" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("all-platform-courses")}
              >
                <i className="bi bi-globe me-2"></i>Platform Courses
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "courses" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("courses")}
              >
                <i className="bi bi-collection me-2"></i>My Courses
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "create-course" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("create-course")}
              >
                <i className="bi bi-plus-circle me-2"></i>Create Course
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "students" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("students")}
              >
                <i className="bi bi-people me-2"></i>Students
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "quizzes" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("quizzes")}
              >
                <i className="bi bi-question-circle me-2"></i>Quizzes
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "analytics" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => setActiveTab("analytics")}
              >
                <i className="bi bi-bar-chart-line me-2"></i>Analytics
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "profile" ? "text-primary fw-bold" : "text-dark"}`}
                onClick={() => {
                  setActiveTab("profile");
                  setIsMenuOpen(false);
                }}
              >
                <i className="bi bi-person me-2"></i>Profile
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
                <p className="lead">Continue your teaching journey.</p>
              </div>
              <div className="row g-4">
                <div className="col-md-3 mb-4" onMouseEnter={() => setHoveredCard("courses")} onMouseLeave={() => setHoveredCard(null)}>
                  <div
                    className="card text-center shadow border-0 p-3 cursor-pointer h-100"
                    style={{
                      minHeight: "240px",
                      transform: hoveredCard === "courses" ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => setActiveTab("courses")}
                  >
                    <div className="card-body">
                      <i className="bi bi-book display-4 text-primary"></i>
                      <h5 className="card-title mt-2">My Courses</h5>
                      <p className="card-text display-4 fw-bold">{totalCourses}</p>
                      <small className="text-muted">Click to manage</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-4" onMouseEnter={() => setHoveredCard("enrollments")} onMouseLeave={() => setHoveredCard(null)}>
                  <div
                    className="card text-center shadow border-0 p-3 cursor-pointer h-100"
                    style={{
                      minHeight: "240px",
                      transform: hoveredCard === "enrollments" ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => setActiveTab("students")}
                  >
                    <div className="card-body">
                      <i className="bi bi-people display-4 text-success"></i>
                      <h5 className="card-title mt-2">Total Enrollments</h5>
                      <p className="card-text display-4 fw-bold">{totalEnrollments}</p>
                      <small className="text-muted">View student progress</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-4" onMouseEnter={() => setHoveredCard("quizzes")} onMouseLeave={() => setHoveredCard(null)}>
                  <div
                    className="card text-center shadow border-0 p-3 cursor-pointer h-100"
                    style={{
                      minHeight: "240px",
                      transform: hoveredCard === "quizzes" ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => setActiveTab("quizzes")}
                  >
                    <div className="card-body">
                      <i className="bi bi-question-circle display-4 text-warning"></i>
                      <h5 className="card-title mt-2">My Quizzes</h5>
                      <p className="card-text display-4 fw-bold">{totalQuizzes}</p>
                      <small className="text-muted">Manage assessments</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-4" onMouseEnter={() => setHoveredCard("studentsInsights")} onMouseLeave={() => setHoveredCard(null)}>
                  <div
                    className="card text-center shadow border-0 p-3 cursor-pointer h-100"
                    style={{
                      minHeight: "240px",
                      transform: hoveredCard === "studentsInsights" ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => setActiveTab("students")}
                  >
                    <div className="card-body">
                      <i className="bi bi-people-fill display-4 text-secondary"></i>
                      <h5 className="card-title mt-2">Active Students</h5>
                      <p className="card-text display-4 fw-bold">{activeStudents}</p>
                      <small className="text-muted">Track learner engagement</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-4 mb-3">
                  <div className="card text-center shadow-sm border-primary">
                    <div className="card-body">
                      <h6 className="card-title text-uppercase">Total Courses</h6>
                      <p className="display-4 text-primary">{totalCourses}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card text-center shadow-sm border-success">
                    <div className="card-body">
                      <h6 className="card-title text-uppercase">Total Enrollments</h6>
                      <p className="display-4 text-success">{totalEnrollments}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card text-center shadow-sm border-warning">
                    <div className="card-body">
                      <h6 className="card-title text-uppercase">Published Quizzes</h6>
                      <p className="display-4 text-warning">{totalQuizzes}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "all-platform-courses" && (
            <div>
              <h2 className="mb-4 fw-bold text-dark">
                All Courses on Platform
              </h2>
              <div className="row g-4">
                {allCourses.map((course) => (
                  <div key={course.id} className="col-md-4">
                    <CourseCard
                      course={course}
                      onView={(course) => {
                        setSelectedCourse(course);
                        setActiveTab("view-course");
                      }}
                      userRole="instructor"
                    />
                  </div>
                ))}
                {allCourses.length === 0 && (
                  <p className="text-muted">No courses on the platform yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "courses" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="fw-bold mb-0">My Courses</h2>
                  <p className="text-muted mb-0">All courses are shown below.</p>
                </div>
              </div>
              <div className="row g-4">
                {myCourses.length > 0 ? (
                  myCourses
                    .map((course) => (
                      <div
                        key={course.id}
                        className="col-md-6 col-lg-4"
                        onMouseEnter={() => setHoveredCard(course.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        <div
                          style={{
                            transform:
                              hoveredCard === course.id ? "translateY(-8px)" : "translateY(0)",
                            transition: "all 0.3s ease",
                          }}
                        >
                          <CourseCard
                            course={course}
                            onView={(course) => {
                              setSelectedCourse(course);
                              setActiveTab("view-course");
                            }}
                            onDelete={deleteCourse}
                            onEdit={(course) => {
                              setEditingCourse(course);
                              setActiveTab("edit-course");
                            }}
                          />
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-5 bg-white rounded shadow-sm col-12">
                    <i className="bi bi-book display-4 text-muted mb-3"></i>
                    <p className="text-muted">
                      You haven't created any courses yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "view-course" && selectedCourse && (
            <CoursePlayer
              course={selectedCourse}
              onBack={() => {
                setSelectedCourse(null);
                setActiveTab("courses");
              }}
            />
          )}

          {activeTab === "create-course" && (
            <div>
              <h2 className="mb-4 fw-bold">Design New Course</h2>
              <div className="card shadow border-0">
                <div className="card-body p-4">
                  <CourseForm
                    initialData={previewMode === "create" ? previewData : null}
                    initialActiveTopicIndex={previewActiveTopic}
                    onSubmit={(courseData) => {
                      setPreviewData(courseData);
                      setPreviewMode("create");
                      setPreviewActiveTopic(0);
                      setActiveTab("preview-course");
                    }}
                    onCancel={() => {
                      setPreviewData(null);
                      setPreviewMode(null);
                      setPreviewActiveTopic(0);
                      setActiveTab("dashboard");
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "edit-course" && editingCourse && (
            <div>
              <h2 className="mb-4 fw-bold">Edit Course</h2>
              <div className="card shadow border-0">
                <div className="card-body p-4">
                  <CourseForm
                    initialData={
                      previewMode === "edit" && previewData
                        ? previewData
                        : editingCourse
                    }
                    initialActiveTopicIndex={previewActiveTopic}
                    onSubmit={(courseData) => {
                      setPreviewData(courseData);
                      setPreviewMode("edit");
                      setPreviewActiveTopic(0);
                      setActiveTab("preview-course");
                    }}
                    onCancel={() => {
                      setEditingCourse(null);
                      setPreviewData(null);
                      setPreviewMode(null);
                      setPreviewActiveTopic(0);
                      setActiveTab("courses");
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "preview-course" && previewData && (
            <CoursePreview
              course={previewData}
              isUpdate={previewMode === "edit"}
              onEdit={() => {
                setActiveTab(
                  previewMode === "edit" ? "edit-course" : "create-course",
                );
              }}
              onEditTopic={(index) => {
                setPreviewActiveTopic(index);
                setActiveTab(
                  previewMode === "edit" ? "edit-course" : "create-course",
                );
              }}
              onDeleteTopic={(index, item) => {
                const topicLabel = item?.topic || `Topic ${index + 1}`;
                if (
                  !window.confirm(
                    `Remove "${topicLabel}" from the course?`,
                  )
                ) {
                  return;
                }
                setPreviewData((prev) => {
                  if (!prev) return prev;
                  const nextContent = (prev.content || []).filter(
                    (_, i) => i !== index,
                  );
                  return { ...prev, content: nextContent };
                });
              }}
              onPublish={async () => {
                if (previewMode === "edit" && editingCourse) {
                  await updateCourse(
                    editingCourse._id || editingCourse.id,
                    previewData,
                  );
                } else {
                  await addCourse(previewData);
                }
                setPreviewData(null);
                setPreviewMode(null);
                setPreviewActiveTopic(0);
              }}
              onCancel={() => {
                setPreviewData(null);
                setPreviewMode(null);
                setPreviewActiveTopic(0);
                setEditingCourse(null);
                setActiveTab("courses");
              }}
            />
          )}

          {activeTab === "students" && (
            <div>
              <h2 className="mb-4 fw-bold">Enrolled Students</h2>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by student name or id..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              {myCourses.map((course) => {
                const courseEnrollments = enrollments.filter(
                  (e) => e.courseId === course.id,
                );
                const courseStudents = users.filter((u) =>
                  courseEnrollments.some((e) => e.userId === u.id),
                );
                const filteredStudents = courseStudents.filter(
                  (s) =>
                    s.name
                      .toLowerCase()
                      .includes(studentSearch.toLowerCase()) ||
                    s.id.toString().includes(studentSearch),
                );
                return (
                  <div
                    key={course.id}
                    className="mb-4 p-3 bg-white rounded shadow-sm"
                  >
                    <h4 className="text-primary">{course.title}</h4>
                    {courseStudents.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Student ID</th>
                              <th>Name</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStudents.map((student) => (
                              <tr key={student.id}>
                                <td>{student.id}</td>
                                <td>{student.name}</td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() =>
                                      setSelectedStudentAnalytics({
                                        student,
                                        course,
                                      })
                                    }
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted">No students enrolled yet.</p>
                    )}
                  </div>
                );
              })}
              {selectedStudentAnalytics && (
                <StudentPerformanceDashboard
                  student={selectedStudentAnalytics.student}
                  course={selectedStudentAnalytics.course}
                  enrollments={enrollments}
                  courseProgress={courseProgress}
                  quizAttempts={quizAttempts}
                  quizzes={quizzes}
                  onClose={() => setSelectedStudentAnalytics(null)}
                />
              )}
            </div>
          )}

          {activeTab === "quizzes" && (
            <ErrorBoundary>
              <QuizManagement
                courses={myCourses}
                quizzes={myQuizzes}
                quizAttempts={quizAttempts}
                users={users}
                onCreateQuiz={addQuiz}
                onUpdateQuiz={updateQuiz}
                onPublishQuiz={publishQuiz}
                onDeleteQuiz={deleteQuiz}
                onExtendDeadline={extendDeadline}
              />
            </ErrorBoundary>
          )}

          {activeTab === "analytics" && (
            <InstructorAnalytics
              userId={user.id}
              courses={allCourses}
              enrollments={enrollments}
              quizzes={quizzes}
              quizAttempts={quizAttempts}
              courseProgress={courseProgress}
              courseRatings={courseRatings}
              users={users}
            />
          )}

          {activeTab === "profile" && <InstructorProfile />}
        </div>
      </div>
    </div>
  );
}
