import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { isValidPhone, isValidStudentId } from '../lib/validation';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const benefits = [
  'Flexible ride sharing with fellow SLIIT students.',
  'Grow your driver reputation with verified trips.',
  'Track requests, routes, and earnings from one dashboard.'
];

export default function BecomeDriverPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formState, setFormState] = useState({
    vehicleType: 'Sedan',
    vehicleNumber: '',
    vehicleModel: '',
    licenseNumber: '',
    capacity: '4'
  });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const errors = {
    vehicleType: !formState.vehicleType.trim() ? 'Vehicle type is required.' : '',
    vehicleNumber: !formState.vehicleNumber.trim() 
      ? 'Vehicle number is required.' 
      : formState.vehicleNumber.trim().length < 5 
        ? 'Vehicle number looks too short.' 
        : '',
    vehicleModel: !formState.vehicleModel.trim() 
      ? 'Vehicle model is required.' 
      : formState.vehicleModel.trim().length < 2 
        ? 'Enter a valid vehicle model.' 
        : '',
    licenseNumber: !formState.licenseNumber.trim() 
      ? 'License number is required.' 
      : formState.licenseNumber.trim().length < 6 
        ? 'License number looks too short.' 
        : '',
    capacity: Number(formState.capacity) < 1 ? 'Capacity must be at least 1.' : ''
  };

  const isFormValid = Object.values(errors).every((value) => !value);

  function touchField(field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setTouched({
      vehicleType: true,
      vehicleNumber: true,
      vehicleModel: true,
      licenseNumber: true,
      capacity: true
    });

    if (!isFormValid) {
      return;
    }

    if (!user || !user._id) {
      setErrorMessage('You must be logged in to apply as a driver.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await apiRequest('/api/drivers', {
        method: 'POST',
        body: JSON.stringify({
          userId: user._id,
          vehicleType: formState.vehicleType,
          vehicleNumber: formState.vehicleNumber,
          vehicleModel: formState.vehicleModel,
          licenseNumber: formState.licenseNumber,
          capacity: Number(formState.capacity)
        })
      });

      setSuccessMessage('Driver application submitted successfully! Your application is pending admin approval.');
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to submit driver application. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Driver Registration"
        title="Become a Driver"
        subtitle="Offer rides to verified SLIIT students and earn on your schedule."
      />

      <section className="section-block">
        <div className="container layout-two-col">
          <div className="surface info-panel">
            <h2>Why become a driver?</h2>
            <ul className="feature-list">
              {benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
            </ul>
            <div className="callout-box">
              <strong>Approval workflow</strong>
              <p>Driver submissions can be reviewed by the admin panel before going live.</p>
            </div>
          </div>

          <form className="surface form-card" onSubmit={handleSubmit}>
            <h2>Driver Registration</h2>
            <p className="form-note">Complete the form to create your driver profile.</p>

            {errorMessage ? <div className="notice error">{errorMessage}</div> : null}
            {successMessage ? <div className="notice success">{successMessage}</div> : null}

            <div className="field-grid two-col">
              <label>
                <span className="field-label-row">Vehicle Type</span>
                <select
                  value={formState.vehicleType}
                  onChange={(event) => setFormState((current) => ({ ...current, vehicleType: event.target.value }))}
                  onBlur={() => touchField('vehicleType')}
                  className={touched.vehicleType && errors.vehicleType ? 'input-error' : ''}
                  required
                >
                  <option value="Sedan">Sedan</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="SUV">SUV</option>
                  <option value="Van">Van</option>
                  <option value="Motorbike">Motorbike</option>
                  <option value="Tuk-Tuk">Tuk-Tuk</option>
                </select>
                {touched.vehicleType && errors.vehicleType ? <span className="field-error">{errors.vehicleType}</span> : null}
              </label>
              <label>
                <span className="field-label-row">Vehicle Number</span>
                <input
                  type="text"
                  value={formState.vehicleNumber}
                  onChange={(event) => setFormState((current) => ({ ...current, vehicleNumber: event.target.value }))}
                  onBlur={() => touchField('vehicleNumber')}
                  placeholder="ABC-1234"
                  className={touched.vehicleNumber && errors.vehicleNumber ? 'input-error' : ''}
                  required
                />
                {touched.vehicleNumber && errors.vehicleNumber ? <span className="field-error">{errors.vehicleNumber}</span> : null}
              </label>
              <label>
                <span className="field-label-row">Vehicle Model</span>
                <input
                  type="text"
                  value={formState.vehicleModel}
                  onChange={(event) => setFormState((current) => ({ ...current, vehicleModel: event.target.value }))}
                  onBlur={() => touchField('vehicleModel')}
                  placeholder="Toyota Corolla, Honda Civic, etc."
                  className={touched.vehicleModel && errors.vehicleModel ? 'input-error' : ''}
                  required
                />
                {touched.vehicleModel && errors.vehicleModel ? <span className="field-error">{errors.vehicleModel}</span> : null}
              </label>
              <label>
                <span className="field-label-row">License Number</span>
                <input
                  type="text"
                  value={formState.licenseNumber}
                  onChange={(event) => setFormState((current) => ({ ...current, licenseNumber: event.target.value }))}
                  onBlur={() => touchField('licenseNumber')}
                  placeholder="Driver license number"
                  className={touched.licenseNumber && errors.licenseNumber ? 'input-error' : ''}
                  required
                />
                {touched.licenseNumber && errors.licenseNumber ? <span className="field-error">{errors.licenseNumber}</span> : null}
              </label>
              <label>
                <span className="field-label-row">Passenger Capacity</span>
                <select
                  value={formState.capacity}
                  onChange={(event) => setFormState((current) => ({ ...current, capacity: event.target.value }))}
                  onBlur={() => touchField('capacity')}
                  className={touched.capacity && errors.capacity ? 'input-error' : ''}
                  required
                >
                  <option value="1">1 Passenger</option>
                  <option value="2">2 Passengers</option>
                  <option value="3">3 Passengers</option>
                  <option value="4">4 Passengers</option>
                  <option value="5">5 Passengers</option>
                  <option value="6">6 Passengers</option>
                  <option value="7">7 Passengers</option>
                  <option value="8">8 Passengers</option>
                </select>
                {touched.capacity && errors.capacity ? <span className="field-error">{errors.capacity}</span> : null}
              </label>
            </div>

            <button type="submit" className="button button-primary button-full" disabled={loading || !isFormValid}>
              {loading ? 'Submitting Application...' : 'Submit Driver Application'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}