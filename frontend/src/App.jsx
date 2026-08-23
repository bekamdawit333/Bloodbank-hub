import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { api } from './api';
import { useTheme } from './hooks/useTheme';
import { useIsMobile } from './hooks/useIsMobile';
import { useAuthSession } from './hooks/useAuthSession';
import { useNotifications } from './features/notifications/useNotifications';

import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import BottomToast from './components/ui/BottomToast';
import ProfileView from './components/profile/ProfileView';

import LandingPage from './features/landing/LandingPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/register/RegisterPage';

import AdminDashboard from './features/admin/AdminDashboard';
import DonorDashboard from './features/donor/DonorDashboard';
import StationDashboard from './features/station/StationDashboard';
import LabDashboard from './features/laboratory/LabDashboard';
import WarehouseDashboard from './features/warehouse/WarehouseDashboard';
import HospitalDashboard from './features/hospital/HospitalDashboard';

const DASHBOARDS = {
  admin: AdminDashboard,
  donor: DonorDashboard,
  station: StationDashboard,
  laboratory: LabDashboard,
  warehouse: WarehouseDashboard,
  hospital: HospitalDashboard,
};

// Guest auth pages share a centered card layout with a back-to-home button.
function AuthShell({ children, onBackHome, accent }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '20px',
        background: accent,
      }}
    >
      <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
        <button
          onClick={onBackHome}
          className="btn"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '8px 16px',
          }}
        >
          ← Back to Home
        </button>
      </div>
      {children}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('landing');
  const [subTab, setSubTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const { user, login, logout } = useAuthSession();
  const { notifications, unreadCount, incomingAlert, dismissAlert, markAsRead, markAllRead } =
    useNotifications(user);

  // Reset navigation whenever the signed-in user changes, and land returning
  // users (page refresh with a valid session) straight on their dashboard.
  useEffect(() => {
    setSubTab('dashboard');
    setMenuOpen(false);
    if (user) setView('dashboard');
  }, [user?.id]);

  const handleLoginSuccess = (loggedInUser) => {
    login(loggedInUser);
    setView('dashboard');
    setSubTab('dashboard');
  };
  const handleLogout = () => {
    logout();
    setView('landing');
  };

  const navigateToTab = (tab) => {
    setSubTab(tab);
    setMenuOpen(false);
  };

  const renderDashboardContent = () => {
    if (!user) return null;
    if (subTab === 'profile') {
      return <ProfileView user={user} setTab={setSubTab} onBack={() => setSubTab('dashboard')} />;
    }
    const Dashboard = DASHBOARDS[user.role];
    if (!Dashboard) return <div style={{ color: 'red' }}>Error: Unknown Workstation Role</div>;
    const props = user.role === 'donor'
      ? { activeTab: subTab, setActiveTab: setSubTab, isMobile }
      : { tab: subTab, setTab: setSubTab, isMobile };
    return <Dashboard {...props} />;
  };

  return (
    <div
      className={user ? `theme-${user.role}` : ''}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
      }}
    >
      <BottomToast message={incomingAlert} onClose={dismissAlert} />

      {/* Theme toggle floating over guest views */}
      {view !== 'dashboard' && view !== 'landing' && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100 }}>
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '10px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      )}

      {view === 'landing' && (
        <LandingPage
          onNavigateToLogin={() => setView('login')}
          onNavigateToRegister={() => setView('register')}
        />
      )}

      {view === 'login' && (
        <AuthShell
          onBackHome={() => setView('landing')}
          accent="radial-gradient(circle at top right, rgba(239,35,60,0.07) 0%, transparent 50%)"
        >
          <LoginPage onLoginSuccess={handleLoginSuccess} onNavigateToRegister={() => setView('register')} />
        </AuthShell>
      )}

      {view === 'register' && (
        <AuthShell
          onBackHome={() => setView('landing')}
          accent="radial-gradient(circle at top left, rgba(58,134,255,0.06) 0%, transparent 50%)"
        >
          <RegisterPage onNavigateToLogin={() => setView('login')} />
        </AuthShell>
      )}

      {view === 'dashboard' && user && (
        <div style={{ display: 'flex', flex: 1, height: '100vh', overflow: 'hidden' }}>
          {isMobile && menuOpen && (
            <div
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9998,
                backdropFilter: 'blur(2px)',
              }}
            />
          )}

          <Sidebar
            user={user}
            activeTab={subTab}
            onTabChange={navigateToTab}
            notifications={notifications}
            onLogout={handleLogout}
            isMobile={isMobile}
            menuOpen={menuOpen}
          />

          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-main)' }}>
            <Topbar
              user={user}
              isMobile={isMobile}
              onMenuToggle={() => setMenuOpen((prev) => !prev)}
              theme={theme}
              onToggleTheme={toggleTheme}
              onNavigate={navigateToTab}
              onLogout={handleLogout}
              notifications={notifications}
              unreadCount={unreadCount}
              markAsRead={markAsRead}
              markAllRead={markAllRead}
            />

            <div style={{ flex: 1, padding: isMobile ? '16px' : '24px', overflowY: 'auto' }} className="animate-fade-in">
              {renderDashboardContent()}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
