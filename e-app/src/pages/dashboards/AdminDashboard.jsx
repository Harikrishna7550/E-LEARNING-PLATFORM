import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Navbar from "../../components/layout/Navbar";
import CourseCard from "../../components/courses/CourseCard";
import CoursePlayer from "../../components/courses/CoursePlayer";
import StudentPerformanceDashboard from "../../components/StudentPerformanceDashboard";

const API_BASE = "http://localhost:5000/api";

export default function AdminDashboard() {
  const { user, users, removeUser } = useAuth();
  const toast = useToast();
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [courseProgress, setCourseProgress] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourseForStudent, setSelectedCourseForStudent] = useState(null);
  const [adminFeedback, setAdminFeedback] = useState({});
  const [quizAttempts, setQuizAttempts] = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      const [
        coursesRes,
        enrollmentsRes,
        quizzesRes,
        complaintsRes,
        progressRes,
        attemptsRes,
      ] = await Promise.all([
        fetch(`${API_BASE}/courses`, { credentials: "include" }),
        fetch(`${API_BASE}/enrollments`, { credentials: "include" }),
        fetch(`${API_BASE}/quizzes`, { credentials: "include" }),
        fetch(`${API_BASE}/complaints`, { credentials: "include" }),
        fetch(`${API_BASE}/progress`, { credentials: "include" }),
        fetch(`${API_BASE}/quiz-attempts`, { credentials: "include" }),
      ]);
      if (coursesRes.ok) setCourses(await coursesRes.json());
      if (enrollmentsRes.ok) setEnrollments(await enrollmentsRes.json());
      if (quizzesRes.ok) setQuizzes(await quizzesRes.json());
      if (complaintsRes.ok) setComplaints(await complaintsRes.json());
      if (progressRes.ok) {
        const data = await progressRes.json();
        const map = {};
        data.forEach((p) => (map[p.courseId] = p));
        setCourseProgress(map);
      }
      if (attemptsRes.ok) setQuizAttempts(await attemptsRes.json());
    } catch (error) {
      console.error("Failed to load admin data", error);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totalUsers = users.length;
  const totalCourses = courses.length;
  const totalQuizzes = quizzes.length;
  const pendingComplaints = complaints.filter((c) => c.status === "pending").length;

  const solveComplaint = async (complaintId, message = "") => {
    try {
      const response = await fetch(`${API_BASE}/complaints/${complaintId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "solved", adminMessage: message }),
      });
      if (response.ok) {
        const updated = await response.json();
        setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)));
        toast.success("Complaint resolved");
        setAdminFeedback((prev) => ({ ...prev, [complaintId]: "" }));
      } else {
        toast.error("Failed to resolve complaint");
      }
    } catch (error) {
      console.error("Error resolving complaint", error);
      toast.error("Error resolving complaint");
    }
  };

  const deleteAnyCourse = async (courseId) => {
    if (!window.confirm("ADMIN ACTION: Delete this course from the platform?")) return;
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
        setEnrollments((prev) => prev.filter((e) => e.courseId !== courseId));
        setQuizzes((prev) => prev.filter((q) => q.courseId !== courseId));
        toast.success("Course deleted");
      } else {
        toast.error("Failed to delete course");
      }
    } catch (error) {
      console.error("Error deleting course", error);
      toast.error("Error deleting course");
    }
  };

  const removeInstructor = async (userId) => {
    if (!window.confirm("Remove this instructor and all their courses?")) return;
    const ok = await removeUser(userId);
    if (ok) {
      toast.success("Instructor deleted successfully");
      await fetchAll();
    } else {
      toast.error("Failed to delete instructor");
    }
  };

  const removeStudent = async (userId) => {
    if (
      !window.confirm(
        "Delete this student account? This will remove all their enrollments and progress.",
      )
    ) {
      return;
    }
    const ok = await removeUser(userId);
    if (ok) {
      toast.success("Student deleted successfully");
      await fetchAll();
    } else {
      toast.error("Failed to delete student");
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 dashboard-shell">
      <Navbar />
      <div className="d-flex flex-grow-1" style={{ minHeight: "calc(100vh - 56px)" }}>
        <div
          className={`bg-white shadow-sm p-3 ${isMenuOpen ? "d-block position-fixed top-0 start-0 vh-100" : "d-none d-lg-block"}`}
          style={{
            width: isMenuOpen ? "85%" : "250px",
            maxWidth: isMenuOpen ? "320px" : "250px",
            minHeight: "100%",
            zIndex: isMenuOpen ? 1052 : "auto",
          }}
        >
          <h5 className="text-secondary mb-4 small fw-bold text-uppercase">Management</h5>
          <ul className="nav flex-column">
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "dashboard" ? "bg-primary text-white" : "text-dark"}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <i className="bi bi-speedometer2 me-2"></i>Dashboard
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "users" ? "bg-primary text-white" : "text-dark"}`}
                onClick={() => setActiveTab("users")}
              >
                <i className="bi bi-people me-2"></i>User Directory
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "courses" ? "bg-primary text-white" : "text-dark"}`}
                onClick={() => setActiveTab("courses")}
              >
                <i className="bi bi-collection-play me-2"></i>Global Courses
              </button>
            </li>
            <li className="nav-item mb-2">
              <button
                className={`nav-link btn btn-link text-start w-100 ${activeTab === "complaints" ? "bg-primary text-white" : "text-dark"}`}
                onClick={() => setActiveTab("complaints")}
              >
                <i className="bi bi-chat-left-dots me-2"></i>Complaints{" "}
                {pendingComplaints > 0 && (
                  <span className="badge bg-danger ms-2">{pendingComplaints}</span>
                )}
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
                className="p-5 mb-4 rounded shadow-sm text-white"
                style={{ backgroundColor: "#4f46e5" }}
              >
                <h1 className="display-5 fw-bold">Platform Overview</h1>
                <p className="lead">
                  You have full control over users, courses, and system health.
                </p>
              </div>
              <div className="row g-4">
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm text-center p-3">
                    <h6 className="text-muted text-uppercase small">Total Users</h6>
                    <h2 className="fw-bold">{totalUsers}</h2>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm text-center p-3">
                    <h6 className="text-muted text-uppercase small">Active Courses</h6>
                    <h2 className="fw-bold text-success">{totalCourses}</h2>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm text-center p-3">
                    <h6 className="text-muted text-uppercase small">Live Quizzes</h6>
                    <h2 className="fw-bold text-info">{totalQuizzes}</h2>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm text-center p-3">
                    <h6 className="text-muted text-uppercase small">Pending Issues</h6>
                    <h2 className="fw-bold text-danger">{pendingComplaints}</h2>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="container-fluid p-0">
              <h2 className="mb-4 fw-bold">User Management</h2>

              <div className="card shadow-sm border-0 mb-5">
                <div className="card-header bg-primary text-white fw-bold">
                  <i className="bi bi-person-badge me-2"></i> Platform Instructors
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Courses</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter((u) => u.role === "instructor")
                        .map((inst) => {
                          const instCourseIds = courses
                            .filter((c) => c.instructorId === inst.id)
                            .map((c) => c.id);
                          const studentCount = enrollments.filter((e) =>
                            instCourseIds.includes(e.courseId),
                          ).length;

                          return (
                            <tr key={inst.id}>
                              <td>
                                <div className="fw-bold">{inst.name}</div>
                                <button
                                  className="btn btn-sm btn-link text-primary p-0"
                                  onClick={() => setSelectedInstructor(inst.id)}
                                >
                                  View {studentCount} Enrolled Students
                                </button>
                              </td>
                              <td>{inst.email}</td>
                              <td>{instCourseIds.length} Courses</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeInstructor(inst.id)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedInstructor && (
                <div className="card shadow-sm border-0 mb-4">
                  <div className="card-header bg-info text-white fw-bold">
                    Students Enrolled under Selected Instructor
                  </div>
                  <div className="card-body">
                    <button
                      className="btn btn-sm btn-secondary mb-3"
                      onClick={() => setSelectedInstructor(null)}
                    >
                      Close
                    </button>
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Course</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments
                            .filter((e) =>
                              courses.some(
                                (c) =>
                                  c.instructorId === selectedInstructor &&
                                  c.id === e.courseId,
                              ),
                            )
                            .map((enrollItem, idx) => {
                              const student = users.find(
                                (u) => u.id === enrollItem.userId,
                              );
                              const course = courses.find(
                                (c) => c.id === enrollItem.courseId,
                              );
                              if (!student || !course) return null;
                              return (
                                <tr key={`i-${idx}`}>
                                  <td>{student.id}</td>
                                  <td>{student.name}</td>
                                  <td>{course.title}</td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => {
                                        setSelectedStudent(student);
                                        setSelectedCourseForStudent(course);
                                      }}
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {selectedStudent && selectedCourseForStudent && (
                <StudentPerformanceDashboard
                  student={selectedStudent}
                  course={selectedCourseForStudent}
                  enrollments={enrollments}
                  courseProgress={courseProgress}
                  quizAttempts={quizAttempts}
                  quizzes={quizzes}
                  onClose={() => {
                    setSelectedStudent(null);
                    setSelectedCourseForStudent(null);
                  }}
                />
              )}

              <div className="card shadow-sm border-0">
                <div className="card-header bg-secondary text-white fw-bold">
                  <i className="bi bi-people me-2"></i> Registered Students
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Enrolled In</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter((u) => u.role === "student")
                        .map((stud) => (
                          <tr key={stud.id}>
                            <td className="fw-bold">{stud.name}</td>
                            <td>{stud.email}</td>
                            <td>
                              {enrollments.filter((e) => e.userId === stud.id).length}{" "}
                              Courses
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeStudent(stud.id)}
                              >
                                Delete Account
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "courses" && (
            <div>
              <h2 className="mb-4 fw-bold">Global Course Management</h2>
              <div className="row g-4">
                {courses.map((course) => (
                  <div key={course.id} className="col-md-4">
                    <CourseCard
                      course={course}
                      onView={(c) => {
                        setSelectedCourse(c);
                        setActiveTab("view-course");
                      }}
                      onDelete={deleteAnyCourse}
                      userRole="admin"
                    />
                  </div>
                ))}
                {courses.length === 0 && (
                  <p className="text-muted">No courses on the platform yet.</p>
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

          {activeTab === "complaints" && (
            <div>
              <h2 className="mb-4 fw-bold">Platform Complaints</h2>
              <div className="row g-3">
                {complaints.length === 0 ? (
                  <div className="col-12 text-center py-5">
                    <i className="bi bi-info-circle display-4 text-muted mb-3"></i>
                    <h5 className="text-muted">No complaints yet</h5>
                    <p className="text-muted">Great job! No outstanding issues.</p>
                  </div>
                ) : (
                  complaints.map((c) => (
                    <div key={c.id} className="col-md-6">
                      <div
                        className={`card shadow-sm border-start border-4 ${c.status === "pending" ? "border-danger" : "border-success"}`}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between">
                            <h6 className="fw-bold">From: {c.userName}</h6>
                            <span
                              className={`badge ${c.status === "pending" ? "bg-danger" : "bg-success"}`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <p className="small mt-2">{c.complaint}</p>
                          {c.adminMessage && (
                            <div className="alert alert-light border-start border-4 border-info mt-3">
                              <strong>Admin note:</strong>
                              <p className="mb-0 mt-1">{c.adminMessage}</p>
                            </div>
                          )}
                          {c.status === "pending" && (
                            <>
                              <div className="mb-3 mt-3">
                                <label className="form-label small fw-semibold">Optional student note</label>
                                <textarea
                                  className="form-control"
                                  rows={2}
                                  value={adminFeedback[c.id] || ""}
                                  onChange={(e) =>
                                    setAdminFeedback((prev) => ({
                                      ...prev,
                                      [c.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="How should the student fix this? (optional)"
                                />
                              </div>
                            <button
                              className="btn btn-sm btn-primary w-100 mt-2"
                                onClick={() => solveComplaint(c.id, adminFeedback[c.id] || "")}
                            >
                              Resolve Issue
                            </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
