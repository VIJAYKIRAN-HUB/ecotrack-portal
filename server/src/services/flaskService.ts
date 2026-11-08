import { config } from '../config.js';

export class FlaskService {
  /**
   * Health check to test if your Flask backend is online
   */
  static async checkStatus(): Promise<{ online: boolean; message: string; data?: any }> {
    const url = `${config.flaskApiUrl}/health`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': config.flaskApiKey,
        },
        signal: controller.signal,
      }).catch(async () => {
        // Fallback check on root /
        return await fetch(config.flaskApiUrl, { signal: controller.signal });
      });

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json().catch(() => ({ status: 'ok' }));
        return { online: true, message: `Connected to Flask at ${config.flaskApiUrl}`, data };
      }

      return {
        online: false,
        message: `Flask responded with HTTP ${res?.status || 'error'} at ${config.flaskApiUrl}`,
      };
    } catch (err: any) {
      return {
        online: false,
        message: `Flask server unreachable at ${config.flaskApiUrl} (${err.message})`,
      };
    }
  }

  /**
   * Send an image or complaint payload to Flask for AI/ML classification
   */
  static async classifyWaste(payload: { imageUrl?: string; imageBase64?: string; title?: string }): Promise<any> {
    const url = `${config.flaskApiUrl}/predict`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': config.flaskApiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Flask API error: ${res.statusText}`);
      }

      return await res.json();
    } catch (err: any) {
      console.warn(`Flask Service Request Failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Generic proxy request to your Flask backend
   */
  static async proxyToFlask(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${config.flaskApiUrl}${cleanEndpoint}`;

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': config.flaskApiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return await res.json();
  }
}
