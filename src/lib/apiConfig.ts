// This file manages the centralized server configuration.
// Client PCs can configure the SERVER_URL to point to the main Server PC (e.g. http://192.168.1.100:3001)

export const setApiUrl = (url: string) => {
  // Remove trailing slashes
  const cleanUrl = url.replace(/\/+$/, '');
  localStorage.setItem('SIC_SERVER_URL', cleanUrl);
  // Reload the page to ensure all connections reset to the new server
  window.location.reload();
};

export const getApiUrl = (): string => {
  // If we are in local development using Vite, point to the node server explicitly
  if (import.meta && import.meta.env && import.meta.env.DEV) {
    return 'http://localhost:3001';
  }

  // Try to get from local storage (Manual configuration)
  const stored = localStorage.getItem('SIC_SERVER_URL');
  if (stored) {
    return stored;
  }
  
  // If accessed via a standard web browser over the network, use the current host
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3001';
};

// Global Fetch wrapper that prepends the Server URL automatically
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  return fetch(url, options);
};

export const autoDiscoverServer = async (baseSubnets: string[] = ['192.168.1', '192.168.0', '192.168.10', '10.0.0', '172.16.0']): Promise<string | null> => {
  return new Promise((resolve) => {
    let found = false;
    let pending = 0;
    
    // We will test IPs 1 through 254 for each subnet
    const ipsToTest: string[] = [];
    baseSubnets.forEach(subnet => {
      for (let i = 1; i < 255; i++) {
        ipsToTest.push(`${subnet}.${i}`);
      }
    });

    const abortController = new AbortController();
    
    // Safety timeout: If no server is found in 10 seconds, resolve null
    const fallbackTimeout = setTimeout(() => {
      if (!found) {
        abortController.abort();
        resolve(null);
      }
    }, 10000);

    // Fire off parallel requests
    ipsToTest.forEach(ip => {
      if (found) return;
      pending++;
      
      const targetUrl = `http://${ip}:3001`;
      fetch(`${targetUrl}/api/ping`, { 
        signal: abortController.signal,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not OK');
      })
      .then(data => {
        if (!found && data && data.sic_server === true) {
          found = true;
          clearTimeout(fallbackTimeout);
          abortController.abort(); // Cancel all other pending requests
          resolve(targetUrl);
        }
      })
      .catch(() => {
        // Ignore timeouts or connection refused
      })
      .finally(() => {
        pending--;
        if (pending === 0 && !found) {
          clearTimeout(fallbackTimeout);
          resolve(null);
        }
      });
    });
  });
};
