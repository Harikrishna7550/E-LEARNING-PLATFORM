import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "../styles/InstructorProfile.css";

const DEFAULT_AVATAR = "/default-profile.png";
const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i;

export default function InstructorProfile() {
  const { user, updateUserProfile, refreshUserProfile } = useAuth();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    bio: "",
    qualifications: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    twitterUrl: "",
    subjectExpertise: [],
    profilePicturePreview: DEFAULT_AVATAR,
  });
  const [originalData, setOriginalData] = useState(profileData);
  const [errors, setErrors] = useState({});


  useEffect(() => {
    if (!user) {
      console.log("No user object available yet");
      return;
    }

    console.log("=== LOADING INSTRUCTOR PROFILE ===");
    console.log("User data:", user);
    console.log("Instructor profile from user:", user.instructorProfile);

    const instructorProfile = user.instructorProfile || {};
    const subjectExpertise = Array.isArray(instructorProfile.subjectExpertise)
      ? instructorProfile.subjectExpertise
      : typeof instructorProfile.subjectExpertise === "string"
      ? instructorProfile.subjectExpertise
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    const preview =
      instructorProfile.profilePicture ||
      instructorProfile.profilePicturePreview ||
      DEFAULT_AVATAR;

    const initData = {
      fullName: user.name || "",
      email: user.email || "",
      phoneNumber: instructorProfile.phoneNumber || "",
      bio: instructorProfile.bio || "",
      qualifications: instructorProfile.qualifications || "",
      linkedinUrl: instructorProfile.linkedinUrl || "",
      githubUrl: instructorProfile.githubUrl || "",
      portfolioUrl: instructorProfile.portfolioUrl || "",
      twitterUrl: instructorProfile.twitterUrl || "",
      subjectExpertise,
      profilePicturePreview: preview,
    };

    console.log("Initialized profile data:", initData);
    setProfileData(initData);
    setOriginalData(initData);
  }, [user]);


  const validateUrl = (value) => {
    if (!value) return true;
    return urlPattern.test(value);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!profileData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    if (
      profileData.phoneNumber &&
      !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/i.test(profileData.phoneNumber)
    ) {
      newErrors.phoneNumber = "Enter a valid phone number.";
    }

    if (!profileData.bio.trim()) {
      newErrors.bio = "A short bio is required.";
    } else if (profileData.bio.length > 420) {
      newErrors.bio = "Bio must be 420 characters or less.";
    }

    if (!profileData.qualifications.trim()) {
      newErrors.qualifications = "Add at least one qualification.";
    }

    if (!profileData.subjectExpertise.length) {
      newErrors.subjectExpertise = "Add at least one expertise tag.";
    }

    ["linkedinUrl", "githubUrl", "portfolioUrl", "twitterUrl"].forEach((field) => {
      if (!validateUrl(profileData[field])) {
        newErrors[field] = "Enter a valid URL.";
      }
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      toast.error("Please fix the highlighted fields before saving.");
      return false;
    }
    return true;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name, "Size:", file.size, "Type:", file.type);

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      console.error("Invalid file type:", file.type);
      return;
    }

    const maxBytes = 600 * 1024;
    if (file.size > maxBytes) {
      toast.error("Image size must be less than 600KB.");
      console.error("File too large:", file.size, "bytes");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("File converted to base64, length:", reader.result.length);
      setProfileData((prev) => {
        const updated = {
          ...prev,
          profilePicturePreview: reader.result,
        };
        console.log("Profile data updated with new image preview");
        return updated;
      });
    };
    reader.onerror = () => {
      console.error("FileReader error:", reader.error);
      toast.error("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  const addExpertise = () => {
    const tag = expertiseInput.trim();
    if (!tag) return;
    if (profileData.subjectExpertise.includes(tag)) {
      toast.error("This expertise tag is already added.");
      return;
    }
    setProfileData((prev) => ({
      ...prev,
      subjectExpertise: [...prev.subjectExpertise, tag],
    }));
    setExpertiseInput("");
    setErrors((prev) => ({ ...prev, subjectExpertise: "" }));
  };

  const removeExpertise = (tag) => {
    setProfileData((prev) => ({
      ...prev,
      subjectExpertise: prev.subjectExpertise.filter((item) => item !== tag),
    }));
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!updateUserProfile) return;

    setIsSaving(true);
    try {
      // Only include image if it's a base64 string (user uploaded an image)
      const imageToSend = profileData.profilePicturePreview && profileData.profilePicturePreview.startsWith('data:')
        ? profileData.profilePicturePreview
        : undefined;
      
      const payload = {
        name: profileData.fullName,
        instructorProfile: {
          phoneNumber: profileData.phoneNumber,
          bio: profileData.bio,
          qualifications: profileData.qualifications,
          linkedinUrl: profileData.linkedinUrl,
          githubUrl: profileData.githubUrl,
          portfolioUrl: profileData.portfolioUrl,
          twitterUrl: profileData.twitterUrl,
          subjectExpertise: profileData.subjectExpertise,
        },
      };
      
      // Only add image fields if image was uploaded
      if (imageToSend) {
        payload.instructorProfile.profilePicture = imageToSend;
        payload.instructorProfile.profilePicturePreview = imageToSend;
      }
      
      console.log("=== INSTRUCTOR PROFILE SAVE DEBUG ===");
      console.log("Payload being sent:", JSON.stringify(payload, null, 2));
      console.log("User role:", user?.role);
      console.log("Image included:", !!imageToSend);
      
      const updatedUser = await updateUserProfile(payload);
      
      console.log("Response from updateUserProfile:", updatedUser);
      
      if (!updatedUser) {
        console.error("updatedUser is null or undefined");
        toast.error("Failed to save instructor profile. Please try again.");
        return;
      }
      
      // Force refresh to ensure data is loaded correctly
      console.log("FORCING PROFILE REFRESH...");
      await refreshUserProfile();
      
      setOriginalData(profileData);
      setIsEditing(false);
      toast.success("Instructor profile saved successfully!");
    } catch (error) {
      console.error("Instructor profile save error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      toast.error("Unable to save profile right now: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData(originalData);
    setErrors({});
    setExpertiseInput("");
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="instructor-profile-page">
        <div className="profile-card empty-state">
          <h2>Loading instructor profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-profile-page">
      <div className="profile-header-card">
        <div>
          <p className="eyebrow">Instructor Profile</p>
          <h1>Profile Information</h1>
          <p className="profile-subtitle">
            Manage your instructor details, expertise tags, links, and profile image from one modern page.
          </p>
        </div>
        <div className="header-actions">
          {!isEditing && (
            <button className="btn btn-primary" type="button" onClick={() => setIsEditing(true)}>
              <i className="bi bi-pencil-square me-2"></i>Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-grid">
          <div className="profile-sidebar-panel">
            <div className="profile-picture-card">
              <div className="picture-frame">
                <img
                  src={profileData.profilePicturePreview || DEFAULT_AVATAR}
                  alt="Instructor profile"
                  className="profile-picture"
                />
              </div>
              <div className="picture-actions">
                <button
                  type="button"
                  className="upload-button"
                  onClick={() => document.getElementById('profile-picture-upload')?.click()}
                  disabled={!isEditing}
                >
                  <i className="bi bi-camera-fill"></i>
                  <span>{isEditing ? "Upload" : "Change"} picture</span>
                </button>
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="summary-card">
              <h2>{profileData.fullName || "Instructor"}</h2>
              <p className="summary-role">Lead Instructor</p>
              <div className="summary-meta">
                <div>
                  <span>Role</span>
                  <strong>{user.role || "instructor"}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{user.email}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-form-panel">
            <section className="profile-section">
              <div className="section-heading">
                <div>
                  <h3>Core information</h3>
                  <p>Editable instructor details for your public profile.</p>
                </div>
              </div>

              <div className="field-grid">
                <div className="field-group">
                  <label className="field-label" htmlFor="fullName">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    className={`field-input ${errors.fullName ? "error" : ""}`}
                    value={profileData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                  {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="field-input"
                    value={profileData.email}
                    disabled
                  />
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="phoneNumber">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    className={`field-input ${errors.phoneNumber ? "error" : ""}`}
                    value={profileData.phoneNumber}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="+1 555 123 4567"
                  />
                  {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
                </div>
              </div>
            </section>

            <section className="profile-section">
              <div className="section-heading">
                <div>
                  <h3>About you</h3>
                  <p>Write a short description that highlights your teaching style.</p>
                </div>
              </div>

              <div className="field-group full-width">
                <label className="field-label" htmlFor="bio">
                  Bio / Short Description
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  className={`field-input ${errors.bio ? "error" : ""}`}
                  value={profileData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows="4"
                  placeholder="Share your experience, approach, and what students can expect."
                />
                {errors.bio && <span className="field-error">{errors.bio}</span>}
              </div>

              <div className="field-group full-width">
                <label className="field-label" htmlFor="qualifications">
                  Qualifications
                </label>
                <textarea
                  id="qualifications"
                  name="qualifications"
                  className={`field-input ${errors.qualifications ? "error" : ""}`}
                  value={profileData.qualifications}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows="3"
                  placeholder="e.g., PhD in Math, Certified Project Management Professional"
                />
                {errors.qualifications && <span className="field-error">{errors.qualifications}</span>}
              </div>
            </section>

            <section className="profile-section">
              <div className="section-heading">
                <div>
                  <h3>Expertise tags</h3>
                  <p>Add the topics you teach so learners can discover your strengths.</p>
                </div>
              </div>

              <div className="tag-input-row">
                <input
                  type="text"
                  name="expertise"
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  disabled={!isEditing}
                  className="field-input"
                  placeholder="Add a topic and press Enter or Add"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addExpertise();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={addExpertise}
                  disabled={!isEditing}
                >
                  Add
                </button>
              </div>
              {errors.subjectExpertise && <span className="field-error">{errors.subjectExpertise}</span>}

              <div className="expertise-tags">
                {profileData.subjectExpertise.length ? (
                  profileData.subjectExpertise.map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                      {isEditing && (
                        <button
                          type="button"
                          className="tag-remove"
                          onClick={() => removeExpertise(tag)}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <p className="text-muted">No expertise tags yet.</p>
                )}
              </div>
            </section>

            <section className="profile-section">
              <div className="section-heading">
                <div>
                  <h3>Social links</h3>
                  <p>Share your public URLs for students and colleagues.</p>
                </div>
              </div>

              <div className="field-grid">
                <div className="field-group">
                  <label className="field-label" htmlFor="linkedinUrl">
                    <i className="bi bi-linkedin"></i> LinkedIn
                  </label>
                  <input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="url"
                    className={`field-input ${errors.linkedinUrl ? "error" : ""}`}
                    value={profileData.linkedinUrl}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  {errors.linkedinUrl && <span className="field-error">{errors.linkedinUrl}</span>}
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="githubUrl">
                    <i className="bi bi-github"></i> GitHub
                  </label>
                  <input
                    id="githubUrl"
                    name="githubUrl"
                    type="url"
                    className={`field-input ${errors.githubUrl ? "error" : ""}`}
                    value={profileData.githubUrl}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="https://github.com/yourusername"
                  />
                  {errors.githubUrl && <span className="field-error">{errors.githubUrl}</span>}
                </div>
              </div>

              <div className="field-grid">
                <div className="field-group">
                  <label className="field-label" htmlFor="portfolioUrl">
                    <i className="bi bi-globe"></i> Portfolio Website
                  </label>
                  <input
                    id="portfolioUrl"
                    name="portfolioUrl"
                    type="url"
                    className={`field-input ${errors.portfolioUrl ? "error" : ""}`}
                    value={profileData.portfolioUrl}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="https://yourportfolio.com"
                  />
                  {errors.portfolioUrl && <span className="field-error">{errors.portfolioUrl}</span>}
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="twitterUrl">
                    <i className="bi bi-twitter"></i> Twitter / X
                  </label>
                  <input
                    id="twitterUrl"
                    name="twitterUrl"
                    type="url"
                    className={`field-input ${errors.twitterUrl ? "error" : ""}`}
                    value={profileData.twitterUrl}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="https://twitter.com/yourhandle"
                  />
                  {errors.twitterUrl && <span className="field-error">{errors.twitterUrl}</span>}
                </div>
              </div>
            </section>

            <div className="action-row">
              <button
                type="button"
                className="btn btn-primary btn-save"
                onClick={handleSave}
                disabled={!isEditing || isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i>Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-cancel"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
