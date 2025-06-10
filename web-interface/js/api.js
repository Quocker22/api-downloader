import { CONFIG } from './config.js';

// API service for handling requests
export class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_URL;
        this.authToken = null;
    }

    // Set authentication token (API Key or Bearer)
    setAuthToken(token, scheme = 'Api-Key') {
        this.authToken = `${scheme} ${token}`;
    }

    // Clear authentication
    clearAuth() {
        this.authToken = null;
    }

    // Process URL with options
    async processUrl(url, options = {}) {
        // Valid API parameters according to Cobalt API schema
        const validParams = [
            'url', 'videoQuality', 'downloadMode', 'filenameStyle'
        ];

        // Merge with default options
        const allOptions = {
            ...CONFIG.DEFAULT_OPTIONS,
            ...options
        };

        // Build request data with only valid parameters
        const requestData = { url };

        // Add only valid parameters with non-empty values
        Object.keys(allOptions).forEach(key => {
            if (validParams.includes(key)) {
                const value = allOptions[key];
                if (value !== '' && value !== null && value !== undefined) {
                    requestData[key] = value;
                }
            }
        });

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': window.location.origin
        };

        // Add authentication if available
        if (this.authToken) {
            headers['Authorization'] = this.authToken;
        }

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            // Handle rate limiting
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
            }
            throw new Error(`${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    }

    // Get instance info
    async getInstanceInfo() {
        const response = await fetch(this.baseUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    // Create session (for turnstile authentication)
    async createSession(turnstileResponse) {
        const response = await fetch(`${this.baseUrl}session`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'cf-turnstile-response': turnstileResponse
            }
        });

        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Automatically set the bearer token
        if (data.token) {
            this.setAuthToken(data.token, 'Bearer');
        }

        return data;
    }

    async downloadFile(url) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    }
}
