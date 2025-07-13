/**
 * User-Agent Configuration for API Access Control
 * 
 * This file contains configuration settings for blocking browser access
 * and allowing only specific User-Agent patterns for your Android app.
 */

// Browser User-Agent patterns to block
const BROWSER_PATTERNS = [
    'mozilla/5.0',
    'chrome/',
    'firefox/',
    'safari/',
    'edge/',
    'opera/',
    'chromium/',
    'webkit/',
    'gecko/',
    'trident/',
    'msie',
    'internet explorer',
    'brave/',
    'vivaldi/',
    'maxthon/',
    'seamonkey/'
];

// Allowed User-Agent patterns (your Android app)
const ALLOWED_PATTERNS = [
    'okhttp',  // Common Android HTTP client
    'retrofit',  // Android HTTP client
    'volley',  // Android HTTP client
    'android',  // Android system
    'your-app-name',  // Replace with your actual app name
    'statement-analyzer',  // Your app identifier
    'mobile-app',  // Generic mobile app identifier
    'api-client',  // Generic API client
    'react-native',  // React Native apps
    'flutter',  // Flutter apps
    'xamarin',  // Xamarin apps
    'cordova',  // Cordova/PhoneGap apps
    'ionic'  // Ionic apps
];

// Configuration options
const CONFIG = {
    // Set to true to enable strict User-Agent checking (only allow patterns in ALLOWED_PATTERNS)
    strictMode: false,
    
    // Set to true to log all blocked requests
    logBlockedRequests: true,
    
    // Custom error messages
    browserBlockedMessage: 'This API is only accessible from mobile applications.',
    unauthorizedMessage: 'Access denied. Invalid User-Agent.',
    
    // HTTP status codes
    browserBlockedStatus: 404,
    unauthorizedStatus: 403
};

/**
 * Check if the User-Agent string indicates a browser
 * @param {string} userAgent - The User-Agent string to check
 * @returns {boolean} - True if it's a browser User-Agent
 */
function isBrowserUserAgent(userAgent) {
    const userAgentLower = userAgent.toLowerCase();
    return BROWSER_PATTERNS.some(pattern => userAgentLower.includes(pattern));
}

/**
 * Check if the User-Agent string is in the allowed patterns
 * @param {string} userAgent - The User-Agent string to check
 * @returns {boolean} - True if it's an allowed User-Agent
 */
function isAllowedUserAgent(userAgent) {
    const userAgentLower = userAgent.toLowerCase();
    return ALLOWED_PATTERNS.some(pattern => userAgentLower.includes(pattern));
}

/**
 * Determine if a request should be blocked based on User-Agent
 * @param {string} userAgent - The User-Agent string to check
 * @returns {Object} - Object containing shouldBlock, message, and statusCode
 */
function shouldBlockRequest(userAgent) {
    if (isBrowserUserAgent(userAgent)) {
        return {
            shouldBlock: true,
            message: CONFIG.browserBlockedMessage,
            statusCode: CONFIG.browserBlockedStatus
        };
    }
    
    if (CONFIG.strictMode && userAgent && !isAllowedUserAgent(userAgent)) {
        return {
            shouldBlock: true,
            message: CONFIG.unauthorizedMessage,
            statusCode: CONFIG.unauthorizedStatus
        };
    }
    
    return {
        shouldBlock: false,
        message: '',
        statusCode: 200
    };
}

module.exports = {
    BROWSER_PATTERNS,
    ALLOWED_PATTERNS,
    CONFIG,
    isBrowserUserAgent,
    isAllowedUserAgent,
    shouldBlockRequest
}; 