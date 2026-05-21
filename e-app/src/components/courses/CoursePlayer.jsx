import React, { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";

// CoursePlayer - main player to watch course videos and mark topics as complete
export default function CoursePlayer({
  course,
  onBack,
  onEnroll,
  isEnrolled,
  onTopicComplete,
  onUpdateLastActive,
  previewMode = false,
  onEditTopic,
  onDeleteTopic,
}) {
  const toast = useToast();
  const [currentVideo, setCurrentVideo] = useState(course.content?.[0] || null);
  const [completedTopics, setCompletedTopics] = useState(new Set());
  const [activeMaterialIndex, setActiveMaterialIndex] = useState(0);

  useEffect(() => {
    if (isEnrolled && typeof onUpdateLastActive === "function") {
      onUpdateLastActive(course.id);
    }
  }, [course.id, isEnrolled, onUpdateLastActive]);

  const getEmbedUrl = (url) => {
    if (!url) return "";

    const youtubeRegex =
      /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/?(?:watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);

    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }

    if (url.includes("youtube.com/embed/")) {
      return url;
    }

    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const oldMatch = url.match(regExp);
    return oldMatch && oldMatch[2].length === 11
      ? `https://www.youtube.com/embed/${oldMatch[2]}`
      : url;
  };

  const handleTopicClick = (item) => {
    setCurrentVideo(item);
  };

  const activeMaterial = course.materials?.[activeMaterialIndex];

  const printMaterial = (materialSrc) => {
    if (!materialSrc) return;
    const printWindow = window.open(materialSrc, "_blank");
    if (printWindow) {
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleMarkComplete = () => {
    if (!isEnrolled) {
      toast.warning("Please enroll in the course to track and update progress.");
      return;
    }

    if (!currentVideo) return;

    if (!completedTopics.has(currentVideo.topic)) {
      setCompletedTopics((prev) => {
        const next = new Set(prev);
        next.add(currentVideo.topic);
        return next;
      });

      if (typeof onTopicComplete === "function") {
        onTopicComplete(course.id, currentVideo.topic);
      }
    }
  };

        useEffect(() => {
          if (course.materials && course.materials.length > 0) {
            setActiveMaterialIndex(0);
          }
        }, [course.materials]);
  const totalTopics = course.content?.length || 0;
  const completedCount = completedTopics.size;
  const progressPercent = totalTopics
    ? Math.round((completedCount / totalTopics) * 100)
    : 0;
  const shouldShowProgress = isEnrolled && typeof onTopicComplete === "function";

  return (
    <div className="container-fluid p-0">
      <button
        className="btn btn-link text-decoration-none mb-3 ps-0"
        onClick={onBack}
      >
        <i className="bi bi-arrow-left me-2"></i> Back to Courses
      </button>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-play-circle text-primary me-2"></i>
              {currentVideo?.topic || "Select a topic to start"}
            </h5>
            {!previewMode && (
              <button
                className="btn btn-sm btn-success"
                onClick={handleMarkComplete}
                disabled={!currentVideo}
                title="Mark this topic as complete"
              >
                <i className="bi bi-check2-all me-1"></i>Mark Complete
              </button>
            )}
          </div>

          <div className="ratio ratio-16x9 shadow-sm rounded overflow-hidden bg-black">
              {currentVideo ? (
                <iframe
                  src={getEmbedUrl(currentVideo.videoUrl)}
                  title={currentVideo.topic}
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="d-flex align-items-center justify-content-center text-white">
                  <p>No video available for this course.</p>
                </div>
              )}
            </div>

          {activeMaterial && (
            <div className="card shadow-sm border-0 mt-4">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold">Document Preview</h5>
              </div>
              <div className="card-body">
                {activeMaterial.type === "pdf" ? (
                  <iframe
                    src={activeMaterial.value || activeMaterial.content}
                    title={activeMaterial.name || `Document ${activeMaterialIndex + 1}`}
                    className="w-100 border rounded"
                    style={{ minHeight: "520px" }}
                  />
                ) : (
                    <div className="border rounded p-3 bg-light">
                      <h6 className="fw-bold">{activeMaterial.name || `Text Material ${activeMaterialIndex + 1}`}</h6>
                      <p className="mb-3 text-secondary">Text material content is shown below.</p>
                      <div className="p-3 bg-white rounded" style={{ whiteSpace: "pre-wrap", minHeight: "200px" }}>
                        {activeMaterial.value || "No text content available."}
                      </div>
                    </div>
                )}
                <div className="mt-3 d-flex flex-wrap gap-2">
                  <a
                    href={activeMaterial.value || activeMaterial.content}
                    download={activeMaterial.name || `document-${activeMaterialIndex + 1}`}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          )}

          <h3 className="mt-4 fw-bold">{course.title}</h3>
          <p className="text-secondary">{course.description}</p>

          <div className="mb-3">
            {shouldShowProgress ? (
              <>
                <strong>Topic Progress:</strong> {progressPercent}%
                <div className="progress mt-2" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${progressPercent}%` }}
                    aria-valuenow={progressPercent}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <small className="text-muted">
                  {completedCount}/{totalTopics} topics completed
                </small>
              </>
            ) : (
              <p className="text-muted mb-0">Progress tracking available after enrolling.</p>
            )}
          </div>

          {onEnroll &&
            (isEnrolled ? (
              <button className="btn btn-success btn-lg w-100" disabled>
                <i className="bi bi-check-circle me-2"></i>Enrolled
              </button>
            ) : (
              <button
                className="btn btn-primary btn-lg w-100"
                onClick={() => {
                  onEnroll(course.id);
                  toast.success("Successfully enrolled in " + course.title);
                }}
              >
                <i className="bi bi-person-plus me-2"></i>Enroll Now
              </button>
            ))}
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold">Course Content</h5>
            </div>
            <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: "320px" }}>
              {course.content?.map((item, index) => (
                <div
                  key={index}
                  className={`list-group-item py-3 border-start border-4 d-flex justify-content-between align-items-center ${currentVideo?.topic === item.topic ? "border-primary bg-light fw-bold" : "border-transparent"}`}
                  role="button"
                  onClick={() => handleTopicClick(item)}
                >
                  <div className="d-flex align-items-center">
                    <i
                      className={`bi ${currentVideo?.topic === item.topic ? "bi-play-circle-fill text-primary" : "bi-play-circle text-muted"} me-3 fs-5`}
                    ></i>
                    <span>{item.topic}</span>
                  </div>
                  {previewMode ? (
                    <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        title="Edit this topic"
                        onClick={() => onEditTopic && onEditTopic(index, item)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        title="Delete this topic"
                        onClick={() => onDeleteTopic && onDeleteTopic(index, item)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  ) : completedTopics.has(item.topic) ? (
                    <i className="bi bi-check2-all text-success fs-5"></i>
                  ) : isEnrolled ? (
                    <i className="bi bi-clock text-secondary"></i>
                  ) : (
                    <i className="bi bi-lock-fill text-muted"></i>
                  )}
                </div>
              ))}
            </div>
            {course.materials && course.materials.length > 0 && (
              <div className="mt-0">
                <div className="list-group list-group-flush">
                  <div className="list-group-item bg-light text-muted">
                    <strong>Materials</strong>
                  </div>
                  {course.materials.map((material, index) => {
                    const label = material.name
                      ? material.name
                      : material.type === "pdf"
                      ? `Document ${index + 1}`
                      : `Text material ${index + 1}`;
                    return (
                      <div
                        key={index}
                        className={`list-group-item py-3 border-start border-4 d-flex justify-content-between align-items-center ${
                          index === activeMaterialIndex ? "border-primary bg-light fw-bold" : "border-transparent"
                        }`}
                        role="button"
                        onClick={() => setActiveMaterialIndex(index)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex align-items-center">
                          <i
                            className={`bi ${material.type === "pdf" ? "bi-file-pdf text-danger" : "bi-file-text text-secondary"} me-3 fs-5`}
                          ></i>
                          <span>{label}</span>
                        </div>
                        {previewMode ? (
                          <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              title="Edit this material"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              title="Delete this material"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
