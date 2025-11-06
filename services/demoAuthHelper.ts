// Auto-login helper for demo mode
import { BackendService } from './backendService';

export class DemoAuthHelper {
  private static readonly DEMO_EMAIL = 'demo@example.com';
  private static readonly DEMO_PASSWORD = 'password123';
  private static readonly AUTO_LOGIN_KEY = 'demo_auto_login';

  static async ensureDemoLogin(): Promise<boolean> {
    try {
      // Check if already logged in
      if (BackendService.isLoggedIn()) {
        return true;
      }

      // Check if auto-login is enabled
      const autoLogin = localStorage.getItem(this.AUTO_LOGIN_KEY);
      if (autoLogin === 'false') {
        return false;
      }

      // Attempt demo login
      console.log('Attempting demo auto-login...');
      await BackendService.login(this.DEMO_EMAIL, this.DEMO_PASSWORD);
      
      // Enable auto-login for future sessions
      localStorage.setItem(this.AUTO_LOGIN_KEY, 'true');
      console.log('Demo auto-login successful');
      return true;

    } catch (error) {
      console.error('Demo auto-login failed:', error);
      
      // Disable auto-login if it fails
      localStorage.setItem(this.AUTO_LOGIN_KEY, 'false');
      return false;
    }
  }

  static enableAutoLogin(): void {
    localStorage.setItem(this.AUTO_LOGIN_KEY, 'true');
  }

  static disableAutoLogin(): void {
    localStorage.setItem(this.AUTO_LOGIN_KEY, 'false');
  }

  static isAutoLoginEnabled(): boolean {
    return localStorage.getItem(this.AUTO_LOGIN_KEY) !== 'false';
  }

  static async manualDemoLogin(): Promise<void> {
    await BackendService.login(this.DEMO_EMAIL, this.DEMO_PASSWORD);
    this.enableAutoLogin();
  }
}