import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  User,
  ShieldCheck,
  Calendar,
  FileText,
  Building,
  BarChart2,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  Menu as MenuIcon,
  X,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole, NotificationItem } from '../../types';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const {
    role,
    setRole,
    activeStudent,
    notifications,
    markNotificationAsRead,
    activeTab,
    setActiveTab,
  } = useApp();

  const [collapsed, setCollapsed] = useState(false);
  const [notifDrawerVisible, setNotifDrawerVisible] = useState(false);
  const [userDropdownVisible, setUserDropdownVisible] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabels: Record<UserRole, { label: string; color: string; bg: string }> = {
    student: { label: 'Student Portal', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    placement_coordinator: { label: 'Placement Coordinator Portal', color: 'text-green-700', bg: 'bg-green-50' },
    placement_cell: { label: 'Placement Cell Portal', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    super_admin: { label: 'Super Admin Portal', color: 'text-amber-700', bg: 'bg-amber-50' },
  };

  // Define which tabs are allowed per role
  const studentAllowedTabs = ['dashboard', 'jobs', 'student_profile', 'applications'];
  const coordinatorAllowedTabs = ['dashboard', 'student_profile', 'students_directory', 'applications', 'analytics'];
  const cellAllowedTabs = ['dashboard', 'jobs', 'student_profile', 'students_directory', 'drives', 'applications', 'companies', 'analytics', 'drive_create'];
  const adminAllowedTabs = ['dashboard', 'jobs', 'student_profile', 'students_directory', 'drives', 'applications', 'companies', 'analytics', 'settings', 'drive_create'];

  const allowedTabs =
    role === 'student'
      ? studentAllowedTabs
      : role === 'placement_coordinator'
        ? coordinatorAllowedTabs
        : role === 'placement_cell'
          ? cellAllowedTabs
          : adminAllowedTabs;

  // Redirect guard: if current tab is not allowed for the role, go to dashboard
  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [role, activeTab]);

  const allMenuItems = [
    { key: 'dashboard', icon: <LayoutDashboard size={16} />, label: 'Home Dashboard', roles: ['student', 'placement_coordinator', 'placement_cell', 'super_admin'] },
    { key: 'jobs', icon: <Briefcase size={16} />, label: 'Job Profiles', roles: ['student', 'placement_cell', 'super_admin'] },
    { key: 'student_profile', icon: <User size={16} />, label: 'My Profile', roles: ['student', 'placement_coordinator', 'placement_cell', 'super_admin'] },
    { key: 'students_directory', icon: <ShieldCheck size={16} />, label: 'Student Verification & Progress', roles: ['placement_coordinator', 'placement_cell', 'super_admin'] },
    { key: 'drives', icon: <Calendar size={16} />, label: 'Placement Drives', roles: ['placement_cell', 'super_admin'] },
    { key: 'applications', icon: <FileText size={16} />, label: role === 'student' ? 'My Applications' : 'Applications & Stages', roles: ['student', 'placement_coordinator', 'placement_cell', 'super_admin'] },
    { key: 'companies', icon: <Building size={16} />, label: 'Company & Partner Management', roles: ['placement_cell', 'super_admin'] },
    { key: 'analytics', icon: <BarChart2 size={16} />, label: 'Placement Analytics', roles: ['placement_coordinator', 'placement_cell', 'super_admin'] },
    { key: 'settings', icon: <Settings size={16} />, label: 'System Settings', roles: ['super_admin'] },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

  const breadcrumbNameMap: Record<string, string> = {
    dashboard: 'Dashboard',
    jobs: 'Job Profiles',
    student_profile: 'Student Profile',
    students_directory: 'Student Registry',
    drives: 'Placement Drives',
    applications: 'Applications Tracker',
    companies: 'Companies & Partners',
    analytics: 'Analytics & Reports',
    settings: 'Settings',
    drive_create: 'Create Placement Drive',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-[13px] text-gray-900 font-sans">
      {/* Fixed Top Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 bg-white border-b border-gray-200 h-14 shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-8 h-8 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 text-[15px] leading-tight">
                SUPERSET<span className="text-emerald-600 font-medium">ERP</span>
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-wide uppercase leading-tight">
                University Placement Portal
              </span>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-gray-200 mx-2 hidden sm:block" />

          {/* University Badge */}
          <div className="hidden md:flex items-center bg-gray-50 px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-600 border border-gray-200 gap-1.5">
            <Building size={14} className="text-emerald-600" />
            Manav Rachna University, Faridabad
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Action Button for placement cell */}
          {role === 'placement_cell' || role === 'super_admin' ? (
            <button
              onClick={() => setActiveTab('drive_create')}
              className="hidden sm:flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition-colors font-medium text-[13px]"
            >
              <Plus size={14} />
              Create Placement Drive
            </button>
          ) : null}

          {/* User Role Display */}
          <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-300 rounded-md px-2 py-1">
            <span className="text-[11px] font-medium text-gray-500">Portal:</span>
            <span className="text-gray-700 text-[12px] font-medium">
              {role === 'student' ? '🎓 Student' : role === 'placement_coordinator' ? '🛡️ Coordinator' : role === 'placement_cell' ? '🏢 Cell' : '👑 Admin'}
            </span>
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => setNotifDrawerVisible(!notifDrawerVisible)}
            className="relative p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-[9px] h-[9px] bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownVisible(!userDropdownVisible)}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-xs border border-emerald-200 shrink-0">
                {role === 'student' ? (activeStudent?.name?.charAt(0) || 'S') : 'S'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[12.5px] font-medium text-gray-900 leading-none">
                  {role === 'student' ? (activeStudent?.name || 'Student') : 'Admin/Coordinator'}
                </span>
                <span className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  {roleLabels[role].label}
                </span>
              </div>
              <ChevronDown size={14} className="text-gray-400 ml-1" />
            </button>

            {userDropdownVisible && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={() => { setActiveTab('student_profile'); setUserDropdownVisible(false); }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <User size={14} /> View My Profile
                </button>
                <div className="h-[1px] bg-gray-100 my-1"></div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.reload();
                  }} 
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={14} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Left Sidebar */}
        <aside
          className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
            collapsed ? 'w-14' : 'w-52'
          }`}
        >
          <div className="flex-1 overflow-y-auto py-3">
            {/* Student Info Box */}
            {!collapsed && role === 'student' && (
              <div className="mx-3 mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-[13px] border border-emerald-200 shrink-0">
                    {activeStudent?.name?.charAt(0) || 'S'}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-semibold text-[12px] text-gray-900 block truncate">
                      {activeStudent?.name || 'Loading...'}
                    </span>
                    <span className="text-[11px] text-gray-500 block truncate">
                      ID: {activeStudent?.supersetId || '---'}
                    </span>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-emerald-200 flex items-center justify-between text-[11px]">
                  <span className="text-gray-600">CGPA: <strong className="text-gray-900">{activeStudent?.education?.graduation?.cgpa || 'N/A'}</strong></span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    activeStudent?.verificationStatus === 'verified' ? 'bg-green-50 text-green-700' :
                    activeStudent?.verificationStatus === 'pending' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {(activeStudent?.verificationStatus || 'pending').toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            <nav className="px-2 space-y-0.5">
              {menuItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Fake left border accent using absolute positioning or just border */}
                    <div className="relative flex items-center gap-3 w-full">
                      {isActive && (
                        <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-emerald-600 rounded-r-md"></div>
                      )}
                      <span className={isActive ? 'text-emerald-600' : 'text-gray-400'}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Collapse Toggle */}
          <div className="border-t border-gray-200 p-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex justify-center items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md"
            >
              <MenuIcon size={18} />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-gray-50 overflow-y-auto p-5 relative">
          {/* Breadcrumb Navigation */}
          <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-[13px]">
              <button onClick={() => setActiveTab('dashboard')} className="text-gray-400 hover:text-gray-600">Home</button>
              <span className="text-gray-300">/</span>
              <span className="font-medium text-gray-900">{breadcrumbNameMap[activeTab] || 'Overview'}</span>
            </div>

            {/* Context Tag */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className={`px-2 py-0.5 rounded font-medium ${roleLabels[role].bg} ${roleLabels[role].color}`}>
                Active View: {roleLabels[role].label}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500 font-mono text-[11px]">
                Batch 2026 Drive Operations
              </span>
            </div>
          </div>

          {/* Page Content */}
          <div className="bg-white p-5 rounded-lg border border-gray-200 min-h-[500px]">
            {children}
          </div>

          <footer className="text-center text-[12px] text-gray-400 py-6">
            Superset Enterprise Placement Management Platform &copy; 2026 Manav Rachna University. All rights reserved.
          </footer>
        </main>
      </div>

      {/* Notifications Drawer */}
      {notifDrawerVisible && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setNotifDrawerVisible(false)}></div>
          <div className="relative w-[380px] bg-white h-full shadow-xl flex flex-col border-l border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-semibold text-[15px] text-gray-900">Notifications & Alerts</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded">
                  {unreadCount} New
                </span>}
                <button onClick={() => setNotifDrawerVisible(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.map((item: NotificationItem) => (
                <div
                  key={item.id}
                  onClick={() => {
                    markNotificationAsRead(item.id);
                    if (item.linkDriveId) {
                      setActiveTab('jobs');
                      setNotifDrawerVisible(false);
                    }
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors flex gap-3 ${
                    item.read ? 'bg-white border-gray-100' : 'bg-emerald-50 border-emerald-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                    item.read ? 'bg-gray-100 text-gray-500' : 'bg-emerald-600 text-white'
                  }`}>
                    {item.type === 'drive' ? <Briefcase size={14} /> :
                     item.type === 'verification' ? <ShieldCheck size={14} /> :
                     <Bell size={14} />}
                  </div>
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-gray-900 text-[13px] leading-tight">{item.title}</h4>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">{item.timestamp}</span>
                    </div>
                    <p className="text-gray-600 text-[12px] mt-1 leading-snug">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
