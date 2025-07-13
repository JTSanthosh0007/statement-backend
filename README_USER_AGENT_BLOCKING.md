# User-Agent Blocking for API Access Control

This feature blocks browser access to your web app API and ensures it only works within your Android app by checking the User-Agent header.

## Overview

The User-Agent blocking middleware prevents web browsers from accessing your API endpoints while allowing legitimate mobile app requests. This is implemented for both FastAPI (Python) and Express.js (Node.js) servers.

## How It Works

1. **Browser Detection**: The middleware checks incoming requests for common browser User-Agent patterns
2. **Blocking**: Requests from browsers are blocked with a 404 error
3. **Logging**: Blocked requests are logged for monitoring
4. **Configurable**: Easy to customize patterns and behavior

## Configuration Files

### Python (FastAPI) - `user_agent_config.py`

```python
# Browser patterns to block
BROWSER_PATTERNS = [
    "mozilla/5.0",
    "chrome/",
    "firefox/",
    "safari/",
    # ... more patterns
]

# Allowed patterns for your Android app
ALLOWED_PATTERNS = [
    "okhttp",  # Common Android HTTP client
    "retrofit",  # Android HTTP client
    "android",  # Android system
    "your-app-name",  # Replace with your actual app name
    # ... more patterns
]

# Configuration options
CONFIG = {
    "strict_mode": False,  # Set to True for strict checking
    "log_blocked_requests": True,
    "browser_blocked_message": "This API is only accessible from mobile applications.",
    "unauthorized_message": "Access denied. Invalid User-Agent.",
    "browser_blocked_status": 404,
    "unauthorized_status": 403
}
```

### JavaScript (Express.js) - `user_agent_config.js`

```javascript
// Browser patterns to block
const BROWSER_PATTERNS = [
    'mozilla/5.0',
    'chrome/',
    'firefox/',
    'safari/',
    // ... more patterns
];

// Allowed patterns for your Android app
const ALLOWED_PATTERNS = [
    'okhttp',  // Common Android HTTP client
    'retrofit',  // Android HTTP client
    'android',  // Android system
    'your-app-name',  // Replace with your actual app name
    // ... more patterns
];

// Configuration options
const CONFIG = {
    strictMode: false,  // Set to true for strict checking
    logBlockedRequests: true,
    browserBlockedMessage: 'This API is only accessible from mobile applications.',
    unauthorizedMessage: 'Access denied. Invalid User-Agent.',
    browserBlockedStatus: 404,
    unauthorizedStatus: 403
};
```

## Setup Instructions

### 1. Update Your Android App User-Agent

In your Android app, set a custom User-Agent that includes one of the allowed patterns:

```java
// Java (Android)
OkHttpClient client = new OkHttpClient.Builder()
    .addInterceptor(chain -> {
        Request original = chain.request();
        Request request = original.newBuilder()
            .header("User-Agent", "YourAppName/1.0 (Android)")
            .build();
        return chain.proceed(request);
    })
    .build();
```

```kotlin
// Kotlin (Android)
val client = OkHttpClient.Builder()
    .addInterceptor { chain ->
        val original = chain.request()
        val request = original.newBuilder()
            .header("User-Agent", "YourAppName/1.0 (Android)")
            .build()
        chain.proceed(request)
    }
    .build()
```

### 2. Configure Allowed Patterns

Edit the configuration files to include your app's User-Agent pattern:

```python
# In user_agent_config.py
ALLOWED_PATTERNS = [
    "okhttp",
    "retrofit", 
    "android",
    "your-app-name",  # Add your actual app name here
    "statement-analyzer",  # Your app identifier
    # ... other patterns
]
```

### 3. Enable Strict Mode (Optional)

For maximum security, enable strict mode to only allow specific User-Agent patterns:

```python
# In user_agent_config.py
CONFIG = {
    "strict_mode": True,  # Only allow patterns in ALLOWED_PATTERNS
    # ... other settings
}
```

```javascript
// In user_agent_config.js
const CONFIG = {
    strictMode: true,  // Only allow patterns in ALLOWED_PATTERNS
    // ... other settings
};
```

## Testing

### Test Browser Access (Should Be Blocked)

```bash
# Test with curl using browser User-Agent
curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
     http://your-api-url/analyze

# Expected response: 404 with "This API is only accessible from mobile applications."
```

### Test Android App Access (Should Work)

```bash
# Test with curl using Android User-Agent
curl -H "User-Agent: YourAppName/1.0 (Android)" \
     http://your-api-url/analyze

# Expected response: Normal API response
```

## Common Android User-Agent Patterns

Here are common User-Agent patterns used by Android apps:

- **OkHttp**: `okhttp/4.9.1`
- **Retrofit**: `okhttp/4.9.1` (uses OkHttp)
- **Volley**: `Apache-HttpClient/UNAVAILABLE (java 1.4)`
- **Android System**: `Dalvik/2.1.0 (Linux; U; Android 10; SM-G975F Build/QP1A.190711.020)`
- **React Native**: `ReactNative/0.70.0`
- **Flutter**: `Dart/2.19.0 (dart:io)`

## Security Considerations

1. **User-Agent Spoofing**: User-Agent headers can be easily spoofed. This is a basic level of protection.
2. **Additional Security**: Consider implementing:
   - API keys
   - JWT tokens
   - Certificate pinning
   - IP whitelisting
   - Rate limiting

## Troubleshooting

### Issue: Android app requests are being blocked

1. Check your app's User-Agent string
2. Add the pattern to `ALLOWED_PATTERNS`
3. Ensure `strict_mode` is set to `False` initially
4. Check server logs for blocked requests

### Issue: Browser requests are not being blocked

1. Verify the middleware is properly loaded
2. Check if the User-Agent pattern is in `BROWSER_PATTERNS`
3. Ensure the middleware is added before other middleware

### Issue: API calls from Postman/cURL are blocked

This is expected behavior. To test your API:
1. Use a custom User-Agent header
2. Set up a test endpoint that bypasses the middleware
3. Use your Android app for testing

## Monitoring

The middleware logs blocked requests when `log_blocked_requests` is enabled. Monitor your server logs to:

- Track blocked browser attempts
- Identify potential security issues
- Debug User-Agent configuration problems

## Example Log Output

```
WARNING: Request blocked. User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
WARNING: Request blocked. User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
```

## Files Modified

- `api_server.py` - FastAPI server with User-Agent middleware
- `server.js` - Express.js server with User-Agent middleware  
- `user_agent_config.py` - Python configuration file
- `user_agent_config.js` - JavaScript configuration file
- `README_USER_AGENT_BLOCKING.md` - This documentation file 