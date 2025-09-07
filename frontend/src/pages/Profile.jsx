import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaPhone, FaMapMarkerAlt, FaCamera } from 'react-icons/fa'; // Import icons
import axios from 'axios';
import NotificationModal from '../components/NotificationModal';
import './Profile.css';

const Profile = () => {
  const { user_id, username, loadingSettings, updateUsername } = useSettings();
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
  
  // Notification modal state
  const [notification, setNotification] = useState({
    isOpen: false,
    message: '',
    type: 'success'
  });

  // Function to show notification
  const showNotification = (message, type = 'success') => {
    setNotification({
      isOpen: true,
      message,
      type
    });
  };

  // Function to close notification
  const closeNotification = () => {
    setNotification({
      isOpen: false,
      message: '',
      type: 'success'
    });
  };

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
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
      // Validate name length
      if (profileData.name && profileData.name.length > 70) {
        showNotification('Name must be 70 characters or less', 'error');
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
      
      showNotification('Profile updated successfully!', 'success');
      
      // Reload page after showing notification
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification(`Error updating profile: ${error.response?.data?.message || error.message}`, 'error');
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
              <FaCamera style={{ marginRight: '10px' }} />
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
              <FaUser style={{ marginRight: '10px' }} />
              Personal Information
            </h2>
            <div className="personal-info-form">
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <div className="form-input-container">
                  <FaUser className="form-icon" />
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    className="form-input"
                    maxLength={70}
                  />
                </div>
                <div className="character-count">
                  {profileData.name ? profileData.name.length : 0}/70 characters
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Phone Number</label>
                <div className="form-input-container">
                  <FaPhone className="form-icon" />
                  <input
                    type="text"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Address</label>
                <div className="form-input-container">
                  <FaMapMarkerAlt className="form-icon" />
                  <input
                    type="text"
                    name="address"
                    value={profileData.address}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
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
      
      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
      />
    </div>
  );
};

export default Profile; 