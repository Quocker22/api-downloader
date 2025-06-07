import { CONFIG } from './config.js';

// API service for handling requests
export class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_URL;
    }

    async processUrl(url) {
        const requestData = { url };
        
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': window.location.origin
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }

        const data = await response.json();
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
