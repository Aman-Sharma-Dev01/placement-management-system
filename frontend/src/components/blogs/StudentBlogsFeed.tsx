import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Clock, Briefcase, ChevronRight } from 'lucide-react';

export const StudentBlogsFeed: React.FC = () => {
  const { blogs, drives, setActiveTab } = useApp();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Bell size={20} className="text-emerald-600" />
          Announcements & Updates
        </h2>
        <p className="text-[13px] text-gray-500 mt-1">Stay updated with the latest news from the placement cell.</p>
      </div>

      <div className="space-y-4">
        {blogs && blogs.length > 0 ? (
          blogs.map((blog) => {
            const relatedDrive = blog.relatedDriveId ? drives.find(d => d.id === blog.relatedDriveId) : null;
            return (
              <div key={blog.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* LinkedIn style post header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
                      {blog.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-gray-900">{blog.authorName}</h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                        <span>Placement Cell</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Clock size={10} /> {new Date(blog.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {blog.isImportant && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wide">
                      Important
                    </span>
                  )}
                </div>

                {/* Post body */}
                <div className="p-5">
                  <h3 className="text-[16px] font-semibold text-gray-900 mb-3">{blog.title}</h3>
                  <p className="text-[14px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {blog.content}
                  </p>
                </div>

                {/* Linked Drive Card (if any) */}
                {relatedDrive && (
                  <div className="mx-5 mb-5 mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4 hover:border-emerald-300 transition-colors cursor-pointer" onClick={() => setActiveTab('jobs')}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <Briefcase size={20} className="text-gray-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-[14px]">{relatedDrive.jobTitle}</div>
                          <div className="text-[12px] text-gray-600">{relatedDrive.companyName}</div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Bell size={24} className="text-gray-400" />
            </div>
            <h3 className="text-[15px] font-medium text-gray-900 mb-1">You're all caught up!</h3>
            <p className="text-[13px] text-gray-500">No new announcements at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};
