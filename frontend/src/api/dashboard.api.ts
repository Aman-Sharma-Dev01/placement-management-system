import { apiClient } from './apiClient';

export interface DashboardStats {
  totalStudents: number;
  verifiedStudents: number;
  pendingStudents: number;
  totalDrives: number;
  openDrives: number;
  closedDrives: number;
  totalApplications: number;
  offeredCount: number;
  rejectedCount: number;
  totalCompanies: number;
  ctcStats: { avgCtc: number; maxCtc: number; minCtc: number };
  placementRate: number;
  drivesBySector: { _id: string; count: number }[];
  applicationsByStatus: { _id: string; count: number }[];
  recentDrives: {
    _id: string;
    companyName: string;
    jobTitle: string;
    ctcLpa: number;
    status: string;
    positionType: string;
    companyLogo: string;
    deadlineDate: string;
  }[];
  studentStats: {
    totalApplied: number;
    underReview: number;
    shortlisted: number;
    offered: number;
    rejected: number;
    profileCompletion: number;
    verificationStatus: string;
  } | null;
}

export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/dashboard/stats'),
};
