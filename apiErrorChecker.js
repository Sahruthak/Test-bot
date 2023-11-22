const fetch = require("node-fetch");

const apiEndpoints = {
  health: "https://prod-wbtc-garden-monitor.onrender.com/health",
  serviceStatus: "https://prod-wbtc-garden-monitor.onrender.com/service-status",
  cobiBalance: "https://prod-wbtc-garden-monitor.onrender.com/cobi-balance",
};

async function checkApiErrors() {
  const errors = [];

  for (const endpoint in apiEndpoints) {
    const url = apiEndpoints[endpoint];
    const error = await checkEndpointError(endpoint, url);
    if (error) {
      errors.push(error);
    }
  }

  // Check the overall server health for all three APIs
  const serverHealthError = await checkServerHealth();
  if (serverHealthError) {
    errors.push(serverHealthError);
  }

  return errors;
}

async function checkEndpointError(endpoint, url) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    // Error signature logic for each API
    const errorSignature = getErrorSignature(endpoint, response, data);

    return errorSignature;
  } catch (error) {
    return `${endpoint} - Request Error: ${error.message}`;
  }
}

async function checkServerHealth() {
  const serverEndpoints = Object.values(apiEndpoints);

  for (const serverEndpoint of serverEndpoints) {
    try {
      const response = await fetch(serverEndpoint);

      if (response.status === 200) {
        const data = await response.json();

        // Check for specific conditions indicating server health
        if (data.status === "online") {
          continue; // Move on to the next API
        } else {
          return `Server - Unexpected state for API at ${serverEndpoint}: ${data.status}`;
        }
      } else {
        return `Server - Unexpected response status for API at ${serverEndpoint}: ${response.status}`;
      }
    } catch (error) {
      return `Server - Request Error for API at ${serverEndpoint}: ${error.message}`;
    }
  }

  return null; // No errors detected for all APIs
}

function getErrorSignature(endpoint, response, data) {
  if (response.status >= 400 && response.status < 500) {
    return `${endpoint} - Client Error: ${response.status}`;
  }
  if (response.status >= 500 && response.status < 600) {
    return `${endpoint} - Server Error: ${response.status}`;
  }
  if (data.error) {
    return `${endpoint} - API Error: ${data.error}`;
  }

  // Additional checks based on the response structure can be added here
  if (
    (endpoint === "health" ||
      endpoint === "cobi-balance" ||
      endpoint === "service status") &&
    (!data.status || data.status !== "online")
  ) {
    return `${endpoint} - Unexpected response: ${response.status}`;
  }

  return null; // No errors detected
}

module.exports = { checkApiErrors };
