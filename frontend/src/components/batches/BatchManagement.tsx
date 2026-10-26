import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Users,
  ToggleLeft,
  ToggleRight,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  Edit3,
  BarChart2,
} from 'lucide-react';
import { batchesApi, Batch } from '../../api/batches.api';
import { toast } from '../../utils/toast';
import { useApp } from '../../context/AppContext';

interface CreateBatchForm {
  name: string;
  passingYear: string;
  admissionYear: string;
  program: string;
  description: string;
}

export const BatchManagement: React.FC = () => {
  const { role, setActiveTab } = useApp();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  const [form, setForm] = useState<CreateBatchForm>({
    name: '',
    passingYear: String(currentYear + 1),
    admissionYear: String(currentYear - 3),
    program: 'B.Tech',
    description: '',
  });

  const [isCreating, setIsCreating] = useState(false);

  const fetchBatches = async () => {
    try {
      const data = await batchesApi.getAll();
      setBatches(data);
    } catch (err: any) {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Auto-generate batch name when years change
  useEffect(() => {
    if (form.admissionYear && form.passingYear) {
      setForm((f) => ({
        ...f,
        name: `${form.program} ${form.admissionYear}-${form.passingYear}`,
      }));
    }
  }, [form.admissionYear, form.passingYear, form.program]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.passingYear || !form.admissionYear) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsCreating(true);
    try {
      await batchesApi.create({
        name: form.name,
        passingYear: Number(form.passingYear),
        admissionYear: Number(form.admissionYear),
        program: form.program,
        description: form.description,
      });
      toast.success(`Batch "${form.name}" created successfully`);
      setShowCreateForm(false);
      fetchBatches();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create batch');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleEnrollment = async (batch: Batch) => {
    setTogglingId(batch._id);
    try {
      await batchesApi.toggleEnrollment(batch._id);
      toast.success(
        batch.isEnrollmentOpen
          ? `Enrollment closed for ${batch.name}`
          : `Enrollment opened for ${batch.name}`
      );
      fetchBatches();
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle enrollment');
    } finally {
      setTogglingId(null);
    }
  };

  if (role !== 'placement_cell' && role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <GraduationCap size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500">Access restricted to placement cell.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-[13px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-gray-900 m-0">Batch Management</h2>
          <p className="text-[12.5px] text-gray-500 mt-0.5">
            Create academic batches and control student enrollment windows
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-md font-medium transition-colors"
        >
          <Plus size={15} />
          Create New Batch
        </button>
      </div>

      {/* Create Batch Form */}
      {showCreateForm && (
        <div className="bg-white border border-emerald-200 rounded-lg p-5 shadow-sm">
          <h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <GraduationCap size={16} className="text-emerald-600" />
            New Batch Details
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">
                  Program <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.program}
                  onChange={(e) => setForm((f) => ({ ...f, program: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none bg-white"
                >
                  <option>B.Tech</option>
                  <option>MCA</option>
                  <option>BCA</option>
                  <option>MBA</option>
                  <option>M.Tech</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">
                  Admission Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.admissionYear}
                  onChange={(e) => setForm((f) => ({ ...f, admissionYear: e.target.value }))}
                  placeholder="e.g. 2023"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">
                  Passing / Graduation Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.passingYear}
                  onChange={(e) => setForm((f) => ({ ...f, passingYear: e.target.value }))}
                  placeholder="e.g. 2027"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">
                  Batch Name (Auto-generated)
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Main batch, lateral entry, etc."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex items-start gap-2">
              <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[12px] text-blue-700">
                Students who registered with <strong>Passing Year {form.passingYear || '—'}</strong> will be able to enroll in this batch once you open enrollment. Only verified students can enroll.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium transition-colors disabled:opacity-60"
              >
                {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {isCreating ? 'Creating...' : 'Create Batch'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Batches List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-emerald-500" />
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <GraduationCap size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-600">No batches created yet</p>
          <p className="text-[12px] mt-1">Click "Create New Batch" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {batches.map((batch) => (
            <div
              key={batch._id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Batch Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <GraduationCap size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-[14px] leading-tight">{batch.name}</h3>
                      <span className="text-[11px] text-gray-500">{batch.program}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    batch.isEnrollmentOpen
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {batch.isEnrollmentOpen ? '● Enrollment Open' : '○ Enrollment Closed'}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-gray-50 rounded-md p-2 text-center">
                  <div className="text-[15px] font-bold text-gray-800">{batch.enrolledStudentsCount}</div>
                  <div className="text-[10px] text-gray-500">Enrolled</div>
                </div>
                <div className="bg-gray-50 rounded-md p-2 text-center">
                  <div className="text-[15px] font-bold text-emerald-700">{batch.placedStudentsCount}</div>
                  <div className="text-[10px] text-gray-500">Placed</div>
                </div>
                <div className="bg-gray-50 rounded-md p-2 text-center">
                  <div className="text-[15px] font-bold text-blue-700">
                    {new Date().getFullYear() - batch.admissionYear}Y
                  </div>
                  <div className="text-[10px] text-gray-500">Running</div>
                </div>
              </div>

              {/* Year Info */}
              <div className="flex items-center gap-3 text-[11.5px] text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Admitted: {batch.admissionYear}
                </span>
                <span className="flex items-center gap-1">
                  <GraduationCap size={12} />
                  Passing: {batch.passingYear}
                </span>
              </div>

              {batch.description && (
                <p className="text-[11.5px] text-gray-500 mb-3 italic">{batch.description}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleToggleEnrollment(batch)}
                  disabled={togglingId === batch._id}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                    batch.isEnrollmentOpen
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
                  }`}
                >
                  {togglingId === batch._id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : batch.isEnrollmentOpen ? (
                    <>
                      <ToggleLeft size={14} /> Close Enrollment
                    </>
                  ) : (
                    <>
                      <ToggleRight size={14} /> Open Enrollment
                    </>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition-colors"
                  title="View Analytics"
                >
                  <BarChart2 size={13} />
                  Analytics
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
