import { useState } from 'react';
import { getEventBookingTickets } from '../lib/eventCommunityApi';

export default function TicketDownload({ bookingId, userId, bookingCount }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadTickets = async () => {
    try {
      setLoading(true);
      setError('');

      const ticketData = await getEventBookingTickets(bookingId, userId);

      if (!ticketData.tickets || ticketData.tickets.length === 0) {
        setError('No tickets available');
        return;
      }

      // Generate and download each ticket
      ticketData.tickets.forEach((ticket, index) => {
        setTimeout(() => {
          generateTicketHTML(ticketData, ticket, index + 1);
        }, index * 500); // Stagger downloads by 500ms
      });
    } catch (err) {
      setError(err.message || 'Failed to download tickets');
      console.error('Download tickets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTicketHTML = (ticketData, ticket, ticketIndex) => {
    const { event, userName, userEmail, paymentAmount, verifiedAt } = ticketData;

    const ticketHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Ticket - ${ticket.ticketNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ticket-container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 800px;
      width: 100%;
      overflow: hidden;
    }
    .ticket-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .ticket-header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .ticket-header p {
      font-size: 16px;
      opacity: 0.9;
    }
    .ticket-body {
      padding: 40px;
    }
    .ticket-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      margin-bottom: 30px;
    }
    .info-item {
      border-left: 4px solid #667eea;
      padding-left: 15px;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
    .ticket-qr {
      text-align: center;
      padding: 30px;
      background: #f8f9fa;
      border-radius: 10px;
      margin-top: 30px;
    }
    .qr-code {
      font-size: 48px;
      margin-bottom: 15px;
    }
    .qr-text {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #666;
      word-break: break-all;
    }
    .ticket-footer {
      background: #f8f9fa;
      padding: 20px 40px;
      text-align: center;
      color: #666;
      font-size: 14px;
      border-top: 2px dashed #ddd;
    }
    .seat-badge {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 10px 20px;
      border-radius: 50px;
      font-size: 20px;
      font-weight: bold;
      margin: 20px 0;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .ticket-container {
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="ticket-header">
      <h1>🎫 Event Ticket</h1>
      <p>${event.title}</p>
      <div class="seat-badge">Seat #${ticket.seatNumber}</div>
    </div>
    
    <div class="ticket-body">
      <div class="ticket-info">
        <div class="info-item">
          <div class="info-label">Ticket Number</div>
          <div class="info-value">${ticket.ticketNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Seat Number</div>
          <div class="info-value">#${ticket.seatNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Attendee Name</div>
          <div class="info-value">${userName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${userEmail || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Event Location</div>
          <div class="info-value">${event.location}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Event Date</div>
          <div class="info-value">${new Date(event.startDate).toLocaleDateString()}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Start Time</div>
          <div class="info-value">${new Date(event.startDate).toLocaleTimeString()}</div>
        </div>
        <div class="info-item">
          <div class="info-label">End Time</div>
          <div class="info-value">${new Date(event.endDate).toLocaleTimeString()}</div>
        </div>
      </div>

      <div class="ticket-qr">
        <div class="qr-code">📱</div>
        <div class="info-label">Scan QR Code at Entry</div>
        <div class="qr-text">${ticket.qrCode}</div>
      </div>
    </div>

    <div class="ticket-footer">
      <p><strong>Important:</strong> Please bring this ticket (printed or digital) to the event.</p>
      <p>Verified on: ${new Date(verifiedAt).toLocaleString()}</p>
      <p>Ticket ${ticketIndex} of ${ticketData.bookingCount}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Create a blob and download
    const blob = new Blob([ticketHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${ticket.seatNumber}-${ticket.ticketNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ticket-download-section">
      {error && (
        <div className="paymentx-alert paymentx-alert-error" style={{ marginBottom: '15px' }}>
          {error}
        </div>
      )}
      
      <button
        className="button button-success"
        onClick={handleDownloadTickets}
        disabled={loading}
        style={{
          width: '100%',
          padding: '15px',
          fontSize: '16px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.3s ease',
        }}
      >
        {loading ? '⏳ Preparing Tickets...' : `🎫 Download ${bookingCount} Ticket${bookingCount > 1 ? 's' : ''}`}
      </button>
      
      <p style={{ 
        textAlign: 'center', 
        marginTop: '10px', 
        fontSize: '14px', 
        color: '#666' 
      }}>
        {bookingCount > 1 
          ? `${bookingCount} individual tickets will be downloaded` 
          : 'Your ticket will be downloaded'}
      </p>
    </div>
  );
}
