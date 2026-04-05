import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { publicService } from '../services/complaintService';
import { ADMIN_LEVELS } from '../utils/constants';
import './LoginPage.css';

const LoginPage = () => {
  const [roleView, setRoleView] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedWards, setSelectedWards] = useState([]); // multi-ward for Level 2
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    state_id: '',
    district_id: '',
    city_id: '',
    ward_id: '',
    street: '',
    landmark: '',
    pincode: '',
    selectedLevel: null,
    department: '',
    designation: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      console.log('Loading states...');
      const response = await publicService.getGeographicUnits(null, 'STATE');
      console.log('States loaded:', response);
      setStates(response.units);
    } catch (error) {
      console.error('Error loading states:', error);
    }
  };

  const loadDistricts = async (stateId) => {
    try {
      console.log('Loading districts for state:', stateId);
      const response = await publicService.getGeographicUnits(stateId, 'DISTRICT');
      console.log('Districts loaded:', response);
      setDistricts(response.units);
      setCities([]);
      setWards([]);
    } catch (error) {
      console.error('Error loading districts:', error);
    }
  };

  const loadCities = async (districtId) => {
    try {
      console.log('Loading cities for district:', districtId);
      // Load cities/divisions from district
      const response = await publicService.getGeographicUnits(districtId);
      console.log('Cities loaded:', response);
      setCities(response.units);
      setWards([]);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadWards = async (cityId) => {
    try {
      console.log('Loading wards for city:', cityId);
      // Load wards from city
      const response = await publicService.getGeographicUnits(cityId);
      console.log('Wards loaded:', response);
      setWards(response.units);
    } catch (error) {
      console.error('Error loading wards:', error);
    }
  };

  const roleCards = [
    { role: 'CITIZEN', label: 'Resident', icon: '👤', description: 'File and track complaints' },
    { role: 'ADMIN', label: 'Level 1 Officer', icon: '👮', description: 'Field Officer', level: 1 },
    { role: 'ADMIN', label: 'Level 2 Officer', icon: '🎖️', description: 'Division Authority', level: 2 },
    { role: 'ADMIN', label: 'Level 3 Officer', icon: '⭐', description: 'District Authority', level: 3 }
  ];

  const handleRoleSelect = (role, level = null) => {
    setRoleView(role);
    setIsRegister(false);
    setSelectedWards([]);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      state_id: '',
      district_id: '',
      city_id: '',
      ward_id: '',
      street: '',
      landmark: '',
      pincode: '',
      selectedLevel: level,
      department: '',
      designation: ''
    });
    setError('');
  };

  // Toggle ward selection for Level 2 multi-ward assignment
  const handleWardToggle = (wardId) => {
    setSelectedWards(prev =>
      prev.includes(wardId) ? prev.filter(id => id !== wardId) : [...prev, wardId]
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    console.log('Field changed:', name, value);

    // Handle cascading dropdowns
    if (name === 'state_id' && value) {
      console.log('State selected, loading districts for state:', value);
      loadDistricts(value);
      setSelectedWards([]);
      setFormData(prev => ({
        ...prev,
        state_id: value,
        district_id: '',
        city_id: '',
        ward_id: ''
      }));
    } else if (name === 'district_id' && value) {
      console.log('District selected, loading cities for district:', value);
      loadCities(value);
      setSelectedWards([]);
      setFormData(prev => ({
        ...prev,
        district_id: value,
        city_id: '',
        ward_id: ''
      }));
    } else if (name === 'city_id' && value) {
      console.log('City selected, loading wards for city:', value);
      loadWards(value);
      setSelectedWards([]);
      setFormData(prev => ({
        ...prev,
        city_id: value,
        ward_id: ''
      }));
    } else {
      // For non-geographic fields, just update normally
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.phone.trim() || !/^[0-9]{10}$/.test(formData.phone)) {
      setError('Valid 10-digit phone number is required');
      return;
    }

    // Role-specific geographic validation
    if (roleView === 'ADMIN') {
      // Level 2 and 3 don't have a department — handled automatically
      if (formData.selectedLevel !== 2 && formData.selectedLevel !== 3 && !formData.department) {
        setError('Please select your department');
        return;
      }
      if (!formData.state_id) {
        setError('Please select your state');
        return;
      }
      // Level 3: only needs district
      if (formData.selectedLevel === 3 && !formData.district_id) {
        setError('Please select your district assigned area');
        return;
      }
      // Level 2: needs city + multiple wards
      if (formData.selectedLevel === 2 && !formData.city_id) {
        setError('Please select your city assigned area');
        return;
      }
      if (formData.selectedLevel === 2) {
        // Level 2 must select at least 2 wards
        if (selectedWards.length < 2) {
          setError('Please select at least 2 wards for your assigned jurisdiction');
          return;
        }
      }
      if (formData.selectedLevel === 1 && !formData.ward_id) {
        setError('Please select your ward/village assigned area');
        return;
      }
    } else {
      // Citizen geographic validation
      if (!formData.state_id) {
        setError('Please select your state');
        return;
      }
      if (!formData.district_id) {
        setError('Please select your district');
        return;
      }
      if (!formData.ward_id) {
        setError('Please select your ward/village');
        return;
      }
      if (!formData.street.trim()) {
        setError('Street address is required');
        return;
      }
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      let payload;

      if (roleView === 'ADMIN') {
        let assignedIds;
        if (formData.selectedLevel === 2) {
          // Level 2: multiple wards selected via checkboxes
          assignedIds = selectedWards;
        } else if (formData.selectedLevel === 3) {
          // Level 3: district-level jurisdiction
          assignedIds = [formData.district_id];
        } else {
          // Level 1: single ward
          assignedIds = [formData.ward_id || formData.city_id || formData.district_id];
        }

        payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'ADMIN',
          level: formData.selectedLevel,
          // Level 2 and 3 automatically get GENERAL (all departments)
          department: (formData.selectedLevel === 2 || formData.selectedLevel === 3) ? 'GENERAL' : formData.department,
          designation: formData.designation || '',
          assigned_geographic_unit_ids: assignedIds
        };
      } else {
        payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'CITIZEN',
          geographic_unit_id: formData.ward_id,
          address: {
            street: formData.street,
            landmark: formData.landmark,
            pincode: formData.pincode
          }
        };
      }

      const result = await register(payload);

      if (result.success) {
        // Level 3 goes directly to analytics; others go to complaints list
        if (roleView === 'ADMIN') {
          navigate(formData.selectedLevel === 3 ? '/admin/analytics' : '/admin/complaints');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        if (result.user.role === 'ADMIN') {
          // Level 3 district analysts go to analytics
          // Redirect based on level: Level 3 goes to analytics, others to complaints
          navigate(result.user.level === 3 ? '/admin/analytics' : '/admin/complaints');
        } else if (result.user.role === 'GOVERNMENT_ANALYST') {
          navigate('/analytics');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!roleView) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>CivicConnect</h1>
            <p>Civic Complaint Governance Platform</p>
          </div>

          <div className="role-selection">
            <h2>Select Your Role</h2>
            <div className="role-cards">
              {roleCards.map((card, index) => (
                <div
                  key={index}
                  className="role-card"
                  onClick={() => handleRoleSelect(card.role, card.level)}
                >
                  <div className="role-icon">{card.icon}</div>
                  <div className="role-label">{card.label}</div>
                  <div className="role-description">{card.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>CivicConnect</h1>
          <p>Login to continue</p>
        </div>

        <button className="back-btn" onClick={() => {
          setRoleView(null);
          setIsRegister(false);
        }}>
          ← Back to Role Selection
        </button>

        {error && <div className="error-message">{error}</div>}

        {isRegister ? (
          // Registration Form
          <form className="login-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit phone number"
                maxLength="10"
                required
              />
            </div>

            {/* Department — L2 and L3 handle ALL departments, so no selection needed */}
            {roleView === 'ADMIN' && formData.selectedLevel !== 2 && formData.selectedLevel !== 3 && (
              <div className="form-group">
                <label>Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select your department</option>
                  <option value="WATER_SUPPLY">Water Supply</option>
                  <option value="ELECTRICITY">Electricity</option>
                  <option value="ROAD_MAINTENANCE">Road Maintenance</option>
                  <option value="GARBAGE_COLLECTION">Garbage Collection</option>
                  <option value="STREET_LIGHTING">Street Lighting</option>
                  <option value="DRAINAGE">Drainage</option>
                  <option value="PUBLIC_HEALTH">Public Health</option>
                  <option value="TRAFFIC">Traffic</option>
                  <option value="POLLUTION">Pollution</option>
                  <option value="ILLEGAL_CONSTRUCTION">Illegal Construction</option>
                  <option value="PARKS_GARDENS">Parks & Gardens</option>
                  <option value="GENERAL">General Administration</option>
                </select>
              </div>
            )}

            {/* Level 2 info banner */}
            {roleView === 'ADMIN' && formData.selectedLevel === 2 && (
              <div style={{
                background: 'linear-gradient(135deg, #ede9fe, #dbeafe)',
                border: '1px solid #a5b4fc',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: '#3730a3'
              }}>
                🏛️ <strong>Division Authority</strong> — You oversee <em>all departments</em> across your assigned wards.
              </div>
            )}

            {/* Level 3 info banner */}
            {roleView === 'ADMIN' && formData.selectedLevel === 3 && (
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: '#92400e'
              }}>
                ⭐ <strong>District Analyst</strong> — You oversee <em>all departments</em> across the entire district.
                You have <strong>read-only analytics access</strong> — no complaint editing.
              </div>
            )}

            {/* Designation — shown for L2/L3 always, for L1 only after dept chosen */}
            {roleView === 'ADMIN' && (formData.department || formData.selectedLevel === 2 || formData.selectedLevel === 3) && (
              <div className="form-group">
                <label>Designation *</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder={
                    formData.selectedLevel === 1 ? 'e.g. Junior Engineer, Health Inspector, Ward Officer' :
                      formData.selectedLevel === 2 ? 'e.g. Executive Engineer, Zonal Commissioner, BDO' :
                        'e.g. District Magistrate, Municipal Commissioner, Superintending Engineer'
                  }
                  required
                />
                <small style={{ color: '#6b7280', fontSize: '0.78rem', marginTop: '0.3rem', display: 'block' }}>
                  {formData.selectedLevel === 2
                    ? 'Your official job title (Division / Block Authority)'
                    : `Your official job title in the ${formData.department.replace(/_/g, ' ')} department`}
                </small>
              </div>
            )}

            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#1f2937', fontSize: '1rem' }}>
              {roleView === 'ADMIN' ? '📍 Assigned Jurisdiction' : '📍 Residential Address'}
            </h3>

            <div className="form-group">
              <label>State *</label>
              <select
                name="state_id"
                value={formData.state_id}
                onChange={handleChange}
                required
              >
                <option value="">Select your state</option>
                {states.map((state) => (
                  <option key={state._id} value={state._id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.state_id && (roleView === 'CITIZEN' || formData.selectedLevel <= 3) && (
              <div className="form-group">
                <label>District *</label>
                <select
                  name="district_id"
                  value={formData.district_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select your district</option>
                  {districts.map((district) => (
                    <option key={district._id} value={district._id}>
                      {district.name}
                    </option>
                  ))}
                </select>
                {roleView === 'ADMIN' && formData.selectedLevel === 3 && (
                  <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280', fontSize: '0.75rem' }}>
                    This will be your assigned District jurisdiction.
                  </small>
                )}
              </div>
            )}

            {formData.district_id && (roleView === 'CITIZEN' || formData.selectedLevel <= 2) && (
              <div className="form-group">
                <label>City / Municipality *</label>
                <select
                  name="city_id"
                  value={formData.city_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select your city/municipality</option>
                  {cities.map((city) => (
                    <option key={city._id} value={city._id}>
                      {city.name} ({city.type})
                    </option>
                  ))}
                </select>
                {roleView === 'ADMIN' && formData.selectedLevel === 2 && (
                  <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280', fontSize: '0.75rem' }}>
                    This will be your assigned City jurisdiction.
                  </small>
                )}
              </div>
            )}

            {/* Level 1 / Citizen: single ward selector */}
            {formData.city_id && (roleView === 'CITIZEN' || formData.selectedLevel === 1) && (
              <div className="form-group">
                <label>Ward / Village / Block *</label>
                <select
                  name="ward_id"
                  value={formData.ward_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select your ward/village</option>
                  {wards.map((ward) => (
                    <option key={ward._id} value={ward._id}>
                      {ward.name}
                    </option>
                  ))}
                </select>
                <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280', fontSize: '0.75rem' }}>
                  {roleView === 'ADMIN' ? 'This will be your assigned Ward jurisdiction.' : 'This will be your default location for complaints'}
                </small>
              </div>
            )}

            {/* Level 2: multi-ward checkbox selector (must choose ≥ 2) */}
            {formData.city_id && roleView === 'ADMIN' && formData.selectedLevel === 2 && (
              <div className="form-group">
                <label>📍 Assigned Wards * <small style={{ color: '#6b7280', fontWeight: 'normal' }}>(select at least 2)</small></label>
                {wards.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Loading wards…</p>
                ) : (
                  <div style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: '#f9fafb'
                  }}>
                    {wards.map((ward) => (
                      <label
                        key={ward._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.4rem 0.25rem',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          transition: 'background 0.15s',
                          background: selectedWards.includes(ward._id) ? '#ede9fe' : 'transparent'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedWards.includes(ward._id)}
                          onChange={() => handleWardToggle(ward._id)}
                          style={{ accentColor: '#6366f1', width: '16px', height: '16px' }}
                        />
                        <span style={{ fontSize: '0.9rem', color: '#374151' }}>{ward.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <small style={{ display: 'block', marginTop: '0.4rem', color: selectedWards.length >= 2 ? '#10b981' : '#6b7280', fontSize: '0.75rem' }}>
                  {selectedWards.length === 0
                    ? 'No wards selected yet'
                    : `${selectedWards.length} ward${selectedWards.length > 1 ? 's' : ''} selected${selectedWards.length >= 2 ? ' ✓' : ' — select at least 1 more'}`}
                </small>
              </div>
            )}

            {roleView === 'CITIZEN' && (
              <>
                <div className="form-group">
                  <label>Street / House Address *</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="House/Flat No., Street Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Landmark</label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="Nearby landmark (optional)"
                  />
                </div>

                <div className="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6-digit pincode (optional)"
                    maxLength="6"
                  />
                </div>
              </>
            )}

            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#1f2937', fontSize: '1rem' }}>
              🔒 Account Security
            </h3>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>

            <div className="login-footer">
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setIsRegister(false);
                    setError('');
                  }}
                >
                  Login here
                </button>
              </p>
            </div>
          </form>
        ) : (
          // Login Form
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            {(roleView === 'CITIZEN' || roleView === 'ADMIN') && (
              <div className="login-footer">
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      setIsRegister(true);
                      setError('');
                    }}
                  >
                    Register here
                  </button>
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
