/**
 * Keep Alive Script
 * Pings the health endpoint every 14 minutes to keep Render instance active
 * (Render spins down instances after 15 minutes of inactivity)
 */

const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds
let serverUrl = null;

export function startKeepAlive(baseUrl) {
  serverUrl = baseUrl;
  
  // Initial ping
  pingHealth();
  
  // Schedule periodic pings every 14 minutes
  setInterval(() => {
    pingHealth();
  }, PING_INTERVAL);
  
  console.log(`✓ Keep-alive started. Health check will run every 14 minutes.`);
}

async function pingHealth() {
  try {
    const healthUrl = `${serverUrl}/api/cron/health`;
    const response = await fetch(healthUrl, {
      method: 'GET',
      timeout: 5000,
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`[${new Date().toISOString()}] Cron health check successful:`, data);
    } else {
      console.warn(`[${new Date().toISOString()}] Cron health check returned status: ${response.status}`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cron health check failed:`, error.message);
  }
}
