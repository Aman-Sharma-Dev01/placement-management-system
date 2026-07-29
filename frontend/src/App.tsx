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
import  LandingPage  from './components/landing/LandingPage';

const MainContent: React.FC = () => {
  const { activeTab, role } = useApp();

  const allowedTabsByRole: Record<string, string[]> = {
    student: ['dashboard', 'jobs', 'student_profile', 'applications'],
    placement_coordinator: ['dashboard', 'student_profile', 'students_directory', 'applications', 'analytics'],
    placement_cell: ['dashboard', 'jobs', 'student_profile', 'students_directory', 'drives', 'applications', 'companies', 'analytics', 'drive_create'],
    super_admin: ['dashboard', 'jobs', 'student_profile', 'students_directory', 'drives', 'applications', 'companies', 'analytics', 'settings', 'drive_create'],
  };

  const allowedTabs = allowedTabsByRole[role] || allowedTabsByRole.student;

  const safeTab = allowedTabs.includes(activeTab) ? activeTab : 'dashboard';

  switch (safeTab) {
    case 'dashboard':
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
    default:
      return <OverviewDashboard />;
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [isInitializing, setIsInitializing] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      setIsAuthenticated(true);
    }
    setIsInitializing(false);
  }, []);

  const handleLoginSuccess = (user: any, token: string) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
          <AppProvider>
            <AppLayout onLogout={handleLogout}>
              <MainContent />
            </AppLayout>
          </AppProvider>
        ) : (
          <Navigate to="/" replace />
        )} />

        <Route path="/login" element={!isAuthenticated ? (
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          <Navigate to="/app" replace />
        )} />
      </Routes>
    </Router>
  );
}
