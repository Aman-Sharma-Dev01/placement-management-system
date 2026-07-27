import React from 'react';
import {
  Download,
  BarChart as BarChartIcon,
  TrendingUp,
  Briefcase
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
  CartesianGrid
} from 'recharts';

export const AnalyticsReports: React.FC = () => {
  const branchData = [
    { branch: 'CSE', placed: 88, total: 100 },
    { branch: 'IT', placed: 82, total: 95 },
    { branch: 'AI & ML', placed: 91, total: 100 },
    { branch: 'ECE', placed: 74, total: 90 },
    { branch: 'Mechanical', placed: 65, total: 80 },
  ];

  const packageRangeData = [
    { range: '< 5 LPA', count: 38 },
    { range: '5 - 8 LPA', count: 65 },
    { range: '8 - 12 LPA', count: 42 },
    { range: '> 12 LPA', count: 24 },
  ];

  const trendData = [
    { year: '2023 Batch', avgCtc: 6.8, highestCtc: 14.5, placementRate: 81 },
    { year: '2024 Batch', avgCtc: 7.4, highestCtc: 16.0, placementRate: 84 },
    { year: '2025 Batch', avgCtc: 8.2, highestCtc: 17.5, placementRate: 87 },
    { year: '2026 Batch', avgCtc: 8.85, highestCtc: 18.0, placementRate: 89 },
  ];

  return (
    <div className="space-y-6 text-[13px] text-gray-900">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h2 className="m-0 text-[18px] text-gray-900 font-semibold leading-tight">
            Campus Placement Analytics & Executive Reports
          </h2>
          <p className="text-[12.5px] text-gray-500 mt-1">
            Official University Placement Performance Reports (Batch 2026)
          </p>
        </div>
        <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap">
          <Download size={16} /> Export Executive Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2 text-gray-900">
            <BarChartIcon size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-[14px]">Department Placement Rate (%)</h3>
          </div>
          <div className="p-4 h-72 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="branch" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value}% Placed`, 'Placement Rate']}
                />
                <Bar dataKey="placed" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2 text-gray-900">
            <Briefcase size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-[14px]">Salary Bracket Distribution (CTC in LPA)</h3>
          </div>
          <div className="p-4 h-72 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={packageRangeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} Offers`, 'Offer Count']}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 text-gray-900">
          <TrendingUp size={18} className="text-emerald-600" />
          <h3 className="font-semibold text-[14px]">4-Year Year-on-Year Placement & CTC Growth Trends</h3>
        </div>
        <div className="p-5 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="avgCtc" stroke="#2563EB" strokeWidth={3} name="Average CTC (LPA)" activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="highestCtc" stroke="#10B981" strokeWidth={3} name="Highest CTC (LPA)" activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
