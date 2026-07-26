import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast as message } from '../utils/toast';
import {
  Student,
  PlacementDrive,
  Company,
  Application,
  NotificationItem,
  UserRole,
  VerificationStatus,
  ApplicationStatus,
} from '../types';
import { studentsApi } from '../api/students.api';
import { drivesApi } from '../api/drives.api';
import { companiesApi } from '../api/companies.api';
import { applicationsApi } from '../api/applications.api';
import { notificationsApi } from '../api/notifications.api';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeStudent: Student;
  setActiveStudentId: (id: string) => void;
  
  students: Student[];
  drives: PlacementDrive[];
  companies: Company[];
  applications: Application[];
  notifications: NotificationItem[];
  
  // Actions
  applyToDrive: (driveId: string, resumeId: string) => Promise<void>;
  verifyStudentProfile: (studentId: string, status: VerificationStatus, remarks?: string) => Promise<void>;
  bulkVerifyStudents: (studentIds: string[], status: VerificationStatus) => Promise<void>;
  createPlacementDrive: (drive: Omit<PlacementDrive, 'id' | 'totalAppliedCount' | 'shortlistedCount' | 'selectedCount'>) => Promise<void>;
  updateApplicationStage: (applicationId: string, stageId: string, status: ApplicationStatus, feedback?: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  updateStudentData: (updatedStudent: Student) => Promise<void>;
  
  // Quick Filter
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Auth
  logout: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('student');
  const [activeStudentId, setActiveStudentId] = useState<string>('');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Dummy fallback student while loading or if data is empty
  const activeStudent = students.find((s) => s.id === activeStudentId || s._id === activeStudentId) || ({} as Student);

  const fetchInitialData = async () => {
    try {
      const [drivesRes, companiesRes, appsRes, notifsRes] = await Promise.all([
        drivesApi.getAll(),
        companiesApi.getAll(),
        applicationsApi.getAll(),
        notificationsApi.getAll()
      ]);
      setDrives(drivesRes);
      setCompanies(companiesRes);
      setApplications(appsRes);
      setNotifications(notifsRes);

      // If user is admin/coordinator, fetch all students
      if (role !== 'student') {
        const studentsRes = await studentsApi.getAll({ limit: '100' });
        setStudents(studentsRes.students);
      } else {
        // Fetch own profile
        const myProfile = await studentsApi.getMyProfile();
        setStudents([myProfile]);
        setActiveStudentId(myProfile._id || myProfile.id);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  // Load user data on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role) {
          setRole(user.role as UserRole);
        }
        if (user.studentProfile && user.studentProfile._id) {
          setActiveStudentId(user.studentProfile._id);
        }
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  useEffect(() => {
    if (role) {
      fetchInitialData();
    }
  }, [role]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const applyToDrive = async (driveId: string, resumeId: string) => {
    try {
      await applicationsApi.apply(driveId, resumeId);
      message.success('Successfully applied to the drive!');
      await fetchInitialData();
    } catch (error: any) {
      message.error(error.message || 'Failed to apply');
    }
  };

  const verifyStudentProfile = async (studentId: string, status: VerificationStatus, remarks?: string) => {
    try {
      await studentsApi.verify(studentId, status, remarks);
      message.success(`Student profile status updated to ${status.toUpperCase()}`);
      await fetchInitialData();
    } catch (error: any) {
      message.error(error.message || 'Verification failed');
    }
  };

  const bulkVerifyStudents = async (studentIds: string[], status: VerificationStatus) => {
    try {
      await studentsApi.bulkVerify(studentIds, status);
      message.success(`${studentIds.length} student profiles marked as ${status.toUpperCase()}`);
      await fetchInitialData();
    } catch (error: any) {
      message.error(error.message || 'Bulk verification failed');
    }
  };

  const createPlacementDrive = async (driveData: Omit<PlacementDrive, 'id' | 'totalAppliedCount' | 'shortlistedCount' | 'selectedCount'>) => {
    try {
      await drivesApi.create(driveData);
      message.success(`Placement Drive created and published!`);
      await fetchInitialData();
      setActiveTab('drives');
    } catch (error: any) {
      message.error(error.message || 'Failed to create drive');
    }
  };

  const updateApplicationStage = async (applicationId: string, stageId: string, status: ApplicationStatus, feedback?: string) => {
    try {
      await applicationsApi.updateStage(applicationId, stageId, status, feedback);
      message.success(`Application status updated to ${status}`);
      await fetchInitialData();
    } catch (error: any) {
      message.error(error.message || 'Failed to update stage');
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId || n._id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error: any) {
      console.error('Failed to mark read', error);
    }
  };

  const updateStudentData = async (updatedStudent: Student) => {
    try {
      const id = updatedStudent._id || updatedStudent.id;
      await studentsApi.update(id, updatedStudent);
      message.success('Student profile updated successfully!');
      await fetchInitialData();
    } catch (error: any) {
      message.error(error.message || 'Update failed');
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeStudent,
        setActiveStudentId,
        students,
        drives,
        companies,
        applications,
        notifications,
        applyToDrive,
        verifyStudentProfile,
        bulkVerifyStudents,
        createPlacementDrive,
        updateApplicationStage,
        markNotificationAsRead,
        updateStudentData,
        activeTab,
        setActiveTab,
        logout,
        refreshData: fetchInitialData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
