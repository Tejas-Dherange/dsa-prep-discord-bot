import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  ApiResponse, 
  PaginatedResponse, 
  User, 
  Problem, 
  Submission, 
  DashboardStats
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response: AxiosResponse<ApiResponse<DashboardStats>> = await this.api.get('/dashboard/stats');
    return response.data;
  }

  async triggerDailyChallenge(): Promise<ApiResponse<{ message: string; timestamp: string }>> {
    const response: AxiosResponse<ApiResponse<{ message: string; timestamp: string }>> = 
      await this.api.post('/dashboard/daily-challenge/trigger');
    return response.data;
  }

  // User endpoints
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<PaginatedResponse<User>>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<User>>> = 
      await this.api.get('/users', { params });
    return response.data;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/users/${id}`);
    return response.data;
  }

  // Problem endpoints
  async getProblems(params?: {
    page?: number;
    limit?: number;
    search?: string;
    difficulty?: string;
    topics?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<PaginatedResponse<Problem>>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Problem>>> = 
      await this.api.get('/problems', { params });
    return response.data;
  }

  async getProblemById(id: string): Promise<ApiResponse<Problem>> {
    const response: AxiosResponse<ApiResponse<Problem>> = await this.api.get(`/problems/${id}`);
    return response.data;
  }

  async createProblem(data: Omit<Problem, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Problem>> {
    const response: AxiosResponse<ApiResponse<Problem>> = await this.api.post('/problems', data);
    return response.data;
  }

  async updateProblem(id: string, data: Partial<Problem>): Promise<ApiResponse<Problem>> {
    const response: AxiosResponse<ApiResponse<Problem>> = await this.api.put(`/problems/${id}`, data);
    return response.data;
  }

  async deleteProblem(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/problems/${id}`);
    return response.data;
  }

  async syncProblemsFromLeetcode(limit?: number): Promise<ApiResponse<{ total: number; synced: number; skipped: number; errors: number }>> {
    const response: AxiosResponse<ApiResponse<{ total: number; synced: number; skipped: number; errors: number }>> = 
      await this.api.post('/problems/sync', { limit });
    return response.data;
  }

  async syncSpecificProblem(slug: string): Promise<ApiResponse<Problem>> {
    const response: AxiosResponse<ApiResponse<Problem>> = await this.api.post(`/problems/sync/${slug}`);
    return response.data;
  }

  // Submission endpoints
  async getSubmissions(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    problemId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<PaginatedResponse<Submission>>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Submission>>> = 
      await this.api.get('/submissions', { params });
    return response.data;
  }

  async getSubmissionById(id: string): Promise<ApiResponse<Submission>> {
    const response: AxiosResponse<ApiResponse<Submission>> = await this.api.get(`/submissions/${id}`);
    return response.data;
  }

  async updateSubmission(id: string, data: Partial<Submission>): Promise<ApiResponse<Submission>> {
    const response: AxiosResponse<ApiResponse<Submission>> = await this.api.put(`/submissions/${id}`, data);
    return response.data;
  }

  async deleteSubmission(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/submissions/${id}`);
    return response.data;
  }

  // Settings endpoints
  async getBotSettings(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/settings/bot');
    return response.data;
  }

  async updateBotSettings(settings: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put('/settings/bot', settings);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;