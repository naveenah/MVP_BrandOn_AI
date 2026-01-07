
/**
 * Stateless API Client (NFR-801)
 * Handles Cross-Cutting Concerns: Isolation, Security, and Rate Limiting.
 */

const API_VERSION = 'v1';
const RATE_LIMIT_CEILING = 100;
let requestCount = 0;

export class ApiClient {
  private tenantId: string;

  constructor(tenantId: string) {
    if (!tenantId) throw new Error("Infrastructure Violation: X-Tenant-ID missing (NFR-601)");
    this.tenantId = tenantId;
  }

  /**
   * Simulated fetch with Infrastructure context (NFR-601, NFR-603, NFR-803)
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `/api/${API_VERSION}/${endpoint}`;
    
    // Simulate Kong Gateway Headers
    const headers = {
      ...options.headers,
      'X-Tenant-ID': this.tenantId,
      'Authorization': `Bearer ${localStorage.getItem('jwt_simulated')}`,
      'X-API-Version': API_VERSION,
      'Content-Type': 'application/json'
    };

    // Simulate Rate Limiting (NFR-603)
    requestCount++;
    if (requestCount > RATE_LIMIT_CEILING) {
      throw new Error("429 Too Many Requests: Kong Rate Limit Exceeded (NFR-603)");
    }

    console.debug(`[Kong Gateway] Routing ${options.method || 'GET'} to ${url}`);
    console.debug(`[Infra] Enforcing Isolation for Tenant: ${this.tenantId}`);

    // Simulate Network Latency (Targeting <200ms NFR-701)
    const latency = Math.random() * 150 + 50; 
    await new Promise(resolve => setTimeout(resolve, latency));

    // Simulate Database Repository Check
    const isolationVerified = this.verifyIsolation();
    if (!isolationVerified) {
      throw new Error("403 Forbidden: Cross-Tenant Access Violation (NFR-601)");
    }

    // In a real app, this would be: 
    // const res = await fetch(url, { ...options, headers });
    // return res.json();
    
    return {} as T; // Mocking successful response
  }

  private verifyIsolation(): boolean {
    // Simulated Row-Level Security (RLS) check at the Infrastructure level
    const activeTenantId = localStorage.getItem('currentTenantId');
    return activeTenantId === this.tenantId;
  }

  getRateLimitStatus() {
    return {
      limit: RATE_LIMIT_CEILING,
      remaining: Math.max(0, RATE_LIMIT_CEILING - requestCount),
      resetIn: "45s"
    };
  }
}

export const getInfraStatus = (): any => ({
  gateway: 'Healthy',
  apiVersion: API_VERSION,
  encryption: 'AES-256 (At-Rest)',
  tlsVersion: 'TLS 1.3 (In-Transit)',
  isolation: 'Row-Level Security (Neon DB)',
  rateLimit: `${Math.max(0, RATE_LIMIT_CEILING - requestCount)} / ${RATE_LIMIT_CEILING}`
});
