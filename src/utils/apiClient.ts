const GAS_API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;

interface RequestOptions {
  method?: "GET" | "POST";
  body?: any;
  retries?: number;
  delayMs?: number;
}

export async function requestGas<T>(action: string, options: RequestOptions = {}): Promise<T> {
  if (!GAS_API_URL) {
    throw new Error("Missing NEXT_PUBLIC_GAS_API_URL environment variable.");
  }

  const { method = "GET", body = {}, retries = 3, delayMs = 1500 } = options;
  
  // Get token from localStorage
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("upgrid_token") || "";
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
      // Important: Use default mode/credentials for GAS Web Apps
      mode: "cors",
    };
  } else {
    // POST request
    // Important: To avoid CORS preflight options issues with GAS, 
    // we send payload as text/plain. This classes as a 'simple request' in CORS.
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

  throw lastError || new Error("Failed to complete request to GAS API");
}
