import { executeMockAction } from "./mockDb";

const GAS_API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;

interface RequestOptions {
  method?: "GET" | "POST";
  body?: any;
  retries?: number;
  delayMs?: number;
}

export async function requestGas<T>(action: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body = {}, retries = 1, delayMs = 800 } = options;
  
  // Get token from localStorage
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("upgrid_token") || "";
  }

  // Check if we should force local mock API
  const forceMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

  if (forceMock && typeof window !== "undefined") {
    try {
      const mockResult = await executeMockAction(action, { token, ...body });
      if (mockResult && mockResult.success === false) {
        throw new Error(mockResult.error || "Mock action execution failed");
      }
      return (mockResult.data !== undefined ? mockResult.data : mockResult) as T;
    } catch (mockErr: any) {
      console.warn(`[MockAPI] Action '${action}' failed, attempting remote API...`, mockErr);
    }
  }

  if (!GAS_API_URL) {
    throw new Error("Missing NEXT_PUBLIC_GAS_API_URL environment variable.");
  }

  let url = `${GAS_API_URL}`;
  let fetchOptions: RequestInit = {};

  if (method === "GET") {
    const params = new URLSearchParams();
    params.append("action", action);
    if (token) params.append("token", token);
    
    // Add any other properties from body to parameters
    if (body && typeof body === "object") {
      Object.keys(body).forEach((key) => {
        if (body[key] !== undefined && body[key] !== null) {
          params.append(key, body[key].toString());
        }
      });
    }
    url += `?${params.toString()}`;
    fetchOptions = {
      method: "GET",
      mode: "cors",
    };
  } else {
    // POST request
    const payload = {
      action,
      token,
      ...body,
    };
    
    fetchOptions = {
      method: "POST",
      mode: "cors",
      body: JSON.stringify(payload),
    };
  }

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const json = await response.json();
      
      if (!json.success) {
        throw new Error(json.error || "Unknown server error occurred");
      }
      
      return json.data as T;
    } catch (err: any) {
      lastError = err;
      // If we have retries left, wait and retry
      if (attempt < retries) {
        console.warn(`GAS request failed (Attempt ${attempt + 1}/${retries + 1}). Retrying in ${delayMs}ms...`, err);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // If remote fails completely, check if we can fallback to mock DB client-side
  if (typeof window !== "undefined" && forceMock) {
    console.warn(`[apiClient] GAS remote API failed. Falling back to local mock database for action: ${action}`);
    try {
      const mockResult = await executeMockAction(action, { token, ...body });
      if (mockResult && mockResult.success === false) {
        throw new Error(mockResult.error || "Mock action execution failed");
      }
      return (mockResult.data !== undefined ? mockResult.data : mockResult) as T;
    } catch (mockErr: any) {
      console.error(`[apiClient] Local mock database fallback failed as well:`, mockErr);
    }
  }

  throw lastError || new Error("Failed to complete request to GAS API");
}
