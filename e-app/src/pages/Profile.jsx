import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "../styles/Profile.css";

/**
 * Modern single-page Profile component
 * Displays all profile information in a clean, card-based layout
 * Features: profile picture upload, form validation, dark mode toggle, real-time updates
 */
export default function Profile() {
  const { user, updateUserProfile, refreshUserProfile } = useAuth();
  const toast = useToast();

  // Profile data state
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    interests: [],
    profilePicture: null,
    profilePicturePreview: "/default-profile.png",
  });

  const { theme } = useTheme();

  // UI state
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState(profileData);
  const [interestInput, setInterestInput] = useState("");
  const [errors, setErrors] = useState({});

  // Initialize profile data from user
  useEffect(() => {
    if (!user) return;

    const initData = {
      fullName: user.name || "",
      email: user.email || "",
      phoneNumber: user.profile?.phoneNumber || "",
      gender: user.profile?.gender || "",
      dateOfBirth: user.profile?.dateOfBirth || "",
      address: user.profile?.address || "",
      interests: user.profile?.interests || [],
      profilePicturePreview: user.profile?.avatar || "/default-profile.png",
    };

    setProfileData((prev) => ({
      ...prev,
      ...initData,
    }));

    setOriginalData((prev) => ({
      ...prev,
      ...initData,
    }));
  }, [user]);


  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!profileData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (profileData.phoneNumber && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(profileData.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number format";
    }

    if (profileData.dateOfBirth) {
      const dob = new Date(profileData.dateOfBirth);
      if (isNaN(dob.getTime()) || dob > new Date()) {
        newErrors.dateOfBirth = "Invalid or future date of birth";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle profile picture upload
  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({
          ...prev,
          profilePicture: file,
          profilePicturePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Add interest tag
  const addInterest = () => {
    if (interestInput.trim() && !profileData.interests.includes(interestInput.trim())) {
      setProfileData((prev) => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()],
      }));
      setInterestInput("");
    }
  };

  // Remove interest tag
  const removeInterest = (interest) => {
    setProfileData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  // Handle key press for adding interests
  const handleInterestKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInterest();
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updatePayload = {
        name: profileData.fullName,
        profile: {
          phoneNumber: profileData.phoneNumber,
          gender: profileData.gender,
          dateOfBirth: profileData.dateOfBirth,
          address: profileData.address,
          interests: profileData.interests,
          avatar: profileData.profilePicturePreview, // Save the base64 image
        },
      };

      const result = await updateUserProfile(updatePayload);

      if (result) {
        await refreshUserProfile();
      }

      // Update original data to reflect changes
      setOriginalData(profileData);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setProfileData(originalData);
    setIsEditing(false);
    setErrors({});
  };

  if (!user) {
    return <div className="profile-container">Loading profile...</div>;
  }

  return (
    <div className={`profile-container ${theme === "dark" ? "dark-mode" : ""}`}>
      {/* Header Section */}
      <div className="profile-header">
        <div>
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">Manage your profile information</p>
        </div>
        <button
          type="button"
          className={`btn-edit ${isEditing ? "btn-edit-active" : ""}`}
          onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
        >
          <i className={`bi bi-${isEditing ? "x" : "pencil"}`}></i>
          {isEditing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        {/* Profile Picture Section */}
        <div className="profile-picture-section">
          <div className="picture-container">
            <img
              src={profileData.profilePicturePreview}
              alt={profileData.fullName}
              className="profile-picture"
            />
            {isEditing && (
              <label className="upload-overlay">
                <i className="bi bi-camera-fill"></i>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="file-input"
                />
              </label>
            )}
          </div>
          <div className="profile-brief">
            <h2>{profileData.fullName}</h2>
            <p>{profileData.email}</p>
            <span className="badge role-badge">{user.role}</span>
          </div>
        </div>

        {/* Main Form Section */}
        <div className="form-section">
          {/* Basic Information */}
          <div className="form-group-section">
            <h3 className="section-title">Basic Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`form-input ${errors.fullName ? "input-error" : ""}`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="form-input input-disabled"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  name="phoneNumber"
                  value={profileData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`form-input ${errors.phoneNumber ? "input-error" : ""}`}
                  placeholder="e.g., +1 (555) 123-4567"
                />
                {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={profileData.gender}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-input form-select"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  name="dateOfBirth"
                  value={profileData.dateOfBirth}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`form-input ${errors.dateOfBirth ? "input-error" : ""}`}
                />
                {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="form-group-section">
            <h3 className="section-title">Address</h3>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={profileData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="form-input form-textarea"
                placeholder="Enter your address"
                rows="3"
              />
            </div>
          </div>

          {/* Interests & Skills Section */}
          <div className="form-group-section">
            <h3 className="section-title">Interests & Skills</h3>

            {isEditing && (
              <div className="interest-input-group">
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyPress={handleInterestKeyPress}
                  placeholder="Add an interest or skill and press Enter"
                  className="form-input"
                />
                <button type="button" onClick={addInterest} className="btn-add-interest">
                  <i className="bi bi-plus-lg"></i> Add
                </button>
              </div>
            )}

            <div className="interests-container">
              {profileData.interests.map((interest) => (
                <div key={interest} className="interest-tag">
                  <span>{interest}</span>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="btn-remove-interest"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {profileData.interests.length === 0 && (
                <p className="no-interests">No interests added yet</p>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="form-group-section">
            <h3 className="section-title">Preferences</h3>

            <div className="toggle-option">
              <div className="toggle-info">
                <label>Current theme</label>
                <p className="toggle-description">The application theme is managed globally.</p>
              </div>
              <div className="theme-status">{theme === "dark" ? "Dark" : "Light"}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="action-buttons">
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg"></i> Save Changes
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="btn-secondary"
            >
              <i className="bi bi-x-lg"></i> Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
