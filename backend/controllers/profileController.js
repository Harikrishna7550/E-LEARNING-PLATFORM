const { findUserById, saveUser } = require('../services/userService');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;
    delete sanitizedUser.otp;
    delete sanitizedUser.otpExpires;

    res.json(sanitizedUser);
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile with full validation
exports.updateProfile = async (req, res) => {
  try {
    const { name, profile, darkModePreference, instructorProfile } = req.body;

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update name if provided
    if (name) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: 'Name must be a non-empty string' });
      }
      user.name = name.trim();
    }

    const isValidUrl = (value) => {
      if (!value) return true;
      const urlPattern = /^(https?:\/\/)?(([\w-]+\.)+[\w-]{2,})(\/.*)?$/i;
      return urlPattern.test(value);
    };

    // Update profile data with validation
    if (profile) {
      if (!user.profile) {
        user.profile = {};
      }

      if (profile.phoneNumber) {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
        if (!phoneRegex.test(profile.phoneNumber)) {
          return res.status(400).json({ message: 'Invalid phone number format' });
        }
      }

      if (profile.dateOfBirth) {
        const dob = new Date(profile.dateOfBirth);
        if (isNaN(dob.getTime()) || dob > new Date()) {
          return res.status(400).json({ message: 'Invalid or future date of birth' });
        }
      }

      if (profile.gender && !['male', 'female', 'other', 'prefer-not-to-say'].includes(profile.gender)) {
        return res.status(400).json({ message: 'Invalid gender value' });
      }

      if (profile.interests && !Array.isArray(profile.interests)) {
        return res.status(400).json({ message: 'Interests must be an array' });
      }

      if (profile.phoneNumber !== undefined) user.profile.phoneNumber = profile.phoneNumber;
      if (profile.dateOfBirth !== undefined) user.profile.dateOfBirth = profile.dateOfBirth;
      if (profile.gender !== undefined) user.profile.gender = profile.gender;
      if (profile.address !== undefined) user.profile.address = profile.address;
      if (profile.interests !== undefined) user.profile.interests = profile.interests;
      if (profile.avatar !== undefined) user.profile.avatar = profile.avatar;
      if (profile.bio !== undefined) user.profile.bio = profile.bio;
      if (profile.preferredLanguage !== undefined) user.profile.preferredLanguage = profile.preferredLanguage;
      if (profile.fontSize !== undefined) user.profile.fontSize = profile.fontSize;
      if (profile.emailNotifications !== undefined) user.profile.emailNotifications = profile.emailNotifications;
      if (profile.smsNotifications !== undefined) user.profile.smsNotifications = profile.smsNotifications;
      if (profile.appNotifications !== undefined) user.profile.appNotifications = profile.appNotifications;
    }

    if (instructorProfile) {
      if (!user.instructorProfile) {
        user.instructorProfile = {};
      }

      if (instructorProfile.phoneNumber) {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
        if (!phoneRegex.test(instructorProfile.phoneNumber)) {
          return res.status(400).json({ message: 'Invalid instructor phone number format' });
        }
      }

      if (instructorProfile.linkedinUrl && !isValidUrl(instructorProfile.linkedinUrl)) {
        return res.status(400).json({ message: 'Invalid LinkedIn URL' });
      }

      if (instructorProfile.githubUrl && !isValidUrl(instructorProfile.githubUrl)) {
        return res.status(400).json({ message: 'Invalid GitHub URL' });
      }

      if (instructorProfile.portfolioUrl && !isValidUrl(instructorProfile.portfolioUrl)) {
        return res.status(400).json({ message: 'Invalid portfolio URL' });
      }

      if (instructorProfile.twitterUrl && !isValidUrl(instructorProfile.twitterUrl)) {
        return res.status(400).json({ message: 'Invalid Twitter URL' });
      }

      if (instructorProfile.subjectExpertise !== undefined) {
        if (Array.isArray(instructorProfile.subjectExpertise)) {
          user.instructorProfile.subjectExpertise = instructorProfile.subjectExpertise
            .map((item) => String(item).trim())
            .filter(Boolean);
        } else if (typeof instructorProfile.subjectExpertise === 'string') {
          user.instructorProfile.subjectExpertise = instructorProfile.subjectExpertise
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        }
      }

      if (instructorProfile.profilePicture !== undefined) {
        user.instructorProfile.profilePicture = instructorProfile.profilePicture;
      }
      if (instructorProfile.profilePicturePreview !== undefined) {
        user.instructorProfile.profilePicturePreview = instructorProfile.profilePicturePreview;
      }
      if (instructorProfile.bio !== undefined) user.instructorProfile.bio = instructorProfile.bio;
      if (instructorProfile.qualifications !== undefined) user.instructorProfile.qualifications = instructorProfile.qualifications;
      if (instructorProfile.phoneNumber !== undefined) user.instructorProfile.phoneNumber = instructorProfile.phoneNumber;
      if (instructorProfile.linkedinUrl !== undefined) user.instructorProfile.linkedinUrl = instructorProfile.linkedinUrl;
      if (instructorProfile.githubUrl !== undefined) user.instructorProfile.githubUrl = instructorProfile.githubUrl;
      if (instructorProfile.portfolioUrl !== undefined) user.instructorProfile.portfolioUrl = instructorProfile.portfolioUrl;
      if (instructorProfile.twitterUrl !== undefined) user.instructorProfile.twitterUrl = instructorProfile.twitterUrl;
    }

    // Update dark mode preference if provided
    if (typeof darkModePreference === 'boolean') {
      user.darkModePreference = darkModePreference;
    }

    try {
      await saveUser(user);
    } catch (saveError) {
      console.error('ERROR SAVING USER:', saveError);
      return res.status(500).json({ message: 'Error saving profile: ' + saveError.message });
    }

    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;
    delete sanitizedUser.otp;
    delete sanitizedUser.otpExpires;

    res.json({ message: 'Profile updated successfully', user: sanitizedUser });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Upload profile image (base64 or file)
exports.uploadProfileImage = async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store image data (base64)
    if (req.body.target === 'instructor') {
      if (!user.instructorProfile) {
        user.instructorProfile = {};
      }
      user.instructorProfile.profilePicture = imageData;
      user.instructorProfile.profilePicturePreview = imageData;
    } else {
      if (!user.profile) {
        user.profile = {};
      }
      user.profile.avatar = imageData;
    }

    await saveUser(user);

    res.json({
      message: 'Profile image uploaded successfully',
      avatar: req.body.target === 'instructor' ? user.instructorProfile.profilePicture : user.profile.avatar,
    });
  } catch (error) {
    console.error('uploadProfileImage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};