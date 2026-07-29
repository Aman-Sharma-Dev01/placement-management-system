import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
  ShieldCheck,
  FileText,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, VerificationStatus } from '../../types';
import { toast } from '../../utils/toast';

export const StudentsDirectory: React.FC = () => {
  const { students, verifyStudentProfile, bulkVerifyStudents, role } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // Drawer Inspection
  const [inspectStudent, setInspectStudent] = useState<Student | null>(null);
  const [remarksModalVisible, setRemarksModalVisible] = useState(false);
  const [actionStatus, setActionStatus] = useState<VerificationStatus>('verified');
  const [remarksInput, setRemarksInput] = useState('');

  // RBAC guard: only placement coordinators and super admins should access this view
  if (role !== 'placement_coordinator' && role !== 'placement_cell' && role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck size={48} className="text-gray-300 mb-4" />
        <h3 className="text-[16px] font-semibold text-gray-700 mb-1">Access restricted</h3>
        <p className="text-[13px] text-gray-500 max-w-sm">
          The Student Verification & Progress view is only accessible to placement coordinators, placement cell, and super admins.
        </p>
      </div>
    );
  }

  // Filtering
  const filteredStudents = students.filter((s) => {
    if (selectedBranch !== 'all' && !s.branch.includes(selectedBranch)) return false;
    if (selectedStatus !== 'all' && s.verificationStatus !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchId = s.supersetId.toLowerCase().includes(q);
      const matchRoll = s.rollNo.toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchRoll && !matchEmail) return false;
    }
    return true;
  });

  const handleBulkApprove = () => {
    if (selectedRowKeys.length === 0) return;
    bulkVerifyStudents(selectedRowKeys, 'verified');
    setSelectedRowKeys([]);
  };

  const handleExportCSV = () => {
    const headers = 'Superset ID,Name,Roll No,Branch,CGPA,Active Backlogs,Verification Status\n';
    const rows = filteredStudents
      .map(
        (s) =>
          `"${s.supersetId}","${s.name}","${s.rollNo}","${s.branch}",${s.education.graduation.cgpa},${s.education.graduation.backlogs.active},"${s.verificationStatus}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Student_Verification_Registry_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    toast.success('Student registry exported to CSV successfully!');
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRowKeys((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedRowKeys.length === filteredStudents.length) {
      setSelectedRowKeys([]);
    } else {
      setSelectedRowKeys(filteredStudents.map((s: any) => s.id || s._id));
    }
  };

  return (
    <div className="space-y-4 text-[13px] text-gray-900">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search student, Roll No, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-[12px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
            />
          </div>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-white border border-gray-300 rounded-md text-[12px] py-1.5 pl-2 pr-6 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 w-48"
          >
            <option value="all">All Branches</option>
            <option value="Computer Science">Computer Science (CSE)</option>
            <option value="Information Technology">Information Tech (IT)</option>
            <option value="AI & Machine Learning">AI & Machine Learning</option>
            <option value="Mechanical">Mechanical</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-gray-300 rounded-md text-[12px] py-1.5 pl-2 pr-6 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 w-36"
          >
            <option value="all">All Verifications</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Queue</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {selectedRowKeys.length > 0 && (role === 'placement_coordinator' || role === 'super_admin') && (
            <button
              onClick={handleBulkApprove}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            >
              <CheckCircle2 size={14} />
              Approve Selected ({selectedRowKeys.length})
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 w-[40px]">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedRowKeys.length === filteredStudents.length}
                    onChange={toggleAllSelection}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Student Details</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Roll No</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Branch / Program</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">CGPA</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Backlogs</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Verification</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student: any) => (
                <tr key={student.id || student._id} className={`hover:bg-gray-50 transition-colors ${selectedRowKeys.includes(student.id || student._id) ? 'bg-emerald-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRowKeys.includes(student.id || student._id)}
                      onChange={() => toggleRowSelection(student.id || student._id)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {student.avatarUrl ? <img src={student.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 leading-tight">{student.name}</div>
                        <div className="text-[11px] text-gray-500">ID: {student.supersetId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-gray-700">{student.rollNo}</td>
                  <td className="px-4 py-3 font-medium text-gray-700">{student.branch}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${
                      student.education.graduation.cgpa >= 8.5 ? 'text-green-700' :
                      student.education.graduation.cgpa >= 7.0 ? 'text-emerald-700' : 'text-gray-900'
                    }`}>
                      {student.education.graduation.cgpa}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-medium ${
                      student.education.graduation.backlogs.active === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {student.education.graduation.backlogs.active} Active
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-medium uppercase ${
                      student.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' :
                      student.verificationStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {student.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setInspectStudent(student)}
                        className="flex items-center gap-1 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-2 py-1 rounded-md text-[11.5px] font-medium transition-colors"
                      >
                        <Eye size={12} /> Inspect
                      </button>
{(role === 'placement_coordinator' || role === 'super_admin') && (
                        student.verificationStatus === 'verified' ? (
                          <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-2 py-1 rounded-md text-[11.5px] font-medium">
                            <CheckCircle2 size={12} /> Verified
                          </span>
                        ) : student.verificationStatus === 'rejected' ? (
                          <button
                            onClick={() => {
                              setInspectStudent(student);
                              setActionStatus('verified');
                              setRemarksModalVisible(true);
                            }}
                            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded-md text-[11.5px] font-medium transition-colors"
                          >
                            <CheckCircle2 size={12} /> Re-verify
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setInspectStudent(student);
                              setActionStatus('verified');
                              setRemarksModalVisible(true);
                            }}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md text-[11.5px] font-medium transition-colors"
                          >
                            <CheckCircle2 size={12} /> Verify
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-[13px]">
              No students found matching your filters.
            </div>
          )}
        </div>
      </div>

      {/* Inspection Drawer */}
      {inspectStudent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setInspectStudent(null)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col border-l border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h2 className="font-semibold text-[15px]">Student Document Verification</h2>
              </div>
              <button onClick={() => setInspectStudent(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">{inspectStudent.name}</h3>
                  <span className="text-[12px] text-gray-500">Superset ID: {inspectStudent.supersetId}</span>
                </div>
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  inspectStudent.verificationStatus === 'verified' ? 'bg-green-100 text-green-700 border border-green-200' :
                  inspectStudent.verificationStatus === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {inspectStudent.verificationStatus}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2">Academic Scores & CGPA:</h4>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg space-y-1.5 text-[12.5px] text-gray-700">
                  <div className="flex justify-between"><span>Graduation CGPA:</span> <strong className="text-gray-900">{inspectStudent.education.graduation.cgpa}</strong></div>
                  <div className="flex justify-between"><span>{inspectStudent.education?.twelfthOrDiploma === 'diploma' ? 'Diploma' : '12th'} Percentage:</span> <strong className="text-gray-900">{(inspectStudent.education as any)[inspectStudent.education?.twelfthOrDiploma === 'diploma' ? 'diploma' : 'twelfth']?.percentage || 0}%</strong></div>
                  <div className="flex justify-between"><span>10th Percentage:</span> <strong className="text-gray-900">{inspectStudent.education.tenth.percentage}%</strong></div>
                  <div className="flex justify-between"><span>Active Backlogs:</span> <strong className="text-gray-900">{inspectStudent.education.graduation.backlogs.active}</strong></div>
                </div>
                {inspectStudent.education.graduation.sgpaPerSemester?.length > 0 && (
                  <div className="mt-2">
                    <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Semester SGPA:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {inspectStudent.education.graduation.sgpaPerSemester.map((sgpa, idx) => (
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
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2">Profile Completeness:</h4>
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-gray-600">Completion</span>
                    <span className="text-[12px] font-bold text-emerald-700">{inspectStudent.profileCompletionPercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-2">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${inspectStudent.profileCompletionPercentage || 0}%` }}></div>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {(() => {
                      const s = inspectStudent;
                      const checklist: { label: string; done: boolean }[] = [
                        { label: 'Full Name', done: !!s.name },
                        { label: 'Email', done: !!s.email },
                        { label: 'Phone Number', done: !!s.phone },
                        { label: 'Avatar / Photo', done: !!s.avatarUrl },
                        { label: 'Roll Number', done: !!s.rollNo },
                        { label: 'Branch', done: !!s.branch },
                        { label: 'Batch Year', done: !!s.batchYear },
                        { label: 'Gender', done: !!s.gender },
                        { label: 'Category', done: !!s.category },
                        { label: '10th Institution', done: !!s.education?.tenth?.institution },
                        { label: '10th Board', done: !!s.education?.tenth?.board },
                        { label: '10th Percentage', done: Number(s.education?.tenth?.percentage || 0) > 0 },
                        { label: `${s.education?.twelfthOrDiploma === 'diploma' ? 'Diploma' : '12th'} Institution`, done: !!(s.education as any)?.[s.education?.twelfthOrDiploma === 'diploma' ? 'diploma' : 'twelfth']?.institution },
                        { label: `${s.education?.twelfthOrDiploma === 'diploma' ? 'Diploma' : '12th'} Board`, done: !!(s.education as any)?.[s.education?.twelfthOrDiploma === 'diploma' ? 'diploma' : 'twelfth']?.board },
                        { label: `${s.education?.twelfthOrDiploma === 'diploma' ? 'Diploma' : '12th'} Percentage`, done: Number((s.education as any)?.[s.education?.twelfthOrDiploma === 'diploma' ? 'diploma' : 'twelfth']?.percentage || 0) > 0 },
                        { label: 'University', done: !!s.education?.graduation?.university },
                        { label: 'Branch / Major', done: !!s.education?.graduation?.branch },
                        { label: 'CGPA', done: Number(s.education?.graduation?.cgpa || 0) > 0 },
                        { label: 'Semester SGPA', done: Array.isArray(s.education?.graduation?.sgpaPerSemester) && s.education.graduation.sgpaPerSemester.length > 0 },
                        { label: 'Skills', done: Array.isArray(s.skills) && s.skills.length > 0 },
                        { label: 'Projects', done: Array.isArray(s.projects) && s.projects.length > 0 },
                        { label: 'Internships', done: Array.isArray(s.internships) && s.internships.length > 0 },
                        { label: 'Certificates', done: Array.isArray(s.certificates) && s.certificates.length > 0 },
                        { label: 'Resume Uploaded', done: Array.isArray(s.resumes) && s.resumes.length > 0 },
                        { label: '10th Marksheet', done: !!s.education?.tenth?.marksheetUrl },
                        { label: `${s.education?.twelfthOrDiploma === 'diploma' ? 'Diploma' : '12th'} Marksheet`, done: !!(s.education as any)?.[s.education?.twelfthOrDiploma === 'diploma' ? 'diploma' : 'twelfth']?.marksheetUrl },
                      ];
                      const pending = checklist.filter(i => !i.done);
                      const completed = checklist.filter(i => i.done);
                      return (
                        <>
                          {pending.length > 0 && (
                            <div className="mb-2">
                              <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wider block mb-1">Pending ({pending.length})</span>
                              {pending.map((item, idx) => (
                                <div key={`p-${idx}`} className="flex items-center gap-1.5 text-[10.5px] text-red-600 py-0.5">
                                  <div className="w-2 h-2 rounded-full border-2 border-red-300 shrink-0"></div>
                                  <span>{item.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {completed.length > 0 && (
                            <div>
                              <span className="text-[10px] font-semibold text-green-500 uppercase tracking-wider block mb-1">Completed ({completed.length})</span>
                              {completed.map((item, idx) => (
                                <div key={`c-${idx}`} className="flex items-center gap-1.5 text-[10.5px] text-gray-500 py-0.5">
                                  <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                                  <span>{item.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2">Uploaded Documents:</h4>
                <div className="space-y-2.5">
                  {/* 12th / Diploma Marksheet */}
                  {(() => {
                    const isDip = inspectStudent.education?.twelfthOrDiploma === 'diploma';
                    const hKey = isDip ? 'diploma' : 'twelfth';
                    const hLabel = isDip ? 'Diploma' : '12th';
                    const hUrl = (inspectStudent.education as any)?.[hKey]?.marksheetUrl;
                    return hUrl ? (
                      <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white shadow-sm">
                        <span className="flex items-center gap-2 font-medium text-gray-700 text-[12.5px]">
                          <FileText size={16} className="text-red-500" /> {hLabel} Marksheet
                        </span>
                        <a href={hUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium text-[11.5px] hover:underline">View PDF</a>
                      </div>
                    ) : (
                      <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-gray-50 shadow-sm text-gray-400 text-[12.5px]">
                        <span>No {hLabel} Marksheet</span>
                      </div>
                    );
                  })()}

                  {/* 10th Marksheet */}
                  {inspectStudent.education?.tenth?.marksheetUrl ? (
                    <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white shadow-sm">
                      <span className="flex items-center gap-2 font-medium text-gray-700 text-[12.5px]">
                        <FileText size={16} className="text-red-500" /> Class 10 Marksheet
                      </span>
                      <a href={inspectStudent.education.tenth.marksheetUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium text-[11.5px] hover:underline">View PDF</a>
                    </div>
                  ) : (
                    <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-gray-50 shadow-sm text-gray-400 text-[12.5px]">
                      <span>No Class 10 Marksheet</span>
                    </div>
                  )}

                  {/* Resumes */}
                  {inspectStudent.resumes?.map((res, idx) => (
                    <div key={idx} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white shadow-sm">
                      <span className="flex items-center gap-2 font-medium text-gray-700 text-[12.5px]">
                        <FileText size={16} className="text-emerald-500" /> {res.name} {res.isPrimary && '(Primary)'}
                      </span>
                      {res.fileUrl ? (
                        <a href={res.fileUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium text-[11.5px] hover:underline">View PDF</a>
                      ) : (
                        <span className="text-gray-400 text-[11.5px]">Missing File</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2">Skills:</h4>
                {inspectStudent.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {inspectStudent.skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white border border-gray-200 text-gray-600 rounded text-[11px] font-medium">{skill}</span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11.5px] text-gray-400 italic">No skills added</div>
                )}
              </div>

              {/* Internships */}
              <div>
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2">Internships & Work Experience:</h4>
                {inspectStudent.internships?.length > 0 ? (
                  <div className="space-y-2">
                    {inspectStudent.internships.map((intern, idx) => (
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
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2">Projects:</h4>
                {inspectStudent.projects?.length > 0 ? (
                  <div className="space-y-2">
                    {inspectStudent.projects.map((proj, idx) => (
                      <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg text-[12px]">
                        <div className="font-semibold text-gray-900">{proj.title}</div>
                        <p className="text-gray-600 mb-1">{proj.description}</p>
                        {proj.link && (
                          <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline block mb-1">View Project</a>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {proj.techStack?.map((tech, i) => (
                            <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{tech}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11.5px] text-gray-400 italic">No projects added</div>
                )}
              </div>

              {/* Certificates */}
              <div>
                <h4 className="font-semibold text-gray-800 text-[12.5px] mb-2">Certificates & Accomplishments:</h4>
                {inspectStudent.certificates?.length > 0 ? (
                  <div className="space-y-2">
                    {inspectStudent.certificates.map((cert, idx) => (
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

{(role === 'placement_coordinator' || role === 'super_admin') && (
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-2">
                {inspectStudent.verificationStatus === 'verified' ? (
                  <>
                    <div className="flex items-center gap-2 justify-center text-green-700 text-[13px] font-medium py-1">
                      <CheckCircle2 size={16} /> This profile is already verified
                    </div>
                    <button
                      onClick={() => { setActionStatus('pending'); setRemarksModalVisible(true); }}
                      className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-md font-medium text-[13px] transition-colors"
                    >
                      Unlock Profile (Set to Pending)
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setActionStatus('verified'); setRemarksModalVisible(true); }}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-medium text-[13px] transition-colors"
                    >
                      <CheckCircle2 size={16} /> Approve Verification
                    </button>
                    <button
                      onClick={() => { setActionStatus('rejected'); setRemarksModalVisible(true); }}
                      className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-md font-medium text-[13px] transition-colors"
                    >
                      <XCircle size={16} /> Send Back for Correction
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remarks Modal */}
      {remarksModalVisible && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRemarksModalVisible(false)}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-[15px]">Verification Remarks</h3>
              <button onClick={() => setRemarksModalVisible(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-3">
              <label className="block text-[12.5px] font-medium text-gray-700">Add remarks for candidate profile:</label>
              <textarea
                rows={3}
                placeholder="e.g. Verified all marksheets against original controller records."
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
              ></textarea>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setRemarksModalVisible(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (inspectStudent) {
                    const idToUse = inspectStudent.id || (inspectStudent as any)._id;
                    verifyStudentProfile(idToUse, actionStatus, remarksInput);
                    setRemarksModalVisible(false);
                    setInspectStudent(null);
                    setRemarksInput('');
                  }
                }}
                className={`px-4 py-2 rounded-md text-[13px] font-medium text-white transition-colors ${
                  actionStatus === 'verified' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Submit Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
