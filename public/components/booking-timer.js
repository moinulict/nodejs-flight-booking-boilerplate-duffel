/**
 * Booking Timer Component
 * Displays countdown timer for booking completion
 */

class BookingTimer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Booking timer container not found:', containerId);
            return;
        }

        this.timerDuration = options.timerDuration || 15; // minutes from config
        this.onExpire = options.onExpire || this.defaultExpireHandler;
        this.warningThreshold = options.warningThreshold || 5; // minutes
        this.intervalId = null;
        
        this.init();
    }

    init() {
        const startTime = localStorage.getItem('booking_timer_start');
        
        if (!startTime) {
            console.warn('No booking timer start time found');
            this.container.style.display = 'none';
            return;
        }

        this.startTime = parseInt(startTime);
        this.endTime = this.startTime + (this.timerDuration * 60 * 1000); // Convert minutes to ms
        
        this.render();
        this.startCountdown();
    }

    render() {
        this.container.innerHTML = `
            <div id="timer-card" class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-orange-100">
                <div class="bg-gradient-to-r from-orange-50 to-red-50 px-4 py-3 border-b border-orange-200">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                            </svg>
                            <span class="text-sm font-semibold text-gray-700">Time Remaining</span>
                        </div>
                        <div id="timer-display" class="text-2xl font-bold text-red-600 tracking-wider">
                            --:--
                        </div>
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div class="bg-gray-100 h-2 relative overflow-hidden">
                    <div id="timer-progress-bar" class="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000 ease-linear" style="width: 100%"></div>
                </div>
                
                <!-- Status Message -->
                <div class="px-4 py-2 bg-white">
                    <p id="timer-status-text" class="text-xs text-gray-600 text-center">
                        Complete your booking before time expires
                    </p>
                </div>
            </div>
        `;
    }

    startCountdown() {
        this.updateDisplay();
        
        this.intervalId = setInterval(() => {
            this.updateDisplay();
        }, 1000);
    }

    updateDisplay() {
        const now = Date.now();
        const remainingMs = this.endTime - now;

        if (remainingMs <= 0) {
            this.handleExpire();
            return;
        }

        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        
        // Calculate progress percentage
        const totalDuration = this.timerDuration * 60 * 1000;
        const elapsed = totalDuration - remainingMs;
        const progressPercent = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
        const remainingPercent = 100 - progressPercent;

        const display = document.getElementById('timer-display');
        const statusText = document.getElementById('timer-status-text');
        const progressBar = document.getElementById('timer-progress-bar');
        const timerCard = document.getElementById('timer-card');

        if (display) {
            display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Update progress bar
        if (progressBar) {
            progressBar.style.width = `${remainingPercent}%`;
        }

        // Warning state when under threshold
        if (minutes < this.warningThreshold) {
            if (timerCard) {
                timerCard.className = 'bg-white rounded-lg shadow-lg overflow-hidden border-2 border-red-500 animate-pulse';
            }
            if (statusText) {
                statusText.textContent = '⚠️ Hurry! Your booking time is running out!';
                statusText.className = 'text-xs text-red-600 font-bold text-center';
            }
            if (display) {
                display.className = 'text-2xl font-bold text-red-600 tracking-wider';
            }
            if (progressBar) {
                progressBar.className = 'h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-1000 ease-linear';
            }
        }
    }

    handleExpire() {
        clearInterval(this.intervalId);
        
        const display = document.getElementById('timer-display');
        const statusText = document.getElementById('timer-status-text');
        const progressBar = document.getElementById('timer-progress-bar');
        const timerCard = document.getElementById('timer-card');

        if (display) {
            display.textContent = '0:00';
        }
        if (statusText) {
            statusText.textContent = '⏰ Time Expired! Redirecting...';
            statusText.className = 'text-xs text-red-600 font-bold text-center';
        }
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.className = 'h-full bg-red-600 transition-all duration-1000 ease-linear';
        }
        if (timerCard) {
            timerCard.className = 'bg-white rounded-lg shadow-lg overflow-hidden border-2 border-red-600';
        }

        // Call the expiration handler
        this.onExpire();
    }

    defaultExpireHandler() {
        // Clear booking data
        localStorage.removeItem('pending_booking_data');
        localStorage.removeItem('booking_timer_start');
        
        // Show expiration message
        setTimeout(() => {
            alert('Your booking time has expired. Please search for flights again.');
            window.location.href = '/flights.html';
        }, 1000);
    }

    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    static clearTimer() {
        localStorage.removeItem('booking_timer_start');
    }

    static hasActiveTimer() {
        return localStorage.getItem('booking_timer_start') !== null;
    }

    static getRemainingTime(timerDuration) {
        const startTime = localStorage.getItem('booking_timer_start');
        if (!startTime) return 0;

        const start = parseInt(startTime);
        const end = start + (timerDuration * 60 * 1000);
        const remaining = end - Date.now();

        return Math.max(0, remaining);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingTimer;
}
