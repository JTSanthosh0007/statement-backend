"""
User-Agent Configuration for API Access Control

This file contains configuration settings for blocking browser access
and allowing only specific User-Agent patterns for your Android app.
"""

# Browser User-Agent patterns to block
BROWSER_PATTERNS = [
    "mozilla/5.0",
    "chrome/",
    "firefox/",
    "safari/",
    "edge/",
    "opera/",
    "chromium/",
    "webkit/",
    "gecko/",
    "trident/",
    "msie",
    "internet explorer",
    "brave/",
    "vivaldi/",
    "maxthon/",
    "seamonkey/"
]

# Allowed User-Agent patterns (your Android app)
ALLOWED_PATTERNS = [
    "okhttp",  # Common Android HTTP client
    "retrofit",  # Android HTTP client
    "volley",  # Android HTTP client
    "android",  # Android system
    "your-app-name",  # Replace with your actual app name
    "statement-analyzer",  # Your app identifier
    "mobile-app",  # Generic mobile app identifier
    "api-client",  # Generic API client
    "react-native",  # React Native apps
    "flutter",  # Flutter apps
    "xamarin",  # Xamarin apps
    "cordova",  # Cordova/PhoneGap apps
    "ionic"  # Ionic apps
]

# Configuration options
CONFIG = {
    # Set to True to enable strict User-Agent checking (only allow patterns in ALLOWED_PATTERNS)
    "strict_mode": False,
    
    # Set to True to log all blocked requests
    "log_blocked_requests": True,
    
    # Custom error messages
    "browser_blocked_message": "This API is only accessible from mobile applications.",
    "unauthorized_message": "Access denied. Invalid User-Agent.",
    
    # HTTP status codes
    "browser_blocked_status": 404,
    "unauthorized_status": 403
}

def is_browser_user_agent(user_agent: str) -> bool:
    """Check if the User-Agent string indicates a browser."""
    user_agent_lower = user_agent.lower()
    return any(pattern in user_agent_lower for pattern in BROWSER_PATTERNS)

def is_allowed_user_agent(user_agent: str) -> bool:
    """Check if the User-Agent string is in the allowed patterns."""
    user_agent_lower = user_agent.lower()
    return any(pattern in user_agent_lower for pattern in ALLOWED_PATTERNS)

def should_block_request(user_agent: str) -> tuple[bool, str, int]:
    """
    Determine if a request should be blocked based on User-Agent.
    
    Returns:
        tuple: (should_block, message, status_code)
    """
    if is_browser_user_agent(user_agent):
        return True, CONFIG["browser_blocked_message"], CONFIG["browser_blocked_status"]
    
    if CONFIG["strict_mode"] and user_agent and not is_allowed_user_agent(user_agent):
        return True, CONFIG["unauthorized_message"], CONFIG["unauthorized_status"]
    
    return False, "", 200 