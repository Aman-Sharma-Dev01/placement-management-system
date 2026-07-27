import React, { useState } from 'react';
import {
  Building2,
  Briefcase,
  ShieldCheck,
  ListTodo,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PlacementDrive, HiringStage } from '../../types';

export const DriveCreationWizard: React.FC = () => {
  const { createPlacementDrive, setActiveTab, role } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  if (role !== 'placement_cell' && role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck size={48} className="text-gray-300 mb-4" />
        <h3 className="text-[16px] font-semibold text-gray-700 mb-1">Access restricted</h3>
        <p className="text-[13px] text-gray-500 max-w-sm">
          Drive creation and publishing is reserved for the placement cell and super admin.
        </p>
      </div>
    );
  }

  // Form State
  const [formValues, setFormValues] = useState({
    companyName: 'Acme Software Labs',
    sector: 'SaaS / HRTech',
    companyWebsite: 'https://acmesoftware.com',
    companyLogo: '',
    jobTitle: 'Software Development Engineer - 1',
    positionType: 'Full Time',
    jobFunction: 'Software Engineering',
    location: 'Gurgaon / Remote',
    workMode: 'Hybrid',
    ctcLpa: '12.0',
    probationPeriodMonths: '6',
    compensationDetails: 'Base Pay: 10.5 LPA | Performance Bonus: 1.5 LPA',
    description: 'Acme Software Labs is seeking energetic SDE-1 engineers to scale real-time collaboration engines and cloud infrastructure.',
    requirements: 'Proficiency in Java, Python or TypeScript\nStrong understanding of Data Structures & Algorithms\nDatabase basics (PostgreSQL / Redis)',
    externalApplyUrl: '',
    deadlineDate: '2026-08-15',
    minCgpa: '7.0',
    minTenthPercentage: '65',
    minTwelfthPercentage: '65',
    maxActiveBacklogs: '0',
    maxHistoryBacklogs: '1',
    maxGapYears: '1',
  });

  const [allowedBranches, setAllowedBranches] = useState<string[]>([
    'B.Tech - Computer Science and Engineering',
    'B.Tech - Information Technology',
    'B.Tech - AI & Machine Learning',
    'MCA',
  ]);

  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([
    'Updated Resume (PDF format)',
    '10th & 12th Marksheet',
    'Graduation Semester Marksheets',
    'College ID Card',
  ]);

  const [stages, setStages] = useState<HiringStage[]>([
    {
      id: 'stg-1',
      name: 'Pre-Placement Talk',
      type: 'pre_placement_talk',
      venueOrLink: 'Campus Auditorium',
      isCompleted: false,
    },
    {
      id: 'stg-2',
      name: 'Online Aptitude & Coding Test',
      type: 'online_test',
      venueOrLink: 'Computer Lab 3 & 4',
      isCompleted: false,
    },
    {
      id: 'stg-3',
      name: 'Technical Interview',
      type: 'technical_interview',
      venueOrLink: 'Virtual Google Meet',
      isCompleted: false,
    },
  ]);

  const [newStageName, setNewStageName] = useState('');
  const [newStageType, setNewStageType] = useState<HiringStage['type']>('technical_interview');

  const addStage = () => {
    if (!newStageName.trim()) return;
    setStages([
      ...stages,
      {
        id: `stg-${Date.now()}`,
        name: newStageName,
        type: newStageType,
        isCompleted: false,
      },
    ]);
    setNewStageName('');
  };

  const removeStage = (id: string) => {
    setStages(stages.filter((s) => s.id !== id));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final Publish
      const newDrive: Omit<PlacementDrive, 'id' | 'totalAppliedCount' | 'shortlistedCount' | 'selectedCount'> = {
        companyId: `comp-${Date.now()}`,
        companyName: formValues.companyName,
        companyLogo: formValues.companyLogo || 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=120&auto=format&fit=crop&q=80',
        companyWebsite: formValues.companyWebsite || 'https://example.com',
        sector: formValues.sector,
        jobTitle: formValues.jobTitle,
        positionType: formValues.positionType,
        jobFunction: formValues.jobFunction || 'Engineering',
        location: formValues.location,
        workMode: formValues.workMode,
        ctcLpa: parseFloat(formValues.ctcLpa) || 0,
        description: formValues.description,
        requirements: formValues.requirements ? formValues.requirements.split('\n').filter(Boolean) : ['Strong problem solving skills'],
        probationPeriodMonths: parseInt(formValues.probationPeriodMonths) || 6,
        compensationDetails: formValues.compensationDetails,
        status: 'open',
        postedDate: new Date().toISOString().substring(0, 10),
        deadlineDate: formValues.deadlineDate || '2026-08-15',
        eligibility: {
          allowedBranches: allowedBranches,
          minCgpa: parseFloat(formValues.minCgpa) || 6.5,
          minTenthPercentage: parseFloat(formValues.minTenthPercentage) || 60,
          minTwelfthPercentage: parseFloat(formValues.minTwelfthPercentage) || 60,
          maxActiveBacklogs: parseInt(formValues.maxActiveBacklogs) || 0,
          maxHistoryBacklogs: parseInt(formValues.maxHistoryBacklogs) || 0,
          maxGapYears: parseInt(formValues.maxGapYears) || 0,
          allowedCategories: ['General', 'OBC', 'SC', 'ST', 'EWS'],
          maxExistingOffers: 1,
        },
        stages: stages,
        requiredDocuments: requiredDocuments,
        externalApplyUrl: formValues.externalApplyUrl,
        totalEligibleStudentsCount: 350,
      };

      createPlacementDrive(newDrive);
      setActiveTab('jobs');
    }
  };

  const steps = [
    { title: 'Company', icon: <Building2 size={16} /> },
    { title: 'Job Profile', icon: <Briefcase size={16} /> },
    { title: 'Eligibility', icon: <ShieldCheck size={16} /> },
    { title: 'Workflow', icon: <ListTodo size={16} /> },
    { title: 'Documents', icon: <FileText size={16} /> },
    { title: 'Publish', icon: <CheckCircle2 size={16} /> },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const toggleBranch = (branch: string) => {
    setAllowedBranches(prev => 
      prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
    );
  };

  const toggleDocument = (doc: string) => {
    setRequiredDocuments(prev => 
      prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2 text-[13px] text-gray-900">
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div>
          <h2 className="m-0 text-[18px] text-gray-900 font-semibold leading-tight">
            Create New Placement Drive
          </h2>
          <p className="text-[12.5px] text-gray-500 mt-1">
            Multi-step campus hiring drive creation wizard for universities
          </p>
        </div>
        <button
          onClick={() => setActiveTab('jobs')}
          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-md font-medium transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Steps Header */}
      <div className="flex flex-wrap items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 z-0"></div>
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <div key={idx} className="relative z-10 flex flex-col items-center group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                isActive ? 'bg-emerald-600 border-emerald-600 text-white' :
                isCompleted ? 'bg-emerald-50 border-emerald-600 text-emerald-600' : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {isCompleted ? <CheckCircle2 size={16} /> : step.icon}
              </div>
              <span className={`absolute top-10 text-[11px] font-medium whitespace-nowrap ${
                isActive ? 'text-emerald-700' : isCompleted ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="h-6"></div> {/* Spacer for step labels */}

      {/* Form Content Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 space-y-6">
        
        {/* Step 0: Company Details */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
              Step 1: Company & Partner Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="companyName"
                  value={formValues.companyName}
                  onChange={handleInputChange}
                  placeholder="e.g. Recruit CRM"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Industry Sector <span className="text-red-500">*</span></label>
                <select
                  name="sector"
                  value={formValues.sector}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                >
                  <option value="SaaS / HRTech">SaaS / HRTech</option>
                  <option value="IT Services / Software">IT Services</option>
                  <option value="Data Analytics & AI">Data Analytics & AI</option>
                  <option value="FinTech / Banking">FinTech / Banking</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Company Official Website</label>
                <input
                  type="text"
                  name="companyWebsite"
                  value={formValues.companyWebsite}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Company Logo Image URL</label>
                <input
                  type="text"
                  name="companyLogo"
                  value={formValues.companyLogo}
                  onChange={handleInputChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Job Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
              Step 2: Role & Compensation Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Job Designation Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formValues.jobTitle}
                  onChange={handleInputChange}
                  placeholder="e.g. Trainee Software Engineer"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Employment Type <span className="text-red-500">*</span></label>
                <select
                  name="positionType"
                  value={formValues.positionType}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Internship">Internship</option>
                  <option value="Internship + PPO">Internship + PPO</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Total CTC Offered (in LPA) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    name="ctcLpa"
                    step="0.1"
                    value={formValues.ctcLpa}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-md pl-7 pr-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px] font-semibold">LPA</span>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Posting Location <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="location"
                  value={formValues.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Remote / Gurgaon"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Work Mode</label>
                <div className="flex gap-4 items-center h-[38px]">
                  {['Onsite', 'Hybrid', 'Remote'].map(mode => (
                    <label key={mode} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="workMode"
                        value={mode}
                        checked={formValues.workMode === mode}
                        onChange={handleInputChange}
                        className="w-3.5 h-3.5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />
                      <span className="text-[12.5px]">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Application Deadline Date</label>
                <input
                  type="date"
                  name="deadlineDate"
                  value={formValues.deadlineDate}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Salary Structure Breakdown</label>
              <input
                type="text"
                name="compensationDetails"
                value={formValues.compensationDetails}
                onChange={handleInputChange}
                placeholder="e.g. Fixed: 10 LPA | Variable: 2 LPA"
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Job Profile Description <span className="text-red-500">*</span></label>
              <textarea
                rows={3}
                name="description"
                value={formValues.description}
                onChange={handleInputChange}
                placeholder="Describe the role, day-to-day responsibilities, technology stack..."
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Skill Requirements (One per line)</label>
              <textarea
                rows={3}
                name="requirements"
                value={formValues.requirements}
                onChange={handleInputChange}
                placeholder="Data Structures & Algorithms&#10;React / Node.js proficiency&#10;SQL databases"
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">External Application Link (Optional)</label>
              <input
                type="text"
                name="externalApplyUrl"
                value={formValues.externalApplyUrl}
                onChange={handleInputChange}
                placeholder="If candidates must also register on company careers portal"
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Eligibility Criteria */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
              Step 3: Campus Eligibility Rules
            </h3>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-2">Eligible Programs / Branches <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                {[
                  'B.Tech - Computer Science and Engineering',
                  'B.Tech - Information Technology',
                  'B.Tech - AI & Machine Learning',
                  'B.Tech - Electronics & Communication',
                  'B.Tech - Mechanical Engineering',
                  'MCA',
                  'BCA'
                ].map(branch => (
                  <label key={branch} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowedBranches.includes(branch)}
                      onChange={() => toggleBranch(branch)}
                      className="w-3.5 h-3.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-[12px] text-gray-800">{branch}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Min Graduation CGPA <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="minCgpa"
                  step="0.1"
                  value={formValues.minCgpa}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Min 10th Score (%)</label>
                <input
                  type="number"
                  name="minTenthPercentage"
                  value={formValues.minTenthPercentage}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Min 12th Score (%)</label>
                <input
                  type="number"
                  name="minTwelfthPercentage"
                  value={formValues.minTwelfthPercentage}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Max Active Backlogs</label>
                <input
                  type="number"
                  name="maxActiveBacklogs"
                  value={formValues.maxActiveBacklogs}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Max History Backlogs</label>
                <input
                  type="number"
                  name="maxHistoryBacklogs"
                  value={formValues.maxHistoryBacklogs}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Max Gap Years</label>
                <input
                  type="number"
                  name="maxGapYears"
                  value={formValues.maxGapYears}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Hiring Workflow Stages */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
              Step 4: Hiring Process Rounds
            </h3>

            <div className="space-y-3">
              {stages.map((stage, idx) => (
                <div
                  key={stage.id}
                  className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-gray-900 block">{stage.name}</span>
                      <span className="text-[11.5px] text-gray-500 mt-0.5 block">Venue: {stage.venueOrLink || 'Not assigned'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeStage(stage.id)}
                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
              <input
                type="text"
                placeholder="Round Name (e.g. Group Discussion)"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                className="flex-1 min-w-[150px] bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[12.5px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
              />
              <select
                value={newStageType}
                onChange={(e) => setNewStageType(e.target.value as any)}
                className="w-44 bg-white border border-gray-300 rounded-md px-2 py-1.5 text-[12.5px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
              >
                <option value="pre_placement_talk">Pre-Placement Talk</option>
                <option value="online_test">Online Test</option>
                <option value="group_discussion">Group Discussion</option>
                <option value="technical_interview">Technical Interview</option>
                <option value="hr_interview">HR Interview</option>
              </select>
              <button
                onClick={addStage}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors"
              >
                <Plus size={14} /> Add Stage
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Documents Required */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
              Step 5: Required Verification Documents
            </h3>

            <div>
              <label className="block text-[12.5px] font-medium text-gray-700 mb-3">Select Mandatory Uploads</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 border border-gray-200 rounded-md">
                {[
                  'Updated Resume (PDF format)',
                  '10th & 12th Marksheet',
                  'Graduation Semester Marksheets',
                  'College ID Card',
                  'Aadhaar Card / Government ID'
                ].map(doc => (
                  <label key={doc} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiredDocuments.includes(doc)}
                      onChange={() => toggleDocument(doc)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-[12.5px] text-gray-800">{doc}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Preview & Publish */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3.5 flex items-start gap-2.5">
              <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-[12.5px] text-emerald-800 leading-relaxed">
                Review all placement drive details before publishing to students. Once published, students who meet the eligibility criteria will be able to apply.
              </span>
            </div>

            <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h4 className="m-0 text-[16px] text-gray-900 font-bold">
                    {formValues.jobTitle}
                  </h4>
                  <div className="text-[13px] text-gray-600 font-medium mt-1">{formValues.companyName}</div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[13px] font-bold">
                  ₹ {formValues.ctcLpa} LPA
                </span>
              </div>

              <div className="h-[1px] bg-gray-200 w-full"></div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[11px] text-gray-500 block mb-0.5 font-medium uppercase tracking-wider">Position Type</span>
                  <span className="font-semibold text-gray-900 text-[13px]">{formValues.positionType}</span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block mb-0.5 font-medium uppercase tracking-wider">Location</span>
                  <span className="font-semibold text-gray-900 text-[13px]">{formValues.location}</span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block mb-0.5 font-medium uppercase tracking-wider">Min CGPA Required</span>
                  <span className="font-semibold text-gray-900 text-[13px]">{formValues.minCgpa}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex justify-between items-center mt-8 pt-5 border-t border-gray-200 bg-white">
          <button
            onClick={() => setCurrentStep((p) => p - 1)}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${
              currentStep === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous Step
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[13px] font-medium transition-colors"
          >
            {currentStep === 5 ? 'Publish Placement Drive' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};
