import React, { useState } from 'react';
import { Save, Settings, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from '../../utils/toast';

export const SettingsView: React.FC = () => {
  const { role } = useApp();
  const [formValues, setFormValues] = useState({
    maxOffers: 1,
    minCgpaDefault: 6.0,
    autoLockVerifiedProfiles: true,
    emailNotifications: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Placement ERP Settings updated successfully!');
  };

  const handleToggle = (field: keyof typeof formValues) => {
    setFormValues(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck size={48} className="text-gray-300 mb-4" />
        <h3 className="text-[16px] font-semibold text-gray-700 mb-1">Access restricted</h3>
        <p className="text-[13px] text-gray-500 max-w-sm">
          Global system settings are only available to the super admin.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4 text-[13px] text-gray-900">
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="m-0 text-[18px] text-gray-900 font-semibold leading-tight flex items-center gap-2">
          <Settings size={20} className="text-gray-500" />
          University Placement Policy & ERP Settings
        </h2>
        <p className="text-[12.5px] text-gray-500 mt-1 ml-7">
          Configure global eligibility rules, offer limits, and coordinator approval workflows.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <form onSubmit={handleSave} className="p-5 space-y-6">
          <div className="space-y-4">
            <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
              1. Placement Policy & Offer Limits
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Max Offers Allowed per Candidate in Dream Category</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formValues.maxOffers}
                  onChange={(e) => setFormValues({...formValues, maxOffers: parseInt(e.target.value)})}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Default Minimum CGPA Threshold</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formValues.minCgpaDefault}
                  onChange={(e) => setFormValues({...formValues, minCgpaDefault: parseFloat(e.target.value)})}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-gray-200 w-full"></div>

          <div className="space-y-4">
            <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider">
              2. Verification & Governance
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-[12.5px] text-gray-800 font-medium group-hover:text-gray-900">Lock student profile editing once verified by the placement coordinator</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formValues.autoLockVerifiedProfiles}
                    onChange={() => handleToggle('autoLockVerifiedProfiles')}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${formValues.autoLockVerifiedProfiles ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formValues.autoLockVerifiedProfiles ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-[12.5px] text-gray-800 font-medium group-hover:text-gray-900">Send automated email alerts to candidates on stage advancement</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formValues.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${formValues.emailNotifications ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formValues.emailNotifications ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium text-[13px] transition-colors"
            >
              <Save size={16} /> Save Policy Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
