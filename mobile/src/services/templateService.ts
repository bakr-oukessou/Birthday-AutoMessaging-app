import api, { ApiResponse } from './api';

export interface MessageTemplate {
  id: string;
  name: string;
  message: string;
}

class TemplateService {
  async getTemplates(): Promise<MessageTemplate[]> {
    const response = await api.get<ApiResponse<{ templates: MessageTemplate[] }>>('/templates');

    if (response.data.success && response.data.data) {
      return response.data.data.templates;
    }

    throw new Error(response.data.message || 'Failed to load templates');
  }
}

export const templateService = new TemplateService();
