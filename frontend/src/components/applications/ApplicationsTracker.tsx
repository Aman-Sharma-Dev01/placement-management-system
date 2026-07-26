import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  User,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Application, ApplicationStatus } from '../../types';

export const ApplicationsTracker: React.FC = () => {
  const { applications, drives, students, updateApplicationStage, role, activeStudent } = useApp();

  if (role === 'student' && (!activeStudent || (!activeStudent.id && !activeStudent._id))) {
    return <div className="p-8 text-center text-gray-500">Loading applications...</div>;
  }

  const [selectedDriveId, setSelectedDriveId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Move stage modal
  const [advanceApp, setAdvanceApp] = useState<Application | null>(null);
  const [targetStageId, setTargetStageId] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus>('shortlisted');
  const [feedbackInput, setFeedbackInput] = useState('');

  // Students can only see their own applications
  const baseApplications = role === 'student'
    ? applications.filter(a => a.studentId === (activeStudent.id || activeStudent._id))
    : applications;

  const filteredApplications = baseApplications.filter((app) => {
    if (selectedDriveId !== 'all' && app.driveId !== selectedDriveId) return false;
    if (selectedStatus !== 'all' && app.status !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const student = students.find((s) => s.id === app.studentId);
      const drive = drives.find((d) => d.id === app.driveId);
      const matchStudent = student?.name.toLowerCase().includes(q);
      const matchDrive = drive?.jobTitle.toLowerCase().includes(q) || drive?.companyName.toLowerCase().includes(q);
      if (!matchStudent && !matchDrive) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 text-[13px] text-gray-900">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedDriveId}
            onChange={(e) => setSelectedDriveId(e.target.value)}
            className="w-full sm:w-56 bg-white border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-[12.5px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          >
            <option value="all">All Placement Drives</option>
            {drives.map((d) => (
              <option key={d.id} value={d.id}>{d.companyName} - {d.jobTitle}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-36 bg-white border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-[12.5px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="offered">Offered</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Search visible for admin roles */}
          {(role === 'placement_coordinator' || role === 'placement_cell' || role === 'super_admin') && (
            <div className="relative w-full sm:w-48">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidate or drive"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-[12.5px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>
          )}
        </div>

        <div className="text-[12.5px] font-semibold text-gray-500 whitespace-nowrap">
          Total Applications: {filteredApplications.length}
        </div>
      </div>

      {/* Main Applications Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Applicant Student</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Company Drive</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Applied On</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Current Stage</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Status</th>
                {(role === 'placement_cell' || role === 'super_admin') && (
                  <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredApplications.map((record) => {
                const student = students.find((s) => s.id === record.studentId);
                const drive = drives.find((d) => d.id === record.driveId);
                const stage = drive?.stages.find((s) => s.id === record.currentStageId);

                return (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 overflow-hidden">
                          {student?.avatarUrl ? <img src={student.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={14} />}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 leading-tight">{student?.name || 'Student'}</div>
                          <div className="text-[11px] text-gray-500">CGPA: {student?.education.graduation.cgpa} | {student?.branch}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{drive?.jobTitle}</div>
                      <div className="text-[12px] text-gray-500">{drive?.companyName}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-[12.5px]">{record.appliedAt}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold text-[11px] rounded border border-blue-100 whitespace-nowrap">
                        {stage?.name || 'Application Received'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider ${
                        record.status === 'offered' ? 'bg-green-100 text-green-700 border border-green-200' :
                        record.status === 'shortlisted' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        record.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(role === 'placement_cell' || role === 'super_admin') ? (
                        <button
                          onClick={() => {
                            setAdvanceApp(record);
                            setTargetStageId(drive?.stages[1]?.id || record.currentStageId);
                          }}
                          className="flex items-center gap-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-colors whitespace-nowrap"
                        >
                          Advance Stage <ArrowRight size={12} />
                        </button>
                      ) : (
                        <span className="text-[11.5px] text-gray-400 font-medium">Read only</span>
                      )}
                    </td>
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
      {advanceApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAdvanceApp(null)}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-[15px]">Advance Candidate Stage</h3>
              <button onClick={() => setAdvanceApp(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">Target Status:</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as ApplicationStatus)}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                >
                  <option value="shortlisted">Shortlisted for Next Round</option>
                  <option value="offered">Offer Released</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">Feedback / Round Notes:</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Performed exceptionally well in coding round."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                ></textarea>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setAdvanceApp(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (advanceApp) {
                    updateApplicationStage(advanceApp.id, targetStageId, targetStatus, feedbackInput);
                    setAdvanceApp(null);
                    setFeedbackInput('');
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[13px] font-medium transition-colors"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
