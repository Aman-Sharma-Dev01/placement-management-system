import React, { useState } from 'react';
import {
  Search,
  Plus,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CompaniesDirectory: React.FC = () => {
  const { companies, role } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  if (role !== 'placement_cell' && role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck size={48} className="text-gray-300 mb-4" />
        <h3 className="text-[16px] font-semibold text-gray-700 mb-1">Access restricted</h3>
        <p className="text-[13px] text-gray-500 max-w-sm">
          Company and drive management is only available to the placement cell and super admin.
        </p>
      </div>
    );
  }

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 text-[13px] text-gray-900">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search corporate recruiting partner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-[12.5px] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
          />
        </div>

        {(role === 'placement_cell' || role === 'super_admin') && (
          <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors">
            <Plus size={14} /> Register Partner
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Company & Sector</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Tier Classification</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">MoU Status</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Active Drives</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Total Students Hired</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">Avg CTC Offered</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-[11.5px] uppercase tracking-wide">HR Contact Person</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompanies.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={record.logo}
                        alt={record.name}
                        className="w-10 h-10 rounded object-cover border border-gray-200 bg-white shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-gray-900 leading-tight">{record.name}</div>
                        <div className="text-[11px] text-gray-500">{record.sector}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold tracking-wider ${
                      record.tier.includes('Super Dream') ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      record.tier.includes('Dream') ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {record.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-green-100 text-green-700 border border-green-200">
                      {record.mouStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{record.activeDrivesCount} Active</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-emerald-700">{record.totalHired} Students</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">₹ {record.avgCtc} LPA</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[11.5px]">
                      <div className="font-medium text-gray-900">{record.contactPerson.name}</div>
                      <div className="text-gray-500">{record.contactPerson.email}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCompanies.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-[13px]">
              No companies found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
