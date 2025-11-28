// Footer Component - Reusable footer for all pages
(function() {
    // Auto-initialize footer when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFooter);
    } else {
        initFooter();
    }

    function initFooter() {
        // Support both footer-container and footer-component IDs
        const footerContainer = document.getElementById('footer-container') || 
                              document.getElementById('footer-component');
        if (footerContainer) {
            footerContainer.innerHTML = getFooterHTML();
        }
    }

    function getFooterHTML() {
        return `
            <footer class="bg-gray-900 text-gray-300 pt-16 pb-8 mt-12">
                <div class="container mx-auto px-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        <!-- Company Info -->
                        <div>
                            <div class="flex items-center space-x-3 mb-6">
                                <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-plane text-white text-xl"></i>
                                </div>
                                <h3 class="text-2xl font-bold text-white">Soft Flight</h3>
                            </div>
                            <p class="text-gray-400 mb-4">Your trusted partner for hassle-free flight bookings worldwide. Experience seamless travel planning with us.</p>
                            <div class="flex space-x-4">
                                <a href="#" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition">
                                    <i class="fab fa-facebook-f"></i>
                                </a>
                                <a href="#" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition">
                                    <i class="fab fa-twitter"></i>
                                </a>
                                <a href="#" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition">
                                    <i class="fab fa-instagram"></i>
                                </a>
                                <a href="#" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition">
                                    <i class="fab fa-linkedin-in"></i>
                                </a>
                            </div>
                        </div>
                        
                        <!-- Quick Links -->
                        <div>
                            <h4 class="text-lg font-bold text-white mb-6">Quick Links</h4>
                            <ul class="space-y-3">
                                <li><a href="/" class="hover:text-orange-500 transition">Home</a></li>
                                <li><a href="/flights" class="hover:text-orange-500 transition">Flights</a></li>
                                <li><a href="/#about" class="hover:text-orange-500 transition">About Us</a></li>
                                <li><a href="/#contact" class="hover:text-orange-500 transition">Contact</a></li>
                                <li><a href="#" class="hover:text-orange-500 transition">Privacy Policy</a></li>
                                <li><a href="#" class="hover:text-orange-500 transition">Terms & Conditions</a></li>
                            </ul>
                        </div>
                        
                        <!-- Support -->
                        <div>
                            <h4 class="text-lg font-bold text-white mb-6">Support</h4>
                            <ul class="space-y-3">
                                <li><a href="#" class="hover:text-orange-500 transition">Help Center</a></li>
                                <li><a href="#" class="hover:text-orange-500 transition">FAQs</a></li>
                                <li><a href="#" class="hover:text-orange-500 transition">How to Book</a></li>
                                <li><a href="#" class="hover:text-orange-500 transition">Cancellation Policy</a></li>
                                <li><a href="#" class="hover:text-orange-500 transition">Payment Methods</a></li>
                                <li><a href="#" class="hover:text-orange-500 transition">Customer Support</a></li>
                            </ul>
                        </div>
                        
                        <!-- Contact Info -->
                        <div>
                            <h4 class="text-lg font-bold text-white mb-6">Contact Us</h4>
                            <ul class="space-y-4">
                                <li class="flex items-start space-x-3">
                                    <i class="fas fa-map-marker-alt text-orange-500 mt-1"></i>
                                    <span>123 Flight Street, Aviation City, AC 12345</span>
                                </li>
                                <li class="flex items-start space-x-3">
                                    <i class="fas fa-phone text-orange-500 mt-1"></i>
                                    <span>+1 (555) 123-4567</span>
                                </li>
                                <li class="flex items-start space-x-3">
                                    <i class="fas fa-envelope text-orange-500 mt-1"></i>
                                    <span>support@softflight.com</span>
                                </li>
                                <li class="flex items-start space-x-3">
                                    <i class="fas fa-clock text-orange-500 mt-1"></i>
                                    <span>24/7 Customer Service</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- Bottom Bar -->
                    <div class="border-t border-gray-800 pt-8">
                        <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            <p class="text-gray-400 text-sm">
                                © 2025 Soft Flight. All rights reserved.
                            </p>
                            <div class="flex items-center space-x-6 text-sm">
                                <a href="#" class="hover:text-orange-500 transition">Privacy</a>
                                <span class="text-gray-600">|</span>
                                <a href="#" class="hover:text-orange-500 transition">Terms</a>
                                <span class="text-gray-600">|</span>
                                <a href="#" class="hover:text-orange-500 transition">Sitemap</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }

    // Export for manual initialization if needed
    window.initFooter = initFooter;
})();
