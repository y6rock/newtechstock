class LoginLimiter {
    constructor() {
        this.failedAttempts = new Map(); // email -> { count: number, blockedUntil: Date }
        this.maxAttempts = 3;
        this.blockDuration = 60000; // 1 minute in milliseconds
    }

    isBlocked(email) {
        const userAttempts = this.failedAttempts.get(email);
        if (!userAttempts) return false;

        // Check if user is still blocked
        if (userAttempts.blockedUntil && new Date() < userAttempts.blockedUntil) {
            return true;
        }

        // If block time has passed, reset attempts
        if (userAttempts.blockedUntil && new Date() >= userAttempts.blockedUntil) {
            this.failedAttempts.delete(email);
            return false;
        }

        return false;
    }

    recordFailedAttempt(email) {
        const userAttempts = this.failedAttempts.get(email) || { count: 0 };
        userAttempts.count++;

        if (userAttempts.count >= this.maxAttempts) {
            // Block user for 1 minute
            userAttempts.blockedUntil = new Date(Date.now() + this.blockDuration);
            console.log(`User ${email} blocked for 1 minute due to ${this.maxAttempts} failed login attempts`);
        }

        this.failedAttempts.set(email, userAttempts);
    }

    recordSuccessfulAttempt(email) {
        // Reset failed attempts on successful login
        this.failedAttempts.delete(email);
    }

    getRemainingBlockTime(email) {
        const userAttempts = this.failedAttempts.get(email);
        if (!userAttempts || !userAttempts.blockedUntil) return 0;

        const remaining = userAttempts.blockedUntil.getTime() - Date.now();
        return Math.max(0, Math.ceil(remaining / 1000)); // Return seconds remaining
    }

    getRemainingAttempts(email) {
        const userAttempts = this.failedAttempts.get(email);
        if (!userAttempts) return this.maxAttempts;
        return Math.max(0, this.maxAttempts - userAttempts.count);
    }

    // Clean up old entries periodically
    cleanup() {
        const now = new Date();
        for (const [email, attempts] of this.failedAttempts.entries()) {
            if (attempts.blockedUntil && now >= attempts.blockedUntil) {
                this.failedAttempts.delete(email);
            }
        }
    }
}

// Create a singleton instance
const loginLimiter = new LoginLimiter();

// Clean up old entries every 5 minutes
setInterval(() => {
    loginLimiter.cleanup();
}, 5 * 60 * 1000);

module.exports = loginLimiter; 