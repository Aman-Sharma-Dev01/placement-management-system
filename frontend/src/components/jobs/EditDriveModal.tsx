import React, { useState, useEffect } from 'react';
import { PlacementDrive } from '../../types';
import { X, Trash2, Plus, GraduationCap, Info } from 'lucide-react';
import { drivesApi } from '../../api/drives.api';
import { toast } from '../../utils/toast';
import { batchesApi, Batch } from '../../api/batches.api';

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
    genderRestriction: drive.eligibility.allowedGenders?.[0] || 'Any',
  });

  // Batch selection — use targetBatchIds if present, otherwise fall back to empty
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>(
    (drive.eligibility as any).targetBatchIds?.map((id: any) => id?.toString?.() ?? id) || []
  );

  useEffect(() => {
    batchesApi.getAll().then(setAvailableBatches).catch(() => {});
  }, []);

  const toggleBatch = (batchId: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  };

  const [thirdPartyLinks, setThirdPartyLinks] = useState<{ label: string; url: string }[]>(
    drive.thirdPartyLinks || []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const addThirdPartyLink = () => {
    setThirdPartyLinks([...thirdPartyLinks, { label: '', url: '' }]);
  };

  const removeThirdPartyLink = (index: number) => {
    setThirdPartyLinks(thirdPartyLinks.filter((_, i) => i !== index));
  };

  const updateThirdPartyLink = (index: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...thirdPartyLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setThirdPartyLinks(newLinks);
  };

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
        thirdPartyLinks: thirdPartyLinks.filter(link => link.label.trim() || link.url.trim()),
        eligibility: {
          ...drive.eligibility,
          minCgpa: parseFloat(formData.minCgpa),
          maxActiveBacklogs: parseInt(formData.maxActiveBacklogs),
          allowedGenders:
            formData.genderRestriction === 'Any' ? [] : [formData.genderRestriction],
          targetBatchIds: selectedBatchIds,
        } as any,
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
                    <option value="On-site">On-site</option>
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
                  <label className="block text-[12.5px] font-medium text-gray-700 mb-1">Application Deadline</label>
                  <input type="date" name="deadlineDate" value={formData.deadlineDate?.slice(0, 10)} onChange={handleChange} required
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Eligibility */}
            <div className="space-y-3">
              <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Eligibility & Visibility</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-medium text-gray-700 mb-1">Min CGPA</label>
                  <input type="number" step="0.1" name="minCgpa" value={formData.minCgpa} onChange={handleChange}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-gray-700 mb-1">Max Active Backlogs</label>
                  <input type="number" name="maxActiveBacklogs" value={formData.maxActiveBacklogs} onChange={handleChange}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-gray-700 mb-1">Gender Restriction</label>
                  <select name="genderRestriction" value={formData.genderRestriction} onChange={handleChange}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none">
                    <option value="Any">Any (No restriction)</option>
                    <option value="Male">Male Only</option>
                    <option value="Female">Female Only</option>
                    <option value="Other">Other Only</option>
                  </select>
                </div>
              </div>

              {/* Target Batches */}
              <div>
                <label className="block text-[12.5px] font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-emerald-600" />
                  Target Batches
                </label>
                {availableBatches.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-[12px] text-amber-700 flex items-center gap-2">
                    <Info size={13} className="shrink-0" />
                    No batches created. Create batches in Batch Management first.
                  </div>
                ) : (
                  <div className="space-y-1.5 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    {availableBatches.map((batch) => (
                      <label key={batch._id} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBatchIds.includes(batch._id)}
                          onChange={() => toggleBatch(batch._id)}
                          className="w-3.5 h-3.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-[12.5px] text-gray-800 font-medium">{batch.name}</span>
                        <span className="text-[11px] text-gray-500">({batch.program} · Passing {batch.passingYear})</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${batch.isEnrollmentOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {batch.isEnrollmentOpen ? 'Open' : 'Closed'}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[11px] text-gray-500">Leave all unchecked to show drive to all students.</p>
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

            <hr className="border-gray-100" />

            {/* Third-Party Links */}
            <div className="space-y-3">
              <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Third-Party Job Links</h4>
              <div className="space-y-2">
                {thirdPartyLinks.map((link, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateThirdPartyLink(index, 'label', e.target.value)}
                      placeholder="e.g. LinkedIn, Glassdoor"
                      className="w-1/3 bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateThirdPartyLink(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeThirdPartyLink(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addThirdPartyLink}
                  className="flex items-center gap-1 text-[12px] text-emerald-600 font-medium hover:text-emerald-700 mt-1"
                >
                  <Plus size={14} />
                  <span>Add another third-party link</span>
                </button>
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
