/**
 * Environment Loader Script
 * Tự động load environment configuration dựa trên URL hoặc environment variable
 */

(function() {
    'use strict';
    
    // Function to detect environment
    function detectEnvironment() {
        var hostname = window.location.hostname;
        var protocol = window.location.protocol;
        
        // Vercel production detection
        if (hostname.includes('vercel.app') || hostname.includes('now.sh')) {
            return 'production';
        }
        
        // Production detection
        if (hostname === 'api.bookstore.com' || hostname === 'bookstore.com') {
            return 'production';
        }
        
        // Staging detection
        if (hostname.includes('staging') || hostname === 'staging-api.bookstore.com') {
            return 'staging';
        }
        
        // Development detection (localhost, 127.0.0.1, etc.)
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
            return 'development';
        }
        
        // Default to production for Vercel deployments
        return 'production';
    }
    
    // Function to load environment script
    function loadEnvironmentScript(env) {
        var script = document.createElement('script');
        script.src = 'env/' + env + '.js';
        script.async = false; // Load synchronously to ensure ENV_CONFIG is available
        
        script.onload = function() {
            console.log('✅ Environment script loaded:', env);
            console.log('Environment:', window.ENV_CONFIG ? window.ENV_CONFIG.ENVIRONMENT : 'unknown');
            console.log('API Base URL:', window.ENV_CONFIG ? window.ENV_CONFIG.API_BASE_URL : 'unknown');
        };
        
        script.onerror = function() {
            console.error('❌ Failed to load environment script:', env);
            console.log('Falling back to default configuration');
        };
        
        document.head.appendChild(script);
    }
    
    // Function to load environment from URL parameter
    function loadEnvironmentFromURL() {
        var urlParams = new URLSearchParams(window.location.search);
        var envParam = urlParams.get('env');
        
        if (envParam && ['development', 'staging', 'production'].includes(envParam)) {
            console.log('Environment from URL parameter:', envParam);
            return envParam;
        }
        
        return null;
    }
    
    // Function to load environment from localStorage
    function loadEnvironmentFromStorage() {
        var storedEnv = localStorage.getItem('bookstore_environment');
        
        if (storedEnv && ['development', 'staging', 'production'].includes(storedEnv)) {
            console.log('Environment from localStorage:', storedEnv);
            return storedEnv;
        }
        
        return null;
    }
    
    // Main function to initialize environment
    function initializeEnvironment() {
        console.log('🔧 Initializing environment...');
        
        // Priority order: URL parameter > localStorage > auto-detect
        var environment = loadEnvironmentFromURL() || 
                        loadEnvironmentFromStorage() || 
                        detectEnvironment();
        
        console.log('Selected environment:', environment);
        
        // Load the environment script
        loadEnvironmentScript(environment);
        
        // Store the selected environment in localStorage for future use
        localStorage.setItem('bookstore_environment', environment);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEnvironment);
    } else {
        initializeEnvironment();
    }
    
    // Expose utility functions globally for debugging
    window.BookstoreEnv = {
        detectEnvironment: detectEnvironment,
        loadEnvironmentScript: loadEnvironmentScript,
        setEnvironment: function(env) {
            if (['development', 'staging', 'production'].includes(env)) {
                localStorage.setItem('bookstore_environment', env);
                console.log('Environment set to:', env);
                console.log('Please refresh the page to apply changes');
            } else {
                console.error('Invalid environment:', env);
            }
        },
        getCurrentEnvironment: function() {
            return localStorage.getItem('bookstore_environment') || detectEnvironment();
        },
        clearEnvironment: function() {
            localStorage.removeItem('bookstore_environment');
            console.log('Environment preference cleared');
        }
    };
    
})();
