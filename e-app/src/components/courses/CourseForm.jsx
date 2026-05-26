import React, { useState, useEffect } from "react";
import { useDebouncedCallback, makeInputValidator } from "../../utils/formValidation";

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
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

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

  const validateField = (name, value) => {
    switch (name) {
      case "title":
        if (!value.trim()) {
          return "Course title is required.";
        }
        if (value.trim().length < 3) {
          return "Course title must be at least 3 characters.";
        }
        if (/^\s*\d/.test(value)) {
          return "Course title cannot start with a digit.";
        }
        if (!/[A-Za-z]/.test(value.trim())) {
          return "Course title must include letters.";
        }
        return "";
      case "description":
        if (!value.trim()) {
          return "Course description is required.";
        }
        if (value.trim().length < 10) {
          return "Description must be at least 10 characters.";
        }
        return "";
      case "thumbnail":
        if (!value.trim()) {
          return "Course thumbnail is required.";
        }
        if (thumbType === "url" && !value.startsWith("http")) {
          return "Please enter a valid URL.";
        }
        return "";
      case "topic":
        if (!value.trim()) {
          return "Topic name is required.";
        }
        if (value.trim().length < 3) {
          return "Topic name must be at least 3 characters.";
        }
        return "";
      case "videoUrl":
        if (!value.trim()) {
          return "Video URL is required.";
        }
        if (!value.includes("youtube.com") && !value.includes("youtu.be")) {
          return "Please enter a valid YouTube URL.";
        }
        return "";
      case "materialName":
        if (!value.trim()) {
          return "Material name is required.";
        }
        return "";
      case "materialValue":
        if (!value.trim()) {
          return "Material content is required.";
        }
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (name, value, ruleName = name) => {
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(ruleName, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const validateOnInput = makeInputValidator(validateField);

  const runInputValidation = useDebouncedCallback((errorKey, ruleName, value) => {
    setErrors((prev) => ({ ...prev, [errorKey]: validateOnInput(ruleName, value) }));
  }, 300);

  const handleFieldChange = (name, value) => {
    setCourseData((prev) => ({ ...prev, [name]: value }));
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    runInputValidation(name, name, value);
  };

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
    if (field === "topic" || field === "videoUrl") {
      const errorKey = `${field}-${index}`;
      setTouchedFields((prev) => ({ ...prev, [errorKey]: true }));
      runInputValidation(errorKey, field, value);
    }
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
        setCourseData((prev) => {
          const next = { ...prev, [field]: reader.result };
          const fieldError = validateField(field, reader.result);
          setErrors((prevErrors) => ({ ...prevErrors, [field]: fieldError }));
          return next;
        });
      }
    };
    if (file) reader.readAsDataURL(file);
  };

  const validateAll = () => {
    const newErrors = {};
    const newTouched = {};
    const titleErr = validateField("title", courseData.title);
    if (titleErr) newErrors.title = titleErr;
    newTouched.title = true;
    const descErr = validateField("description", courseData.description);
    if (descErr) newErrors.description = descErr;
    newTouched.description = true;
    const thumbErr = validateField("thumbnail", courseData.thumbnail);
    if (thumbErr) newErrors.thumbnail = thumbErr;
    newTouched.thumbnail = true;
    courseData.content.forEach((item, index) => {
      const topicErr = validateField("topic", item.topic);
      const topicKey = `topic-${index}`;
      newTouched[topicKey] = true;
      if (topicErr) newErrors[topicKey] = topicErr;
      if (item.type === "url") {
        const urlErr = validateField("videoUrl", item.videoUrl);
        const urlKey = `videoUrl-${index}`;
        newTouched[urlKey] = true;
        if (urlErr) newErrors[urlKey] = urlErr;
      }
    });
    courseData.materials.forEach((item, index) => {
      const nameKey = `materialName-${index}`;
      const valueKey = `materialValue-${index}`;
      const nameErr = validateField("materialName", item.name || "");
      const valueErr = validateField("materialValue", item.value || "");
      newTouched[nameKey] = true;
      newTouched[valueKey] = true;
      if (nameErr) newErrors[nameKey] = nameErr;
      if (valueErr) newErrors[valueKey] = valueErr;
    });
    setTouchedFields((prev) => ({ ...prev, ...newTouched }));
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!validateAll()) return;
        onSubmit(courseData);
      }}
      className="p-2"
    >
      <div className="row g-3">
        <div className="col-md-8">
          <label className="form-label fw-bold small">Course Title</label>
          <input
            type="text"
            className={`form-control ${errors.title && touchedFields.title ? "is-invalid" : ""}`}
            value={courseData.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            onBlur={(e) => handleBlur("title", e.target.value)}
            required
          />
          {errors.title && touchedFields.title && <span className="text-danger small d-block mt-2">{errors.title}</span>}
        </div>
        <div className="col-md-4">
          <label className="form-label fw-bold small">Duration</label>
          <div className="d-flex gap-2">
            <div className="flex-grow-1">
              <select
                className="form-select form-select-sm"
                value={durationWeeks}
                onChange={(e) =>
                  handleDurationChange(
                    e.target.value,
                    durationDays,
                    durationHours,
                  )
                }
              >
                {Array.from({ length: 53 }, (_, i) => (
                  <option key={i} value={i}>
                    {i} {i === 1 ? "week" : "weeks"}
                  </option>
                ))}
              </select>
              <small className="text-muted d-block mt-1">Weeks</small>
            </div>
            <div className="flex-grow-1">
              <select
                className="form-select form-select-sm"
                value={durationDays}
                onChange={(e) =>
                  handleDurationChange(
                    durationWeeks,
                    e.target.value,
                    durationHours,
                  )
                }
              >
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i} value={i}>
                    {i} {i === 1 ? "day" : "days"}
                  </option>
                ))}
              </select>
              <small className="text-muted d-block mt-1">Days</small>
            </div>
            <div className="flex-grow-1">
              <select
                className="form-select form-select-sm"
                value={durationHours}
                onChange={(e) =>
                  handleDurationChange(
                    durationWeeks,
                    durationDays,
                    e.target.value,
                  )
                }
              >
                {Array.from({ length: 25 }, (_, i) => (
                  <option key={i} value={i}>
                    {i} {i === 1 ? "hour" : "hours"}
                  </option>
                ))}
              </select>
              <small className="text-muted d-block mt-1">Hours</small>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 card p-3 bg-light border-0">
        <label className="form-label fw-bold small">Course Thumbnail</label>
        <div className="d-flex gap-3 mb-2">
          <select
            className="form-select form-select-sm w-auto"
            value={thumbType}
            onChange={(e) => setThumbType(e.target.value)}
          >
            <option value="url">External URL</option>
            <option value="file">Upload from Device</option>
          </select>
        </div>
        {thumbType === "url" ? (
          <div>
            <input
              type="url"
              className={`form-control ${errors.thumbnail && touchedFields.thumbnail ? "is-invalid" : ""}`}
              placeholder="https://..."
              value={courseData.thumbnail}
              onChange={(e) => handleFieldChange("thumbnail", e.target.value)}
              onBlur={(e) => handleBlur("thumbnail", e.target.value)}
              required
            />
            {errors.thumbnail && touchedFields.thumbnail && <span className="text-danger small d-block mt-2">{errors.thumbnail}</span>}
          </div>
        ) : (
          <div>
            <input
              type="file"
              className={`form-control ${errors.thumbnail && touchedFields.thumbnail ? "is-invalid" : ""}`}
              accept="image/*"
              onChange={(e) => handleFileUpload(e)}
              onBlur={() => handleBlur("thumbnail", courseData.thumbnail)}
              required
            />
            {errors.thumbnail && touchedFields.thumbnail && <span className="text-danger small d-block mt-2">{errors.thumbnail}</span>}
          </div>
        )}
      </div>

      <div className="mt-3 mb-3">
        <label className="form-label fw-bold small">Description</label>
        <textarea
          className={`form-control ${errors.description && touchedFields.description ? "is-invalid" : ""}`}
          rows="2"
          value={courseData.description}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          onBlur={(e) => handleBlur("description", e.target.value)}
          required
        />
        {errors.description && touchedFields.description && <span className="text-danger small d-block mt-2">{errors.description}</span>}
      </div>

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
      <div>
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
                          className={`form-control ${errors[`topic-${index}`] && touchedFields[`topic-${index}`] ? "is-invalid" : ""}`}
                          value={item.topic}
                          onChange={(e) =>
                            handleTopicChange(index, "topic", e.target.value)
                          }
                          onBlur={(e) => handleBlur(`topic-${index}`, e.target.value)}
                          required
                        />
                        {errors[`topic-${index}`] && touchedFields[`topic-${index}`] && <span className="text-danger small d-block mt-2">{errors[`topic-${index}`]}</span>}
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
                        <div>
                          <input
                            type="url"
                            className={`form-control form-control-sm ${errors[`videoUrl-${index}`] && touchedFields[`videoUrl-${index}`] ? "is-invalid" : ""}`}
                            placeholder="Paste YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
                            value={item.videoUrl}
                            onChange={(e) =>
                              handleTopicChange(index, "videoUrl", e.target.value)
                            }
                            onBlur={(e) => handleBlur(`videoUrl-${index}`, e.target.value)}
                            required
                          />
                          {errors[`videoUrl-${index}`] && touchedFields[`videoUrl-${index}`] && <span className="text-danger small d-block mt-2">{errors[`videoUrl-${index}`]}</span>}
                        </div>
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
                    className={`form-control form-control-sm ${errors[`materialName-${index}`] && touchedFields[`materialName-${index}`] ? "is-invalid" : ""}`}
                    placeholder="e.g. Java Material, React Notes"
                    value={item.name || ""}
                    onChange={(e) => {
                      const updatedMaterials = [...courseData.materials];
                      updatedMaterials[index].name = e.target.value;
                      setCourseData({ ...courseData, materials: updatedMaterials });
                      const errorKey = `materialName-${index}`;
                      setTouchedFields((prev) => ({ ...prev, [errorKey]: true }));
                      runInputValidation(errorKey, "materialName", e.target.value);
                    }}
                    onBlur={(e) => handleBlur(`materialName-${index}`, e.target.value, "materialName")}
                  />
                  {errors[`materialName-${index}`] && touchedFields[`materialName-${index}`] && <span className="text-danger small d-block mt-2">{errors[`materialName-${index}`]}</span>}
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
                      <div>
                        <textarea
                          className={`form-control form-control-sm ${errors[`materialValue-${index}`] && touchedFields[`materialValue-${index}`] ? "is-invalid" : ""}`}
                          rows="3"
                          placeholder="Enter material text..."
                          value={item.value}
                          onChange={(e) => {
                            const updatedMaterials = [...courseData.materials];
                            updatedMaterials[index].value = e.target.value;
                            setCourseData({ ...courseData, materials: updatedMaterials });
                            const errorKey = `materialValue-${index}`;
                            setTouchedFields((prev) => ({ ...prev, [errorKey]: true }));
                            runInputValidation(errorKey, "materialValue", e.target.value);
                          }}
                          onBlur={(e) => handleBlur(`materialValue-${index}`, e.target.value, "materialValue")}
                        />
                        {errors[`materialValue-${index}`] && touchedFields[`materialValue-${index}`] && <span className="text-danger small d-block mt-2">{errors[`materialValue-${index}`]}</span>}
                      </div>
                    ) : (
                      <div className="input-group input-group-sm">
                        <input
                          type="file"
                          className={`form-control ${errors[`materialValue-${index}`] && touchedFields[`materialValue-${index}`] ? "is-invalid" : ""}`}
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
                          onBlur={() => handleBlur(`materialValue-${index}`, item.value)}
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
