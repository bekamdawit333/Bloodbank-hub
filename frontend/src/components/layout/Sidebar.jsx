import { Heart, Home, LogOut } from 'lucide-react';
import { getRoleConfig } from '../../config/roleConfig';

// Left navigation sidebar: brand, per-role nav items with unread badges,
// and the user badge / quick actions footer.
export default function Sidebar({ user, activeTab, onTabChange, notifications = [], onLogout, isMobile, menuOpen }) {
  const role = getRoleConfig(user.role);

  return (
    <aside
      style={{
        width: '240px',
        background: 'var(--sidebar-bg, #0f172a)',
        color: '#ffffff',
        display: isMobile && !menuOpen ? 'none' : 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px 16px 16px',
        transition: 'all 0.3s ease',
        zIndex: 9999,
        ...(isMobile
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              height: '100vh',
              boxShadow: '10px 0 30px rgba(0, 0, 0, 0.4)',
            }
          : {}),
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={18} color="var(--primary, #ef233c)" fill="var(--primary, #ef233c)" />
          </div>
          <span
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.3px',
            }}
          >
            Blood Bank Hub
          </span>
        </div>

        {/* Per-role navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {role.nav.map((item) => {
            const isActive = activeTab === item.id;
            const tabUnreadCount = notifications.filter((n) => n.category === item.id).length;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'var(--primary, #ef233c)' : 'transparent',
                  color: '#ffffff',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  opacity: isActive ? 1 : 0.8,
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {tabUnreadCount > 0 && (
                  <span
                    style={{
                      background: '#ef233c',
                      color: '#fff',
                      borderRadius: '10px',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      minWidth: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      flexShrink: 0,
                    }}
                  >
                    {tabUnreadCount > 9 ? '9+' : tabUnreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User badge + quick actions */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          paddingTop: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {role.icon}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {user.entity_name || user.email?.split('@')[0]}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.65)',
                textTransform: 'capitalize',
              }}
            >
              {role.badgeTitle}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {activeTab !== 'dashboard' && (
            <button
              onClick={() => onTabChange('dashboard')}
              title="Back to Dashboard"
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.85)',
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            >
              <Home size={13} /> Dashboard
            </button>
          )}
          <button
            onClick={onLogout}
            title="Sign Out"
            style={{
              flex: activeTab !== 'dashboard' ? 'none' : 1,
              background: 'rgba(239,35,60,0.12)',
              border: '1px solid rgba(239,35,60,0.25)',
              color: '#ff6b6b',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,35,60,0.22)';
              e.currentTarget.style.color = '#ff8a8a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,35,60,0.12)';
              e.currentTarget.style.color = '#ff6b6b';
            }}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
