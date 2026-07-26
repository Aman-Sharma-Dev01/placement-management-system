import React from 'react';
import {
  Calendar,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const statusClasses: Record<string, string> = {
  offered: 'bg-green-100 text-green-700',
  shortlisted: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  applied: 'bg-amber-100 text-amber-700',
  under_review: 'bg-amber-100 text-amber-700',
  verified: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  draft: 'bg-blue-100 text-blue-700',
};

export const OverviewDashboard: React.FC = () => {
  const { students, drives, applications, role, setActiveTab, activeStudent } = useApp();

  if (role === 'student') {
    if (!activeStudent || (!activeStudent.id && !activeStudent._id)) {
      return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    }
    
    const studentId = activeStudent.id || activeStudent._id;
    const myApplications = applications.filter((app) => app.studentId === studentId);
    const totalApplied = myApplications.length;
    const shortlisted = myApplications.filter((app) => app.status === 'shortlisted').length;
    const offersReceived = myApplications.filter((app) => app.status === 'offered').length;
    const profileCompletion = activeStudent.profileCompletionPercentage || 0;

    return (
      <div className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Student dashboard</h2>
              <p className="text-[12.5px] text-gray-500 mt-1">Track your profile, applications, and interview progress.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveTab('jobs')} className="bg-blue-600 text-white rounded-md px-3 py-1.5 text-[13px] font-medium hover:bg-blue-700">
                Browse drives
              </button>
              <button onClick={() => setActiveTab('student_profile')} className="bg-white border border-gray-300 text-gray-700 rounded-md px-3 py-1.5 text-[13px] font-medium hover:bg-gray-50">
                Update profile
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Applications submitted</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{totalApplied}</div>
            <div className="mt-3 text-[11.5px] text-gray-500">Under review: {myApplications.length - shortlisted - offersReceived}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Shortlisted</div>
            <div className="mt-1 text-2xl font-semibold text-blue-700">{shortlisted}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Offers received</div>
            <div className="mt-1 text-2xl font-semibold text-green-700">{offersReceived}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Profile completion</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{profileCompletion}%</div>
            <div className="mt-3 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${profileCompletion}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden lg:col-span-2">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-gray-900">Recent applications</h3>
              <button onClick={() => setActiveTab('applications')} className="text-[12px] font-medium text-blue-600 hover:underline">View all ({totalApplied})</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wide">Drive</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wide">Company</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wide">Stage</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myApplications.slice(0, 4).map((app) => {
                    const drive = drives.find((d) => d.id === app.driveId);
                    const stage = drive?.stages.find((s) => s.id === app.currentStageId);
                    if (!drive) return null;
                    return (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-medium">{drive.jobTitle}</td>
                        <td className="px-4 py-3 text-gray-700">{drive.companyName}</td>
                        <td className="px-4 py-3 text-gray-700">{stage?.name || 'Application received'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusClasses[app.status] || 'bg-gray-100 text-gray-700'}`}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Upcoming schedules</h3>
            <div className="space-y-3">
              {myApplications.length > 0 ? myApplications.slice(0, 4).map((app) => {
                const drive = drives.find((d) => d.id === app.driveId);
                return drive ? (
                  <div key={app.id} className="flex gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Calendar size={14} /></div>
                    <div>
                      <div className="font-medium text-gray-900 text-[13px]">{drive.companyName}</div>
                      <div className="text-[11.5px] text-gray-500">{drive.jobTitle}</div>
                    </div>
                  </div>
                ) : null;
              }) : (
                <div className="text-[12.5px] text-gray-500">No upcoming schedules yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'placement_coordinator') {
    const totalStudents = students.length;
    const verifiedStudents = students.filter((student) => student.verificationStatus === 'verified').length;
    const pendingStudents = students.filter((student) => student.verificationStatus === 'pending').length;
    const draftStudents = students.filter((student) => student.verificationStatus === 'draft').length;

    return (
      <div className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Placement coordinator dashboard</h2>
              <p className="text-[12.5px] text-gray-500 mt-1">Verify student profiles, approve corrections, and monitor student progress.</p>
            </div>
            <button onClick={() => setActiveTab('students_directory')} className="bg-blue-600 text-white rounded-md px-3 py-1.5 text-[13px] font-medium hover:bg-blue-700">
              Open verification queue
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5"><div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total students</div><div className="mt-1 text-2xl font-semibold text-gray-900">{totalStudents}</div></div>
          <div className="bg-white border border-gray-200 rounded-lg p-5"><div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Verified profiles</div><div className="mt-1 text-2xl font-semibold text-green-700">{verifiedStudents}</div></div>
          <div className="bg-white border border-gray-200 rounded-lg p-5"><div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Pending review</div><div className="mt-1 text-2xl font-semibold text-amber-700">{pendingStudents}</div></div>
          <div className="bg-white border border-gray-200 rounded-lg p-5"><div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Draft / corrections</div><div className="mt-1 text-2xl font-semibold text-blue-700">{draftStudents}</div></div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-gray-900">Verification queue</h3>
            <button onClick={() => setActiveTab('students_directory')} className="text-[12px] font-medium text-blue-600 hover:underline">Open registry</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wide">Student</th>
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wide">Branch</th>
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wide">CGPA</th>
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.slice(0, 6).map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-[11px] text-gray-500">{student.supersetId}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{student.branch}</td>
                    <td className="px-4 py-3 text-gray-700">{student.education.graduation.cgpa}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusClasses[student.verificationStatus] || 'bg-gray-100 text-gray-700'}`}>
                        {student.verificationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'placement_cell') {
    const totalDrives = drives.length;
    const openDrives = drives.filter((drive) => drive.status === 'open').length;
    const totalApplications = applications.length;
    const totalCompanies = new Set(drives.map((drive) => drive.companyId)).size;

    return (
      <div className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Placement cell operations dashboard</h2>
              <p className="text-[12.5px] text-gray-500 mt-1">Create drives, manage companies, publish schedules, and monitor applicant flow.</p>
            </div>
            <button onClick={() => setActiveTab('drive_create')} className="bg-blue-600 text-white rounded-md px-3 py-1.5 text-[13px] font-medium hover:bg-blue-700">
              Create placement drive
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5"><div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Open drives</div><div className="mt-1 text-2xl font-semibold text-gray-900">{openDrives}</div><div className="text-[12px] text-gray-500 mt-1">of {totalDrives} total</div></div>
          <div className="bg-white border border-gray-200 rounded-lg p-5"><div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Companies managed</div><div className="mt-1 text-2xl font-semibold text-indigo-700">{totalCompanies}</div></div>
          <div className="bg-white border border-gray-200 rounded-lg p-5"><div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Applications received</div><div className="mt-1 text-2xl font-semibold text-blue-700">{totalApplications}</div></div>
          <div className="bg-white border border-gray-200 rounded-lg p-5"><div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Published drives</div><div className="mt-1 text-2xl font-semibold text-green-700">{totalDrives}</div></div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-gray-900">Recent drives</h3>
            <button onClick={() => setActiveTab('jobs')} className="text-[12px] font-medium text-blue-600 hover:underline">Open jobs</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wide">Drive</th>
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wide">Company</th>
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wide">Applicants</th>
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drives.slice(0, 4).map((drive) => (
                  <tr key={drive.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{drive.jobTitle}</div>
                      <div className="text-[11px] text-gray-500">{drive.positionType}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{drive.companyName}</td>
                    <td className="px-4 py-3 text-gray-700">{drive.totalAppliedCount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${drive.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {drive.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'super_admin') {
    const totalUsers = students.length;
    const verifiedUsers = students.filter((student) => student.verificationStatus === 'verified').length;
    const openDrives = drives.filter((drive) => drive.status === 'open').length;
    const totalCompanies = new Set(drives.map((drive) => drive.companyId)).size;

    return (
      <div className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Super admin dashboard</h2>
              <p className="text-[12.5px] text-gray-500 mt-1">Global control over users, verification, drives, and system settings.</p>
            </div>
            <button onClick={() => setActiveTab('settings')} className="bg-blue-600 text-white rounded-md px-3 py-1.5 text-[13px] font-medium hover:bg-blue-700">
              Open system settings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5"><div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total users</div><div className="mt-1 text-2xl font-semibold text-gray-900">{totalUsers}</div></div>
          <div className="bg-white border border-gray-200 rounded-lg p-5"><div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Verified profiles</div><div className="mt-1 text-2xl font-semibold text-green-700">{verifiedUsers}</div></div>
          <div className="bg-white border border-gray-200 rounded-lg p-5"><div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Open drives</div><div className="mt-1 text-2xl font-semibold text-blue-700">{openDrives}</div></div>
          <div className="bg-white border border-gray-200 rounded-lg p-5"><div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Companies</div><div className="mt-1 text-2xl font-semibold text-indigo-700">{totalCompanies}</div></div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Admin shortcuts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => setActiveTab('students_directory')} className="w-full text-left px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 text-[13px] font-medium text-gray-700">Student verification</button>
            <button onClick={() => setActiveTab('drive_create')} className="w-full text-left px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 text-[13px] font-medium text-gray-700">Create drive</button>
            <button onClick={() => setActiveTab('settings')} className="w-full text-left px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 text-[13px] font-medium text-gray-700">System settings</button>
          </div>
        </div>
      </div>
    );
  }

  return <div className="space-y-5" />;
};
