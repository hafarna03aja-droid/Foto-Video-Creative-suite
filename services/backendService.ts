// API Configuration
const getApiBaseUrl = () => {
  try {
    return (import.meta as any)?.env?.VITE_API_BASE_URL || 'https://backend.hafarnas-projects.vercel.app/api';
  } catch {
    return 'https://backend.hafarnas-projects.vercel.app/api';
  }
};
const API_BASE_URL = getApiBaseUrl();

// Response interfaces
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken?: string;
}

interface GenerationResponse {
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  promptTokens?: number;
  completionTokens?: number;
  placeholder?: string;
}

// Auth token management
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user_data';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getUser(): any | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static setTokens(accessToken: string, refreshToken?: string, user?: any): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }
}

// HTTP Client with auto token refresh
class ApiClient {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add auth header if token exists
    const token = TokenManager.getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      // Handle token expiry
      if (response.status === 401 && data.error === 'Token Expired') {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry with new token
          headers['Authorization'] = `Bearer ${TokenManager.getAccessToken()}`;
          const retryResponse = await fetch(url, { ...options, headers });
          return await retryResponse.json();
        } else {
          // Refresh failed, redirect to login
          TokenManager.clearTokens();
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private static async refreshToken(): Promise<boolean> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        TokenManager.setTokens(data.data.accessToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}

// Backend Service
export class BackendService {
  // Authentication methods
  static async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await ApiClient.post<AuthResponse>('/auth/register', {
      email,
      password,
      name,
    });

    if (response.success && response.data) {
      TokenManager.setTokens(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.user
      );
    }

    return response.data!;
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    const response = await ApiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });

    if (response.success && response.data) {
      TokenManager.setTokens(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.user
      );
    }

    return response.data!;
  }

  static async logout(): Promise<void> {
    try {
      await ApiClient.post('/auth/logout');
    } finally {
      TokenManager.clearTokens();
    }
  }

  static isLoggedIn(): boolean {
    return TokenManager.isLoggedIn();
  }

  static getCurrentUser(): any | null {
    return TokenManager.getUser();
  }

  // AI Generation methods
  static async generateText(
    prompt: string,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<string> {
    const response = await ApiClient.post<GenerationResponse>('/ai/text/generate', {
      prompt,
      maxTokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    });

    if (!response.success || !response.data?.text) {
      throw new Error(response.error || 'Text generation failed');
    }

    return response.data.text;
  }

  static async generateImage(
    prompt: string,
    options?: { aspectRatio?: string; quality?: string }
  ): Promise<string> {
    const response = await ApiClient.post<GenerationResponse>('/ai/image/generate', {
      prompt,
      aspectRatio: options?.aspectRatio || '1:1',
      quality: options?.quality || 'standard',
    });

    if (!response.success) {
      throw new Error(response.error || 'Image generation failed');
    }

    return response.data?.imageUrl || response.data?.placeholder || '';
  }

  static async generateVideo(
    prompt: string,
    options?: { duration?: number; quality?: string }
  ): Promise<string> {
    const response = await ApiClient.post<GenerationResponse>('/ai/video/generate', {
      prompt,
      duration: options?.duration || 5,
      quality: options?.quality || 'standard',
    });

    if (!response.success) {
      throw new Error(response.error || 'Video generation failed');
    }

    return response.data?.videoUrl || response.data?.placeholder || '';
  }

  static async generateAudio(
    text: string,
    options?: { voice?: string; speed?: number; language?: string }
  ): Promise<string> {
    const response = await ApiClient.post<GenerationResponse>('/ai/audio/generate', {
      text,
      voice: options?.voice || 'default',
      speed: options?.speed || 1.0,
      language: options?.language || 'en',
    });

    if (!response.success) {
      throw new Error(response.error || 'Audio generation failed');
    }

    return response.data?.audioUrl || response.data?.placeholder || '';
  }

  static async transcribeAudio(
    audioUrl: string,
    language?: string
  ): Promise<string> {
    const response = await ApiClient.post<{ transcript: string }>('/ai/audio/transcribe', {
      audioUrl,
      language: language || 'auto',
    });

    if (!response.success) {
      throw new Error(response.error || 'Audio transcription failed');
    }

    return response.data?.transcript || '';
  }

  static async chat(
    message: string,
    conversationId?: string,
    systemPrompt?: string
  ): Promise<{ message: string; conversationId: string }> {
    const response = await ApiClient.post<{ message: string; conversationId: string }>('/ai/chat', {
      message,
      conversationId,
      systemPrompt,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Chat request failed');
    }

    return response.data;
  }

  // File upload methods
  static async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = TokenManager.getAccessToken();
    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'File upload failed');
    }

    return data.data;
  }

  // User methods
  static async getUserProfile(): Promise<any> {
    const response = await ApiClient.get<{ user: any }>('/user/profile');
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get user profile');
    }

    return response.data?.user;
  }

  static async updateUserProfile(updates: any): Promise<any> {
    const response = await ApiClient.put<{ user: any }>('/user/profile', updates);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to update profile');
    }

    return response.data?.user;
  }

  static async getUserUsage(): Promise<any> {
    const response = await ApiClient.get('/user/usage');
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get usage stats');
    }

    return response.data;
  }
}

// Export token manager for direct access if needed
export { TokenManager };