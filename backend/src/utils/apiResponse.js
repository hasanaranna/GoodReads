// API response helper

export function successResponse(message, data = null) {
    return {
        success: true,
        message,
        data
    };
}

export function errorResponse(message, details = null) {
    return {
        success: false,
        error: {
            message,
            details
        }
    };
}
