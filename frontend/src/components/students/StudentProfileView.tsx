import React, { useState } from 'react';
import {
  User,
  BookOpen,
  Clock,
  CheckCircle2,
  FileText,
  Upload,
  Edit2,
  Download,
  Plus,
  AlertCircle,
  Briefcase,
  Trophy,
  X,
  Loader2,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { uploadApi } from '../../api/upload.api';
import { toast } from '../../utils/toast';

export const StudentProfileView: React.FC = () => {
  const { activeStudent, updateStudentData, role, verifyStudentProfile } = useApp();

  const [activeSection, setActiveSection] = useState<string>('education');
  const [editBasicModalVisible, setEditBasicModalVisible] = useState(false);
  const [addProjectModalVisible, setAddProjectModalVisible] = useState(false);
  const [editEducationModalVisible, setEditEducationModalVisible] = useState(false);
  const [editSkillsModalVisible, setEditSkillsModalVisible] = useState(false);
  const [addInternshipModalVisible, setAddInternshipModalVisible] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isUploading10th, setIsUploading10th] = useState(false);
  const [isUploading12th, setIsUploading12th] = useState(false);
  const [addCertificateModalVisible, setAddCertificateModalVisible] = useState(false);
  
  // Edit indices for arrays (-1 means adding new)
  const [editProjectIndex, setEditProjectIndex] = useState<number>(-1);
  const [editInternshipIndex, setEditInternshipIndex] = useState<number>(-1);
  const [editCertificateIndex, setEditCertificateIndex] = useState<number>(-1);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const tenthInputRef = React.useRef<HTMLInputElement>(null);
  const twelfthInputRef = React.useRef<HTMLInputElement>(null);

  // Early return if data is not yet loaded
  if (!activeStudent || !activeStudent.name) {
    return <div className="p-8 text-center text-gray-500">Loading student profile...</div>;
  }

  // Form states for basic edit
  const [basicForm, setBasicForm] = useState({
    name: activeStudent.name,
    phone: activeStudent.phone,
    email: activeStudent.email,
  });

  // Form states for new project
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    techStack: '',
    link: '',
  });

  const [educationForm, setEducationForm] = useState({
    graduation: {
      university: activeStudent?.education?.graduation?.university || '',
      degree: activeStudent?.education?.graduation?.degree || '',
      branch: activeStudent?.education?.graduation?.branch || '',
      cgpa: activeStudent?.education?.graduation?.cgpa || 0,
      passingYear: activeStudent?.education?.graduation?.passingYear || 0,
      backlogs: {
        active: activeStudent?.education?.graduation?.backlogs?.active || 0,
      }
    },
    twelfth: {
      institution: activeStudent?.education?.twelfth?.institution || '',
      board: activeStudent?.education?.twelfth?.board || '',
      percentage: activeStudent?.education?.twelfth?.percentage || 0,
    },
    tenth: {
      institution: activeStudent?.education?.tenth?.institution || '',
      board: activeStudent?.education?.tenth?.board || '',
      percentage: activeStudent?.education?.tenth?.percentage || 0,
    }
  });

  const [skillsForm, setSkillsForm] = useState(activeStudent?.skills?.join(', ') || '');

  const [internshipForm, setInternshipForm] = useState({
    company: '',
    role: '',
    duration: '',
    description: '',
    certificateUrl: ''
  });

  const [certificateForm, setCertificateForm] = useState({
    title: '',
    issuer: '',
    issueDate: '',
    credentialUrl: ''
  });

  const handleUpdateBasicDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...activeStudent,
      name: basicForm.name,
      phone: basicForm.phone,
      email: basicForm.email,
    };
    updateStudentData(updated);
    setEditBasicModalVisible(false);
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedProjects = [...activeStudent.projects];
    
    if (editProjectIndex !== -1) {
      // Editing
      updatedProjects[editProjectIndex] = {
        ...updatedProjects[editProjectIndex],
        title: projectForm.title,
        description: projectForm.description,
        techStack: projectForm.techStack.split(',').map((s: string) => s.trim()),
        link: projectForm.link,
      };
    } else {
      // Adding
      const newProj = {
        id: `proj-${Date.now()}`,
        title: projectForm.title,
        description: projectForm.description,
        techStack: projectForm.techStack.split(',').map((s: string) => s.trim()),
        link: projectForm.link,
      };
      updatedProjects.push(newProj);
    }
    
    const updated = {
      ...activeStudent,
      projects: updatedProjects,
    };
    updateStudentData(updated);
    setAddProjectModalVisible(false);
    setEditProjectIndex(-1);
    setProjectForm({ title: '', description: '', techStack: '', link: '' });
  };

  const handleDeleteProject = (index: number) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    const updatedProjects = activeStudent.projects.filter((_: any, i: number) => i !== index);
    updateStudentData({ ...activeStudent, projects: updatedProjects });
  };

  const handleUpdateEducation = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...activeStudent,
      education: {
        ...activeStudent.education,
        graduation: { ...activeStudent.education.graduation, ...educationForm.graduation },
        twelfth: { ...activeStudent.education.twelfth, ...educationForm.twelfth },
        tenth: { ...activeStudent.education.tenth, ...educationForm.tenth },
      }
    };
    updateStudentData(updated);
    setEditEducationModalVisible(false);
  };

  const handleUpdateSkills = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = skillsForm.split(',').map(s => s.trim()).filter(s => s);
    const updated = {
      ...activeStudent,
      skills: skillsArray
    };
    updateStudentData(updated);
    setEditSkillsModalVisible(false);
  };

  const handleAddInternship = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedInternships = [...(activeStudent.internships || [])];
    
    if (editInternshipIndex !== -1) {
      updatedInternships[editInternshipIndex] = { ...updatedInternships[editInternshipIndex], ...internshipForm };
    } else {
      updatedInternships.push(internshipForm);
    }

    const updated = {
      ...activeStudent,
      internships: updatedInternships
    };
    updateStudentData(updated);
    setAddInternshipModalVisible(false);
    setEditInternshipIndex(-1);
    setInternshipForm({ company: '', role: '', duration: '', description: '', certificateUrl: '' });
  };

  const handleDeleteInternship = (index: number) => {
    if (!window.confirm("Are you sure you want to delete this internship?")) return;
    const updatedInternships = activeStudent.internships.filter((_: any, i: number) => i !== index);
    updateStudentData({ ...activeStudent, internships: updatedInternships });
  };

  const handleAddCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedCertificates = [...(activeStudent.certificates || [])];
    
    if (editCertificateIndex !== -1) {
      updatedCertificates[editCertificateIndex] = { ...updatedCertificates[editCertificateIndex], ...certificateForm };
    } else {
      updatedCertificates.push(certificateForm);
    }

    const updated = {
      ...activeStudent,
      certificates: updatedCertificates
    };
    updateStudentData(updated);
    setAddCertificateModalVisible(false);
    setEditCertificateIndex(-1);
    setCertificateForm({ title: '', issuer: '', issueDate: '', credentialUrl: '' });
  };

  const handleDeleteCertificate = (index: number) => {
    if (!window.confirm("Are you sure you want to delete this certificate?")) return;
    const updatedCertificates = activeStudent.certificates.filter((_: any, i: number) => i !== index);
    updateStudentData({ ...activeStudent, certificates: updatedCertificates });
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingResume(true);
      const res = await uploadApi.resume(file);
      
      const newResume = {
        id: res.publicId || `res-${Date.now()}`,
        name: res.originalName,
        isPrimary: activeStudent.resumes.length === 0,
        uploadedAt: new Date().toLocaleDateString('en-GB'),
        fileUrl: res.url
      };

      const updated = {
        ...activeStudent,
        resumes: [...activeStudent.resumes, newResume]
      };
      
      await updateStudentData(updated);
    } catch (error) {
      toast.error('Failed to upload resume');
    } finally {
      setIsUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleMarksheetUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'tenth' | 'twelfth') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (type === 'tenth') setIsUploading10th(true);
      if (type === 'twelfth') setIsUploading12th(true);
      
      const res = await uploadApi.marksheet(file);
      
      const updated = {
        ...activeStudent,
        education: {
          ...activeStudent.education,
          [type]: {
            ...activeStudent.education[type],
            marksheetUrl: res.url
          }
        }
      };
      
      await updateStudentData(updated);
    } catch (error) {
      toast.error(`Failed to upload ${type} marksheet`);
    } finally {
      if (type === 'tenth') {
        setIsUploading10th(false);
        if (tenthInputRef.current) tenthInputRef.current.value = '';
      }
      if (type === 'twelfth') {
        setIsUploading12th(false);
        if (twelfthInputRef.current) twelfthInputRef.current.value = '';
      }
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    try {
      const updated = {
        ...activeStudent,
        resumes: activeStudent.resumes.filter((r) => r.id !== resumeId && r._id !== resumeId)
      };
      await updateStudentData(updated);
    } catch (error) {
      toast.error('Failed to delete resume');
    }
  };

  const menuItems = [
    { id: 'basic', label: 'Basic Details', icon: <User size={16} /> },
    { id: 'education', label: 'Education Details', icon: <BookOpen size={16} /> },
    { id: 'internship', label: 'Internship & Work Ex', icon: <Clock size={16} /> },
    { id: 'skills', label: 'Skills & Languages', icon: <CheckCircle2 size={16} /> },
    { id: 'projects', label: 'Projects', icon: <Briefcase size={16} /> },
    { id: 'accomplishments', label: 'Accomplishments', icon: <Trophy size={16} /> },
    { id: 'resumes', label: 'Resumes & Documents', icon: <FileText size={16} /> },
  ];

  return (
    <div className="flex flex-col space-y-4 text-[13px] text-gray-900">
      {/* Verification Status Header Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold border-2 border-white shadow-sm shrink-0 overflow-hidden">
            {activeStudent.avatarUrl ? (
              <img src={activeStudent.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              activeStudent.name.charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="m-0 text-gray-900 text-[16px] font-semibold leading-tight">
                {activeStudent.name}
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium tracking-wide ${
                activeStudent.verificationStatus === 'verified'
                  ? 'bg-green-100 text-green-700'
                  : activeStudent.verificationStatus === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {activeStudent.verificationStatus === 'verified'
                  ? 'VERIFIED PROFILE'
                  : activeStudent.verificationStatus === 'pending'
                  ? 'SUBMITTED FOR VERIFICATION'
                  : 'VERIFICATION REJECTED'}
              </span>
            </div>
            <div className="text-[12px] text-gray-500 font-medium">
              Superset ID: <strong className="text-gray-800">{activeStudent.supersetId}</strong> | Roll No:{' '}
              <strong className="text-gray-800">{activeStudent.rollNo}</strong> | Branch:{' '}
              <strong className="text-gray-800">{activeStudent.branch}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {(role === 'placement_coordinator' || role === 'super_admin') ? (
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const idToUse = activeStudent.id || (activeStudent as any)._id;
                  verifyStudentProfile(idToUse, 'verified', 'Approved by the placement coordinator')
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-medium text-[12px] transition-colors"
              >
                <CheckCircle2 size={16} /> Approve
              </button>
              <button 
                onClick={() => {
                  const idToUse = activeStudent.id || (activeStudent as any)._id;
                  verifyStudentProfile(idToUse, 'rejected', 'Missing 5th Sem Marksheet')
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-md font-medium text-[12px] transition-colors"
              >
                <XCircle size={16} /> Send Back
              </button>
              <button 
                onClick={() => {
                  const idToUse = activeStudent.id || (activeStudent as any)._id;
                  verifyStudentProfile(idToUse, 'draft', 'Profile unlocked for corrections')
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-md font-medium text-[12px] transition-colors"
              >
                <AlertCircle size={16} /> Unlock
              </button>
            </div>
          ) : activeStudent.verificationStatus === 'verified' ? (
            <div className="text-[12px] text-gray-500 font-medium bg-gray-50 border border-gray-200 px-3 py-2 rounded-md">
              Profile locked after verification. Request a correction from the placement coordinator.
            </div>
          ) : (
            <button
              onClick={() => setEditBasicModalVisible(true)}
              className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-md font-medium text-[12px] transition-colors"
            >
              <Edit2 size={14} />
              Edit Basic Details
            </button>
          )}
        </div>
      </div>

      {activeStudent.coordinatorRemarks && (
        <div className={`border rounded-md p-3 flex items-start gap-2 ${
          activeStudent.verificationStatus === 'verified' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <AlertCircle size={16} className={`shrink-0 mt-0.5 ${
            activeStudent.verificationStatus === 'verified' ? 'text-green-600' : 'text-amber-600'
          }`} />
          <span className={`text-[12px] ${
            activeStudent.verificationStatus === 'verified' ? 'text-green-800' : 'text-amber-800'
          }`}>
            <strong>Placement coordinator remarks:</strong> {activeStudent.coordinatorRemarks}
          </span>
        </div>
      )}

      {/* Main Profile Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Sub-Navigation Menu */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-lg p-3">
          <div className="p-4 bg-blue-50/50 rounded-lg mb-3 border border-blue-100">
            <div className="flex items-center justify-between text-[12px] mb-2">
              <span className="font-semibold text-gray-700">Profile Completion</span>
              <span className="font-bold text-blue-700">{activeStudent.profileCompletionPercentage}%</span>
            </div>
            <div className="w-full bg-blue-200/50 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${activeStudent.profileCompletionPercentage}%` }}></div>
            </div>
          </div>

          <div className="flex flex-col space-y-0.5">
            {menuItems.map((nav) => (
              <button
                key={nav.id}
                onClick={() => setActiveSection(nav.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-[13px] font-medium flex items-center gap-2.5 transition-colors ${
                  activeSection === nav.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={activeSection === nav.id ? 'text-white' : 'text-gray-400'}>{nav.icon}</span>
                <span>{nav.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Section Details */}
        <div className="lg:col-span-9 bg-white border border-gray-200 rounded-lg p-5 space-y-6">
          {/* Section: Basic Details */}
          {(activeSection === 'basic' || activeSection === 'all') && (
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
                  Basic Personal & Contact Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <span className="text-gray-500 block text-[11px] mb-1">Full Name:</span>
                  <span className="font-medium text-gray-900 text-[13px]">{activeStudent.name}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <span className="text-gray-500 block text-[11px] mb-1">University Email:</span>
                  <span className="font-medium text-gray-900 text-[13px]">{activeStudent.email}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <span className="text-gray-500 block text-[11px] mb-1">Mobile Phone:</span>
                  <span className="font-medium text-gray-900 text-[13px]">{activeStudent.phone}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <span className="text-gray-500 block text-[11px] mb-1">Roll No / Registration:</span>
                  <span className="font-medium text-gray-900 text-[13px]">{activeStudent.rollNo}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <span className="text-gray-500 block text-[11px] mb-1">Gender:</span>
                  <span className="font-medium text-gray-900 text-[13px]">{activeStudent.gender}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <span className="text-gray-500 block text-[11px] mb-1">Category:</span>
                  <span className="font-medium text-gray-900 text-[13px]">{activeStudent.category}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Education Details */}
          {(activeSection === 'education' || activeSection === 'all') && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
                  Academic Credentials & Semester Results
                </h3>
                <button
                  onClick={() => setEditEducationModalVisible(true)}
                  className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors"
                >
                  <Edit2 size={14} /> Edit Education
                </button>
              </div>

              {/* Graduation Details */}
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900 text-[14px]">
                      {activeStudent.education.graduation.degree} in {activeStudent.education.graduation.branch}
                    </span>
                    <div className="text-[12px] text-gray-500 mt-0.5">
                      {activeStudent.education.graduation.university} (Batch {activeStudent.education.graduation.passingYear})
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-gray-500 block">Overall CGPA</span>
                    <span className="text-[20px] font-bold text-blue-700">
                      {activeStudent.education.graduation.cgpa} <span className="text-[14px] text-gray-400 font-medium">/ 10.0</span>
                    </span>
                  </div>
                </div>

                <div className="h-[1px] bg-gray-200 w-full my-1"></div>

                {/* SGPA breakdown */}
                <div>
                  <span className="text-[11px] font-semibold text-gray-600 block mb-2">Semester-wise SGPA Breakdown:</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {activeStudent.education.graduation.sgpaPerSemester.map((sgpa, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-md border border-gray-200 text-center shadow-sm">
                        <span className="text-[10px] text-gray-400 block font-medium">Sem {idx + 1}</span>
                        <span className="font-semibold text-[13px] text-gray-900">{sgpa}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Backlogs */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="bg-white px-3 py-1.5 rounded-md border border-gray-200 text-[12px] font-medium text-gray-600 shadow-sm">
                    Active Backlogs: <strong className="text-red-600 ml-1">{activeStudent.education.graduation.backlogs?.active || 0}</strong>
                  </span>
                </div>
              </div>

              {/* 10th & 12th Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 12th Standard */}
                <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-[13px] text-gray-900">12th Standard (Higher Secondary)</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-medium text-[11px] rounded border border-blue-100">
                      {activeStudent.education.twelfth.percentage}%
                    </span>
                  </div>
                  <div className="text-[12px] text-gray-600 space-y-1">
                    <div><strong className="font-medium text-gray-700">Institution:</strong> {activeStudent.education.twelfth.institution}</div>
                    <div><strong className="font-medium text-gray-700">Board:</strong> {activeStudent.education.twelfth.board} ({activeStudent.education.twelfth.passingYear})</div>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    {activeStudent.education.twelfth.marksheetUrl ? (
                      <a href={activeStudent.education.twelfth.marksheetUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 font-medium text-[12px] hover:underline mt-1">
                        <Download size={14} /> Class 12 Marksheet
                      </a>
                    ) : (
                      <span className="text-gray-400 text-[11px]">No marksheet uploaded</span>
                    )}
                    
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" ref={twelfthInputRef} onChange={(e) => handleMarksheetUpload(e, 'twelfth')} />
                    <button 
                      disabled={isUploading12th}
                      onClick={() => twelfthInputRef.current?.click()}
                      className="flex items-center gap-1 bg-white border border-gray-300 px-2 py-1 rounded text-[10.5px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isUploading12th ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} 
                      {isUploading12th ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>

                {/* 10th Standard */}
                <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-[13px] text-gray-900">10th Standard (Secondary)</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-medium text-[11px] rounded border border-blue-100">
                      {activeStudent.education.tenth.percentage}%
                    </span>
                  </div>
                  <div className="text-[12px] text-gray-600 space-y-1">
                    <div><strong className="font-medium text-gray-700">Institution:</strong> {activeStudent.education.tenth.institution}</div>
                    <div><strong className="font-medium text-gray-700">Board:</strong> {activeStudent.education.tenth.board} ({activeStudent.education.tenth.passingYear})</div>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    {activeStudent.education.tenth.marksheetUrl ? (
                      <a href={activeStudent.education.tenth.marksheetUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 font-medium text-[12px] hover:underline mt-1">
                        <Download size={14} /> Class 10 Marksheet
                      </a>
                    ) : (
                      <span className="text-gray-400 text-[11px]">No marksheet uploaded</span>
                    )}
                    
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" ref={tenthInputRef} onChange={(e) => handleMarksheetUpload(e, 'tenth')} />
                    <button 
                      disabled={isUploading10th}
                      onClick={() => tenthInputRef.current?.click()}
                      className="flex items-center gap-1 bg-white border border-gray-300 px-2 py-1 rounded text-[10.5px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isUploading10th ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} 
                      {isUploading10th ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Education Gap Section */}
              {activeStudent.education.graduation.gapYears > 0 && (
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[13px] text-amber-900">
                    <AlertCircle size={16} className="text-amber-600" />
                    <span>Education Gap: {activeStudent.education.graduation.gapYears} Year Gap</span>
                  </div>
                  <div className="text-[12px] text-amber-800 ml-6">
                    <strong className="font-medium">Gap Between:</strong> 12th Standard and B.Tech Admission
                  </div>
                  <div className="text-[12px] text-amber-800 ml-6">
                    <strong className="font-medium">Reason for Gap:</strong> {activeStudent.education.graduation.gapReason}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Projects */}
          {(activeSection === 'projects' || activeSection === 'all') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
                  Technical Projects
                </h3>
                <button
                  onClick={() => {
                    setEditProjectIndex(-1);
                    setProjectForm({ title: '', description: '', techStack: '', link: '' });
                    setAddProjectModalVisible(true);
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors"
                >
                  <Plus size={14} /> Add Project
                </button>
              </div>

              <div className="space-y-3">
                {activeStudent.projects.map((proj, i) => (
                  <div key={proj.id || i} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 text-[14px] block mb-1">{proj.title}</span>
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noreferrer" className="text-blue-600 font-medium text-[12px] hover:underline">
                            View Code / Live Link
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => {
                            setEditProjectIndex(i);
                            setProjectForm({
                              title: proj.title,
                              description: proj.description,
                              techStack: proj.techStack.join(', '),
                              link: proj.link || ''
                            });
                            setAddProjectModalVisible(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(i)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-[12.5px] m-0 leading-relaxed">{proj.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {proj.techStack.map((tech, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded text-[10.5px] font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Resumes */}
          {(activeSection === 'resumes' || activeSection === 'all') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
                  Resumes & Documents Repository
                </h3>
                <div>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleResumeUpload}
                  />
                  <button 
                    disabled={isUploadingResume}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors"
                  >
                    {isUploadingResume ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {isUploadingResume ? 'Uploading...' : 'Upload New Resume'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {activeStudent.resumes.map((res) => (
                  <div
                    key={res.id}
                    className="p-3.5 border border-gray-200 rounded-lg flex items-center justify-between bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-[13px] flex items-center gap-2 mb-0.5">
                          {res.name}
                          {res.isPrimary && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9.5px] font-medium border border-blue-100">Primary Version</span>}
                        </div>
                        <span className="text-[11px] text-gray-500">Uploaded on {res.uploadedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {res.fileUrl ? (
                        <a 
                          href={res.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-[12px] bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-md transition-colors"
                        >
                          <Download size={14} /> Download
                        </a>
                      ) : (
                        <button className="flex items-center gap-1.5 text-gray-400 font-medium text-[12px] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md cursor-not-allowed">
                          <Download size={14} /> Missing file
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleDeleteResume(res.id || res._id)}
                        className="flex items-center justify-center text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 px-2 py-1.5 rounded-md transition-colors"
                        title="Delete Resume"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Skills */}
          {(activeSection === 'skills' || activeSection === 'all') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
                  Technical Skills & Competencies
                </h3>
                <button
                  onClick={() => setEditSkillsModalVisible(true)}
                  className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors"
                >
                  <Edit2 size={14} /> Edit Skills
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeStudent.skills.map((skill, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-md text-[12px] font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section: Internships */}
          {(activeSection === 'internship' || activeSection === 'all') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
                  Internships & Work Experience
                </h3>
                <button
                  onClick={() => {
                    setEditInternshipIndex(-1);
                    setInternshipForm({ company: '', role: '', duration: '', description: '', certificateUrl: '' });
                    setAddInternshipModalVisible(true);
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors"
                >
                  <Plus size={14} /> Add Internship
                </button>
              </div>

              <div className="space-y-3">
                {activeStudent.internships?.length > 0 ? activeStudent.internships.map((intern, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-gray-900 text-[14px]">{intern.role} at {intern.company}</span>
                        <div className="text-gray-500 text-[12px] font-medium">{intern.duration}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => {
                            setEditInternshipIndex(i);
                            setInternshipForm({
                              company: intern.company,
                              role: intern.role,
                              duration: intern.duration,
                              description: intern.description,
                              certificateUrl: intern.certificateUrl || ''
                            });
                            setAddInternshipModalVisible(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteInternship(i)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-[12.5px] m-0 leading-relaxed">{intern.description}</p>
                    {intern.certificateUrl && (
                      <div className="pt-1">
                        <a href={intern.certificateUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 font-medium text-[12px] hover:underline">
                          <Download size={14} /> Download Certificate
                        </a>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="p-4 text-center text-gray-500 text-[13px] border border-dashed border-gray-300 rounded-lg">
                    No internships added yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Accomplishments */}
          {(activeSection === 'accomplishments' || activeSection === 'all') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
                  Accomplishments & Certificates
                </h3>
                <button
                  onClick={() => {
                    setEditCertificateIndex(-1);
                    setCertificateForm({ title: '', issuer: '', issueDate: '', credentialUrl: '' });
                    setAddCertificateModalVisible(true);
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors"
                >
                  <Plus size={14} /> Add Certificate
                </button>
              </div>

              <div className="space-y-3">
                {activeStudent.certificates?.length > 0 ? activeStudent.certificates.map((cert, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-start gap-4 relative pr-16">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                      <Trophy size={20} />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-gray-900 text-[14px]">{cert.title}</span>
                        <span className="text-gray-500 text-[12px] font-medium">{cert.issueDate}</span>
                      </div>
                      <div className="text-[12.5px] text-gray-600">
                        Issued by: <strong className="font-medium text-gray-800">{cert.issuer}</strong>
                      </div>
                      {cert.credentialUrl && (
                        <div className="pt-1">
                          <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 font-medium text-[12px] hover:underline">
                            View Credential
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-4 right-4 flex items-center gap-1">
                      <button 
                        onClick={() => {
                          setEditCertificateIndex(i);
                          setCertificateForm({
                            title: cert.title,
                            issuer: cert.issuer,
                            issueDate: cert.issueDate,
                            credentialUrl: cert.credentialUrl || ''
                          });
                          setAddCertificateModalVisible(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCertificate(i)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="p-4 text-center text-gray-500 text-[13px] border border-dashed border-gray-300 rounded-lg">
                    No certificates or accomplishments added yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Basic Details Modal */}
      {editBasicModalVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditBasicModalVisible(false)}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-[15px]">Edit Profile Information</h3>
              <button onClick={() => setEditBasicModalVisible(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateBasicDetails}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={basicForm.name}
                    onChange={(e) => setBasicForm({...basicForm, name: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    required
                    type="text"
                    value={basicForm.phone}
                    onChange={(e) => setBasicForm({...basicForm, phone: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">University Email</label>
                  <input
                    required
                    type="email"
                    value={basicForm.email}
                    onChange={(e) => setBasicForm({...basicForm, email: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setEditBasicModalVisible(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 rounded-md text-[13px] font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {addProjectModalVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddProjectModalVisible(false)}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-[15px]">{editProjectIndex !== -1 ? 'Edit Project' : 'Add Technical Project'}</h3>
              <button onClick={() => setAddProjectModalVisible(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleAddProject}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Project Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Campus Placement ERP"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Project Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Brief description of features built"
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Tech Stack (comma separated)</label>
                  <input
                    required
                    type="text"
                    placeholder="React, TypeScript, Tailwind"
                    value={projectForm.techStack}
                    onChange={(e) => setProjectForm({...projectForm, techStack: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">GitHub / Live Link (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://github.com/..."
                    value={projectForm.link}
                    onChange={(e) => setProjectForm({...projectForm, link: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setAddProjectModalVisible(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 rounded-md text-[13px] font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  {editProjectIndex !== -1 ? 'Save Changes' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Education Modal */}
      {editEducationModalVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditEducationModalVisible(false)}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-900 text-[15px]">Edit Education Details</h3>
              <button onClick={() => setEditEducationModalVisible(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateEducation} className="overflow-y-auto flex-1">
              <div className="p-5 space-y-6">
                
                {/* Graduation */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 text-[13px] border-b pb-1">Graduation (B.Tech)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-1">University</label>
                      <input type="text" value={educationForm.graduation.university} onChange={(e) => setEducationForm({...educationForm, graduation: {...educationForm.graduation, university: e.target.value}})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-1">Branch</label>
                      <input type="text" value={educationForm.graduation.branch} onChange={(e) => setEducationForm({...educationForm, graduation: {...educationForm.graduation, branch: e.target.value}})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-1">CGPA (Out of 10)</label>
                      <input type="number" step="0.01" value={educationForm.graduation.cgpa} onChange={(e) => setEducationForm({...educationForm, graduation: {...educationForm.graduation, cgpa: parseFloat(e.target.value)}})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-1">Passing Year</label>
                      <input type="number" value={educationForm.graduation.passingYear} onChange={(e) => setEducationForm({...educationForm, graduation: {...educationForm.graduation, passingYear: parseInt(e.target.value)}})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-1">Active Backlogs</label>
                      <input type="number" value={educationForm.graduation.backlogs.active} onChange={(e) => setEducationForm({...educationForm, graduation: {...educationForm.graduation, backlogs: { active: parseInt(e.target.value) }}})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                    </div>
                  </div>
                </div>

                {/* 12th */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 text-[13px] border-b pb-1">12th Standard</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[12px] font-medium text-gray-700 mb-1">Institution</label>
                      <input type="text" value={educationForm.twelfth.institution} onChange={(e) => setEducationForm({...educationForm, twelfth: {...educationForm.twelfth, institution: e.target.value}})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-1">Board</label>
                      <input type="text" value={educationForm.twelfth.board} onChange={(e) => setEducationForm({...educationForm, twelfth: {...educationForm.twelfth, board: e.target.value}})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-1">Percentage (%)</label>
                      <input type="number" step="0.01" value={educationForm.twelfth.percentage} onChange={(e) => setEducationForm({...educationForm, twelfth: {...educationForm.twelfth, percentage: parseFloat(e.target.value)}})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                    </div>
                  </div>
                </div>

                {/* 10th */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 text-[13px] border-b pb-1">10th Standard</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[12px] font-medium text-gray-700 mb-1">Institution</label>
                      <input type="text" value={educationForm.tenth.institution} onChange={(e) => setEducationForm({...educationForm, tenth: {...educationForm.tenth, institution: e.target.value}})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-1">Board</label>
                      <input type="text" value={educationForm.tenth.board} onChange={(e) => setEducationForm({...educationForm, tenth: {...educationForm.tenth, board: e.target.value}})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-1">Percentage (%)</label>
                      <input type="number" step="0.01" value={educationForm.tenth.percentage} onChange={(e) => setEducationForm({...educationForm, tenth: {...educationForm.tenth, percentage: parseFloat(e.target.value)}})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                    </div>
                  </div>
                </div>

              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg shrink-0">
                <button type="button" onClick={() => setEditEducationModalVisible(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md text-[13px] font-medium text-white hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Skills Modal */}
      {editSkillsModalVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditSkillsModalVisible(false)}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-[15px]">Edit Skills</h3>
              <button onClick={() => setEditSkillsModalVisible(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSkills}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Technical Skills (comma separated)</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="e.g. React, Python, Node.js"
                    value={skillsForm}
                    onChange={(e) => setSkillsForm(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  ></textarea>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
                <button type="button" onClick={() => setEditSkillsModalVisible(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md text-[13px] font-medium text-white hover:bg-blue-700">Save Skills</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Internship Modal */}
      {addInternshipModalVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddInternshipModalVisible(false)}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-[15px]">{editInternshipIndex !== -1 ? 'Edit Internship' : 'Add Internship'}</h3>
              <button onClick={() => setAddInternshipModalVisible(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleAddInternship}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Company Name</label>
                  <input required type="text" value={internshipForm.company} onChange={(e) => setInternshipForm({...internshipForm, company: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Role / Position</label>
                  <input required type="text" value={internshipForm.role} onChange={(e) => setInternshipForm({...internshipForm, role: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Duration (e.g. June 2023 - Aug 2023)</label>
                  <input required type="text" value={internshipForm.duration} onChange={(e) => setInternshipForm({...internshipForm, duration: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Description</label>
                  <textarea required rows={3} value={internshipForm.description} onChange={(e) => setInternshipForm({...internshipForm, description: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]"></textarea>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Certificate URL (Optional)</label>
                  <input type="text" placeholder="https://drive.google.com/..." value={internshipForm.certificateUrl} onChange={(e) => setInternshipForm({...internshipForm, certificateUrl: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                  <p className="text-[10px] text-gray-500 mt-1">Upload to Drive and paste link, or use direct file URL</p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
                <button type="button" onClick={() => setAddInternshipModalVisible(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md text-[13px] font-medium text-white hover:bg-blue-700">
                  {editInternshipIndex !== -1 ? 'Save Changes' : 'Add Internship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Certificate Modal */}
      {addCertificateModalVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddCertificateModalVisible(false)}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-[15px]">{editCertificateIndex !== -1 ? 'Edit Certificate' : 'Add Certificate'}</h3>
              <button onClick={() => setAddCertificateModalVisible(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleAddCertificate}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Certificate Title</label>
                  <input required type="text" value={certificateForm.title} onChange={(e) => setCertificateForm({...certificateForm, title: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Issuer (e.g. Coursera, AWS)</label>
                  <input required type="text" value={certificateForm.issuer} onChange={(e) => setCertificateForm({...certificateForm, issuer: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Issue Date (e.g. Aug 2023)</label>
                  <input required type="text" value={certificateForm.issueDate} onChange={(e) => setCertificateForm({...certificateForm, issueDate: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Credential URL (Optional)</label>
                  <input type="text" value={certificateForm.credentialUrl} onChange={(e) => setCertificateForm({...certificateForm, credentialUrl: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px]" />
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
                <button type="button" onClick={() => setAddCertificateModalVisible(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md text-[13px] font-medium text-white hover:bg-blue-700">
                  {editCertificateIndex !== -1 ? 'Save Changes' : 'Add Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
