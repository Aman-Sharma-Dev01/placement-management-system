import React, { useEffect, useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Info,
  MapPin,
  X,
  Briefcase,
  Send,
  Download,
  Users,
  Edit,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PlacementDrive } from '../../types';
import { drivesApi } from '../../api/drives.api';
import { toast } from '../../utils/toast';
import { EditDriveModal } from './EditDriveModal';

export const JobProfileView: React.FC = () => {
  const {
    drives,
    activeStudent,
    applyToDrive,
    applications,
    role,
    students,
    refreshData,
    setActiveTab,
  } = useApp();

  const isPlacementOperator = role === 'placement_cell' || role === 'super_admin';
  const showAppliedJobsTab = role === 'student';
  const studentId = activeStudent?.id || (activeStudent as any)?._id || '';

  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTabKey, setActiveTabKey] = useState<'all' | 'applied'>('all');

  const [selectedDriveId, setSelectedDriveId] = useState<string>(drives[0]?.id || '');
  const [selectedDetailTab, setSelectedDetailTab] = useState<string>('description');

  const [applyModalVisible, setApplyModalVisible] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [selectedResumeId, setSelectedResumeId] = useState<string>(
    activeStudent?.resumes?.find((r) => r.isPrimary)?.id || activeStudent?.resumes?.[0]?.id || ''
  );

  useEffect(() => {
    if (!selectedDriveId && drives[0]?.id) {
      setSelectedDriveId(drives[0].id);
    }
  }, [drives, selectedDriveId]);

  useEffect(() => {
    const nextResumeId = activeStudent.resumes?.find((r) => r.isPrimary)?.id || activeStudent.resumes?.[0]?.id || '';
    if (!selectedResumeId && nextResumeId) {
      setSelectedResumeId(nextResumeId);
    }
  }, [activeStudent.resumes, selectedResumeId]);

  useEffect(() => {
    if (!showAppliedJobsTab && activeTabKey !== 'all') {
      setActiveTabKey('all');
    }
  }, [showAppliedJobsTab, activeTabKey]);

  if (!isPlacementOperator && (!activeStudent || !activeStudent.name)) {
    return <div className="p-8 text-center text-gray-500">Loading jobs...</div>;
  }

  const filteredDrives = drives.filter((drive) => {
    if (activeTabKey === 'applied') {
      const isApplied = applications.some(
        (a) => a.driveId === drive.id && a.studentId === studentId
      );
      if (!isApplied) return false;
    }
    if (sectorFilter !== 'all' && drive.sector !== sectorFilter) return false;
    if (typeFilter !== 'all' && drive.positionType !== typeFilter) return false;
    if (statusFilter !== 'all' && drive.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = drive.jobTitle.toLowerCase().includes(q);
      const matchCompany = drive.companyName.toLowerCase().includes(q);
      const matchLoc = drive.location.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany && !matchLoc) return false;
    }
    return true;
  });

  const sortedDrives = [...filteredDrives].sort((a, b) => {
    if (sortBy === 'ctc_high') return b.ctcLpa - a.ctcLpa;
    if (sortBy === 'deadline') return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
    return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
  });

  const selectedDrive = drives.find((d) => d.id === selectedDriveId) || drives[0];

  const clearFilters = () => {
    setSectorFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setSortBy('created_at');
    setSearchQuery('');
  };

  const handleDelete = async () => {
    if (!selectedDrive) return;
    if (!window.confirm(`Are you sure you want to completely delete the drive for ${selectedDrive.companyName}?`)) return;
    setIsDeleting(true);
    try {
      await drivesApi.delete(selectedDrive.id);
      toast.success('Drive deleted successfully');
      await refreshData();
      setSelectedDriveId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete drive');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportData = (type: 'all' | 'shortlisted') => {
    if (!selectedDrive) return;
    const driveApps = applications.filter(a => a.driveId === selectedDrive.id);
    let filteredApps = driveApps;
    if (type === 'shortlisted') {
      filteredApps = driveApps.filter(a => a.status === 'shortlisted' || a.status === 'offered');
    }

    if (filteredApps.length === 0) {
      toast.info('No students found for export criteria.');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Roll No', 'Branch', 'Status'];
    const rows = filteredApps.map(app => {
      const student = students.find(s => s.id === app.studentId);
      if (!student) return null;
      return [student.name, student.email, student.phone, student.rollNo, student.branch, app.status];
    }).filter(r => r !== null);

    const csvContent = [headers.join(','), ...rows.map(e => e!.join(','))].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDrive.companyName}_${type}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManageApplicants = () => {
    if (selectedDrive) {
      localStorage.setItem('activeDriveForTracker', selectedDrive.id);
      setActiveTab('applications');
    }
  };

  const checkStudentEligibility = (drive: PlacementDrive) => {
    if (isPlacementOperator) {
      return {
        eligible: true,
        reasons: [
          {
            title: 'Course & Branch Eligibility',
            satisfied: true,
            details: `Allowed Branches: ${drive.eligibility.allowedBranches.join(', ')}`,
          },
          {
            title: 'Academic CGPA Criteria',
            satisfied: true,
            details: `Required CGPA: >= ${drive.eligibility.minCgpa}`,
          },
          {
            title: 'Backlogs Constraint',
            satisfied: true,
            details: `Allowed Active Backlogs: <= ${drive.eligibility.maxActiveBacklogs}`,
          }
        ]
      };
    }
    if (!drive || !activeStudent?.name) return { eligible: false, reasons: [] };
    const reasons: { title: string; satisfied: boolean; details: string }[] = [];
    const branchMatched = drive.eligibility.allowedBranches.some((b) =>
      b.toLowerCase().includes((activeStudent.branch || '').toLowerCase()) || (activeStudent.branch || '').toLowerCase().includes(b.toLowerCase())
    );
    reasons.push({
      title: 'Course & Branch Eligibility',
      satisfied: branchMatched,
      details: branchMatched
        ? `Eligible for student branch (${activeStudent.branch})`
        : `Drive restricted to: ${drive.eligibility.allowedBranches.join(', ')}`,
    });
    const cgpaMatched = (activeStudent.education?.graduation?.cgpa || 0) >= drive.eligibility.minCgpa;
    reasons.push({
      title: 'Academic CGPA Criteria',
      satisfied: cgpaMatched,
      details: `Your CGPA: ${activeStudent.education?.graduation?.cgpa || 0} (Required: >= ${drive.eligibility.minCgpa})`,
    });
    const backlogsMatched =
      (activeStudent.education?.graduation?.backlogs?.active || 0) <= drive.eligibility.maxActiveBacklogs;
    reasons.push({
      title: 'Backlogs Constraint',
      satisfied: backlogsMatched,
      details: `Active Backlogs: ${activeStudent.education?.graduation?.backlogs?.active || 0} (Allowed: <= ${drive.eligibility.maxActiveBacklogs})`,
    });
    const isVerified = activeStudent.verificationStatus === 'verified';
    reasons.push({
      title: 'Profile Verification Status',
      satisfied: isVerified,
      details: isVerified
        ? 'Profile verified by the placement coordinator'
        : 'Your profile verification is pending.',
    });
    const isFullyEligible = reasons.every((r) => r.satisfied);
    return { eligible: isFullyEligible, reasons };
  };

  const currentEligibility = selectedDrive ? checkStudentEligibility(selectedDrive) : { eligible: false, reasons: [] };
  const existingApplication = applications.find(
    (a) => a.driveId === selectedDrive?.id && a.studentId === studentId
  );

  const handleApplyClick = () => {
    if (existingApplication) return;
    setApplyModalVisible(true);
  };

  const handleConfirmApply = () => {
    if (selectedDrive) {
      applyToDrive(selectedDrive.id, selectedResumeId);
      setApplyModalVisible(false);
    }
  };

  const driveApplications = applications.filter(a => a.driveId === selectedDrive?.id);
  const totalApplied = driveApplications.length;
  const shortlistedCount = driveApplications.filter(a => a.status === 'shortlisted' || a.status === 'offered').length;
  const offeredCount = driveApplications.filter(a => a.status === 'offered').length;

  return (
    <div className="flex flex-col space-y-4 text-[13px]">
      {/* Top Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-gray-500">Job Sector:</span>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-md text-[12px] py-1 pl-2 pr-6 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
          >
            <option value="all">All Sectors</option>
            <option value="SaaS / HRTech">SaaS / HRTech</option>
            <option value="IT Services / Software">IT Services</option>
            <option value="Data Analytics & AI">Analytics & AI</option>
            <option value="Conversational AI">Conversational AI</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-gray-500">Position Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-md text-[12px] py-1 pl-2 pr-6 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="Full Time">Full Time</option>
            <option value="Internship">Internship</option>
            <option value="Internship + PPO">Internship + PPO</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-gray-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-md text-[12px] py-1 pl-2 pr-6 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-gray-300 rounded-md text-[12px] py-1 pl-2 pr-6 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
          >
            <option value="created_at">Created At</option>
            <option value="ctc_high">CTC: High to Low</option>
            <option value="deadline">Nearest Deadline</option>
          </select>
        </div>

        <button
          onClick={clearFilters}
          className="text-[11.5px] text-emerald-600 font-medium hover:underline"
        >
          Clear all filters
        </button>

        <div className="ml-auto w-full sm:w-64 relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by job title or company"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-[12px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Split Screen Main View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-h-[600px]">
        {/* Left Section: Job List */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-lg flex flex-col h-[700px] overflow-hidden shadow-sm">
          {/* Tabs header */}
          <div className="flex px-4 pt-3 border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTabKey('all')}
              className={`pb-2 px-1 mr-6 text-[13px] font-medium border-b-2 transition-colors ${
                activeTabKey === 'all'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Jobs ({drives.length})
            </button>
            {showAppliedJobsTab ? (
              <button
                onClick={() => setActiveTabKey('applied')}
                className={`pb-2 px-1 text-[13px] font-medium border-b-2 transition-colors ${
                  activeTabKey === 'applied'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Applied Jobs ({applications.filter((a) => a.studentId === activeStudent.id).length})
              </button>
            ) : (
              <div className="ml-auto text-[12px] font-medium text-gray-500 py-2">
                Managed drives ({drives.length})
              </div>
            )}
          </div>

          {/* Job List Cards Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredDrives.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileText size={32} className="mb-2 opacity-50" />
                <span className="text-[12px]">No job profiles matched your filters.</span>
              </div>
            ) : (
              filteredDrives.map((drive) => {
                const isSelected = drive.id === selectedDriveId;
                const isApplied = applications.some(
                  (a) => a.driveId === drive.id && a.studentId === activeStudent.id
                );
                const evalElig = checkStudentEligibility(drive);

                return (
                  <div
                    key={drive.id}
                    onClick={() => setSelectedDriveId(drive.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={drive.companyLogo}
                        alt={drive.companyName}
                        className="w-10 h-10 rounded object-cover border border-gray-200 flex-shrink-0 bg-white"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-semibold text-[13px] text-gray-900 truncate block">
                            {drive.jobTitle}
                          </h4>
                          {isPlacementOperator ? (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap">
                              Admin view
                            </span>
                          ) : isApplied ? (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap">
                              Applied
                            </span>
                          ) : !evalElig.eligible ? (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-red-50 text-red-700 whitespace-nowrap">
                              Not eligible
                            </span>
                          ) : drive.status === 'open' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-amber-50 text-amber-700 whitespace-nowrap">
                              Yet to apply
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                              Closed
                            </span>
                          )}
                        </div>

                        <div className="text-[11.5px] text-gray-600 mt-0.5 font-medium truncate">
                          {drive.companyName} <span className="text-gray-300">·</span> {drive.location}
                        </div>

                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Posted {drive.postedDate}
                          </span>
                          <span className="font-semibold text-gray-700">
                            ₹ {drive.ctcLpa} LPA
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Section: Job Details View */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-lg flex flex-col h-[700px] overflow-hidden shadow-sm">
          {selectedDrive ? (
            <div className="flex flex-col h-full">
              {/* Top Detail Header */}
              <div className="p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-gray-200 shrink-0">
                <div className="flex items-start gap-4">
                  <img
                    src={selectedDrive.companyLogo}
                    alt={selectedDrive.companyName}
                    className="w-14 h-14 rounded-lg object-cover border border-gray-200 bg-white"
                  />
                  <div>
                    <h2 className="m-0 text-gray-900 text-[18px] font-semibold leading-tight">
                      {selectedDrive.jobTitle}
                    </h2>
                    <div className="text-[12.5px] text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">{selectedDrive.companyName}</span>
                      <span className="text-gray-300">|</span>
                      <span>{selectedDrive.positionType}</span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1"><MapPin size={12}/>{selectedDrive.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isPlacementOperator && (
                    <>
                      <button 
                        onClick={handleManageApplicants}
                        className="flex items-center gap-1.5 bg-emerald-600 border border-emerald-600 text-white hover:bg-emerald-700 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors shadow-sm"
                      >
                        <Users size={14} /> Manage Applicants
                      </button>
                      
                      <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-md border border-gray-200">
                        <button 
                          onClick={() => exportData('all')}
                          className="flex items-center gap-1.5 bg-white text-gray-700 hover:bg-gray-50 rounded px-2.5 py-1.5 text-[12px] font-medium transition-colors shadow-sm"
                        >
                          <Download size={13} /> Export All
                        </button>
                        <button 
                          onClick={() => exportData('shortlisted')}
                          className="flex items-center gap-1.5 bg-white text-gray-700 hover:bg-gray-50 rounded px-2.5 py-1.5 text-[12px] font-medium transition-colors shadow-sm"
                        >
                          <Download size={13} /> Shortlisted
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 ml-1">
                        <button 
                          onClick={() => setIsEditModalOpen(true)}
                          className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-emerald-600 rounded-md w-8 h-8 transition-colors"
                          title="Edit Job"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 rounded-md w-8 h-8 transition-colors disabled:opacity-50"
                          title="Delete Job"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}

                  {!isPlacementOperator && !existingApplication && (
                    <button className="bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors">
                      Not Interested
                    </button>
                  )}

                  {!isPlacementOperator && existingApplication ? (
                    <button className="flex items-center gap-1.5 bg-green-500 text-white rounded-md px-3 py-1.5 text-[13px] font-medium opacity-90 cursor-default">
                      <CheckCircle2 size={14} />
                      Applied ({existingApplication.status.toUpperCase()})
                    </button>
                  ) : !isPlacementOperator && !currentEligibility.eligible ? (
                    <button className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 rounded-md px-3 py-1.5 text-[13px] font-medium cursor-not-allowed">
                      <XCircle size={14} />
                      Not Eligible
                    </button>
                  ) : !isPlacementOperator ? (
                    <button
                      onClick={handleApplyClick}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors"
                    >
                      <Send size={14} />
                      Apply Now
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Admin KPI Cards */}
                {isPlacementOperator && selectedDrive && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Users size={20} />
                      </div>
                      <div>
                        <div className="text-[20px] font-bold text-gray-900 leading-none mb-1">{totalApplied}</div>
                        <div className="text-[12px] text-gray-500 font-medium">Total Applied</div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <div className="text-[20px] font-bold text-gray-900 leading-none mb-1">{shortlistedCount}</div>
                        <div className="text-[12px] text-gray-500 font-medium">Shortlisted</div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <div className="text-[20px] font-bold text-gray-900 leading-none mb-1">{offeredCount}</div>
                        <div className="text-[12px] text-gray-500 font-medium">Offers Rolled Out</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alert Banners */}
                {selectedDrive?.importantNotice && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
                    <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] text-amber-800">
                      <span>{selectedDrive.importantNotice}</span>
                      {selectedDrive.externalApplyUrl && (
                        <a href={selectedDrive.externalApplyUrl} target="_blank" rel="noreferrer" className="font-semibold text-red-600 hover:underline shrink-0">
                          Go to External Link
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 flex items-start gap-2">
                  <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[12px] text-emerald-800">
                    Job profile is open for campus applications. Application deadline: <strong>{selectedDrive.deadlineDate} 11:59 PM</strong>.
                  </span>
                </div>

                {/* Inner Tabbed Navigation */}
                <div className="flex border-b border-gray-200">
                  {[
                    { key: 'description', label: 'Job Description' },
                    { key: 'workflow', label: 'Hiring Workflow' },
                    { key: 'eligibility', label: 'Eligibility Criteria', icon: !currentEligibility.eligible && <XCircle size={14} className="text-red-500" /> },
                    { key: 'documents', label: 'Required Documents' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedDetailTab(tab.key)}
                      className={`flex items-center gap-1.5 pb-2.5 px-3 mr-2 text-[13px] font-medium border-b-2 transition-colors ${
                        selectedDetailTab === tab.key
                          ? 'border-emerald-600 text-emerald-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label} {tab.icon}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="pt-1 pb-4">
                  {/* Tab 1: Job Description */}
                  {selectedDetailTab === 'description' && (
                    <div className="space-y-6 text-gray-700 text-[13px]">
                      <div>
                        <h5 className="text-[11.5px] font-semibold uppercase text-gray-400 tracking-wider mb-3">Opening Overview</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div>
                            <span className="text-gray-500 text-[11px] block mb-1">Category:</span>
                            <span className="font-medium text-gray-900">Core Companies</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px] block mb-1">Job Function:</span>
                            <span className="font-medium text-gray-900">{selectedDrive.jobFunction}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px] block mb-1">Total CTC Offered:</span>
                            <span className="font-semibold text-emerald-700 text-[14px]">₹ {selectedDrive.ctcLpa} LPA</span>
                          </div>
                        </div>
                      </div>

                      {selectedDrive.compensationDetails && (
                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                          <span className="font-semibold text-gray-900 block mb-1.5">Salary Component Breakdown:</span>
                          <p className="text-gray-700 m-0 leading-relaxed">{selectedDrive.compensationDetails}</p>
                        </div>
                      )}

                      <div>
                        <h5 className="text-[11.5px] font-semibold uppercase text-gray-400 tracking-wider mb-3">About the Role & Responsibilities</h5>
                        <p className="leading-relaxed text-gray-600">{selectedDrive.description}</p>
                      </div>

                      <div>
                        <h5 className="text-[11.5px] font-semibold uppercase text-gray-400 tracking-wider mb-3">Key Skill Requirements</h5>
                        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                          {selectedDrive.requirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Hiring Workflow */}
                  {selectedDetailTab === 'workflow' && (
                    <div className="space-y-4">
                      <h5 className="text-[11.5px] font-semibold uppercase text-gray-400 tracking-wider mb-2">Hiring Process & Evaluation Rounds</h5>
                      {existingApplication?.status === 'offered' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start gap-3 shadow-sm">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <span className="text-xl">🎉</span>
                          </div>
                          <div>
                            <h4 className="text-green-800 font-bold text-[15px] mb-1">Congratulations! You're Selected!</h4>
                            <p className="text-green-700 text-[13px] m-0">You have successfully cleared all rounds and received an offer from <strong>{selectedDrive.companyName}</strong>.</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4 relative">
                        {(() => {
                          const hasOfferStage = selectedDrive.stages.some(s => s.name.toLowerCase().includes('offer'));
                          const displayStages = hasOfferStage 
                            ? selectedDrive.stages 
                            : [...selectedDrive.stages, { 
                                id: 'offer-stage', 
                                name: 'Offer Rollout', 
                                venueOrLink: 'Placement Cell Notification', 
                                isCompleted: existingApplication?.status === 'offered'
                              }];

                          return displayStages.map((stage, idx) => (
                            <div key={stage.id} className="flex gap-4 relative">
                              {idx !== displayStages.length - 1 && (
                                <div className="absolute left-3.5 top-8 bottom-[-16px] w-[2px] bg-gray-100"></div>
                              )}
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-medium text-[12px] z-10 shrink-0 ${
                                stage.isCompleted || (stage.id === 'offer-stage' && existingApplication?.status === 'offered') 
                                  ? 'bg-emerald-600 text-white shadow-md' 
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}>
                                {idx + 1}
                              </div>
                              <div className="pb-2">
                                <h6 className={`font-semibold text-[13.5px] ${stage.isCompleted || (stage.id === 'offer-stage' && existingApplication?.status === 'offered') ? 'text-gray-900' : 'text-gray-600'}`}>{stage.name}</h6>
                                <div className="text-[12px] text-gray-500 mt-1 space-y-1">
                                  <div><strong className="font-medium text-gray-700">Details:</strong> {stage.venueOrLink || 'To be announced'}</div>
                                  {stage.scheduledDate && (
                                    <div><strong className="font-medium text-gray-700">Scheduled:</strong> {stage.scheduledDate}</div>
                                  )}
                                  {stage.notes && <div className="italic text-gray-400">{stage.notes}</div>}
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Eligibility Criteria */}
                  {selectedDetailTab === 'eligibility' && (
                    <div className="space-y-4">
                      <h5 className="text-[11.5px] font-semibold uppercase text-gray-400 tracking-wider mb-1">Drive Eligibility Rules & Evaluation</h5>
                      <div className="space-y-3">
                        {currentEligibility.reasons.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border flex items-start gap-3 ${
                              item.satisfied
                                ? 'bg-green-50 border-green-100'
                                : 'bg-red-50 border-red-100'
                            }`}
                          >
                            {item.satisfied ? (
                              <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0" />
                            ) : (
                              <XCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                            )}
                            <div>
                              <div className={`font-semibold text-[13px] ${item.satisfied ? 'text-green-800' : 'text-red-800'}`}>
                                {item.title}
                              </div>
                              <div className={`text-[12px] mt-0.5 ${item.satisfied ? 'text-green-700/80' : 'text-red-700/80'}`}>
                                {item.details}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200 text-[12px] text-gray-600 space-y-1.5">
                        <div>• <strong className="font-medium text-gray-800">Allowed Student Categories:</strong> General, OBC, SC, ST, EWS</div>
                        <div>• <strong className="font-medium text-gray-800">Max Education Gap:</strong> {selectedDrive.eligibility.maxGapYears} year allowed</div>
                        <div>• <strong className="font-medium text-gray-800">Existing Offers Policy:</strong> Unlimited offers allowed in Core Companies category</div>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Required Documents */}
                  {selectedDetailTab === 'documents' && (
                    <div className="space-y-4">
                      <h5 className="text-[11.5px] font-semibold uppercase text-gray-400 tracking-wider mb-1">Mandatory Documents Required for Application</h5>
                      <div className="space-y-2.5">
                        {selectedDrive.requiredDocuments.map((doc, idx) => (
                          <div key={idx} className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                            <span className="font-medium text-gray-700 flex items-center gap-2 text-[13px]">
                              <FileText size={16} className="text-emerald-500" />
                              {doc}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-green-100 text-green-700 border border-green-200">
                              Verified in Profile
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <Briefcase size={48} className="mb-4 opacity-30" />
              <p className="text-[14px]">Select a job profile from the left list to view details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Confirmation Modal */}
      {isEditModalOpen && selectedDrive && (
        <EditDriveModal 
          drive={selectedDrive} 
          onClose={() => setIsEditModalOpen(false)} 
          onSuccess={() => { setIsEditModalOpen(false); refreshData(); }} 
        />
      )}

      {/* Apply Confirmation Modal */}
      {applyModalVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setApplyModalVisible(false)}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-[15px]">Submit Application for {selectedDrive?.jobTitle}</h3>
              <button onClick={() => setApplyModalVisible(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md flex gap-2">
                <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-[12.5px] text-emerald-800">
                  You are applying to <strong>{selectedDrive?.companyName}</strong> for the position of <strong>{selectedDrive?.jobTitle}</strong>.
                </span>
              </div>

              <div>
                <label className="font-medium text-gray-700 block mb-2 text-[13px]">Select Resume Version:</label>
                <div className="space-y-2">
                  {activeStudent.resumes.map((res) => (
                    <label
                      key={res.id}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        selectedResumeId === res.id ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="resume"
                          value={res.id}
                          checked={selectedResumeId === res.id}
                          onChange={(e) => setSelectedResumeId(e.target.value)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                        />
                        <span className="font-medium text-gray-800 text-[13px]">{res.name}</span>
                        {res.isPrimary && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9.5px] font-medium border border-emerald-200">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500">Uploaded {res.uploadedAt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-600 text-[11.5px] leading-relaxed">
                By applying, you confirm that all your academic CGPA, marksheet, and backlog details in your student profile are accurate and match university official records.
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setApplyModalVisible(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApply}
                className="px-4 py-2 bg-emerald-600 rounded-md text-[13px] font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
