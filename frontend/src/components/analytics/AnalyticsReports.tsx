import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  BarChart2,
  TrendingUp,
  Briefcase,
  Users,
  Award,
  AlertCircle,
  ChevronDown,
  Loader2,
  GraduationCap,
  Building2,
  FileText,
  UserX,
  UserCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { batchesApi, Batch, BatchAnalytics } from '../../api/batches.api';
import { toast } from '../../utils/toast';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon: React.ReactNode;
}> = ({ label, value, sub, color = 'text-emerald-600', icon }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
    <div className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <div className="text-[20px] font-bold text-gray-900 leading-tight">{value}</div>
      <div className="text-[11.5px] text-gray-500">{label}</div>
      {sub && <div className="text-[11px] text-gray-400">{sub}</div>}
    </div>
  </div>
);

// CSV export helper
const exportToCsv = (filename: string, rows: Record<string, any>[]) => {
  if (!rows.length) {
    toast.error('No data to export');
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => `"${r[h] ?? ''}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const AnalyticsReports: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [analytics, setAnalytics] = useState<BatchAnalytics | null>(null);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [activeListTab, setActiveListTab] = useState<'placed' | 'unplaced' | 'not_applied'>('placed');

  useEffect(() => {
    batchesApi
      .getAll()
      .then((data) => {
        setBatches(data);
        if (data.length > 0) setSelectedBatchId(data[0]._id);
      })
      .catch(() => toast.error('Failed to load batches'))
      .finally(() => setLoadingBatches(false));
  }, []);

  useEffect(() => {
    if (!selectedBatchId) return;
    setLoadingAnalytics(true);
    setAnalytics(null);
    batchesApi
      .getAnalytics(selectedBatchId)
      .then(setAnalytics)
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoadingAnalytics(false));
  }, [selectedBatchId]);

  const selectedBatch = batches.find((b) => b._id === selectedBatchId);

  const handleExportList = (type: 'placed' | 'unplaced' | 'not_applied') => {
    if (!analytics) return;
    const data =
      type === 'placed'
        ? analytics.placedStudents
        : type === 'unplaced'
        ? analytics.unplacedStudents
        : analytics.notAppliedStudents;
    exportToCsv(`${selectedBatch?.name || 'batch'}_${type}_students`, data);
  };

  const handleExportSummary = () => {
    if (!analytics) return;
    const { summary, batch } = analytics;
    exportToCsv(`${batch.name}_summary_report`, [
      {
        'Batch Name': batch.name,
        'Passing Year': batch.passingYear,
        'Total Enrolled': summary.totalEnrolled,
        'Total Placed': summary.totalPlaced,
        'Total Unplaced': summary.totalUnplaced,
        'Placement Rate (%)': summary.placementRate,
        'Average CTC (LPA)': summary.avgCtc,
        'Highest CTC (LPA)': summary.highestCtc,
        'Lowest CTC (LPA)': summary.lowestCtc,
        'Total Drives': summary.totalDrives,
        'Total Applications': summary.totalApplications,
      },
    ]);
  };

  return (
    <div className="space-y-5 text-[13px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold text-gray-900 m-0">
            Campus Placement Analytics
          </h2>
          <p className="text-[12.5px] text-gray-500 mt-0.5">
            Batch-wise placement reports with exportable student lists
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Batch Selector */}
          <div className="relative">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={loadingBatches}
              className="appearance-none border border-gray-300 rounded-md pl-3 pr-8 py-2 text-[13px] bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none cursor-pointer"
            >
              {loadingBatches ? (
                <option>Loading batches...</option>
              ) : batches.length === 0 ? (
                <option value="">No batches found</option>
              ) : (
                batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          <button
            onClick={handleExportSummary}
            disabled={!analytics}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-md font-medium transition-colors whitespace-nowrap"
          >
            <Download size={14} />
            Export Summary
          </button>
        </div>
      </div>

      {/* No batches state */}
      {!loadingBatches && batches.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">No batches found</p>
            <p className="text-[12px] text-amber-700 mt-0.5">
              Go to <strong>Batch Management</strong> to create a batch first.
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loadingAnalytics && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={30} className="animate-spin text-emerald-500" />
          <span className="ml-3 text-gray-500">Loading analytics...</span>
        </div>
      )}

      {analytics && !loadingAnalytics && (
        <>
          {/* Batch Info Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <GraduationCap size={22} />
              </div>
              <div>
                <h3 className="font-bold text-[16px]">{analytics.batch.name}</h3>
                <p className="text-emerald-100 text-[12px]">
                  {analytics.batch.program} · Admitted {analytics.batch.admissionYear} · Graduating{' '}
                  {analytics.batch.passingYear}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                <div className="text-[22px] font-bold">{analytics.summary.placementRate}%</div>
                <div className="text-[11px] text-emerald-100">Placement Rate</div>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                <div className="text-[22px] font-bold">{analytics.summary.avgCtc}</div>
                <div className="text-[11px] text-emerald-100">Avg CTC (LPA)</div>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Total Enrolled"
              value={analytics.summary.totalEnrolled}
              icon={<Users size={20} />}
              color="text-blue-600"
            />
            <StatCard
              label="Placed"
              value={analytics.summary.totalPlaced}
              sub={`${analytics.summary.placementRate}% rate`}
              icon={<UserCheck size={20} />}
              color="text-emerald-600"
            />
            <StatCard
              label="Unplaced"
              value={analytics.summary.totalUnplaced}
              icon={<UserX size={20} />}
              color="text-red-500"
            />
            <StatCard
              label="Highest CTC"
              value={`${analytics.summary.highestCtc} LPA`}
              sub={`Lowest: ${analytics.summary.lowestCtc} LPA`}
              icon={<Award size={20} />}
              color="text-amber-600"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Applied"
              value={analytics.summary.totalApplied}
              sub="unique students"
              icon={<FileText size={20} />}
              color="text-indigo-600"
            />
            <StatCard
              label="Not Applied"
              value={analytics.summary.notApplied}
              icon={<AlertCircle size={20} />}
              color="text-orange-500"
            />
            <StatCard
              label="Total Drives"
              value={analytics.summary.totalDrives}
              icon={<Briefcase size={20} />}
              color="text-purple-600"
            />
            <StatCard
              label="Total Applications"
              value={analytics.summary.totalApplications}
              icon={<BarChart2 size={20} />}
              color="text-gray-600"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Branch-wise Placement */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 size={16} className="text-emerald-600" />
                  <h3 className="font-semibold text-[14px] text-gray-900">Branch-wise Placement</h3>
                </div>
                <button
                  onClick={() =>
                    exportToCsv(`${analytics.batch.name}_branch_wise`, analytics.branchWise)
                  }
                  className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  <Download size={12} /> Export
                </button>
              </div>
              <div className="p-4 h-72">
                {analytics.branchWise.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.branchWise}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="branch"
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="total" name="Total" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="applied" name="Applied" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="placed" name="Placed" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Salary Bracket Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Briefcase size={16} className="text-emerald-600" />
                <h3 className="font-semibold text-[14px] text-gray-900">Salary Bracket Distribution</h3>
              </div>
              <div className="p-4 h-72">
                {analytics.salaryBrackets.every((b) => b.count === 0) ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No placements recorded yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.salaryBrackets.filter((b) => b.count > 0)}
                        dataKey="count"
                        nameKey="range"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ range, count }) => `${range}: ${count}`}
                        labelLine={true}
                      >
                        {analytics.salaryBrackets.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          fontSize: '12px',
                        }}
                        formatter={(value) => [`${value} students`, 'Count']}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Company-wise Placements */}
          {analytics.companyWise.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-emerald-600" />
                  <h3 className="font-semibold text-[14px] text-gray-900">
                    Company-wise Placements
                  </h3>
                </div>
                <button
                  onClick={() =>
                    exportToCsv(`${analytics.batch.name}_company_wise`, analytics.companyWise)
                  }
                  className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  <Download size={12} /> Export
                </button>
              </div>
              <div className="p-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.companyWise.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="company"
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                      formatter={(value, name) =>
                        name === 'count' ? [`${value} students`, 'Placed'] : [`${value} LPA`, 'Avg CTC']
                      }
                    />
                    <Bar dataKey="count" name="count" fill="#10B981" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Student Lists */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-semibold text-[14px] text-gray-900 flex items-center gap-2">
                <Users size={16} className="text-emerald-600" />
                Student Lists
              </h3>
              <div className="flex items-center gap-2">
                {/* Tab switcher */}
                <div className="flex bg-gray-100 rounded-md p-0.5 text-[12px]">
                  {(
                    [
                      { key: 'placed', label: `Placed (${analytics.summary.totalPlaced})`, color: 'text-emerald-700' },
                      { key: 'unplaced', label: `Unplaced (${analytics.summary.totalUnplaced})`, color: 'text-red-600' },
                      { key: 'not_applied', label: `Not Applied (${analytics.summary.notApplied})`, color: 'text-amber-700' },
                    ] as const
                  ).map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setActiveListTab(key)}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                        activeListTab === key
                          ? `bg-white shadow-sm ${color}`
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleExportList(activeListTab)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                >
                  <Download size={12} /> Export List
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Roll No</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Branch</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeListTab === 'placed'
                    ? analytics.placedStudents
                    : activeListTab === 'unplaced'
                    ? analytics.unplacedStudents
                    : analytics.notAppliedStudents
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400">
                        No students in this category
                      </td>
                    </tr>
                  ) : (
                    (activeListTab === 'placed'
                      ? analytics.placedStudents
                      : activeListTab === 'unplaced'
                      ? analytics.unplacedStudents
                      : analytics.notAppliedStudents
                    ).map((s, i) => (
                      <tr key={s._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono">{s.rollNo}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium">
                            {s.branch}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{s.email}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
