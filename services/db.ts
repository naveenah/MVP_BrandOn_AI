
/**
 * Enterprise Database Interface (conceptually Neon DB)
 * Handles persistence for all BrandOS entities.
 */

export class DB {
  private static async delay(ms: number = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async get<T>(key: string): Promise<T | null> {
    await this.delay(50);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  static async set<T>(key: string, value: T): Promise<void> {
    await this.delay(50);
    localStorage.setItem(key, JSON.stringify(value));
  }

  static async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  /**
   * Performs a complete purge of all BrandOS related data from local storage.
   */
  static async clearAll(): Promise<void> {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      // Clear specific known keys and prefix-matched keys
      if (
        key.startsWith('brandos_') || 
        key === 'user' || 
        key === 'currentTenantId' || 
        key === 'tenants' ||
        key === 'jwt_simulated'
      ) {
        localStorage.removeItem(key);
      }
    });
    // Fallback: Clear everything if preferred for a "True Restart"
    // localStorage.clear();
    await this.delay(200);
  }

  // Tenant-scoped keys
  static keys = {
    USER: 'brandos_user',
    TENANTS: 'brandos_tenants',
    CURRENT_TENANT_ID: 'brandos_current_tenant_id',
    ONBOARDING: (tid: string) => `brandos_onboarding_${tid}`,
    PIPELINE: (tid: string) => `brandos_pipeline_${tid}`,
    CHATS: (tid: string) => `brandos_chats_${tid}`,
    ANALYTICS: (tid: string) => `brandos_analytics_${tid}`
  };
}
