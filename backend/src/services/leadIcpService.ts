import { ICPProfile } from '../models/ICPProfile';
import { ApiError } from '../utils/ApiError';

export const leadIcpService = {
  async get(organizationId: string) {
    const profile = await ICPProfile.findOne({ organizationId }).lean();
    return profile ?? null;
  },

  async upsert(organizationId: string, input: Record<string, unknown>) {
    const allowed = [
      'name', 'industries', 'companySizeMin', 'companySizeMax', 'locations', 'jobTitles',
      'minRevenue', 'minEmployees', 'technologies', 'keywords', 'customCriteria', 'enabled',
    ];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (input[key] !== undefined) patch[key] = input[key];
    }
    const profile = await ICPProfile.findOneAndUpdate(
      { organizationId },
      { $set: patch },
      { upsert: true, new: true }
    ).lean();
    return profile;
  },

  async remove(organizationId: string) {
    const profile = await ICPProfile.findOneAndDelete({ organizationId }).lean();
    if (!profile) throw ApiError.notFound('ICP profile not found');
    return profile;
  },
};