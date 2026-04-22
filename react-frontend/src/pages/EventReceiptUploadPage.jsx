import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { readStoredUser } from '../lib/auth';
import { isMongoObjectId, uploadEventBookingReceipt } from '../lib/eventCommunityApi';

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read selected file.'));
    reader.readAsDataURL(file);
  });
}

export default function EventReceiptUploadPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingId = location.state?.bookingId || searchParams.get('bookingId') || '';
  const eventId = location.state?.eventId || searchParams.get('eventId') || '';
  const rawAmount = location.state?.amount ?? searchParams.get('amount') ?? '0';
  const amountPaid = Number.isFinite(Number(rawAmount)) ? Number(rawAmount) : 0;

  const user = useMemo(() => readStoredUser(), []);
  const rawUserId = user?._id || user?.id || '';
  const userId = isMongoObjectId(rawUserId) ? rawUserId : '';

  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptDataUrl, setReceiptDataUrl] = useState('');
  const [receiptMimeType, setReceiptMimeType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    setError('');
    setSuccess('');

    if (!file) {
      setReceiptDataUrl('');
      setReceiptFileName('');
      setReceiptMimeType('');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload PNG, JPG, JPEG, WEBP, or PDF.');
      return;
    }

    if (file.size > MAX_RECEIPT_SIZE_BYTES) {
      setError('Receipt image must be 5MB or smaller.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setReceiptDataUrl(dataUrl);
      setReceiptFileName(file.name || 'receipt-image');
      setReceiptMimeType(file.type);
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to load selected receipt image.');
      setReceiptDataUrl('');
      setReceiptFileName('');
      setReceiptMimeType('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!userId) {
      setError('Please log in before uploading receipt.');
      return;
    }

    if (!isMongoObjectId(bookingId)) {
      setError('Booking id is missing. Please complete payment again.');
      return;
    }

    if (!receiptDataUrl) {
      setError('Please select a receipt image to upload.');
      return;
    }

    setIsSubmitting(true);
    try {
      await uploadEventBookingReceipt(bookingId, {
        userId,
        fileName: receiptFileName,
        receiptDataUrl,
      });

      setSuccess('Receipt uploaded successfully. Redirecting...');
      setTimeout(() => {
        navigate('/book-event/payment/success', {
          state: {
            bookingId,
            eventId,
            amount: amountPaid,
          },
        });
      }, 500);
    } catch (requestError) {
      setError(requestError.message || 'Unable to upload receipt right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="paymentx-shell section-block">
      <div className="container receiptx-wrap">
        <div className="receiptx-card">
          <header className="receiptx-head">
            <div className="receiptx-icon" aria-hidden="true">RP</div>
            <div>
              <h1>Upload Payment Receipt</h1>
              <p>Upload your payment receipt to complete booking</p>
            </div>
          </header>

          {error ? <div className="paymentx-alert paymentx-alert-error">{error}</div> : null}
          {success ? <div className="paymentx-alert paymentx-alert-success">{success}</div> : null}

          {!userId ? (
            <div className="paymentx-login-card">
              <p>Please log in to continue with receipt upload.</p>
              <Link to="/login" className="button button-primary button-small">Go to Login</Link>
            </div>
          ) : null}

          <div className="receiptx-amount-box">
            <span>Amount Paid</span>
            <strong>Rs.{amountPaid.toFixed(2)}</strong>
          </div>

          <form onSubmit={handleSubmit} className="receiptx-form" noValidate>
            <input
              id="receipt-file-input"
              className="receiptx-file-input"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
              onChange={handleFileChange}
              required
            />

            <label htmlFor="receipt-file-input" className="receiptx-dropzone">
              <span className="receiptx-drop-icon" aria-hidden="true">UP</span>
              <strong>{receiptFileName ? 'Receipt selected' : 'Click to upload receipt'}</strong>
              <small>{receiptFileName || 'JPG, PNG or PDF (Max 5MB)'}</small>
            </label>

            {receiptDataUrl && receiptMimeType.startsWith('image/') ? (
              <div className="receiptx-preview-wrap">
                <img src={receiptDataUrl} alt="Receipt preview" className="paymentx-receipt-preview" />
              </div>
            ) : null}

            {receiptDataUrl && receiptMimeType === 'application/pdf' ? (
              <div className="receiptx-preview-wrap">
                <p className="paymentx-muted">PDF selected: {receiptFileName}</p>
              </div>
            ) : null}

            <div className="receiptx-actions">
              <button
                type="button"
                className="button receiptx-button-back"
                onClick={() => navigate(eventId ? `/book-event/payment?eventId=${encodeURIComponent(eventId)}` : '/book-event')}
              >
                Back to Card Details
              </button>

              <button
                type="submit"
                className="button button-primary receiptx-button-submit"
                disabled={isSubmitting || !userId}
              >
                {isSubmitting ? 'Uploading...' : 'Upload & Complete Payment'}
              </button>
            </div>
          </form>

          <p className="receiptx-footnote">Booking ID: {bookingId || 'N/A'}</p>
        </div>
      </div>
    </section>
  );
}
