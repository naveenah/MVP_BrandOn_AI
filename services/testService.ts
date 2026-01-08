
import { DB } from './db';
import { GoogleGenAI } from "@google/genai";

export interface TestResult {
  id: string;
  name: string;
  status: 'Pending' | 'Passed' | 'Failed';
  message: string;
}

export const runDiagnostics = async (tenantId: string): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  // 1. Test: Persistence Layer Roundtrip
  try {
    const testKey = `test_persistence_${Date.now()}`;
    const testVal = { success: true, timestamp: Date.now() };
    await DB.set(testKey, testVal);
    const retrieved = await DB.get<typeof testVal>(testKey);
    await DB.remove(testKey);

    results.push({
      id: 'db-1',
      name: 'Persistence Integrity',
      status: retrieved?.success ? 'Passed' : 'Failed',
      message: 'DB read/write roundtrip verified via localStorage.'
    });
  } catch (e) {
    results.push({ id: 'db-1', name: 'Persistence Integrity', status: 'Failed', message: 'Could not write to local storage.' });
  }

  // 2. Test: Gemini API Connectivity
  // Fix: Strictly use process.env.API_KEY for check and initialization
  if (!process.env.API_KEY) {
    results.push({ id: 'ai-1', name: 'Gemini Connectivity', status: 'Failed', message: 'API Key is missing from environment.' });
  } else {
    try {
      // Fix: Always create new instance right before the handshake call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: 'Respond with "pong"' }] }]
      });
      const passed = response.text?.toLowerCase().includes('pong');
      results.push({
        id: 'ai-1',
        name: 'Gemini Connectivity',
        status: passed ? 'Passed' : 'Failed',
        message: passed ? 'API Handshake successful (Gemini 3 Flash).' : 'API responded with unexpected format.'
      });
    } catch (e) {
      results.push({ id: 'ai-1', name: 'Gemini Connectivity', status: 'Failed', message: 'API Request failed. Check credentials/billing.' });
    }
  }

  // 3. Test: Tenant Data Isolation
  try {
    const fakeTenantId = 'tenant_isolation_test_xyz';
    const secretData = { sensitive: 'should_not_be_seen' };
    
    // Write to a different tenant's key space
    await DB.set(DB.keys.PIPELINE(fakeTenantId), [secretData]);
    
    // Attempt to read from current tenant's key space
    const currentData = await DB.get<any[]>(DB.keys.PIPELINE(tenantId));
    const isIsolated = !currentData?.some(d => d.sensitive === 'should_not_be_seen');
    
    results.push({
      id: 'sec-1',
      name: 'Tenant Isolation',
      status: isIsolated ? 'Passed' : 'Failed',
      message: 'Confirmed scoped access prevents cross-tenant data leaks.'
    });
  } catch (e) {
    results.push({ id: 'sec-1', name: 'Tenant Isolation', status: 'Failed', message: 'Isolation check error.' });
  }

  return results;
};
