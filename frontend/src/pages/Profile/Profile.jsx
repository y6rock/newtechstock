import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaPhone, FaMapMarkerAlt, FaCamera } from 'react-icons/fa'; // Import icons
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const { user_id, username, loadingSettings, updateUsername } = useSettings();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: username || '',
    email: '', // Will fetch from backend
    phone: '', // Will fetch from backend
    address: '', // Will fetch from backend
    profilePic: 'https://via.placeholder.com/150' // Default placeholder
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Function to generate initials from user's name
  const generateInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    } else if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    }
    return 'U';
  };

  // Function to render profile image or initials
  const renderProfileImage = () => {
    const hasImage = imagePreview || (profileData.profilePic && profileData.profilePic !== 'https://via.placeholder.com/150');
    
    if (hasImage) {
      return (
        <img 
          src={getProfilePicUrl(imagePreview || profileData.profilePic)} 
          alt="Profile" 
          className="profile-image"
        />
      );
    } else {
      const initials = generateInitials(profileData.name);
      return (
        <div className="profile-initials">
          {initials}
        </div>
      );
    }
  };

  useEffect(() => {
    if (loadingSettings) {
      return; // Wait for settings to load
    }
    if (!user_id) {
      navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/profile/${user_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
          throw new Error(errorData.message || 'Failed to fetch profile data.');
        }
        const data = await response.json();
        console.log('Fetched profile data:', data);
        setProfileData(prev => ({
          ...prev,
          name: data.name || prev.name,
          email: data.email || '',
          phone: data.phone || '',
          address: data.city || '', // Assuming 'city' from DB maps to 'address' for simplicity
          profilePic: data.profile_image || prev.profilePic
        }));
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setProfileError(`Failed to load profile: ${err.message}`);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, [user_id, loadingSettings, navigate]);

  // Validation functions
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.length > 70) return 'Name must be 70 characters or less';
        return '';
      case 'phone':
        if (value && value.trim()) {
          const phoneDigits = value.replace(/\D/g, '');
          
          // Check if phone has valid length
          if (phoneDigits.length < 7 || phoneDigits.length > 15) {
            return 'Phone number must be between 7 and 15 digits. Examples: +1234567890, (123) 456-7890';
          }
          
          // Check for common invalid patterns
          if (phoneDigits.length === phoneDigits.split('').filter(d => d === phoneDigits[0]).length) {
            return 'Phone number cannot be all the same digit';
          }
          
          // Check for sequential numbers (like 1234567890)
          const isSequential = phoneDigits.split('').every((digit, index) => {
            if (index === 0) return true;
            const currentDigit = parseInt(digit);
            const prevDigit = parseInt(phoneDigits[index - 1]);
            return currentDigit === (prevDigit + 1) % 10; // Handle wrap-around (9 -> 0)
          });
          
          if (isSequential && phoneDigits.length >= 8) {
            return 'Phone number cannot be sequential numbers';
          }
        }
        return '';
      case 'address':
        if (value && value.length > 100) return 'Address must be 100 characters or less';
        return '';
      default:
        return '';
    }
  };

  // Phone formatting function
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format based on length
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else if (phoneNumber.length <= 10) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    } else {
      return `+${phoneNumber.slice(0, phoneNumber.length - 10)} (${phoneNumber.slice(-10, -7)}) ${phoneNumber.slice(-7, -4)}-${phoneNumber.slice(-4)}`;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format phone number as user types
    let formattedValue = value;
    if (name === 'phone') {
      formattedValue = formatPhoneNumber(value);
    }
    
    setProfileData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    
    // Validate the field
    const error = validateField(name, formattedValue);
    setValidationErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview('');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // Validate all fields
      const errors = {};
      Object.keys(profileData).forEach(key => {
        if (key !== 'profilePic' && key !== 'email') { // Skip email and profilePic
          const error = validateField(key, profileData[key]);
          if (error) errors[key] = error;
        }
      });

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        showError('Please fix the validation errors before updating');
        return;
      }
      
      let profile_image = profileData.profilePic;
      if (imageFile) {
        const data = new FormData();
        data.append('image', imageFile);
        const token = localStorage.getItem('token');
        const uploadRes = await axios.post('/api/auth/upload-image', data, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
        });
        profile_image = uploadRes.data.imageUrl;
        setProfileData(prev => ({ ...prev, profilePic: profile_image }));
        setImageFile(null);
        setImagePreview('');
      }
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/profile/${user_id}`, {
        name: profileData.name,
        phone: profileData.phone,
        city: profileData.address,
        profile_image
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update token if new one is provided
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Update username in context to reflect in header
        updateUsername(profileData.name);
      } else {
        // Update username in context to reflect in header
        updateUsername(profileData.name);
      }
      
      showSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError(`Error updating profile: ${error.response?.data?.message || error.message}`);
    }
  };

  // Helper to get the correct profile image URL
  const getProfilePicUrl = (pic) => {
    if (!pic) return 'https://via.placeholder.com/150';
    if (pic && pic.startsWith('/uploads')) return `http://localhost:3001${pic}`;
    return pic;
  };

  if (loadingProfile || loadingSettings) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (profileError) {
    return <div className="profile-error">{profileError}</div>;
  }

  return (
    <div className="profile-container">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-container">
          <button className="tab-button active">
            Profile
          </button>
          <button
            onClick={() => navigate('/order-history')}
            className="tab-button inactive"
          >
            Order History
          </button>
        </div>
      </div>
      {/* Profile Content */}
      <div className="profile-content">
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <h2 className="profile-picture-title">
              <FaCamera className="profile-icon" />
              Profile Picture
            </h2>
            <div className="profile-picture-container">
              {renderProfileImage()}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageFileChange} 
              className="profile-image-input"
            />
            <h3 className="profile-name">{profileData.name}</h3>
          </div>
          {/* Personal Information Section */}
          <div className="personal-info-section">
            <h2 className="personal-info-title">
              <FaUser className="profile-icon" />
              Personal Information
            </h2>
            <div className="personal-info-form">
              <div className="form-field">
                <label className="form-label">
                  <FaUser className="form-label-icon" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.name ? 'error' : ''}`}
                  maxLength={70}
                />
                <div className="character-count">
                  {profileData.name ? profileData.name.length : 0}/70 characters
                </div>
                {validationErrors.name && <span className="field-error">{validationErrors.name}</span>}
              </div>
              <div className="form-field">
                <label className="form-label">
                  <FaPhone className="form-label-icon" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="(123) 456-7890"
                  value={profileData.phone}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.phone ? 'error' : ''}`}
                />
                {validationErrors.phone && <span className="field-error">{validationErrors.phone}</span>}
              </div>
              <div className="form-field">
                <label className="form-label">
                  <FaMapMarkerAlt className="form-label-icon" />
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.address ? 'error' : ''}`}
                />
                {validationErrors.address && <span className="field-error">{validationErrors.address}</span>}
              </div>
            </div>
            <button
              onClick={handleUpdateProfile}
              className="update-button"
            >
              Update Profile
            </button>
          </div>
        </div>
      
    </div>
  );
};

export default Profile; 