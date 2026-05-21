import React, { useState, useEffect } from "react";

// CourseForm - form to create new courses with topics and videos
export default function CourseForm({ onSubmit, onCancel, initialData = null, initialActiveTopicIndex = 0 }) {
  // Track if thumbnail is from URL or file upload
  const [thumbType, setThumbType] = useState("url"); // "url" or "file" //image thumbnail
  // Store duration in weeks, days, hours separately
  const [durationWeeks, setDurationWeeks] = useState(0);
  const [durationDays, setDurationDays] = useState(0);
  const [durationHours, setDurationHours] = useState(0);
  const [activeTopicIndex, setActiveTopicIndex] = useState(initialActiveTopicIndex || 0);
  const [activeSection, setActiveSection] = useState("topics");

  // Main course form data
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    duration: "", // Will store as "12 weeks 20 days 10 hours"
    durationBreakdown: { weeks: 0, days: 0, hours: 0 }, // For easier parsing
    content: [{ topic: "", type: "url", videoUrl: "", videoFile: "", topicDesc: "" }],
    materials: [{ type: "text", value: "", name: "" }],
  });

  const parseDuration = (duration = "") => {
    const result = { weeks: 0, days: 0, hours: 0 };
    if (duration && typeof duration === "string") {
      const weeksMatch = duration.match(/(\d+)\s*weeks?/i);
      const daysMatch = duration.match(/(\d+)\s*days?/i);
      const hoursMatch = duration.match(/(\d+)\s*hours?/i);
      result.weeks = weeksMatch ? parseInt(weeksMatch[1], 10) : 0;
      result.days = daysMatch ? parseInt(daysMatch[1], 10) : 0;
      result.hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    }
    return result;
  };

  useEffect(() => {
    if (!initialData) {
      setCourseData({
        title: "",
        description: "",
        thumbnail: "",
        duration: "",
        durationBreakdown: { weeks: 0, days: 0, hours: 0 },
        content: [{ topic: "", type: "url", videoUrl: "", videoFile: "", topicDesc: "" }],
        materials: [{ type: "text", value: "", name: "" }],
      });
      setDurationWeeks(0);
      setDurationDays(0);
      setDurationHours(0);
      setThumbType("url");
      setActiveTopicIndex(0);
      return;
    }

    const breakdown = initialData.durationBreakdown || parseDuration(initialData.duration);
    const preparedContent = Array.isArray(initialData.content)
      ? initialData.content.map((item) => ({
          topic: item.topic || "",
          type: item.type || "url",
          videoUrl: item.videoUrl || "",
          videoFile: item.videoFile || "",
          topicDesc: item.topicDesc || "",
        }))
      : [{ topic: "", type: "url", videoUrl: "", videoFile: "", topicDesc: "" }];
      const preparedMaterials = Array.isArray(initialData.materials)
        ? initialData.materials.map((item) => ({
            type: item.type || "text",
            value: item.value || "",
            name: item.name || "",
          }))
        : [{ type: "text", value: "", name: "" }];

    setCourseData({
      title: initialData.title || "",
      description: initialData.description || "",
      thumbnail: initialData.thumbnail || "",
      duration: initialData.duration || `${breakdown.weeks} weeks ${breakdown.days} days ${breakdown.hours} hours`,
      durationBreakdown: breakdown,
      content: preparedContent,
      materials: preparedMaterials,
    });
    setDurationWeeks(breakdown.weeks);
    setDurationDays(breakdown.days);
    setDurationHours(breakdown.hours);
    setThumbType(initialData.thumbnail?.startsWith("data:") ? "file" : "url");
    const safeIndex = Math.min(
      Math.max(initialActiveTopicIndex || 0, 0),
      Math.max(preparedContent.length - 1, 0),
    );
    setActiveTopicIndex(safeIndex);
    setActiveSection("topics");
  }, [initialData, initialActiveTopicIndex]);

  // Update course data whenever duration parts change
  const handleDurationChange = (weeks, days, hours) => {
    setDurationWeeks(weeks);
    setDurationDays(days);
    setDurationHours(hours);

    const durationString = `${weeks} weeks ${days} days ${hours} hours`;
    setCourseData({
      ...courseData,
      duration: durationString,
      durationBreakdown: {
        weeks: parseInt(weeks),
        days: parseInt(days),
        hours: parseInt(hours),
      },
    });
  };

  const handleAddTopic = () => {
    setCourseData({
      ...courseData,
      content: [
        ...courseData.content,
        { topic: "", type: "url", videoUrl: "", topicDesc: "" },
      ],
    });
    setActiveTopicIndex(courseData.content.length);
  };

  const handleRemoveMaterial = (index) => {
    const updatedMaterials = [...courseData.materials];
    updatedMaterials.splice(index, 1);
    setCourseData({ ...courseData, materials: updatedMaterials });
  };

  const handleTopicChange = (index, field, value) => {
    const updatedContent = [...courseData.content];
    updatedContent[index][field] = value;
    setCourseData({ ...courseData, content: updatedContent });
  };

  const handleRemoveTopic = (index) => {
    const updatedContent = [...courseData.content];
    updatedContent.splice(index, 1);
    if (updatedContent.length === 0) {
      updatedContent.push({ topic: "", type: "url", videoUrl: "", videoFile: "", topicDesc: "" });
    }
    setCourseData({ ...courseData, content: updatedContent });
    setActiveTopicIndex((prev) => Math.max(0, Math.min(prev, updatedContent.length - 1)));
  };

  const handleFileUpload = (e, index = null, field = "thumbnail") => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      if (index !== null) {
        handleTopicChange(index, field, reader.result);
      } else {
        setCourseData({ ...courseData, [field]: reader.result });
      }
    };
    if (file) reader.readAsDataURL(file);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(courseData);
      }}
      className="p-2"
    >
      <div className="row g-3">
        <div className="col-md-8">
          <label className="form-label fw-bold small">Course Title</label>
          <input
            type="text"
            className="form-control"
            value={courseData.title}
            onChange={(e) =>
              setCourseData({ ...courseData, title: e.target.value })
            }
            required
            />
            <div className="d-flex gap-2 mt-3 mb-4">
              <button
                type="button"
                className={`btn btn-sm ${activeSection === "topics" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setActiveSection("topics")}
              >
                Topics
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeSection === "materials" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setActiveSection("materials")}
              >
                Materials
              </button>
            </div>
        {activeSection === "topics" ? (
          <>
            {courseData.content.length > 1 && (
              <div className="mb-3 d-flex flex-wrap gap-2">
                {courseData.content.map((item, index) => (
                  <button
                    type="button"
                    key={index}
                    className={`btn btn-sm ${index === activeTopicIndex ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setActiveTopicIndex(index)}
                  >
                    Topic {index + 1}
                  </button>
                ))}
              </div>
            )}
            <div className="border rounded p-3 mb-3 bg-white shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="mb-1">Topic {activeTopicIndex + 1}</h6>
                  <small className="text-muted">
                    {courseData.content.length} topic{courseData.content.length === 1 ? "" : "s"}
                  </small>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleRemoveTopic(activeTopicIndex)}
                  disabled={courseData.content.length === 1}
                >
                  <i className="bi bi-trash me-1"></i>Remove Topic
                </button>
              </div>

              {courseData.content.map((item, index) =>
                index === activeTopicIndex ? (
                  <div key={index}>
                    <div className="row g-2 mb-2">
                      <div className="col-md-6">
                        <input
                          placeholder="Topic Name"
                          className="form-control"
                          value={item.topic}
                          onChange={(e) =>
                            handleTopicChange(index, "topic", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <select
                          className="form-select"
                          value={item.type}
                          onChange={(e) =>
                            handleTopicChange(index, "type", e.target.value)
                          }
                        >
                          <option value="url">YouTube URL</option>
                          <option value="video">Local Video File</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-2">
                      {item.type === "url" ? (
                        <input
                          type="url"
                          className="form-control form-control-sm"
                          placeholder="Paste YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
                          value={item.videoUrl}
                          onChange={(e) =>
                            handleTopicChange(index, "videoUrl", e.target.value)
                          }
                          required
                        />
                      ) : (
                        <input
                          type="file"
                          className="form-control form-control-sm"
                          accept="video/*"
                          onChange={(e) => handleFileUpload(e, index, "videoFile")}
                          required
                        />
                      )}
                    </div>

                    <input
                      placeholder="Topic Description (Optional)"
                      className="form-control form-control-sm"
                      value={item.topicDesc}
                      onChange={(e) =>
                        handleTopicChange(index, "topicDesc", e.target.value)
                      }
                    />
                  </div>
                  ) : null
                )}

              <div className="d-flex justify-content-between mt-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setActiveTopicIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={activeTopicIndex === 0}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() =>
                    setActiveTopicIndex((prev) =>
                      Math.min(prev + 1, courseData.content.length - 1),
                    )
                  }
                  disabled={activeTopicIndex === courseData.content.length - 1}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="border rounded p-3 mb-3 bg-white shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="mb-1">Course Materials</h6>
                <small className="text-muted">
                  {courseData.materials.length} material{courseData.materials.length === 1 ? "" : "s"}
                </small>
              </div>
            </div>
            {courseData.materials.map((item, index) => (
              <div key={index} className="border rounded p-3 mb-3 bg-light">
                <div className="mb-3">
                  <label className="form-label small">Material Label</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Java Material, React Notes"
                    value={item.name || ""}
                    onChange={(e) => {
                      const updatedMaterials = [...courseData.materials];
                      updatedMaterials[index].name = e.target.value;
                      setCourseData({ ...courseData, materials: updatedMaterials });
                    }}
                  />
                </div>
                <div className="row g-2 align-items-center">
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={item.type}
                      onChange={(e) => {
                        const updatedMaterials = [...courseData.materials];
                        updatedMaterials[index].type = e.target.value;
                        setCourseData({ ...courseData, materials: updatedMaterials });
                      }}
                    >
                      <option value="text">Text Material</option>
                      <option value="pdf">PDF / Document</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    {item.type === "text" ? (
                      <textarea
                        className="form-control form-control-sm"
                        rows="3"
                        placeholder="Enter material text..."
                        value={item.value}
                        onChange={(e) => {
                          const updatedMaterials = [...courseData.materials];
                          updatedMaterials[index].value = e.target.value;
                          setCourseData({ ...courseData, materials: updatedMaterials });
                        }}
                      />
                    ) : (
                      <div className="input-group input-group-sm">
                        <input
                          type="file"
                          className="form-control"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const updatedMaterials = [...courseData.materials];
                              updatedMaterials[index].value = reader.result;
                              updatedMaterials[index].name = file?.name || updatedMaterials[index].name;
                              setCourseData({ ...courseData, materials: updatedMaterials });
                            };
                            if (file) reader.readAsDataURL(file);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="col-md-2 text-end">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleRemoveMaterial(index)}
                      disabled={courseData.materials.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {item.name && (
                  <p className="mt-2 mb-0 small text-muted">Uploaded: {item.name}</p>
                )}
              </div>
            ))}
          </div>
        )}

        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4">
        {activeSection === "materials" ? (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() =>
              setCourseData({
                ...courseData,
                materials: [...courseData.materials, { type: "text", value: "", name: "" }],
              })
            }
          >
            + Add Material
          </button>
        ) : null}
        {activeSection === "topics" ? (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={handleAddTopic}
          >
            + Add Topic
          </button>
        ) : null}
      </div>

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-primary w-100">
          <i className="bi bi-eye me-2"></i>
          {initialData ? "Preview Changes" : "Preview Course"}
        </button>
        <button
          type="button"
          className="btn btn-light w-100"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
