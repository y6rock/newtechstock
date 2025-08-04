import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import OrderHistory from './OrderHistory'; // Import OrderHistory component
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCamera } from 'react-icons/fa'; // Import icons
import axios from 'axios';

const Profile = () => {
  const { user_id, username, loadingSettings } = useSettings();
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
  const [activeTab, setActiveTab] = useState('profile');

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
      await axios.put(`/api/profile/${user_id}`, {
        name: profileData.name,
        phone: profileData.phone,
        city: profileData.address,
        profile_image
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Error updating profile: ${error.response?.data?.message || error.message}`);
    }
  };

  // Helper to get the correct profile image URL
  const getProfilePicUrl = (pic) => {
    if (!pic) return 'https://via.placeholder.com/150';
    if (pic && pic.startsWith('/uploads')) return `http://localhost:3001${pic}`;
    return pic;
  };

  if (loadingProfile || loadingSettings) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading profile...</div>;
  }

  if (profileError) {
    return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>{profileError}</div>;
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '32px auto 0 auto', padding: '8px 0', backgroundColor: '#f5f5f5', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '2px solid #eee', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '0', background: '#f8f8f8', borderRadius: '8px 8px 0 0', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', maxWidth: '900px', margin: '0 auto' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '16px 36px',
              background: activeTab === 'profile' ? '#fff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '3px solid #007bff' : '3px solid transparent',
              color: activeTab === 'profile' ? '#007bff' : '#333',
              fontWeight: 'bold',
              fontSize: '1.1em',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s',
              borderRadius: '8px 8px 0 0',
              marginRight: '2px',
              minWidth: '120px',
            }}
          >Profile</button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '16px 36px',
              background: activeTab === 'orders' ? '#fff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'orders' ? '3px solid #007bff' : '3px solid transparent',
              color: activeTab === 'orders' ? '#007bff' : '#333',
              fontWeight: 'bold',
              fontSize: '1.1em',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s',
              borderRadius: '8px 8px 0 0',
              minWidth: '120px',
            }}
          >Order History</button>
        </div>
      </div>
      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', minWidth: 0, justifyContent: 'center', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
          {/* Profile Picture Section */}
          <div style={{ flex: '1 1 380px', maxWidth: '420px', backgroundColor: '#fff', padding: '18px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign: 'center', margin: '0 4px', boxSizing: 'border-box', minWidth: '200px' }}>
            <h2 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#333' }}><FaCamera style={{ marginRight: '10px' }} />Profile Picture</h2>
            <div style={{ width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 20px auto', border: '3px solid #007bff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={getProfilePicUrl(imagePreview || profileData.profilePic)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ margin: '10px 0' }} />
            <h3 style={{ margin: '10px 0 5px 0', fontSize: '1.2em', color: '#333' }}>{profileData.name}</h3>
            <p style={{ margin: '0', color: '#666', fontSize: '0.9em' }}>{profileData.email}</p>
          </div>
          {/* Personal Information Section */}
          <div style={{
            flex: '1 1 380px',
            maxWidth: '420px',
            minWidth: '200px',
            width: '100%',
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            margin: '0 4px 16px 4px',
            border: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxSizing: 'border-box',
            minWidth: 0,
            overflow: 'hidden',
          }}>
            <h2 style={{ fontSize: '1.5em', marginBottom: '10px', color: '#333' }}><FaUser style={{ marginRight: '10px' }} />Personal Information</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '22px',
            }}>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '7px', color: '#555', fontWeight: 'bold', fontSize: '1.05em' }}>Full Name</label>
                <FaUser style={{ position: 'absolute', left: '10px', top: '44px', color: '#aaa' }} />
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleChange}
                  style={{ width: '100%', maxWidth: '100%', padding: '14px 10px 14px 38px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1.08em', marginBottom: '0', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '7px', color: '#555', fontWeight: 'bold', fontSize: '1.05em' }}>Email Address</label>
                <FaEnvelope style={{ position: 'absolute', left: '10px', top: '44px', color: '#aaa' }} />
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleChange}
                  style={{ width: '100%', maxWidth: '100%', padding: '14px 10px 14px 38px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1.08em', marginBottom: '0', boxSizing: 'border-box' }}
                  readOnly // Email usually not editable
                />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '7px', color: '#555', fontWeight: 'bold', fontSize: '1.05em' }}>Phone Number</label>
                <FaPhone style={{ position: 'absolute', left: '10px', top: '44px', color: '#aaa' }} />
                <input
                  type="text"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleChange}
                  style={{ width: '100%', maxWidth: '100%', padding: '14px 10px 14px 38px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1.08em', marginBottom: '0', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '7px', color: '#555', fontWeight: 'bold', fontSize: '1.05em' }}>Address</label>
                <FaMapMarkerAlt style={{ position: 'absolute', left: '10px', top: '44px', color: '#aaa' }} />
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleChange}
                  style={{ width: '100%', maxWidth: '100%', padding: '14px 10px 14px 38px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1.08em', marginBottom: '0', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <button
              onClick={handleUpdateProfile}
              style={{
                padding: '14px 0',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1.13em',
                marginTop: '10px',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}
            >Update Profile</button>
          </div>
        </div>
      )}
      {activeTab === 'orders' && (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '32px', margin: '0 auto', maxWidth: '900px' }}>
          <h2 style={{ fontSize: '1.5em', marginBottom: '20px', textAlign: 'center', color: '#333' }}>Your Order History</h2>
          {user_id && <OrderHistory userId={user_id} />}
        </div>
      )}
    </div>
  );
};

export default Profile; 