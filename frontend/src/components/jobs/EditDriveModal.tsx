import React, { useState } from 'react';
import { PlacementDrive } from '../../types';
import { X } from 'lucide-react';
import { drivesApi } from '../../api/drives.api';
import { toast } from '../../utils/toast';

interface EditDriveModalProps {
  drive: PlacementDrive;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditDriveModal: React.FC<EditDriveModalProps> = ({ drive, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    jobTitle: drive.jobTitle,
    location: drive.location,
    ctcLpa: drive.ctcLpa.toString(),
    deadlineDate: drive.deadlineDate,
    description: drive.description,
    status: drive.status,
    positionType: drive.positionType,
    workMode: drive.workMode,
    minCgpa: drive.eligibility.minCgpa.toString(),
    maxActiveBacklogs: drive.eligibility.maxActiveBacklogs.toString(),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: Partial<PlacementDrive> = {
        jobTitle: formData.jobTitle,
        location: formData.location,
        ctcLpa: parseFloat(formData.ctcLpa),
        deadlineDate: formData.deadlineDate,
        description: formData.description,
        status: formData.status as any,
        positionType: formData.positionType as any,
        workMode: formData.workMode as any,
        eligibility: {
          ...drive.eligibility,
          minCgpa: parseFloat(formData.minCgpa),
          maxActiveBacklogs: parseInt(formData.maxActiveBacklogs),
        }
      };
      await drivesApi.update(drive.id, payload);
      toast.success('Drive updated successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update drive');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative flex flex-col max-h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-[16px]">Edit Drive: {drive.companyName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4">
            
            {/* Basic Info */}
            <div className="space-y-3">
              <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Basic Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-medium text-gray-700 mb-1">Job Title</label>
                  <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} required
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} required
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none">
                    <option value="open">Open (Accepting Applications)</option>
                    <option value="closed">Closed (No new applications)</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} required
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-gray-700 mb-1">Position Type</label>
                  <select name="positionType" value={formData.positionType} onChange={handleChange} required
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none">
                    <option value="Full Time">Full Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Internship + PPO">Internship + PPO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-gray-700 mb-1">Work Mode</label>
                  <select name="workMode" value={formData.workMode} onChange={handleChange} required
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none">
                    <option value="Onsite">Onsite</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-gray-700 mb-1">CTC (LPA)</label>
                  <input type="number" step="0.1" name="ctcLpa" value={formData.ctcLpa} onChange={handleChange} required
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-gray-700 mb-1">Deadline Date</label>
                  <input type="date" name="deadlineDate" value={formData.deadlineDate} onChange={handleChange} required
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Eligibility */}
            <div className="space-y-3">
              <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Eligibility Limits</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-medium text-gray-700 mb-1">Min CGPA Required</label>
                  <input type="number" step="0.1" name="minCgpa" value={formData.minCgpa} onChange={handleChange} required
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-gray-700 mb-1">Max Active Backlogs</label>
                  <input type="number" name="maxActiveBacklogs" value={formData.maxActiveBacklogs} onChange={handleChange} required
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Description */}
            <div className="space-y-3">
              <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Description</h4>
              <div>
                <label className="block text-[12.5px] font-medium text-gray-700 mb-1">Job Description</label>
                <textarea name="description" rows={4} value={formData.description} onChange={handleChange} required
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"></textarea>
              </div>
            </div>

          </div>
          
          <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[13px] font-medium transition-colors flex items-center gap-2">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
