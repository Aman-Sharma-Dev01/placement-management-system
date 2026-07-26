export type UserRole = 'student' | 'placement_coordinator' | 'placement_cell' | 'super_admin';

export type VerificationStatus = 'verified' | 'pending' | 'rejected' | 'draft';

export type JobStatus = 'open' | 'closed' | 'upcoming' | 'draft';

export type ApplicationStatus = 'applied' | 'under_review' | 'shortlisted' | 'offered' | 'rejected' | 'withdrawn';

export interface Student {
  id: string;
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
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  
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
    twelfth: {
      institution: string;
      board: string;
      percentage: number;
      passingYear: number;
      marksheetUrl?: string;
    };
    graduation: {
      university: string;
      degree: string;
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
  externalApplyUrl?: string;
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

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'drive' | 'verification' | 'interview' | 'offer';
  targetRole?: UserRole;
  linkDriveId?: string;
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
