import React, { useState } from 'react';

const SocietyProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    description: '',
    location: '',
    available: '',
    priceRange: '',
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'image/png') {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setError('Logo must be a PNG file.');
      setLogo(null);
      setLogoPreview(null);
    }
  };

  const allFilled = Object.values(profile).every((v) => v) && logo;

  const handleEdit = (e) => {
    e.preventDefault();
    if (!allFilled) {
      setError('Please fill all fields and upload a PNG logo.');
      return;
    }
    setError('');
    // Edit logic here (e.g., send to backend)
    alert('Profile edited!');
  };

  return (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '80vh', background: '#fff', marginTop: '60px' }}>
  <form onSubmit={handleEdit} style={{ background: '#fff', borderRadius: '20px', padding: '40px', width: '700px', color: '#222', boxShadow: '0 8px 32px rgba(44,62,80,0.12)', border: '1px solid #e3e8ee' }}>
        <h2
          style={{
            marginBottom: '24px',
            textAlign: 'center',
            fontWeight: 700,
            color: '#2d3a4a',
            letterSpacing: '1px',
            background: 'linear-gradient(90deg,#2d3a4a 60%,#4a6fa5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 12px rgba(44,62,80,0.10)',
            fontSize: '2.2rem',
          }}
        >Society Profile</h2>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontWeight: 600, color: '#2d3a4a', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>Society Logo (PNG only)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              id="logo-upload"
              type="file"
              accept="image/png"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
              required
            />
            <button
              type="button"
              onClick={() => document.getElementById('logo-upload').click()}
              style={{
                background: '#ff8800',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(255,136,0,0.10)',
                letterSpacing: '0.5px',
                transition: 'background 0.2s',
              }}
            >Update Logo</button>
            {logo && <span style={{ color: '#2d3a4a', fontWeight: 500 }}>{logo.name}</span>}
          </div>
          {logoPreview && (
            <div style={{ marginTop: '16px', marginBottom: '16px', textAlign: 'center' }}>
              <img src={logoPreview} alt="Logo Preview" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '12px', background: '#f8fafc', padding: '8px', border: '2px solid #ff8800' }} />
            </div>
          )}
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 600, color: '#2d3a4a', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>Society Name</label>
          <input type="text" name="name" value={profile.name} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #ff8800', background: '#f8fafc', marginTop: '4px', fontSize: '16px', transition: 'border 0.2s' }} required />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 600, color: '#2d3a4a', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>Description</label>
          <textarea name="description" value={profile.description} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #ff8800', background: '#f8fafc', marginTop: '4px', fontSize: '16px', resize: 'vertical', transition: 'border 0.2s' }} required rows={3} />
        </div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, color: '#2d3a4a', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>Location</label>
            <input type="text" name="location" value={profile.location} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #ff8800', background: '#f8fafc', marginTop: '4px', fontSize: '16px', transition: 'border 0.2s' }} required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, color: '#2d3a4a', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>Available Plots</label>
            <input type="number" name="available" value={profile.available} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #ff8800', background: '#f8fafc', marginTop: '4px', fontSize: '16px', transition: 'border 0.2s' }} required min={1} />
          </div>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 600, color: '#2d3a4a', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>Price Range</label>
          <input type="text" name="priceRange" value={profile.priceRange} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #ff8800', background: '#f8fafc', marginTop: '4px', fontSize: '16px', transition: 'border 0.2s' }} required placeholder="e.g. 25L - 1.2Cr" />
        </div>
        {error && <div style={{ color: '#ff8800', marginBottom: '20px', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button type="submit" disabled={!allFilled} style={{ background: allFilled ? '#ff8800' : '#ffd6a0', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 32px', fontWeight: 'bold', fontSize: '16px', cursor: allFilled ? 'pointer' : 'not-allowed', boxShadow: '0 2px 8px rgba(255,136,0,0.10)', letterSpacing: '0.5px', transition: 'background 0.2s' }}>Edit Profile</button>
        </div>
      </form>
    </div>
  );
};

export default SocietyProfile;