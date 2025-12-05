/**
 * Database Configuration
 * Toggle between mock and real Azure backend here
 */

// Set to 'mock' for testing, 'azure' for production
export const DATABASE_MODE: 'mock' | 'azure' = 'mock';

// Azure backend URL (only used when DATABASE_MODE is 'azure')
export const AZURE_API_URL = "https://your-azure-function-app.azurewebsites.net/api";

// For development/debugging
export const DEBUG = true;
