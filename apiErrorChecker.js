const fetch = require("node-fetch");

const apiEndpoints = {
  cobiBalance: "https://prod-wbtc-garden-monitor.onrender.com/cobi-balance",
  constraints: "https://prod-wbtc-garden-monitor.onrender.com/constraints",
  networkFee: "https://prod-wbtc-garden-monitor.onrender.com/network-fee",
  orderRate: "https://prod-wbtc-garden-monitor.onrender.com/order-rate",
  serviceStatus: "https://prod-wbtc-garden-monitor.onrender.com/service-status",
  store: "https://prod-wbtc-garden-monitor.onrender.com/store",
  tokenPrice: "https://prod-wbtc-garden-monitor.onrender.com/token-price",
  txnStats: "https://prod-wbtc-garden-monitor.onrender.com/txn-stats",
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

  return errors;
}

async function checkEndpointError(endpoint, url) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    // Check for false values in the response
    if (hasFalseValues(data)) {
      return `${endpoint} - Response contains false values: ${JSON.stringify(
        data
      )}`;
    }

    // Error signature logic for each API
    const errorSignature = getErrorSignature(endpoint, response, data);

    return errorSignature;
  } catch (error) {
    return `${endpoint} - Request Error: ${error.message}`;
  }
}

function hasFalseValues(obj) {
  // Recursive function to check for false values in the response
  for (const key of obj) {
    if (typeof obj[key] === "object") {
      if (hasFalseValues(obj[key])) {
        return true;
      }
    } else if (obj[key] === false) {
      return true;
    }
  }
  return false;
}

function getErrorSignature(endpoint, response, data) {
  if (response.status !== 200) {
    return `${endpoint} - Unexpected response status: ${response.status}`;
  }

  // Check for specific conditions indicating errors in the response data
  switch (endpoint) {
    case "cobiBalance":
      if (!isValidCobiBalance(data)) {
        return `${endpoint} - Invalid balance data: ${JSON.stringify(data)}`;
      }
      break;

    // Add cases for other endpoints as needed

    default:
      break;
  }

  return null; // No errors detected
}

// Add specific validation functions for each endpoint data
function isValidCobiBalance(data) {
  // Implement your validation logic for cobiBalance data
  // Example: Check if the balance values are valid numbers
  return true;
}

// Add validation functions for other endpoints as needed

module.exports = { checkApiErrors };
