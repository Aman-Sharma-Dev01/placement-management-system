import { apiClient } from './apiClient';
import { Blog } from '../types';

const normalizeBlog = (data: any): Blog => ({
  ...data,
  id: data._id || data.id,
});

const normalizeBlogs = (data: any[]): Blog[] => data.map(normalizeBlog);

export const blogsApi = {
  getAll: () => apiClient.get<Blog[]>('/blogs').then(normalizeBlogs),
  create: (data: Partial<Blog>) => apiClient.post<Blog>('/blogs', data).then(normalizeBlog),
  update: (id: string, data: Partial<Blog>) => apiClient.put<Blog>(`/blogs/${id}`, data).then(normalizeBlog),
  delete: (id: string) => apiClient.delete(`/blogs/${id}`),
};
