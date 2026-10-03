import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { JobProfileView } from './components/jobs/JobProfileView';
import { StudentProfileView } from './components/students/StudentProfileView';
import { StudentsDirectory } from './components/students/StudentsDirectory';
import { DriveCreationWizard } from './components/drives/DriveCreationWizard';
import { ApplicationsTracker } from './components/applications/ApplicationsTracker';
import { CompaniesDirectory } from './components/companies/CompaniesDirectory';
import { AnalyticsReports } from './components/analytics/AnalyticsReports';
import { SettingsView } from './components/settings/SettingsView';
import { AuthPage } from './components/auth/AuthPage';
import { OnboardingPage } from './components/auth/OnboardingPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { BlogsManager } from './components/blogs/BlogsManager';
import { StudentBlogsFeed } from './components/blogs/StudentBlogsFeed';
import  LandingPage  from './components/landing/LandingPage';

const MainContent: React.FC = () => {
  const { activeTab, role } = useApp();

  const allowedTabsByRole: Record<string, string[]> = {
    student: ['dashboard', 'student_dashboard', 'jobs', 'student_profile', 'applications'],
    placement_coordinator: ['dashboard', 'student_profile', 'students_directory', 'applications', 'analytics', 'blogs'],
    placement_cell: ['dashboard', 'jobs', 'student_profile', 'students_directory', 'drives', 'applications', 'companies', 'analytics', 'drive_create', 'blogs'],
    super_admin: ['dashboard', 'jobs', 'student_profile', 'students_directory', 'drives', 'applications', 'companies', 'analytics', 'settings', 'drive_create', 'blogs'],
  };

  const allowedTabs = allowedTabsByRole[role] || allowedTabsByRole.student;

  const safeTab = allowedTabs.includes(activeTab) ? activeTab : 'dashboard';

  switch (safeTab) {
    case 'dashboard':
      return role === 'student' ? <StudentBlogsFeed /> : <OverviewDashboard />;
    case 'student_dashboard':
      return <OverviewDashboard />;
    case 'jobs':
      return <JobProfileView />;
    case 'student_profile':
      return <StudentProfileView />;
    case 'students_directory':
      return <StudentsDirectory />;
    case 'drive_create':
      return <DriveCreationWizard />;
    case 'applications':
      return <ApplicationsTracker />;
    case 'companies':
      return <CompaniesDirectory />;
    case 'analytics':
      return <AnalyticsReports />;
    case 'settings':
      return <SettingsView />;
    case 'blogs':
      return <BlogsManager />;
    default:
      return role === 'student' ? <StudentBlogsFeed /> : <OverviewDashboard />;
  }
};

// Reads the cached user for the onboarding form. Kept separate so App
// itself does not need to track another piece of state.
const OnboardingRoute: React.FC<{
  onComplete: () => void;
  onLogout: () => void;
}> = ({ onComplete, onLogout }) => {
  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  return <OnboardingPage user={user} onComplete={onComplete} onLogout={onLogout} />;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [needsOnboarding, setNeedsOnboarding] = React.useState<boolean>(false);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      setIsAuthenticated(true);
      try {
        setNeedsOnboarding(JSON.parse(userStr).needsOnboarding === true);
      } catch {
        setNeedsOnboarding(false);
      }
    }
    setIsInitializing(false);
  }, []);

  const handleLoginSuccess = (user: any, token: string) => {
    setNeedsOnboarding(user?.needsOnboarding === true);
    setIsAuthenticated(true);
  };

  const handleOnboardingComplete = () => {
    // Refresh the cached user so AppContext picks up the new student profile.
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        parsed.needsOnboarding = false;
        localStorage.setItem('user', JSON.stringify(parsed));
      } catch {
        /* ignore malformed cache */
      }
    }
    setNeedsOnboarding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setNeedsOnboarding(false);
    setIsAuthenticated(false);
    window.location.reload();
  };

  if (isInitializing) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={!isAuthenticated ? (
          <LandingPage />
        ) : (
          <Navigate to="/app" replace />
        )} />
        
        <Route path="/app/*" element={isAuthenticated ? (
          needsOnboarding ? (
            <OnboardingRoute onComplete={handleOnboardingComplete} onLogout={handleLogout} />
          ) : (
            <AppProvider>
              <AppLayout onLogout={handleLogout}>
                <MainContent />
              </AppLayout>
            </AppProvider>
          )
        ) : (
          <Navigate to="/" replace />
        )} />

        <Route path="/login" element={!isAuthenticated ? (
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          <Navigate to="/app" replace />
        )} />

        {/* Reachable while logged in — someone resetting a password from a
            expired session must not be bounced to the landing page. */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Routes>
    </Router>
  );
}
