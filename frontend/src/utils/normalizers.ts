import {
  Application,
  Company,
  NotificationItem,
  PlacementDrive,
  Student,
} from '../types';

const toId = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return String(value.id || value._id || '');
};

const normalizeArray = <T>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : []);

const defaultEducation = {
  tenth: {
    institution: '',
    board: '',
    percentage: 0,
    passingYear: 0,
    marksheetUrl: '',
  },
  twelfthOrDiploma: 'twelfth' as 'twelfth' | 'diploma',
  twelfth: {
    institution: '',
    board: '',
    percentage: 0,
    passingYear: 0,
    marksheetUrl: '',
  },
  diploma: {
    institution: '',
    board: '',
    percentage: 0,
    passingYear: 0,
    marksheetUrl: '',
  },
  graduation: {
    university: '',
    branch: '',
    cgpa: 0,
    sgpaPerSemester: [],
    passingYear: 0,
    backlogs: {
      active: 0,
      history: 0,
    },
    gapYears: 0,
    gapReason: '',
  },
};

export const normalizeStudent = (student: any): Student => ({
  ...student,
  id: toId(student),
  supersetId: student?.supersetId || '',
  phone: student?.phone || '',
  avatarUrl: student?.avatarUrl || '',
  department: student?.department || '',
  coordinatorRemarks: student?.coordinatorRemarks || '',
  profileCompletionPercentage: Number(student?.profileCompletionPercentage || 0),
  education: {
    ...defaultEducation,
    ...(student?.education || {}),
    tenth: {
      ...defaultEducation.tenth,
      ...(student?.education?.tenth || {}),
    },
    twelfth: {
      ...defaultEducation.twelfth,
      ...(student?.education?.twelfth || {}),
    },
    graduation: {
      ...defaultEducation.graduation,
      ...(student?.education?.graduation || {}),
      backlogs: {
        ...defaultEducation.graduation.backlogs,
        ...(student?.education?.graduation?.backlogs || {}),
      },
      sgpaPerSemester: normalizeArray(student?.education?.graduation?.sgpaPerSemester),
    },
  },
  skills: normalizeArray(student?.skills),
  projects: normalizeArray(student?.projects).map((project: any) => ({
    ...project,
    id: toId(project),
    techStack: normalizeArray(project?.techStack),
  })),
  internships: normalizeArray(student?.internships).map((internship: any) => ({
    ...internship,
    id: toId(internship),
  })),
  certificates: normalizeArray(student?.certificates).map((certificate: any) => ({
    ...certificate,
    id: toId(certificate),
  })),
  resumes: normalizeArray(student?.resumes).map((resume: any) => ({
    ...resume,
    id: toId(resume),
    fileUrl: resume?.fileUrl || '',
  })),
  appliedDriveIds: normalizeArray(student?.appliedDriveIds).map((driveId: any) => String(driveId)),
  offers: normalizeArray(student?.offers),
});

export const normalizeStudents = (students: any[]): Student[] => normalizeArray(students).map(normalizeStudent);

export const normalizeDrive = (drive: any): PlacementDrive => ({
  ...drive,
  id: toId(drive),
  companyId: toId(drive?.companyId),
  companyLogo: drive?.companyLogo || '',
  companyWebsite: drive?.companyWebsite || '',
  sector: drive?.sector || '',
  jobFunction: drive?.jobFunction || '',
  location: drive?.location || '',
  description: drive?.description || '',
  requirements: normalizeArray(drive?.requirements),
  postedDate: drive?.postedDate || '',
  deadlineDate: drive?.deadlineDate || '',
  eligibility: {
    allowedBranches: normalizeArray(drive?.eligibility?.allowedBranches),
    minCgpa: Number(drive?.eligibility?.minCgpa || 0),
    minTenthPercentage: Number(drive?.eligibility?.minTenthPercentage || 0),
    minTwelfthPercentage: Number(drive?.eligibility?.minTwelfthPercentage || 0),
    maxActiveBacklogs: Number(drive?.eligibility?.maxActiveBacklogs || 0),
    maxHistoryBacklogs: Number(drive?.eligibility?.maxHistoryBacklogs || 0),
    maxGapYears: Number(drive?.eligibility?.maxGapYears || 0),
    allowedCategories: normalizeArray(drive?.eligibility?.allowedCategories),
    maxExistingOffers: Number(drive?.eligibility?.maxExistingOffers || 0),
    offerCategoryRestriction: drive?.eligibility?.offerCategoryRestriction || '',
  },
  stages: normalizeArray(drive?.stages).map((stage: any) => ({
    ...stage,
    id: toId(stage),
  })),
  requiredDocuments: normalizeArray(drive?.requiredDocuments),
});

export const normalizeDrives = (drives: any[]): PlacementDrive[] => normalizeArray(drives).map(normalizeDrive);

export const normalizeApplication = (application: any): Application => ({
  ...application,
  id: toId(application),
  driveId: toId(application?.driveId),
  studentId: toId(application?.studentId),
  appliedAt: application?.appliedAt || '',
  currentStageId: application?.currentStageId || '',
  status: application?.status || 'applied',
  selectedResumeId: application?.selectedResumeId || '',
  stageHistory: normalizeArray(application?.stageHistory),
});

export const normalizeApplications = (applications: any[]): Application[] =>
  normalizeArray(applications).map(normalizeApplication);

export const normalizeCompany = (company: any): Company => ({
  ...company,
  id: toId(company),
  logo: company?.logo || '',
  website: company?.website || '',
  sector: company?.sector || '',
  activeDrivesCount: Number(company?.activeDrivesCount || 0),
  totalHired: Number(company?.totalHired || 0),
  avgCtc: Number(company?.avgCtc || 0),
  contactPerson: {
    name: company?.contactPerson?.name || '',
    role: company?.contactPerson?.role || '',
    email: company?.contactPerson?.email || '',
    phone: company?.contactPerson?.phone || '',
  },
});

export const normalizeCompanies = (companies: any[]): Company[] => normalizeArray(companies).map(normalizeCompany);

export const normalizeNotification = (notification: any): NotificationItem => ({
  ...notification,
  id: toId(notification),
  timestamp: notification?.timestamp || '',
  read: Boolean(notification?.read),
  type: notification?.type || 'drive',
});

export const normalizeNotifications = (notifications: any[]): NotificationItem[] =>
  normalizeArray(notifications).map(normalizeNotification);

export const resolveEntityId = toId;