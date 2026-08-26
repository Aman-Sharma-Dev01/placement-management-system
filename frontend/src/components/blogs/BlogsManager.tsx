import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { blogsApi } from '../../api/blogs.api';
import { Blog } from '../../types';
import { Bell, Plus, Edit2, Trash2, Clock, X, Send } from 'lucide-react';

export const BlogsManager: React.FC = () => {
  const { blogs, drives, refreshData } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    relatedDriveId: '',
    targetAudience: 'all',
    isImportant: false,
  });

  const handleOpenNew = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      content: '',
      relatedDriveId: '',
      targetAudience: 'all',
      isImportant: false,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      relatedDriveId: blog.relatedDriveId || '',
      targetAudience: blog.targetAudience,
      isImportant: blog.isImportant,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await blogsApi.delete(id);
      refreshData();
    } catch (error) {
      console.error(error);
      alert('Failed to delete');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingBlog) {
        await blogsApi.update(editingBlog.id, formData);
      } else {
        await blogsApi.create(formData);
      }
      setIsModalOpen(false);
      refreshData();
    } catch (error) {
      console.error(error);
      alert('Failed to save announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Bell size={20} className="text-emerald-600" /> Announcements & Blogs
          </h2>
          <p className="text-[13px] text-gray-500 mt-1">Publish updates, drive results, and notices for students.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-md text-[13px] font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} /> New Announcement
        </button>
      </div>

      <div className="grid gap-4">
        {blogs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            No announcements found. Create one to keep students informed!
          </div>
        ) : (
          blogs.map((blog) => (
            <div key={blog.id} className={`bg-white border rounded-lg overflow-hidden ${blog.isImportant ? 'border-amber-300' : 'border-gray-200'}`}>
              <div className={`px-5 py-3 border-b flex items-center justify-between ${blog.isImportant ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 text-[15px]">{blog.title}</span>
                  {blog.isImportant && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] uppercase px-2 py-0.5 rounded font-bold tracking-wide">
                      Important
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(blog)} className="p-1.5 text-gray-500 hover:text-emerald-600 rounded bg-white border border-gray-200 hover:border-emerald-200">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(blog.id)} className="p-1.5 text-gray-500 hover:text-red-600 rounded bg-white border border-gray-200 hover:border-red-200">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <p className="text-[13.5px] text-gray-700 whitespace-pre-wrap">{blog.content}</p>
              </div>
              <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center gap-4 text-[12px] text-gray-500">
                <span className="flex items-center gap-1.5"><Clock size={13} /> {new Date(blog.createdAt).toLocaleString()}</span>
                <span>•</span>
                <span>By: {blog.authorName}</span>
                {blog.relatedDriveId && <span>• Related Drive: {drives.find(d => d.id === blog.relatedDriveId)?.companyName || 'Unknown'}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{editingBlog ? 'Edit Announcement' : 'Create New Announcement'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 border"
                  placeholder="e.g. Deadline Extended for Google Applications"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 border"
                  placeholder="Write the full announcement here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Related Drive (Optional)</label>
                  <select
                    value={formData.relatedDriveId}
                    onChange={(e) => setFormData({ ...formData, relatedDriveId: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 border bg-white"
                  >
                    <option value="">None</option>
                    {drives.map(drive => (
                      <option key={drive.id} value={drive.id}>{drive.companyName} - {drive.jobTitle}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 border bg-white"
                  >
                    <option value="all">Everyone</option>
                    <option value="students">Students Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isImportant"
                  checked={formData.isImportant}
                  onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="isImportant" className="text-[13px] font-medium text-gray-700">
                  Mark as High Importance (Highlights in yellow)
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-[13px] font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : <><Send size={14} /> {editingBlog ? 'Update' : 'Publish'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
