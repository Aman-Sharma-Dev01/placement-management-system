import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  ArrowRight,
  User,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  FileText,
  BookOpen,
  Briefcase,
  Trophy
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Application, ApplicationStatus, Student } from '../../types';
import { toast } from '../../utils/toast';

export const ApplicationsTracker: React.FC = () => {
  const { applications, drives, students, updateApplicationStage, role, activeStudent } = useApp();

  if (role === 'student' && (!activeStudent || (!activeStudent.id && !activeStudent._id))) {
    return <div className="p-8 text-center text-gray-500">Loading applications...</div>;
  }

  const isAdmin = role === 'placement_cell' || role === 'placement_coordinator' || role === 'super_admin';
  const canManageStages = role === 'placement_cell' || role === 'super_admin';

  const [selectedDriveId, setSelectedDriveId] = useState<string>(() => {
    const saved = localStorage.getItem('activeDriveForTracker');
    if (saved) {
      localStorage.removeItem('activeDriveForTracker');
      return saved;
    }
    return 'all';
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedCGPA, setSelectedCGPA] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk selection for advancing stages
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isOfferConfirmed, setIsOfferConfirmed] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);

  // Students can only see their own applications
  const baseApplications = role === 'student'
    ? applications.filter(a => a.studentId === (activeStudent.id || activeStudent._id))
    : applications;

  const filteredApplications = baseApplications.filter((app) => {
    if (selectedDriveId !== 'all' && app.driveId !== selectedDriveId) return false;
    if (selectedStatus !== 'all' && app.status !== selectedStatus) return false;

    const student = students.find((s) => s.id === app.studentId);
    
    if (selectedBranch !== 'all' && student?.branch !== selectedBranch) return false;
    
    if (selectedCGPA !== 'all') {
      const cgpa = student?.education?.graduation?.cgpa || 0;
      if (selectedCGPA === '>9' && cgpa < 9) return false;
      if (selectedCGPA === '>8' && cgpa < 8) return false;
      if (selectedCGPA === '>7' && cgpa < 7) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const drive = drives.find((d) => d.id === app.driveId);
      const matchStudent = student?.name.toLowerCase().includes(q);
      const matchDrive = drive?.jobTitle.toLowerCase().includes(q) || drive?.companyName.toLowerCase().includes(q);
      if (!matchStudent && !matchDrive) return false;
    }
    return true;
  });

  // Helper: get the next stage for an application
  const getNextStage = (app: Application) => {
    const drive = drives.find(d => d.id === app.driveId);
    if (!drive || !drive.stages.length) return null;
    const currentIdx = drive.stages.findIndex(s => s.id === app.currentStageId);
    if (currentIdx < 0 || currentIdx >= drive.stages.length - 1) return null;
    return drive.stages[currentIdx + 1];
  };

  // Compute info about the selected apps for the modal
  const selectedAppsInfo = useMemo(() => {
    if (selectedAppIds.length === 0) return null;
    const apps = filteredApplications.filter(a => selectedAppIds.includes(a.id));
    if (apps.length === 0) return null;

    // All selected apps should ideally be from the same drive for bulk advance
    const driveId = apps[0].driveId;
    const allSameDrive = apps.every(a => a.driveId === driveId);
    const drive = drives.find(d => d.id === driveId);

    // Find the next stage (use first selected app as reference)
    const nextStage = getNextStage(apps[0]);

    // Count unselected apps from the same drive at the same stage that would be auto-rejected
    const sameStageApps = filteredApplications.filter(
      a => a.driveId === driveId && a.currentStageId === apps[0].currentStageId && a.status !== 'rejected' && a.status !== 'offered'
    );
    const unselectedCount = sameStageApps.filter(a => !selectedAppIds.includes(a.id)).length;

    return { apps, drive, nextStage, allSameDrive, unselectedCount, driveId, currentStageId: apps[0].currentStageId };
  }, [selectedAppIds, filteredApplications, drives]);

  const toggleAppSelection = (appId: string) => {
    setSelectedAppIds(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const toggleAllSelection = () => {
    const activeApps = filteredApplications.filter(a => a.status !== 'rejected' && a.status !== 'offered');
    if (selectedAppIds.length === activeApps.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(activeApps.map(a => a.id));
    }
  };

  const handleBulkAdvance = async () => {
    if (!selectedAppsInfo) return;
    const { apps, nextStage, driveId, currentStageId } = selectedAppsInfo;

    if (!nextStage) {
      if (!isOfferConfirmed) {
        toast.error('Please confirm the offer rollout first.');
        return;
      }
      for (const app of apps) {
        await updateApplicationStage(app.id, currentStageId, 'offered', feedbackInput || 'Congratulations! You have been offered a position.');
      }
    } else {
      // Advance selected students to next stage
      for (const app of apps) {
        await updateApplicationStage(app.id, nextStage.id, 'shortlisted', feedbackInput || `Advanced to ${nextStage.name}`);
      }
    }

    // Auto-reject unselected students at the same stage in the same drive
    const unselectedApps = filteredApplications.filter(
      a => a.driveId === driveId && a.currentStageId === currentStageId
        && !selectedAppIds.includes(a.id) && a.status !== 'rejected' && a.status !== 'offered'
    );
    for (const app of unselectedApps) {
      await updateApplicationStage(app.id, currentStageId, 'rejected', 'Not selected for next round');
    }

    if (!nextStage) {
      toast.success(`Offers successfully rolled out to ${apps.length} students. ${unselectedApps.length} students auto-rejected.`);
    } else {
      toast.success(`${apps.length} students advanced to "${nextStage.name}". ${unselectedApps.length} students auto-rejected.`);
    }
    setAdvanceModalVisible(false);
    setSelectedAppIds([]);
    setFeedbackInput('');
    setIsOfferConfirmed(false);
  };

  const handleSingleAdvance = (app: Application) => {
    setSelectedAppIds([app.id]);
    setAdvanceModalVisible(true);
    setIsOfferConfirmed(false);
  };

  const handleExport = () => {
    if (filteredApplications.length === 0) {
      toast.info('No applications to export.');
      return;
    }

    const headers = ['Applicant Name', 'Email', 'Phone', 'Roll No', 'Branch', 'CGPA', 'Company', 'Job Title', 'Status', 'Applied On', 'Resume Link'];
    const rows = filteredApplications.map(app => {
      const student = students.find(s => s.id === app.studentId);
      const drive = drives.find(d => d.id === app.driveId);
      if (!student || !drive) return null;

      const primaryResume = student.resumes?.find(r => r.isPrimary);
      const resumeUrl = primaryResume?.fileUrl || (student.resumes?.[0]?.fileUrl || '');

      return [
        `"${student.name}"`, 
        `"${student.email || ''}"`, 
        `"${student.phone || ''}"`, 
        `"${student.rollNo}"`, 
        `"${student.branch || ''}"`, 
        student.education?.graduation?.cgpa || 0,
        `"${drive.companyName}"`, 
        `"${drive.jobTitle}"`, 
        app.status, 
        `"${app.appliedAt}"`,
        `"${resumeUrl}"`
      ];
    }).filter(r => r !== null);

    const csvContent = [headers.join(','), ...rows.map(e => e!.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `applications_tracker_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 text-[13px] text-gray-900">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full">
          <select
            value={selectedDriveId}
            onChange={(e) => setSelectedDriveId(e.target.value)}
            className="w-full sm:w-48 bg-white border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-[12.5px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
          >
            <option value="all">All Placement Drives</option>
            {drives.map((d) => (
              <option key={d.id} value={d.id}>{d.companyName} - {d.jobTitle}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-32 bg-white border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-[12.5px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="offered">Offered</option>
            <option value="rejected">Rejected</option>
          </select>

          {isAdmin && (
            <>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full sm:w-36 bg-white border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-[12.5px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
              >
                <option value="all">All Branches</option>
                <option value="B.Tech - Computer Science and Engineering">B.Tech - CSE</option>
                <option value="B.Tech - Electronics">B.Tech - Electronics</option>
                <option value="B.Tech - Mechanical">B.Tech - Mechanical</option>
              </select>

              <select
                value={selectedCGPA}
                onChange={(e) => setSelectedCGPA(e.target.value)}
                className="w-full sm:w-28 bg-white border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-[12.5px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
              >
                <option value="all">Any CGPA</option>
                <option value=">9">CGPA &gt; 9.0</option>
                <option value=">8">CGPA &gt; 8.0</option>
                <option value=">7">CGPA &gt; 7.0</option>
              </select>

              <div className="flex-1"></div>

              <div className="relative w-full sm:w-56">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidate or drive"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-[12.5px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between w-full border-t border-gray-100 pt-3">
          <div className="flex items-center gap-3">
            {canManageStages && selectedAppIds.length > 0 && (
              <button
                onClick={() => { setAdvanceModalVisible(true); setIsOfferConfirmed(false); }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              >
                <ArrowRight size={14} />
                Advance Selected ({selectedAppIds.length}) & Reject Others
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-[12.5px] font-semibold text-gray-500 whitespace-nowrap">
              Total Applications: {filteredApplications.length}
            </span>
            {isAdmin && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              >
                <Download size={14} /> Export CSV (with Resumes)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Applications Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {canManageStages && (
                  <th className="px-4 py-3 w-[40px]">
                    <input
                      type="checkbox"
                      checked={filteredApplications.filter(a => a.status !== 'rejected' && a.status !== 'offered').length > 0 && selectedAppIds.length === filteredApplications.filter(a => a.status !== 'rejected' && a.status !== 'offered').length}
                      onChange={toggleAllSelection}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                  </th>
                )}
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Applicant Student</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Company Drive</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Applied On</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Current Stage</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Next Stage</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Status</th>
                {canManageStages && (
                  <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredApplications.map((record) => {
                const student = students.find((s) => s.id === record.studentId);
                const drive = drives.find((d) => d.id === record.driveId);
                const stage = drive?.stages.find((s) => s.id === record.currentStageId);
                const nextStage = getNextStage(record);
                const isTerminal = record.status === 'rejected' || record.status === 'offered';

                return (
                  <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${selectedAppIds.includes(record.id) ? 'bg-emerald-50/50' : ''}`}>
                    {canManageStages && (
                      <td className="px-4 py-3">
                        {!isTerminal ? (
                          <input
                            type="checkbox"
                            checked={selectedAppIds.includes(record.id)}
                            onChange={() => toggleAppSelection(record.id)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                        ) : (
                          <span className="w-4 h-4 block"></span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 overflow-hidden">
                          {student?.avatarUrl ? <img src={student.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={14} />}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 leading-tight flex items-center gap-2">
                            {student?.name || 'Student'}
                            {isAdmin && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedStudentForDetail(student || null); }}
                                className="text-emerald-600 hover:text-emerald-800 text-[10.5px] font-medium underline underline-offset-2"
                              >
                                View Full Profile
                              </button>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500">CGPA: {student?.education?.graduation?.cgpa || '-'} | {student?.branch || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{drive?.jobTitle}</div>
                      <div className="text-[12px] text-gray-500">{drive?.companyName}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-[12.5px]">{record.appliedAt}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold text-[11px] rounded border border-emerald-100 whitespace-nowrap">
                        {stage?.name || 'Application Received'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isTerminal ? (
                        <span className="text-[11px] text-gray-400 font-medium">—</span>
                      ) : nextStage ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold text-[11px] rounded border border-emerald-100 whitespace-nowrap">
                          → {nextStage.name}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 font-semibold text-[11px] rounded border border-green-100 whitespace-nowrap">
                          Final Stage
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider ${
                        record.status === 'offered' ? 'bg-green-100 text-green-700 border border-green-200' :
                        record.status === 'shortlisted' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        record.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    {canManageStages && (
                      <td className="px-4 py-3">
                        {!isTerminal ? (
                          <button
                            onClick={() => handleSingleAdvance(record)}
                            className="flex items-center gap-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-colors whitespace-nowrap"
                          >
                            Advance Stage <ArrowRight size={12} />
                          </button>
                        ) : (
                          <span className="text-[11.5px] text-gray-400 font-medium">{record.status === 'offered' ? '✅ Offer' : '❌ Rejected'}</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredApplications.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-[13px]">
              No applications found matching your criteria.
            </div>
          )}
        </div>
      </div>

      {/* Advance Stage Modal */}
      {advanceModalVisible && selectedAppsInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setAdvanceModalVisible(false); setSelectedAppIds([]); }}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-[15px]">Advance to Next Hiring Stage</h3>
              <button onClick={() => { setAdvanceModalVisible(false); setSelectedAppIds([]); }} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Drive Info */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md text-[12.5px] text-emerald-800">
                <strong>Drive:</strong> {selectedAppsInfo.drive?.companyName} — {selectedAppsInfo.drive?.jobTitle}
              </div>

              {/* Stage transition */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1 text-center">
                  <div className="text-[10px] text-gray-500 uppercase font-medium mb-1">Current Stage</div>
                  <div className="px-2 py-1 bg-emerald-100 text-emerald-700 font-semibold text-[12px] rounded inline-block">
                    {selectedAppsInfo.drive?.stages.find(s => s.id === selectedAppsInfo.currentStageId)?.name || 'Application Received'}
                  </div>
                </div>
                <ArrowRight size={20} className="text-gray-400 shrink-0" />
                <div className="flex-1 text-center">
                  <div className="text-[10px] text-gray-500 uppercase font-medium mb-1">Next Stage</div>
                  {selectedAppsInfo.nextStage ? (
                    <div className="px-2 py-1 bg-green-100 text-green-700 font-semibold text-[12px] rounded inline-block">
                      {selectedAppsInfo.nextStage.name}
                    </div>
                  ) : (
                    <div className="px-2 py-1 bg-green-600 text-white font-semibold text-[12px] rounded inline-block shadow-sm">
                      🎉 Offer Rollout
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[12.5px]">
                  <CheckCircle2 size={14} className="text-green-600" />
                  <span>
                    <strong className="text-green-700">{selectedAppsInfo.apps.length}</strong> students will be 
                    {selectedAppsInfo.nextStage ? ' advanced to the next round' : ' extended a job offer'}
                  </span>
                </div>
                {selectedAppsInfo.unselectedCount > 0 && (
                  <div className="flex items-center gap-2 text-[12.5px]">
                    <XCircle size={14} className="text-red-500" />
                    <span><strong className="text-red-600">{selectedAppsInfo.unselectedCount}</strong> unselected students will be <strong>auto-rejected</strong></span>
                  </div>
                )}
              </div>

              {selectedAppsInfo.unselectedCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-[12px] text-amber-800">
                    All students in this stage who are <strong>not selected</strong> will be automatically marked as <strong>Rejected</strong>. This action cannot be undone.
                  </span>
                </div>
              )}

              {/* Offer Confirmation Checkbox */}
              {!selectedAppsInfo.nextStage && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-md mt-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="offerConfirm"
                    checked={isOfferConfirmed}
                    onChange={(e) => setIsOfferConfirmed(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="offerConfirm" className="text-[12.5px] text-green-800 cursor-pointer select-none">
                    <strong>2-Stage Confirmation:</strong> I confirm that I want to rollout offers to the selected students. This action is final and will notify the students.
                  </label>
                </div>
              )}

              <div>
                <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">
                  {selectedAppsInfo.nextStage ? 'Feedback / Round Notes:' : 'Offer Message / Notes:'}
                </label>
                <textarea
                  rows={2}
                  placeholder={selectedAppsInfo.nextStage ? "e.g. Cleared aptitude test with qualifying marks." : "e.g. Congratulations! We are thrilled to extend an offer for the Software Developer role."}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                ></textarea>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => { setAdvanceModalVisible(false); setSelectedAppIds([]); }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAdvance}
                disabled={!selectedAppsInfo.nextStage && !isOfferConfirmed}
                className={`px-4 py-2 rounded-md text-[13px] font-medium text-white transition-colors ${
                  (!selectedAppsInfo.nextStage && !isOfferConfirmed)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : selectedAppsInfo.nextStage 
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {selectedAppsInfo.nextStage 
                  ? `Confirm & Advance ${selectedAppsInfo.apps.length} Student${selectedAppsInfo.apps.length > 1 ? 's' : ''}`
                  : `Rollout Offer to ${selectedAppsInfo.apps.length} Student${selectedAppsInfo.apps.length > 1 ? 's' : ''}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Drawer */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedStudentForDetail(null)}></div>
          <div className="relative w-full max-w-lg bg-white h-full shadow-xl flex flex-col border-l border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900">
                <Eye size={18} className="text-emerald-600" />
                <h2 className="font-semibold text-[15px]">Student Profile</h2>
              </div>
              <button onClick={() => setSelectedStudentForDetail(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Header Card */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">{selectedStudentForDetail.name}</h3>
                  <span className="text-[12px] text-gray-500">Roll No: {selectedStudentForDetail.rollNo} | ID: {selectedStudentForDetail.supersetId}</span>
                </div>
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  selectedStudentForDetail.verificationStatus === 'verified' ? 'bg-green-100 text-green-700 border border-green-200' :
                  selectedStudentForDetail.verificationStatus === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {selectedStudentForDetail.verificationStatus}
                </span>
              </div>

              {/* Basic Info */}
              <div>
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2 flex items-center gap-1.5"><User size={14} className="text-gray-400" /> Basic Information</h4>
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-[12.5px] space-y-1.5">
                  <div className="flex justify-between"><span className="text-gray-500">Email:</span> <strong className="text-gray-900">{selectedStudentForDetail.email}</strong></div>
                  <div className="flex justify-between"><span className="text-gray-500">Phone:</span> <strong className="text-gray-900">{selectedStudentForDetail.phone || '—'}</strong></div>
                  <div className="flex justify-between"><span className="text-gray-500">Branch:</span> <strong className="text-gray-900">{selectedStudentForDetail.branch}</strong></div>
                  <div className="flex justify-between"><span className="text-gray-500">Gender:</span> <strong className="text-gray-900">{selectedStudentForDetail.gender}</strong></div>
                  <div className="flex justify-between"><span className="text-gray-500">Category:</span> <strong className="text-gray-900">{selectedStudentForDetail.category}</strong></div>
                </div>
              </div>

              {/* Education */}
              <div>
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2 flex items-center gap-1.5"><BookOpen size={14} className="text-gray-400" /> Academic Scores</h4>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg space-y-1.5 text-[12.5px] text-gray-700">
                  <div className="flex justify-between"><span>Graduation CGPA:</span> <strong className="text-gray-900">{selectedStudentForDetail.education.graduation.cgpa}</strong></div>
                  <div className="flex justify-between"><span>{selectedStudentForDetail.education?.twelfthOrDiploma === 'diploma' ? 'Diploma' : '12th'} Percentage:</span> <strong className="text-gray-900">{(selectedStudentForDetail.education as any)[selectedStudentForDetail.education?.twelfthOrDiploma === 'diploma' ? 'diploma' : 'twelfth']?.percentage || 0}%</strong></div>
                  <div className="flex justify-between"><span>10th Percentage:</span> <strong className="text-gray-900">{selectedStudentForDetail.education.tenth.percentage}%</strong></div>
                  <div className="flex justify-between"><span>Active Backlogs:</span> <strong className="text-gray-900">{selectedStudentForDetail.education.graduation.backlogs.active}</strong></div>
                </div>
                {selectedStudentForDetail.education.graduation.sgpaPerSemester?.length > 0 && (
                  <div className="mt-2">
                    <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Semester SGPA:</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {selectedStudentForDetail.education.graduation.sgpaPerSemester.map((sgpa, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded p-1.5 text-center">
                          <span className="text-[9px] text-gray-400 block">Sem {idx + 1}</span>
                          <span className="text-[11px] font-semibold text-gray-900">{sgpa}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Completeness */}
              <div>
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-gray-400" /> Profile Completeness</h4>
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-gray-600">Completion</span>
                    <span className="text-[12px] font-bold text-emerald-700">{selectedStudentForDetail.profileCompletionPercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-2">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${selectedStudentForDetail.profileCompletionPercentage || 0}%` }}></div>
                  </div>
                  <div className="text-[10px] text-gray-400">{26 - Math.round(((selectedStudentForDetail.profileCompletionPercentage || 0) / 100) * 26) || 0} items remaining</div>
                </div>
              </div>

              {/* Marksheets */}
              <div>
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2 flex items-center gap-1.5"><FileText size={14} className="text-gray-400" /> Uploaded Documents</h4>
                <div className="space-y-2">
                  {(() => {
                    const isDip = selectedStudentForDetail.education?.twelfthOrDiploma === 'diploma';
                    const hKey = isDip ? 'diploma' : 'twelfth';
                    const hLabel = isDip ? 'Diploma' : '12th';
                    const hUrl = (selectedStudentForDetail.education as any)?.[hKey]?.marksheetUrl;
                    if (hUrl) {
                      return (
                        <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white shadow-sm">
                          <span className="flex items-center gap-2 font-medium text-gray-700 text-[12.5px]">
                            <FileText size={14} className="text-red-500" /> {hLabel} Marksheet
                          </span>
                          <a href={hUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium text-[11.5px] hover:underline">View PDF</a>
                        </div>
                      );
                    }
                    return (
                      <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-gray-50 text-gray-400 text-[12.5px]">
                        <span>No {hLabel} Marksheet</span>
                      </div>
                    );
                  })()}

                  {selectedStudentForDetail.education?.tenth?.marksheetUrl ? (
                    <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white shadow-sm">
                      <span className="flex items-center gap-2 font-medium text-gray-700 text-[12.5px]">
                        <FileText size={14} className="text-red-500" /> Class 10 Marksheet
                      </span>
                      <a href={selectedStudentForDetail.education.tenth.marksheetUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium text-[11.5px] hover:underline">View PDF</a>
                    </div>
                  ) : (
                    <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-gray-50 text-gray-400 text-[12.5px]">
                      <span>No Class 10 Marksheet</span>
                    </div>
                  )}

                  {selectedStudentForDetail.resumes?.map((res, idx) => (
                    <div key={idx} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white shadow-sm">
                      <span className="flex items-center gap-2 font-medium text-gray-700 text-[12.5px]">
                        <FileText size={14} className="text-emerald-500" /> {res.name} {res.isPrimary && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">Primary</span>}
                      </span>
                      {res.fileUrl ? (
                        <a href={res.fileUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium text-[11.5px] hover:underline">View / Download</a>
                      ) : (
                        <span className="text-gray-400 text-[11.5px]">N/A</span>
                      )}
                    </div>
                  ))}
                  {(!selectedStudentForDetail.resumes || selectedStudentForDetail.resumes.length === 0) && (
                    <div className="p-3 border border-dashed border-gray-200 rounded-lg text-center text-gray-400 text-[12.5px]">No resumes uploaded</div>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-gray-400" /> Skills</h4>
                {selectedStudentForDetail.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudentForDetail.skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white border border-gray-200 text-gray-600 rounded text-[11px] font-medium">{skill}</span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11.5px] text-gray-400 italic">No skills added</div>
                )}
              </div>

              {/* Internships */}
              <div>
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2 flex items-center gap-1.5"><Briefcase size={14} className="text-gray-400" /> Internships & Work Experience</h4>
                {selectedStudentForDetail.internships?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStudentForDetail.internships.map((intern, idx) => (
                      <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg text-[12px]">
                        <div className="font-semibold text-gray-900">{intern.role} at {intern.company}</div>
                        <div className="text-gray-500 mb-1">{intern.duration}</div>
                        <p className="text-gray-600 mb-1">{intern.description}</p>
                        {(intern as any).certificateUrl && (
                          <a href={(intern as any).certificateUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline">View Certificate</a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11.5px] text-gray-400 italic">No internships added</div>
                )}
              </div>

              {/* Projects */}
              <div>
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2 flex items-center gap-1.5"><Trophy size={14} className="text-gray-400" /> Projects</h4>
                {selectedStudentForDetail.projects?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStudentForDetail.projects.map((proj, idx) => (
                      <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg text-[12px]">
                        <div className="font-semibold text-gray-900">{proj.title}</div>
                        <p className="text-gray-600 mb-1">{proj.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {proj.techStack?.map((tech, i) => (
                            <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{tech}</span>
                          ))}
                        </div>
                        {proj.link && (
                          <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline block mt-1">View Project</a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11.5px] text-gray-400 italic">No projects added</div>
                )}
              </div>

              {/* Certificates */}
              <div>
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2 flex items-center gap-1.5"><Trophy size={14} className="text-gray-400" /> Certificates & Accomplishments</h4>
                {selectedStudentForDetail.certificates?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStudentForDetail.certificates.map((cert, idx) => (
                      <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg text-[12px]">
                        <div className="font-semibold text-gray-900">{cert.title}</div>
                        <div className="text-gray-500 mb-1">Issued by: {cert.issuer} | {cert.issueDate}</div>
                        {cert.credentialUrl && (
                          <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline">View Credential</a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11.5px] text-gray-400 italic">No certificates added</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
