import { Template } from '../models/Template';
import { ApiError } from '../utils/ApiError';

export const templateService = {
  async list(category?: string) {
    const query = category && category !== 'all' ? { category } : {};
    return Template.find(query).sort({ featured: -1, createdAt: -1 }).lean();
  },

  async getBySlug(slug: string) {
    const template = await Template.findOne({ slug }).lean();
    if (!template) throw ApiError.notFound('Template not found');
    return template;
  },
};