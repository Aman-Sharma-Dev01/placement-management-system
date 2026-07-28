import React, { useState } from 'react';
import { PlacementDrive } from '../../types';
import { useApp } from '../../context/AppContext';
import { drivesApi } from '../../api/drives.api';
import { toast } from '../../utils/toast';
import { 
  Building2, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Briefcase, 
  Clock, 
  Edit, 
  Trash2,
  Calendar,
  IndianRupee,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { EditDriveModal } from './EditDriveModal';

interface AdminJobProfileViewProps {
  drive: PlacementDrive;
}

export const AdminJobProfileView: React.FC<AdminJobProfileViewProps> = ({ drive }) => {
  const { refreshData, setActiveTab } = useApp();
  const [activeTab, setLocalActiveTab] = useState<'overview' | 'workflow' | 'stats'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to completely delete the drive for ${drive.companyName}? This action cannot be undone.`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await drivesApi.delete(drive.id);
      toast.success('Drive deleted successfully');
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete drive');
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = async () => {
    setIsEditModalOpen(false);
    await refreshData();
  };

  const navigateToApplications = () => {
    setActiveTab('applications');
    // Note: The global state for filtering by this drive would ideally be set here.
    // For now, we rely on the user to select the drive in the Applications Tracker.
    toast.info(`Navigating to applications. Please select ${drive.companyName} in the filter.`);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Admin Header */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg border border-gray-200 bg-white flex items-center justify-center p-2 shadow-sm">
            <img src={drive.companyLogo} alt={drive.companyName} className="max-w-full max-h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="m-0 text-gray-900 text-[18px] font-bold leading-tight">{drive.jobTitle}</h2>
              <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider ${
                drive.status === 'open' ? 'bg-green-100 text-green-700 border border-green-200' :
                drive.status === 'closed' ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                drive.status === 'upcoming' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                'bg-amber-100 text-amber-700 border border-amber-200'
              }`}>
                {drive.status}
              </span>
            </div>
            <div className="text-[13px] text-gray-600 font-medium flex items-center gap-3">
              <span className="flex items-center gap-1.5"><Building2 size={14} /> {drive.companyName}</span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {drive.location}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors"
          >
            <Edit size={14} /> Edit Job
          </button>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors"
          >
            <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete Job'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wider mb-3">Application Pipeline</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users size={20} />
            </div>
            <div>
              <div className="text-[20px] font-bold text-gray-900 leading-none mb-1">{drive.totalAppliedCount || 0}</div>
              <div className="text-[12px] text-gray-500 font-medium">Total Applied</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-[20px] font-bold text-gray-900 leading-none mb-1">{drive.shortlistedCount || 0}</div>
              <div className="text-[12px] text-gray-500 font-medium">Shortlisted</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <Briefcase size={20} />
            </div>
            <div>
              <div className="text-[20px] font-bold text-gray-900 leading-none mb-1">{drive.selectedCount || 0}</div>
              <div className="text-[12px] text-gray-500 font-medium">Offers Rolled Out</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <button 
            onClick={navigateToApplications}
            className="w-full sm:w-auto bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-md text-[13px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Manage Applicants Pipeline
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-5 pt-2 bg-gray-50">
        {[
          { id: 'overview', label: 'Drive Overview' },
          { id: 'workflow', label: 'Hiring Workflow' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setLocalActiveTab(tab.id as any)}
            className={`pb-2.5 px-3 mr-4 text-[13px] font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                  <IndianRupee size={14} />
                  <span className="text-[11px] font-semibold uppercase">CTC Offered</span>
                </div>
                <div className="text-[14px] font-bold text-gray-900">{drive.ctcLpa} LPA</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                  <Calendar size={14} />
                  <span className="text-[11px] font-semibold uppercase">Deadline</span>
                </div>
                <div className="text-[14px] font-bold text-gray-900">{drive.deadlineDate}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                  <AlertCircle size={14} />
                  <span className="text-[11px] font-semibold uppercase">Min CGPA</span>
                </div>
                <div className="text-[14px] font-bold text-gray-900">{drive.eligibility.minCgpa}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                  <Clock size={14} />
                  <span className="text-[11px] font-semibold uppercase">Type</span>
                </div>
                <div className="text-[14px] font-bold text-gray-900">{drive.positionType}</div>
              </div>
            </div>

            <div>
              <h4 className="text-[13px] font-bold text-gray-900 mb-2">Job Description</h4>
              <p className="text-[13px] text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                {drive.description}
              </p>
            </div>
            
            {drive.requirements && drive.requirements.length > 0 && (
              <div>
                <h4 className="text-[13px] font-bold text-gray-900 mb-2">Key Requirements</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-gray-600">
                  {drive.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {drive.thirdPartyLinks && drive.thirdPartyLinks.length > 0 && (
              <div>
                <h4 className="text-[13px] font-bold text-gray-900 mb-2">Third-Party Job Links</h4>
                <div className="flex flex-wrap gap-2.5">
                  {drive.thirdPartyLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-colors"
                    >
                      <ExternalLink size={14} />
                      {link.label || 'External Link'}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="space-y-4">
            <h5 className="text-[12px] font-bold uppercase text-gray-500 tracking-wider mb-3">Evaluation Rounds</h5>
            <div className="space-y-4">
              {drive.stages.map((stage, idx) => (
                <div key={stage.id} className="flex gap-4 relative">
                  {idx !== drive.stages.length - 1 && (
                    <div className="absolute left-3.5 top-8 bottom-[-16px] w-[2px] bg-gray-200"></div>
                  )}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[12px] z-10 shrink-0 ${
                    stage.isCompleted ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="pb-2">
                    <h6 className="font-bold text-gray-900 text-[13.5px]">{stage.name}</h6>
                    <div className="text-[12px] text-gray-500 mt-1 space-y-1">
                      <div><strong className="font-medium text-gray-700">Venue/Link:</strong> {stage.venueOrLink || 'TBA'}</div>
                      {stage.scheduledDate && (
                        <div><strong className="font-medium text-gray-700">Scheduled:</strong> {stage.scheduledDate}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <EditDriveModal drive={drive} onClose={() => setIsEditModalOpen(false)} onSuccess={handleEditSuccess} />
      )}
    </div>
  );
};
