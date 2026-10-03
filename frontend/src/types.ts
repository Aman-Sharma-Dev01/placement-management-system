export type UserRole = 'student' | 'placement_coordinator' | 'placement_cell' | 'super_admin';

export type VerificationStatus = 'verified' | 'pending' | 'rejected' | 'draft';

export type JobStatus = 'open' | 'closed' | 'upcoming' | 'draft';

export type ApplicationStatus = 'applied' | 'under_review' | 'shortlisted' | 'offered' | 'rejected' | 'withdrawn';

export interface Blog {
  id: string;
  _id?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  relatedDriveId?: string;
  targetAudience: 'all' | 'students';
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  _id?: string;
  supersetId: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  rollNo: string;
  branch: string;
  department: string;
  batchYear: number;
  gender: 'Male' | 'Female' | 'Other';
  
  // Verification
  verificationStatus: VerificationStatus;
  coordinatorRemarks?: string;
  profileCompletionPercentage: number;
  
  // Education
  education: {
    tenth: {
      institution: string;
      board: string;
      percentage: number;
      passingYear: number;
      marksheetUrl?: string;
    };
    twelfthOrDiploma: 'twelfth' | 'diploma';
    twelfth: {
      institution: string;
      board: string;
      percentage: number;
      passingYear: number;
      marksheetUrl?: string;
    };
    diploma: {
      institution: string;
      board: string;
      percentage: number;
      passingYear: number;
      marksheetUrl?: string;
    };
    graduation: {
      university: string;
      branch: string;
      cgpa: number;
      sgpaPerSemester: number[];
      passingYear: number;
      backlogs: {
        active: number;
        history: number;
      };
      gapYears: number;
      gapReason?: string;
    };
  };

  // Skills & Extras
  skills: string[];
  projects: {
    id: string;
    title: string;
    description: string;
    techStack: string[];
    link?: string;
  }[];
  internships: {
    id: string;
    company: string;
    role: string;
    duration: string;
    description: string;
    certificateUrl?: string;
  }[];
  certificates: {
    id: string;
    title: string;
    issuer: string;
    issueDate: string;
    credentialUrl?: string;
  }[];
  resumes: {
    id: string;
    name: string;
    isPrimary: boolean;
    uploadedAt: string;
    fileUrl: string;
  }[];
  appliedDriveIds: string[];
  offers: {
    companyName: string;
    role: string;
    ctc: number; // in LPA
    offerDate: string;
    status: 'accepted' | 'pending' | 'declined';
  }[];
}

export interface HiringStage {
  id: string;
  name: string;
  type: 'pre_placement_talk' | 'online_test' | 'resume_shortlist' | 'group_discussion' | 'technical_interview' | 'hr_interview';
  scheduledDate?: string;
  venueOrLink?: string;
  isCompleted: boolean;
  notes?: string;
}

export interface EligibilityRules {
  allowedBranches: string[];
  minCgpa: number;
  minTenthPercentage: number;
  minTwelfthPercentage: number;
  maxActiveBacklogs: number;
  maxHistoryBacklogs: number;
  maxGapYears: number;
  allowedCategories: string[];
  maxExistingOffers: number;
  offerCategoryRestriction?: string;
}

export interface CompanyDocument {
  id: string;
  name: string;
  description?: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface PlacementDrive {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  companyWebsite: string;
  sector: string;
  jobTitle: string;
  positionType: 'Full Time' | 'Internship' | 'Internship + PPO' | 'Contractual';
  jobFunction: string;
  location: string;
  workMode: 'Onsite' | 'Remote' | 'Hybrid';
  ctcLpa: number;
  stipendMonthly?: number;
  description: string;
  requirements: string[];
  probationPeriodMonths?: number;
  compensationDetails?: string;
  
  status: JobStatus;
  postedDate: string;
  deadlineDate: string;
  
  eligibility: EligibilityRules;
  stages: HiringStage[];
  requiredDocuments: string[];
  companyDocuments?: CompanyDocument[];
  externalApplyUrl?: string;
  thirdPartyLinks?: { label: string; url: string }[];
  importantNotice?: string;
  
  totalEligibleStudentsCount: number;
  totalAppliedCount: number;
  shortlistedCount: number;
  selectedCount: number;
}

export interface Application {
  id: string;
  driveId: string;
  studentId: string;
  appliedAt: string;
  currentStageId: string;
  status: ApplicationStatus;
  selectedResumeId: string;
  stageHistory: {
    stageId: string;
    stageName: string;
    updatedAt: string;
    status: 'passed' | 'failed' | 'pending';
    feedback?: string;
  }[];
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  website: string;
  sector: string;
  tier: 'Super Dream (>12 LPA)' | 'Dream (6-12 LPA)' | 'Core' | 'Mass Recruiter';
  mouStatus: 'Active MoU' | 'Under Renewal' | 'New Partner';
  activeDrivesCount: number;
  totalHired: number;
  avgCtc: number;
  contactPerson: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
}

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'drive' | 'verification' | 'interview' | 'offer' | 'application' | 'account' | 'system';
  targetRole?: UserRole;
  linkDriveId?: string;
  /** Drives how prominently the item is rendered in the bell drawer. */
  priority: NotificationPriority;
  /** Generic deep-link target, e.g. { entityType: 'drive', entityId }. */
  entityType?: string;
  entityId?: string;
  /** Email delivery state, useful for debugging from the UI. */
  emailSent?: boolean;
  emailError?: string;
}

/** Shape returned by GET /api/notifications. */
export interface NotificationFeed {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface NotificationPreferences {
  emailNotificationsEnabled: boolean;
  mutedCategories: Array<'jobs' | 'applications' | 'interviews' | 'profile'>;
}

export interface FilterState {
  searchQuery: string;
  sector: string;
  positionType: string;
  status: string;
  branch: string;
  verificationStatus: string;
  sortBy: 'latest' | 'ctc_high' | 'deadline' | 'name';
}
