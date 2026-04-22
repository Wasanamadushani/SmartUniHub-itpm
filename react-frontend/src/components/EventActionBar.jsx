import { NavLink } from 'react-router-dom';

const actionItems = [
  { to: '/', label: 'Back to Home', hint: 'Main dashboard', badge: 'HM', exact: true },
  { to: '/book-event', label: 'Book Event', hint: 'Reserve seats', badge: 'BK' },
  { to: '/create-event', label: 'Create Event', hint: 'Submit new event', badge: 'CR' },
  { to: '/events-calendar', label: 'Event Calendar', hint: 'View schedule', badge: 'CL' },
  { to: '/event-stalls/new', label: 'Create Stall', hint: 'Request a booth', badge: 'ST', tone: 'feature' },
  { to: '/event-memories', label: 'Share Memory', hint: 'Post event moments', badge: 'MY' },
];

function actionClassName(isActive, tone) {
  return ['eventsx-action-link', tone === 'feature' ? 'eventsx-action-link-feature' : '', isActive ? 'is-active' : '']
    .filter(Boolean)
    .join(' ');
}

export default function EventActionBar() {
  return (
    <div className="eventsx-toolbar-actions" role="navigation" aria-label="Event quick actions">
      <div className="eventsx-toolbar-actions-head">
        <span className="eventsx-toolbar-kicker">Event Quick Actions</span>
        <p>Jump to booking, creation, calendar, stalls, and memories in one place.</p>
      </div>

      <div className="eventsx-toolbar-actions-grid">
        {actionItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={Boolean(item.exact)}
            className={({ isActive }) => actionClassName(isActive, item.tone)}
          >
            <span className="eventsx-action-badge" aria-hidden="true">{item.badge}</span>
            <span className="eventsx-action-copy">
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
            </span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}