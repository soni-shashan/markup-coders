class VSCodeEditor {
    constructor() {
        this.currentTeam = null;
        this.fileSystem = {
            files: new Map(),
            folders: new Set(['css', 'js', 'pages', 'assets'])
        };
        this.openTabs = new Map();
        this.activeTab = null;
        this.liveServerWindow = null;
        this.liveServerPort = null;
        this.autoSaveInterval = null;
        this.editorHistory = new Map();
        this.liveServerBaseUrl = null;
        this.selectedFolder = null; // ADD THIS LINE
        
        this.init();
    }


    async init() {
        try {
            this.showLoadingOverlay();
            
            console.log('Starting authentication check...');
            
            const authStatus = await this.checkAuthenticationStatus();
            
            if (!authStatus.authenticated) {
                console.log('User not authenticated, showing login prompt');
                this.hideLoadingOverlay();
                this.showLoginPrompt();
                return;
            }
            
            this.currentTeam = authStatus.team;
            console.log('Authentication successful:', this.currentTeam);
            
            this.hideLoadingOverlay();
            
            await this.updateTeamDisplay();
            await this.loadSavedProject();
            
            this.setupEventListeners();
            this.initializeDefaultFiles();
            this.renderFileTree();
            this.startAutoSave();
            
            console.log('Initialization complete');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.hideLoadingOverlay();
            this.showAlert('Error loading team information: ' + error.message, 'error');
            this.showLoginPrompt();
        }
    }

    async checkAuthenticationStatus() {
        try {
            console.log('Making request to /auth/status...');
            
            const response = await fetch('/auth/status', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Auth check result:', result);
            
            return result;
            
        } catch (error) {
            console.error('Auth status check error:', error);
            return { authenticated: false };
        }
    }

    showLoadingOverlay() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoadingOverlay() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showLoginPrompt() {
        const loginPrompt = document.getElementById('loginPrompt');
        loginPrompt.style.display = 'flex';
        
        // Setup login button
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        googleLoginBtn.addEventListener('click', () => {
            window.location.href = '/auth/google';
        });
    }

    hideLoginPrompt() {
        const loginPrompt = document.getElementById('loginPrompt');
        loginPrompt.style.display = 'none';
    }

    async updateTeamDisplay() {
        if (this.currentTeam) {
            document.getElementById('teamName').textContent = this.currentTeam.teamName || 'Unknown Team';
            document.getElementById('teamLeader').textContent = `Leader: ${this.currentTeam.teamLeaderName || 'Unknown'}`;
            document.getElementById('studentId').textContent = `ID: ${this.currentTeam.studentId || 'Unknown'}`;
            document.getElementById('pcIP').textContent = `Email: ${this.currentTeam.email || 'Unknown'}`;
            
            document.getElementById('submitBtn').disabled = false;
        }
    }

    initializeDefaultFiles() {
        if (this.fileSystem.files.size > 0) return; // Already initialized

        const defaultFiles = [
            {
                path: 'index.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project - Eye Coders Club</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <nav>
            <div class="logo">
                <h1>My Website</h1>
            </div>
            <ul class="nav-links">
                <li><a href="index.html" class="active">Home</a></li>
                <li><a href="pages/about.html">About</a></li>
                <li><a href="pages/contact.html">Contact</a></li>
                <li><a href="pages/services.html">Services</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section class="hero">
            <div class="hero-content">
                <h2>Welcome to Eye Coders Club!</h2>
                <p>Start building amazing projects with our powerful IDE.</p>
                <button class="cta-button" onclick="showMessage()">Get Started</button>
            </div>
        </section>
        
        <section class="features">
            <div class="container">
                <h3>Our Features</h3>
                <div class="feature-grid">
                    <div class="feature-card">
                        <i class="fas fa-code"></i>
                        <h4>Modern Editor</h4>
                        <p>VS Code-like experience with syntax highlighting</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-eye"></i>
                        <h4>Live Preview</h4>
                        <p>See your changes instantly with our live server</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-users"></i>
                        <h4>Team Collaboration</h4>
                        <p>Work together on projects seamlessly</p>
                    </div>
                </div>
            </div>
        </section>
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; 2024 Eye Coders Club. All rights reserved.</p>
        </div>
    </footer>
    
    <script src="js/script.js"></script>
</body>
</html>`,
                type: 'html'
            },
            {
                path: 'css/style.css',
                content: `/* Eye Coders Club - Main Stylesheet */

/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background: #f4f4f4;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header and Navigation */
header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 0;
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.logo h1 {
    font-size: 1.8rem;
    font-weight: bold;
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-links a {
    color: white;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.3s ease;
    padding: 0.5rem 1rem;
    border-radius: 5px;
}

.nav-links a:hover,
.nav-links a.active {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

/* Main Content */
main {
    margin-top: 80px;
    min-height: calc(100vh - 160px);
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 6rem 0;
    text-align: center;
}

.hero-content h2 {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    animation: fadeInUp 1s ease;
}

.hero-content p {
    font-size: 1.3rem;
    margin-bottom: 2rem;
    animation: fadeInUp 1s ease 0.2s both;
}

.cta-button {
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    animation: fadeInUp 1s ease 0.4s both;
}

.cta-button:hover {
    background: #ff5252;
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
}

/* Features Section */
.features {
    padding: 6rem 0;
    background: white;
}

.features h3 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.feature-card {
    background: #f8f9fa;
    padding: 2rem;
    border-radius: 15px;
    text-align: center;
    transition: all 0.3s ease;
    border: 1px solid #e9ecef;
}

.feature-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    background: white;
}

.feature-card i {
    font-size: 3rem;
    color: #667eea;
    margin-bottom: 1rem;
}

.feature-card h4 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #333;
}

.feature-card p {
    color: #666;
    line-height: 1.6;
}

/* Footer */
footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem 0;
}

/* Animations */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Notification Styles */
.notification {
    position: fixed;
    top: 100px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    animation: slideInRight 0.3s ease;
    max-width: 350px;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 15px;
}

.notification-content button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    padding: 0;
    transition: all 0.2s ease;
}

.notification-content button:hover {
    background: rgba(255, 255, 255, 0.3);
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Responsive Design */
@media (max-width: 768px) {
    .nav-links {
        flex-direction: column;
        gap: 1rem;
    }
    
    .hero-content h2 {
        font-size: 2.5rem;
    }
    
    .hero-content p {
        font-size: 1.1rem;
    }
    
    .feature-grid {
        grid-template-columns: 1fr;
    }
    
    nav {
        flex-direction: column;
        gap: 1rem;
    }
    
    main {
        margin-top: 120px;
    }
}

/* Page-specific styles */
.page-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 4rem 0;
    text-align: center;
}

.page-content {
    padding: 4rem 0;
    background: white;
}

.page-content h2 {
    margin-bottom: 2rem;
    color: #333;
}

.page-content p {
    margin-bottom: 1rem;
    line-height: 1.8;
    color: #666;
}

/* Contact Form Styles */
.contact-form {
    max-width: 600px;
    margin: 0 auto;
    background: #f8f9fa;
    padding: 2rem;
    border-radius: 15px;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group textarea {
    resize: vertical;
    min-height: 120px;
}

.submit-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 25px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

/* Services Grid */
.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.service-item {
    background: white;
    padding: 2rem;
    border-radius: 15px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
}

.service-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.service-item h4 {
    color: #667eea;
    margin-bottom: 1rem;
    font-size: 1.3rem;
}

.service-item p {
    color: #666;
    line-height: 1.6;
}`,
                type: 'css'
            },
            {
                path: 'js/script.js',
                content: `// Eye Coders Club - Main JavaScript File
console.log('🚀 Eye Coders Club Project Loaded Successfully!');

// Global variables
let isAnimationEnabled = true;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM Content Loaded - Initializing...');
    
    initializeAnimations();
    setupEventListeners();
    setupNavigationHighlighting();
    
    console.log('✅ Application initialized successfully!');
});

// Initialize page animations
function initializeAnimations() {
    // Add fade-in animation to hero section
    const hero = document.querySelector('.hero-content');
    if (hero && isAnimationEnabled) {
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(30px)';
        hero.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            hero.style.opacity = '1';
            hero.style.transform = 'translateY(0)';
        }, 300);
    }
    
    // Animate feature cards on scroll
    const observeElements = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        });
        
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach((card, index) => {
            card.style.animation = \`fadeInUp 0.6s ease \${index * 0.2}s both paused\`;
            observer.observe(card);
        });
    };
    
    if (document.querySelectorAll('.feature-card').length > 0) {
        observeElements();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add hover effects to navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        link.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateY(0) scale(1)';
            }
        });
    });
    
    // Add click effects to buttons
    const buttons = document.querySelectorAll('button, .cta-button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Add ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = \`
                position: absolute;
                width: \${size}px;
                height: \${size}px;
                left: \${x}px;
                top: \${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            \`;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Form submission handling
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmission);
    });
    
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Setup navigation highlighting
function setupNavigationHighlighting() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Interactive message function
function showMessage() {
    const messages = [
        '🎉 Welcome to Eye Coders Club!',
        '💻 Keep coding and stay awesome!',
        '⭐ You are building something amazing!',
        '🎯 Great job on your project!',
        '🌟 The future is bright with your code!',
        '🚀 Ready to launch your next big idea?',
        '🔥 Your creativity knows no bounds!',
        '💡 Innovation starts with a single line of code!'
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    showNotification(randomMessage);
    
    // Add visual feedback to the button
    const button = event.target;
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 150);
    
    // Log interaction
    logUserInteraction('message_button_clicked', { message: randomMessage });
}

// Enhanced notification system
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = \`notification notification-\${type}\`;
    
    const iconMap = {
        'info': '💡',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    };
    
    const icon = iconMap[type] || '💡';
    
    notification.innerHTML = \`
        <div class="notification-content">
            <span class="notification-icon">\${icon}</span>
            <span class="notification-message">\${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" title="Close">
                ×
            </button>
        </div>
    \`;
    
    // Add notification styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = \`
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                animation: slideInRight 0.3s ease;
                max-width: 350px;
                backdrop-filter: blur(10px);
            }
            
            .notification-success {
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            }
            
            .notification-warning {
                background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
            }
            
            .notification-error {
                background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .notification-icon {
                font-size: 18px;
            }
            
            .notification-message {
                flex: 1;
                font-weight: 500;
            }
            
            .notification-content button {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                padding: 0;
                transition: all 0.2s ease;
            }
            
            .notification-content button:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        \`;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after specified duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, duration);
    }
    
    return notification;
}

// Form submission handler
function handleFormSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"], .submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
        showNotification('Message sent successfully! We will get back to you soon.', 'success');
        form.reset();
        
        // Restore button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        logUserInteraction('form_submitted', data);
    }, 2000);
}

// Utility functions
function getCurrentTime() {
    return new Date().toLocaleTimeString();
}

function getCurrentDate() {
    return new Date().toLocaleDateString();
}

function logUserInteraction(action, data = {}) {
    console.log(\`[\${getCurrentTime()}] User Action: \${action}\`, data);
    
    // Here you could send analytics data to your server
    // analytics.track(action, data);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Page-specific functionality
function initializePageSpecific() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch(currentPage) {
        case 'index.html':
            initializeHomePage();
            break;
        case 'about.html':
            initializeAboutPage();
            break;
        case 'contact.html':
            initializeContactPage();
            break;
        case 'services.html':
            initializeServicesPage();
            break;
    }
}

function initializeHomePage() {
    console.log('🏠 Initializing Home Page');
    // Home page specific functionality
}

function initializeAboutPage() {
    console.log('ℹ️ Initializing About Page');
    // About page specific functionality
}

function initializeContactPage() {
    console.log('📞 Initializing Contact Page');
    // Contact page specific functionality
    
    // Add real-time form validation
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearValidationError);
    });
}

function initializeServicesPage() {
    console.log('🛠️ Initializing Services Page');
    // Services page specific functionality
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Remove existing error
    clearValidationError(e);
    
    let isValid = true;
    let errorMessage = '';
    
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    } else if (field.type === 'email' && value && !isValidEmail(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
    } else if (field.name === 'phone' && value && !isValidPhone(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid phone number';
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    }
}

function clearValidationError(e) {
    const field = e.target;
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
    field.style.borderColor = '';
}

function showFieldError(field, message) {
    field.style.borderColor = '#dc3545';
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.style.cssText = \`
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        font-weight: 500;
    \`;
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
}

function isValidEmail(email) {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\\+]?[1-9][\\d\\s\\-\\(\\)]{7,14}$/;
    return phoneRegex.test(phone.replace(/\\s/g, ''));
}

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', initializePageSpecific);

// Export functions for global access
window.showMessage = showMessage;
window.showNotification = showNotification;
window.logUserInteraction = logUserInteraction;

console.log('📝 Script.js loaded successfully!');`,
                type: 'js'
            },
            {
                path: 'pages/about.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Us - Eye Coders Club</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <header>
        <nav>
            <div class="logo">
                <h1>My Website</h1>
            </div>
            <ul class="nav-links">
                <li><a href="../index.html">Home</a></li>
                <li><a href="about.html" class="active">About</a></li>
                <li><a href="contact.html">Contact</a></li>
                <li><a href="services.html">Services</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section class="page-header">
            <div class="container">
                <h2>About Eye Coders Club</h2>
                <p>Learn more about our mission, vision, and the amazing team behind our success.</p>
            </div>
        </section>
        
        <section class="page-content">
            <div class="container">
                <h2>Our Story</h2>
                <p>Eye Coders Club was founded with a simple yet powerful vision: to create a platform where aspiring developers can learn, grow, and showcase their talents. We believe that coding is not just about writing lines of code, but about solving real-world problems and making a positive impact on society.</p>
                
                <p>Our journey began in 2024 when a group of passionate developers came together to create something meaningful. We noticed that many talented individuals lacked the proper platform to demonstrate their skills and connect with like-minded peers. That's when Eye Coders Club was born.</p>
                
                <h2>Our Mission</h2>
                <p>To empower developers of all skill levels by providing them with cutting-edge tools, comprehensive resources, and a supportive community where they can thrive and achieve their full potential.</p>
                
                <h2>Our Vision</h2>
                <p>To become the leading platform for developer collaboration and innovation, fostering a global community of creators who are passionate about technology and committed to making the world a better place through code.</p>
                
                <h2>What We Offer</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <i class="fas fa-laptop-code"></i>
                        <h4>Modern Development Environment</h4>
                        <p>Experience coding like never before with our VS Code-inspired editor that includes syntax highlighting, auto-completion, and real-time collaboration features.</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-users"></i>
                        <h4>Community Support</h4>
                        <p>Join thousands of developers worldwide in our vibrant community where knowledge sharing and mutual support are at the core of everything we do.</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-trophy"></i>
                        <h4>Competitions & Challenges</h4>
                        <p>Participate in exciting coding competitions and challenges designed to test your skills and help you grow as a developer.</p>
                    </div>
                </div>
                
                <h2>Our Values</h2>
                <p><strong>Innovation:</strong> We constantly strive to push the boundaries of what's possible in web development and education.</p>
                <p><strong>Inclusivity:</strong> We welcome developers from all backgrounds and skill levels, creating an environment where everyone can succeed.</p>
                <p><strong>Excellence:</strong> We are committed to delivering the highest quality tools and resources to our community.</p>
                <p><strong>Collaboration:</strong> We believe that the best solutions come from working together and sharing knowledge.</p>
                
                <h2>Join Our Journey</h2>
                <p>Whether you're a beginner taking your first steps into the world of coding or an experienced developer looking to expand your horizons, Eye Coders Club has something for you. Join us today and become part of a community that's shaping the future of technology.</p>
                
                <div style="text-align: center; margin-top: 2rem;">
                    <button class="cta-button" onclick="showNotification('Welcome to our community! 🎉', 'success')">
                        Join Our Community
                    </button>
                </div>
            </div>
        </section>
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; 2024 Eye Coders Club. All rights reserved.</p>
        </div>
    </footer>
    
    <script src="../js/script.js"></script>
</body>
</html>`,
                type: 'html'
            },
            {
                path: 'pages/contact.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Us - Eye Coders Club</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <header>
        <nav>
            <div class="logo">
                <h1>My Website</h1>
            </div>
            <ul class="nav-links">
                <li><a href="../index.html">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="contact.html" class="active">Contact</a></li>
                <li><a href="services.html">Services</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section class="page-header">
            <div class="container">
                <h2>Contact Us</h2>
                <p>Get in touch with us. We'd love to hear from you and help you with your coding journey.</p>
            </div>
        </section>
        
        <section class="page-content">
            <div class="container">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start;">
                    <div>
                        <h2>Send us a Message</h2>
                        <p>Have a question, suggestion, or just want to say hello? Fill out the form below and we'll get back to you as soon as possible.</p>
                        
                        <form class="contact-form" id="contactForm">
                            <div class="form-group">
                                <label for="name">Full Name *</label>
                                <input type="text" id="name" name="name" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="email">Email Address *</label>
                                <input type="email" id="email" name="email" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="phone">Phone Number</label>
                                <input type="tel" id="phone" name="phone">
                            </div>
                            
                            <div class="form-group">
                                <label for="subject">Subject *</label>
                                <input type="text" id="subject" name="subject" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="message">Message *</label>
                                <textarea id="message" name="message" required placeholder="Tell us how we can help you..."></textarea>
                            </div>
                            
                            <button type="submit" class="submit-btn">
                                <i class="fas fa-paper-plane"></i>
                                Send Message
                            </button>
                        </form>
                    </div>
                    
                    <div>
                        <h2>Get in Touch</h2>
                        <p>You can also reach us through the following channels:</p>
                        
                        <div style="margin-top: 2rem;">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                                <i class="fas fa-envelope" style="color: #667eea; font-size: 1.2rem; width: 20px;"></i>
                                <div>
                                    <strong>Email:</strong><br>
                                    <a href="mailto:contact@eyecodersclub.com" style="color: #667eea;">contact@eyecodersclub.com</a>
                                </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                                <i class="fas fa-phone" style="color: #667eea; font-size: 1.2rem; width: 20px;"></i>
                                <div>
                                    <strong>Phone:</strong><br>
                                    <a href="tel:+1234567890" style="color: #667eea;">+1 (234) 567-8900</a>
                                </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                                <i class="fas fa-map-marker-alt" style="color: #667eea; font-size: 1.2rem; width: 20px;"></i>
                                <div>
                                    <strong>Address:</strong><br>
                                    123 Code Street<br>
                                    Tech City, TC 12345<br>
                                    United States
                                </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                                <i class="fas fa-clock" style="color: #667eea; font-size: 1.2rem; width: 20px;"></i>
                                <div>
                                    <strong>Office Hours:</strong><br>
                                    Monday - Friday: 9:00 AM - 6:00 PM<br>
                                    Saturday: 10:00 AM - 4:00 PM<br>
                                    Sunday: Closed
                                </div>
                            </div>
                        </div>
                        
                        <h3>Follow Us</h3>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <a href="#" style="color: #667eea; font-size: 1.5rem;" title="Facebook">
                                <i class="fab fa-facebook"></i>
                            </a>
                            <a href="#" style="color: #667eea; font-size: 1.5rem;" title="Twitter">
                                <i class="fab fa-twitter"></i>
                            </a>
                            <a href="#" style="color: #667eea; font-size: 1.5rem;" title="LinkedIn">
                                <i class="fab fa-linkedin"></i>
                            </a>
                            <a href="#" style="color: #667eea; font-size: 1.5rem;" title="GitHub">
                                <i class="fab fa-github"></i>
                            </a>
                            <a href="#" style="color: #667eea; font-size: 1.5rem;" title="Instagram">
                                <i class="fab fa-instagram"></i>
                            </a>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem;">
                            <h4 style="color: #667eea; margin-bottom: 1rem;">Quick Response</h4>
                            <p style="margin-bottom: 1rem; font-size: 0.9rem;">We typically respond to all inquiries within 24 hours during business days. For urgent matters, please call us directly.</p>
                            <button onclick="showNotification('We will respond to your inquiry as soon as possible! 📞', 'info')" style="background: none; border: 2px solid #667eea; color: #667eea; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">
                                Request Callback
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; 2024 Eye Coders Club. All rights reserved.</p>
        </div>
    </footer>
    
    <script src="../js/script.js"></script>
</body>
</html>`,
                type: 'html'
            },
            {
                path: 'pages/services.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Our Services - Eye Coders Club</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <header>
        <nav>
            <div class="logo">
                <h1>My Website</h1>
            </div>
            <ul class="nav-links">
                <li><a href="../index.html">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="contact.html">Contact</a></li>
                <li><a href="services.html" class="active">Services</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section class="page-header">
            <div class="container">
                <h2>Our Services</h2>
                <p>Discover the comprehensive range of services we offer to help you succeed in your coding journey.</p>
            </div>
        </section>
        
        <section class="page-content">
            <div class="container">
                <h2>What We Offer</h2>
                <p>At Eye Coders Club, we provide a wide range of services designed to meet the needs of developers at every stage of their journey. From beginners to advanced professionals, we have something for everyone.</p>
                
                <div class="services-grid">
                    <div class="service-item">
                        <h4><i class="fas fa-code"></i> Online Code Editor</h4>
                        <p>Experience our powerful VS Code-inspired online editor with syntax highlighting, auto-completion, live preview, and collaborative features. Code anywhere, anytime with just a browser.</p>
                        <ul style="margin-top: 1rem; padding-left: 1.5rem;">
                            <li>Multi-language support (HTML, CSS, JavaScript, and more)</li>
                            <li>Real-time collaboration</li>
                            <li>Live preview with instant updates</li>
                            <li>File management system</li>
                        </ul>
                    </div>
                    
                    <div class="service-item">
                        <h4><i class="fas fa-trophy"></i> Coding Competitions</h4>
                        <p>Participate in exciting coding competitions designed to challenge your skills and help you grow. Compete with developers from around the world and win amazing prizes.</p>
                        <ul style="margin-top: 1rem; padding-left: 1.5rem;">
                            <li>Weekly coding challenges</li>
                            <li>Monthly themed competitions</li>
                            <li>Annual championship events</li>
                            <li>Prizes and recognition for winners</li>
                        </ul>
                    </div>
                    
                    <div class="service-item">
                        <h4><i class="fas fa-graduation-cap"></i> Learning Resources</h4>
                        <p>Access our comprehensive library of tutorials, documentation, and learning materials curated by industry experts to accelerate your learning journey.</p>
                        <ul style="margin-top: 1rem; padding-left: 1.5rem;">
                            <li>Step-by-step tutorials</li>
                            <li>Interactive coding exercises</li>
                            <li>Best practices guides</li>
                            <li>Video lessons and workshops</li>
                        </ul>
                    </div>
                    
                    <div class="service-item">
                        <h4><i class="fas fa-users"></i> Community Support</h4>
                        <p>Join our vibrant community of developers where you can ask questions, share knowledge, collaborate on projects, and build lasting professional relationships.</p>
                        <ul style="margin-top: 1rem; padding-left: 1.5rem;">
                            <li>Discussion forums</li>
                            <li>Peer-to-peer mentoring</li>
                            <li>Code review sessions</li>
                            <li>Networking opportunities</li>
                        </ul>
                    </div>
                    
                    <div class="service-item">
                        <h4><i class="fas fa-project-diagram"></i> Project Showcase</h4>
                        <p>Showcase your projects to the world and get feedback from the community. Build your portfolio and demonstrate your skills to potential employers.</p>
                        <ul style="margin-top: 1rem; padding-left: 1.5rem;">
                            <li>Portfolio hosting</li>
                            <li>Project galleries</li>
                            <li>Community feedback</li>
                            <li>Employer visibility</li>
                        </ul>
                    </div>
                    
                    <div class="service-item">
                        <h4><i class="fas fa-certificate"></i> Certifications</h4>
                        <p>Earn industry-recognized certifications by completing our comprehensive courses and assessments. Validate your skills and boost your career prospects.</p>
                        <ul style="margin-top: 1rem; padding-left: 1.5rem;">
                            <li>Skill-based assessments</li>
                            <li>Industry-recognized certificates</li>
                            <li>Progress tracking</li>
                            <li>LinkedIn integration</li>
                        </ul>
                    </div>
                    
                    <div class="service-item">
                        <h4><i class="fas fa-headset"></i> 24/7 Support</h4>
                        <p>Get help whenever you need it with our round-the-clock support system. Our team of experts is always ready to assist you with any questions or issues.</p>
                        <ul style="margin-top: 1rem; padding-left: 1.5rem;">
                            <li>Live chat support</li>
                            <li>Email assistance</li>
                            <li>Video call consultations</li>
                            <li>Community-driven help</li>
                        </ul>
                    </div>
                    
                    <div class="service-item">
                        <h4><i class="fas fa-mobile-alt"></i> Mobile App</h4>
                        <p>Take your coding experience on the go with our mobile app. Code, learn, and connect with the community from anywhere using your smartphone or tablet.</p>
                        <ul style="margin-top: 1rem; padding-left: 1.5rem;">
                            <li>Mobile code editor</li>
                            <li>Offline learning materials</li>
                            <li>Push notifications</li>
                            <li>Sync across devices</li>
                        </ul>
                    </div>
                    
                    <div class="service-item">
                        <h4><i class="fas fa-briefcase"></i> Career Services</h4>
                        <p>Advance your career with our comprehensive career services including job placement assistance, resume reviews, and interview preparation.</p>
                        <ul style="margin-top: 1rem; padding-left: 1.5rem;">
                            <li>Job board access</li>
                            <li>Resume optimization</li>
                            <li>Interview coaching</li>
                            <li>Salary negotiation tips</li>
                        </ul>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 3rem; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; color: white;">
                    <h3>Ready to Get Started?</h3>
                    <p style="margin: 1rem 0; font-size: 1.1rem;">Join thousands of developers who are already using our platform to enhance their coding skills and advance their careers.</p>
                    <button class="cta-button" onclick="showNotification('Welcome aboard! Let\\'s start your coding journey! 🚀', 'success')" style="background: white; color: #667eea; margin-top: 1rem;">
                        Start Your Journey Today
                    </button>
                </div>
                
                <div style="margin-top: 3rem;">
                    <h2>Pricing Plans</h2>
                    <p>Choose the plan that best fits your needs. All plans include access to our core features with varying levels of advanced functionality.</p>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem;">
                        <div style="background: white; border: 2px solid #e9ecef; border-radius: 15px; padding: 2rem; text-align: center;">
                            <h4 style="color: #667eea; font-size: 1.5rem; margin-bottom: 1rem;">Free</h4>
                            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem;">$0<span style="font-size: 1rem; color: #666;">/month</span></div>
                            <ul style="text-align: left; margin: 1.5rem 0;">
                                <li>Basic code editor</li>
                                <li>5 projects</li>
                                <li>Community access</li>
                                <li>Basic tutorials</li>
                            </ul>
                            <button onclick="showNotification('Free plan activated! 🎉', 'success')" style="width: 100%; background: #667eea; color: white; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer;">Get Started</button>
                        </div>
                        
                        <div style="background: white; border: 2px solid #667eea; border-radius: 15px; padding: 2rem; text-align: center; position: relative;">
                            <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #667eea; color: white; padding: 0.5rem 1rem; border-radius: 15px; font-size: 0.8rem;">POPULAR</div>
                            <h4 style="color: #667eea; font-size: 1.5rem; margin-bottom: 1rem;">Pro</h4>
                            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem;">$19<span style="font-size: 1rem; color: #666;">/month</span></div>
                            <ul style="text-align: left; margin: 1.5rem 0;">
                                <li>Advanced code editor</li>
                                <li>Unlimited projects</li>
                                <li>Live collaboration</li>
                                <li>Premium tutorials</li>
                                <li>Priority support</li>
                            </ul>
                            <button onclick="showNotification('Pro plan selected! Upgrade your experience! ⭐', 'success')" style="width: 100%; background: #667eea; color: white; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer;">Choose Pro</button>
                        </div>
                        
                        <div style="background: white; border: 2px solid #e9ecef; border-radius: 15px; padding: 2rem; text-align: center;">
                            <h4 style="color: #667eea; font-size: 1.5rem; margin-bottom: 1rem;">Enterprise</h4>
                            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem;">$49<span style="font-size: 1rem; color: #666;">/month</span></div>
                            <ul style="text-align: left; margin: 1.5rem 0;">
                                <li>Everything in Pro</li>
                                <li>Team management</li>
                                <li>Custom integrations</li>
                                <li>Advanced analytics</li>
                                <li>Dedicated support</li>
                            </ul>
                            <button onclick="showNotification('Enterprise plan selected! Perfect for teams! 🏢', 'success')" style="width: 100%; background: #667eea; color: white; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer;">Contact Sales</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; 2024 Eye Coders Club. All rights reserved.</p>
        </div>
    </footer>
    
    <script src="../js/script.js"></script>
</body>
</html>`,
                type: 'html'
            }
        ];

        defaultFiles.forEach(file => {
            this.fileSystem.files.set(file.path, {
                content: file.content,
                type: file.type,
                modified: false,
                created: new Date(),
                lastModified: new Date()
            });
        });

        console.log('Default files initialized:', this.fileSystem.files.size, 'files');
    }

    setupEventListeners() {
        // Activity bar
        document.querySelectorAll('.activity-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchActivityView(e.target.closest('.activity-item').dataset.view);
            });
        });

        // File operations
        document.getElementById('newFileBtn').addEventListener('click', () => {
            this.showNewFileModal();
        });

        document.getElementById('newFolderBtn').addEventListener('click', () => {
            this.showNewFolderModal();
        });

        // Quick actions
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileName = e.target.dataset.file || e.target.closest('.quick-action-btn').dataset.file;
                if (fileName) {
                    this.createNewFile(fileName);
                }
            });
        });

        // Go Live button
        document.getElementById('goLiveBtn').addEventListener('click', () => {
            this.toggleLiveServer();
        });

        // Submit button
        document.getElementById('submitBtn').addEventListener('click', () => {
            this.submitCode();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            window.location.href = '/auth/logout';
        });

        // Theme and settings
        document.getElementById('themeSelector').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        document.getElementById('fontSizeSelector').addEventListener('change', (e) => {
            this.changeFontSize(e.target.value);
        });

        document.getElementById('shortcutsBtn').addEventListener('click', () => {
            this.showShortcutsModal();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });

        // Modal event listeners
        this.setupModalEventListeners();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        console.log('Event listeners setup complete');
    }

    switchActivityView(viewName) {
        // Update activity bar
        document.querySelectorAll('.activity-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update panel view
        document.querySelectorAll('.panel-view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');
    }

    renderFileTree() {
        const fileTree = document.getElementById('fileTree');
        fileTree.innerHTML = '';

        console.log('Rendering file tree with', this.fileSystem.files.size, 'files');

        // Group files by folders
        const filesByFolder = new Map();
        filesByFolder.set('root', []);

        for (const [path, file] of this.fileSystem.files) {
            const parts = path.split('/');
            if (parts.length === 1) {
                filesByFolder.get('root').push({ path, file });
            } else {
                const folder = parts[0];
                if (!filesByFolder.has(folder)) {
                    filesByFolder.set(folder, []);
                }
                filesByFolder.get(folder).push({ path, file });
            }
        }

        // Render root files first
        const rootFiles = filesByFolder.get('root') || [];
        rootFiles.forEach(({ path, file }) => {
            fileTree.appendChild(this.createFileElement(path, file));
        });

        // Render folders
        for (const [folderName, files] of filesByFolder) {
            if (folderName !== 'root') {
                const folderElement = this.createFolderElement(folderName, files);
                fileTree.appendChild(folderElement);
            }
        }

        // Add empty folders
        for (const folderName of this.fileSystem.folders) {
            if (!filesByFolder.has(folderName)) {
                const folderElement = this.createFolderElement(folderName, []);
                fileTree.appendChild(folderElement);
            }
        }

        console.log('File tree rendered');
    }


    createFileElement(path, file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.path = path;
        
        if (this.activeTab === path) {
            fileItem.classList.add('active');
        }

        const icon = this.getFileIcon(file.type);
        const fileName = path.split('/').pop();

        fileItem.innerHTML = `
            <i class="${icon}"></i>
            <span>${fileName}</span>
            <div class="file-actions">
                <button class="file-action-btn" title="Rename" onclick="editor.renameFile('${path}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="file-action-btn" title="Delete" onclick="editor.deleteFile('${path}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        fileItem.addEventListener('click', (e) => {
            if (!e.target.closest('.file-actions')) {
                this.openFile(path);
            }
        });

        // Right-click context menu for files
        fileItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showFileContextMenu(e, path, false);
        });

        return fileItem;
    }

    showFileContextMenu(e, path, isFolder) {
    // Remove existing context menu
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.cssText = `
        position: fixed;
        top: ${e.clientY}px;
        left: ${e.clientX}px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 8px 0;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        min-width: 180px;
    `;

    let menuItems = [];

    if (isFolder) {
        menuItems = [
            { icon: 'fas fa-file-plus', text: 'New File', action: () => this.showNewFileModal(path) },
            { icon: 'fas fa-folder-plus', text: 'New Folder', action: () => this.showNewFolderModal(path) },
            { separator: true },
            { icon: 'fas fa-trash', text: 'Delete Folder', action: () => this.deleteFolder(path) }
        ];
    } else {
        menuItems = [
            { icon: 'fas fa-external-link-alt', text: 'Open', action: () => this.openFile(path) },
            { icon: 'fas fa-edit', text: 'Rename', action: () => this.renameFile(path) },
            { separator: true },
            { icon: 'fas fa-trash', text: 'Delete', action: () => this.deleteFile(path) }
        ];
    }

    menuItems.forEach(item => {
        if (item.separator) {
            const separator = document.createElement('div');
            separator.style.cssText = 'height: 1px; background: var(--border-color); margin: 4px 0;';
            contextMenu.appendChild(separator);
        } else {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                color: var(--text-primary);
                font-size: 13px;
                transition: background 0.2s ease;
            `;
            
            menuItem.innerHTML = `<i class="${item.icon}"></i> ${item.text}`;
            
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = 'var(--hover-bg)';
            });
            
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.background = 'transparent';
            });
            
            menuItem.addEventListener('click', () => {
                item.action();
                contextMenu.remove();
            });
            
            contextMenu.appendChild(menuItem);
        }
    });

    document.body.appendChild(contextMenu);

    // Close context menu when clicking outside
    const closeMenu = (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
}

showNewFileModal(folderPath = null) {
    this.selectedFolder = folderPath;
    const modal = document.getElementById('newFileModal');
    const input = document.getElementById('newFileName');
    
    // Update modal title to show target folder
    const modalTitle = modal.querySelector('.modal-header h3');
    if (folderPath) {
        modalTitle.textContent = `Create New File in "${folderPath}"`;
    } else {
        modalTitle.textContent = 'Create New File';
    }
    
    modal.style.display = 'flex';
    input.focus();
    input.value = ''; // Clear previous value
}

showNewFolderModal(parentFolder = null) {
    this.selectedFolder = parentFolder;
    const modal = document.getElementById('newFolderModal');
    const input = document.getElementById('newFolderName');
    
    // Update modal title to show parent folder
    const modalTitle = modal.querySelector('.modal-header h3');
    if (parentFolder) {
        modalTitle.textContent = `Create New Folder in "${parentFolder}"`;
    } else {
        modalTitle.textContent = 'Create New Folder';
    }
    
    modal.style.display = 'flex';
    input.focus();
    input.value = ''; // Clear previous value
}


    createFolderElement(folderName, files) {
    const folderContainer = document.createElement('div');
    
    const folderItem = document.createElement('div');
    folderItem.className = 'folder-item expanded';
    folderItem.dataset.folder = folderName;
    
    folderItem.innerHTML = `
        <i class="fas fa-folder-open"></i>
        <span>${folderName}</span>
        <div class="file-actions">
            <button class="file-action-btn" title="New File in ${folderName}" onclick="event.stopPropagation(); editor.showNewFileModal('${folderName}')">
                <i class="fas fa-file-plus"></i>
            </button>
            <button class="file-action-btn" title="New Folder in ${folderName}" onclick="event.stopPropagation(); editor.showNewFolderModal('${folderName}')">
                <i class="fas fa-folder-plus"></i>
            </button>
            <button class="file-action-btn" title="Delete Folder" onclick="event.stopPropagation(); editor.deleteFolder('${folderName}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    const folderContents = document.createElement('div');
    folderContents.className = 'folder-contents';

    files.forEach(({ path, file }) => {
        folderContents.appendChild(this.createFileElement(path, file));
    });

    // Folder click handler (for expand/collapse)
    folderItem.addEventListener('click', (e) => {
        // Only toggle if not clicking on action buttons
        if (!e.target.closest('.file-actions')) {
            e.stopPropagation();
            folderItem.classList.toggle('expanded');
            folderItem.classList.toggle('collapsed');
            
            const icon = folderItem.querySelector('i');
            if (folderItem.classList.contains('expanded')) {
                icon.className = 'fas fa-folder-open';
                folderContents.style.display = 'block';
            } else {
                icon.className = 'fas fa-folder';
                folderContents.style.display = 'none';
            }
        }
    });

    // Right-click context menu for folders
    folderItem.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showFileContextMenu(e, folderName, true);
    });

    folderContainer.appendChild(folderItem);
    folderContainer.appendChild(folderContents);

    return folderContainer;
}



    getFileIcon(type) {
        const icons = {
            'html': 'fab fa-html5',
            'css': 'fab fa-css3-alt',
            'js': 'fab fa-js-square',
            'json': 'fas fa-file-code',
            'md': 'fab fa-markdown',
            'txt': 'fas fa-file-alt'
        };
        return icons[type] || 'fas fa-file';
    }

    openFile(path) {
        if (!this.fileSystem.files.has(path)) {
            console.error('File not found:', path);
            return;
        }

        console.log('Opening file:', path);

        // Add to open tabs if not already open
        if (!this.openTabs.has(path)) {
            this.openTabs.set(path, {
                path,
                modified: false,
                scrollPosition: 0
            });
        }

        this.activeTab = path;
        this.renderTabs();
        this.renderEditor();
        this.updateFileTree();
        this.updateStatusBar();
    }

    renderTabs() {
        const tabBar = document.getElementById('tabBar');
        tabBar.innerHTML = '';

        if (this.openTabs.size === 0) {
            tabBar.innerHTML = `
                <div class="tab-placeholder">
                    <i class="fas fa-code"></i>
                    <span>Open a file to start editing</span>
                </div>
            `;
            return;
        }

        for (const [path, tabInfo] of this.openTabs) {
            const tab = document.createElement('div');
            tab.className = 'tab';
            if (path === this.activeTab) {
                tab.classList.add('active');
            }
            if (tabInfo.modified) {
                tab.classList.add('modified');
            }

            const fileName = path.split('/').pop();
            const file = this.fileSystem.files.get(path);
            const icon = this.getFileIcon(file.type);

            tab.innerHTML = `
                <i class="${icon}"></i>
                <span>${fileName}</span>
                <button class="tab-close" title="Close">
                    <i class="fas fa-times"></i>
                </button>
            `;

            tab.addEventListener('click', (e) => {
                if (e.target.closest('.tab-close')) {
                    e.stopPropagation();
                    this.closeTab(path);
                } else {
                    this.switchTab(path);
                }
            });

            tabBar.appendChild(tab);
        }
    }

    renderEditor() {
        const editorContainer = document.getElementById('editorContainer');
        const welcomeScreen = document.getElementById('welcomeScreen');

        if (!this.activeTab) {
            welcomeScreen.style.display = 'flex';
            // Clear existing editors
            const existingEditors = editorContainer.querySelectorAll('.editor');
            existingEditors.forEach(editor => editor.remove());
            return;
        }

        welcomeScreen.style.display = 'none';

        // Clear existing editors
        const existingEditors = editorContainer.querySelectorAll('.editor');
        existingEditors.forEach(editor => editor.remove());

        const file = this.fileSystem.files.get(this.activeTab);
        if (!file) return;

        const editor = document.createElement('div');
        editor.className = 'editor active';
        editor.innerHTML = `
            <textarea 
                class="code-editor" 
                data-path="${this.activeTab}"
                spellcheck="false"
                placeholder="Start coding..."
            >${file.content}</textarea>
        `;

        const textarea = editor.querySelector('textarea');
        
        // Set up event listeners for the editor
        textarea.addEventListener('input', (e) => {
            this.handleEditorInput(e);
        });

        textarea.addEventListener('keydown', (e) => {
            this.handleEditorKeydown(e);
        });

        textarea.addEventListener('scroll', (e) => {
            this.saveScrollPosition(this.activeTab, e.target.scrollTop);
        });

        textarea.addEventListener('selectionchange', () => {
            this.updateStatusBar();
        });

        textarea.addEventListener('keyup', () => {
            this.updateStatusBar();
        });

        textarea.addEventListener('click', () => {
            this.updateStatusBar();
        });

        editorContainer.appendChild(editor);

        // Restore scroll position
        const tabInfo = this.openTabs.get(this.activeTab);
        if (tabInfo && tabInfo.scrollPosition) {
            textarea.scrollTop = tabInfo.scrollPosition;
        }

        // Focus the editor
        setTimeout(() => {
            textarea.focus();
            this.updateStatusBar();
        }, 100);

        console.log('Editor rendered for:', this.activeTab);
    }

    handleEditorInput(e) {
        const path = e.target.dataset.path;
        const content = e.target.value;

        // Update file content
        const file = this.fileSystem.files.get(path);
        if (file) {
            file.content = content;
            file.lastModified = new Date();
            
            // Mark as modified
            const tabInfo = this.openTabs.get(path);
            if (tabInfo) {
                tabInfo.modified = true;
            }
        }

        this.renderTabs();
        this.updateStatusBar();
        this.showAutoSaveIndicator('changed');
        
        // Update live preview if it's open
        if (this.liveServerWindow && !this.liveServerWindow.closed) {
            this.updateLivePreview();
        }
    }

    handleEditorKeydown(e) {
        // Handle tab indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            if (e.shiftKey) {
                // Unindent
                this.unindentText(textarea);
            } else {
                // Indent
                if (start !== end) {
                    this.indentSelectedLines(textarea);
                } else {
                    const value = textarea.value;
                    const newValue = value.substring(0, start) + '    ' + value.substring(end);
                    textarea.value = newValue;
                    textarea.selectionStart = textarea.selectionEnd = start + 4;
                    
                    // Trigger input event to update file
                    textarea.dispatchEvent(new Event('input'));
                }
            }
        }

        // Handle Enter key for auto-indentation
        if (e.key === 'Enter') {
            const textarea = e.target;
            const value = textarea.value;
            const start = textarea.selectionStart;
            
            const currentLine = value.substring(0, start).split('\n').pop();
            const indentMatch = currentLine.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '';
            
            let extraIndent = '';
            if (currentLine.trim().endsWith('{') || currentLine.trim().endsWith('[')) {
                extraIndent = '    ';
            }
            
            setTimeout(() => {
                const currentStart = textarea.selectionStart;
                const currentValue = textarea.value;
                const newValue = currentValue.substring(0, currentStart) + indent + extraIndent + currentValue.substring(currentStart);
                textarea.value = newValue;
                textarea.selectionStart = textarea.selectionEnd = currentStart + indent.length + extraIndent.length;
                
                // Trigger input event
                textarea.dispatchEvent(new Event('input'));
            }, 0);
        }
    }

    indentSelectedLines(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        
        const beforeSelection = value.substring(0, start);
        const selection = value.substring(start, end);
        const afterSelection = value.substring(end);
        
        const lines = selection.split('\n');
        const indentedLines = lines.map(line => '    ' + line);
        const newSelection = indentedLines.join('\n');
        
        textarea.value = beforeSelection + newSelection + afterSelection;
        textarea.selectionStart = start;
        textarea.selectionEnd = start + newSelection.length;
        
        // Trigger input event
        textarea.dispatchEvent(new Event('input'));
    }

    unindentText(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        
        const beforeSelection = value.substring(0, start);
        const selection = value.substring(start, end);
        const afterSelection = value.substring(end);
        
        const lines = selection.split('\n');
        const unindentedLines = lines.map(line => {
            if (line.startsWith('    ')) {
                return line.substring(4);
            } else if (line.startsWith('\t')) {
                return line.substring(1);
            }
            return line;
        });
        
        const newSelection = unindentedLines.join('\n');
        const lengthDiff = selection.length - newSelection.length;
        
        textarea.value = beforeSelection + newSelection + afterSelection;
        textarea.selectionStart = start;
        textarea.selectionEnd = end - lengthDiff;
        
        // Trigger input event
        textarea.dispatchEvent(new Event('input'));
    }

    switchTab(path) {
        if (!this.openTabs.has(path)) return;
        
        this.activeTab = path;
        this.renderTabs();
        this.renderEditor();
        this.updateFileTree();
        this.updateStatusBar();
    }

    closeTab(path) {
        const tabInfo = this.openTabs.get(path);
        if (tabInfo && tabInfo.modified) {
            if (!confirm(`File "${path.split('/').pop()}" has unsaved changes. Close anyway?`)) {
                return;
            }
        }
        
        this.openTabs.delete(path);
        
        if (this.activeTab === path) {
            // Switch to another tab or show welcome screen
            const remainingTabs = Array.from(this.openTabs.keys());
            this.activeTab = remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1] : null;
        }
        
        this.renderTabs();
        this.renderEditor();
        this.updateFileTree();
        this.updateStatusBar();
    }

    updateFileTree() {
        // Update active file highlighting
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (this.activeTab) {
            const fileName = this.activeTab.split('/').pop();
            const activeFileItem = Array.from(document.querySelectorAll('.file-item')).find(item => {
                const span = item.querySelector('span');
                return span && span.textContent === fileName;
            });
            if (activeFileItem) {
                activeFileItem.classList.add('active');
            }
        }
    }

    updateStatusBar() {
        const currentFileEl = document.getElementById('currentFile');
        const fileTypeEl = document.getElementById('fileType');
        const cursorPositionEl = document.getElementById('cursorPosition');
        
        if (this.activeTab) {
            const fileName = this.activeTab.split('/').pop();
            const file = this.fileSystem.files.get(this.activeTab);
            
            currentFileEl.textContent = fileName;
            fileTypeEl.textContent = file.type.toUpperCase();
            
            // Update cursor position if editor is focused
            const activeEditor = document.querySelector('.code-editor');
            if (activeEditor && document.activeElement === activeEditor) {
                const lines = activeEditor.value.substring(0, activeEditor.selectionStart).split('\n');
                const line = lines.length;
                const col = lines[lines.length - 1].length + 1;
                cursorPositionEl.textContent = `Ln ${line}, Col ${col}`;
            }
        } else {
            currentFileEl.textContent = 'No file selected';
            fileTypeEl.textContent = 'Plain Text';
            cursorPositionEl.textContent = 'Ln 1, Col 1';
        }
    }

    saveScrollPosition(path, position) {
        const tabInfo = this.openTabs.get(path);
        if (tabInfo) {
            tabInfo.scrollPosition = position;
        }
    }

    async toggleLiveServer() {
        const goLiveBtn = document.getElementById('goLiveBtn');
        const liveServerStatus = document.getElementById('liveServerStatus');
        
        if (this.liveServerWindow && !this.liveServerWindow.closed) {
            // Stop live server
            this.liveServerWindow.close();
            this.liveServerWindow = null;
            
            goLiveBtn.innerHTML = '<i class="fas fa-play"></i> Go Live';
            goLiveBtn.classList.remove('active');
            liveServerStatus.innerHTML = '<i class="fas fa-circle"></i> <span>Live Server: Offline</span>';
            liveServerStatus.classList.remove('online');
            liveServerStatus.classList.add('offline');
            
            this.showAlert('Live server stopped', 'info');
        } else {
            // Start live server
            try {
                this.startLiveServer();
            } catch (error) {
                console.error('Error starting live server:', error);
                this.showAlert('Error starting live server: ' + error.message, 'error');
            }
        }
    }

    startLiveServer() {
        // Create a virtual server using blob URLs and service worker
        const liveServerContent = this.generateLiveServerHTML();
        
        // Create a blob URL for the main content
        const blob = new Blob([liveServerContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Open the live server window
        this.liveServerWindow = window.open('', 'LivePreview', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        
        if (this.liveServerWindow) {
            // Set up the live server
            this.setupLiveServer(this.liveServerWindow);
            
            // Update UI
            const goLiveBtn = document.getElementById('goLiveBtn');
            const liveServerStatus = document.getElementById('liveServerStatus');
            
            goLiveBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Live Server';
            goLiveBtn.classList.add('active');
            liveServerStatus.innerHTML = '<i class="fas fa-circle"></i> <span>Live Server: Online</span>';
            liveServerStatus.classList.remove('offline');
            liveServerStatus.classList.add('online');
            
            this.showAlert('Live server started successfully!', 'success');
            
            // Start auto-refresh
            this.startLiveReload();
        } else {
            throw new Error('Failed to open live server window. Please check popup blocker settings.');
        }
    }

    setupLiveServer(window) {
        // Set up the live server environment
        const doc = window.document;
        doc.open();
        doc.write(this.generateLiveServerHTML());
        doc.close();
        
        // Set up navigation handling
        this.setupLiveServerNavigation(window);
    }

    generateLiveServerHTML() {
    // Get the main HTML file (index.html or first HTML file)
    let mainHtmlPath = 'index.html';
    if (!this.fileSystem.files.has(mainHtmlPath)) {
        // Find first HTML file
        for (const [path, file] of this.fileSystem.files) {
            if (file.type === 'html') {
                mainHtmlPath = path;
                break;
            }
        }
    }
    
    if (!this.fileSystem.files.has(mainHtmlPath)) {
        return this.getNoHtmlFileContent();
    }
    
    let htmlContent = this.fileSystem.files.get(mainHtmlPath).content;
    
    // Process and inject CSS and JS
    htmlContent = this.processHTMLContent(htmlContent, mainHtmlPath);
    
    // Add enhanced live reload functionality
    htmlContent = this.addEnhancedLiveReloadScript(htmlContent);
    
    return htmlContent;
}

getNoHtmlFileContent() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>Live Server - No HTML File</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .message {
                    text-align: center;
                    padding: 3rem;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 15px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .message h1 {
                    margin-bottom: 1rem;
                    font-size: 2.5rem;
                }
                .message p {
                    font-size: 1.2rem;
                    opacity: 0.9;
                }
                .create-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    margin-top: 1rem;
                    transition: all 0.3s ease;
                }
                .create-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
            <div class="message">
                <h1>📄 No HTML File Found</h1>
                <p>Create an HTML file to see the live preview.</p>
                <button class="create-btn" onclick="if(window.opener && window.opener.editor) { window.opener.editor.createNewFile('index.html'); window.opener.focus(); }">
                    Create index.html
                </button>
            </div>
        </body>
        </html>
    `;
}

processHTMLContent(htmlContent, currentPath = 'index.html') {
    // Collect all CSS and JS content
    let cssContent = '';
    let jsContent = '';
    
    for (const [path, file] of this.fileSystem.files) {
        if (file.type === 'css') {
            cssContent += `/* File: ${path} */\n${file.content}\n\n`;
        } else if (file.type === 'js') {
            jsContent += `// File: ${path}\n${file.content}\n\n`;
        }
    }
    
    // Fix relative paths based on current page location
    htmlContent = this.fixRelativePaths(htmlContent, currentPath);
    
    // Replace CSS links with inline styles
    if (cssContent) {
        const styleTag = `<style>\n${cssContent}</style>`;
        
        // Try to replace existing link tags first
        htmlContent = htmlContent.replace(/<link[^>]*rel=['"]*stylesheet['"]*[^>]*>/gi, '');
        
        // Insert style tag before closing head or at the beginning
        if (htmlContent.includes('</head>')) {
            htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
        } else if (htmlContent.includes('<head>')) {
            htmlContent = htmlContent.replace('<head>', `<head>\n${styleTag}`);
        } else {
            htmlContent = `<head>${styleTag}</head>\n${htmlContent}`;
        }
    }
    
    // Replace JS script tags with inline scripts
    if (jsContent) {
        const scriptTag = `<script>\n${jsContent}\n</script>`;
        
        // Try to replace existing script tags first
        htmlContent = htmlContent.replace(/<script[^>]*src=[^>]*><\/script>/gi, '');
        
        // Insert script tag before closing body or at the end
        if (htmlContent.includes('</body>')) {
            htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
        } else {
            htmlContent = htmlContent + `\n${scriptTag}`;
        }
    }
    
    return htmlContent;
}

fixRelativePaths(htmlContent, currentPath) {
    // This function fixes relative paths in HTML content based on the current page location
    const currentDir = currentPath.includes('/') ? currentPath.substring(0, currentPath.lastIndexOf('/')) : '';
    
    // Fix image src paths
    htmlContent = htmlContent.replace(/src=["']([^"']+)["']/gi, (match, src) => {
        if (src.startsWith('http') || src.startsWith('//') || src.startsWith('#')) {
            return match; // Don't modify absolute URLs or anchors
        }
        
        // Handle relative paths
        if (currentDir && src.startsWith('../')) {
            // Remove one level of '../' for each directory level
            const levels = currentDir.split('/').length;
            let newSrc = src;
            for (let i = 0; i < levels; i++) {
                newSrc = newSrc.replace('../', '');
            }
            return `src="${newSrc}"`;
        }
        
        return match;
    });
    
    return htmlContent;
}

addEnhancedLiveReloadScript(htmlContent) {
    const liveReloadScript = `
        <script>
            // Enhanced Live Server with Better Navigation
            window.liveServer = {
                currentPage: '${this.getCurrentPageFromUrl()}',
                lastModified: ${Date.now()},
                fileMap: ${JSON.stringify(this.getFileMap())},
                
                navigate: function(targetPage) {
                    console.log('Navigating to:', targetPage);
                    
                    if (window.opener && window.opener.editor) {
                        const content = window.opener.editor.getPageContent(targetPage);
                        if (content) {
                            // Store scroll position
                            const scrollPos = { x: window.scrollX, y: window.scrollY };
                            
                            // Update content
                            document.open();
                            document.write(content);
                            document.close();
                            
                            // Update current page and URL
                            this.currentPage = targetPage;
                            this.updateURL(targetPage);
                            
                            // Restore scroll position for same page
                            if (scrollPos.x !== 0 || scrollPos.y !== 0) {
                                setTimeout(() => {
                                    window.scrollTo(scrollPos.x, scrollPos.y);
                                }, 100);
                            }
                            
                            console.log('Navigation completed to:', targetPage);
                            return true;
                        } else {
                            console.warn('Content not found for:', targetPage);
                            this.showNavigationError(targetPage);
                            return false;
                        }
                    }
                    return false;
                },
                
                updateURL: function(page) {
                    try {
                        const newUrl = window.location.origin + window.location.pathname + '#' + page;
                        history.pushState({page: page}, '', newUrl);
                    } catch(e) {
                        console.warn('Could not update URL:', e);
                    }
                },
                
                showNavigationError: function(page) {
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = \`
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #ff6b6b;
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        z-index: 10000;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                        font-family: Arial, sans-serif;
                    \`;
                    errorDiv.innerHTML = \`
                        <strong>Page Not Found</strong><br>
                        Could not find: \${page}
                        <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">×</button>
                    \`;
                    document.body.appendChild(errorDiv);
                    
                    setTimeout(() => {
                        if (errorDiv.parentElement) {
                            errorDiv.remove();
                        }
                    }, 5000);
                },
                
                checkForUpdates: function() {
                    if (window.opener && !window.opener.closed && window.opener.editor) {
                        try {
                            const editor = window.opener.editor;
                            const newModified = editor.getLastModified();
                            if (newModified > this.lastModified) {
                                this.lastModified = newModified;
                                this.reload();
                            }
                        } catch (e) {
                            // Ignore cross-origin errors
                        }
                    } else if (window.opener && window.opener.closed) {
                        // Parent window closed, show message
                        this.showParentClosedMessage();
                    }
                },
                
                showParentClosedMessage: function() {
                    const messageDiv = document.createElement('div');
                    messageDiv.style.cssText = \`
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        background: #ff9800;
                        color: white;
                        padding: 10px;
                        text-align: center;
                        z-index: 10000;
                        font-family: Arial, sans-serif;
                    \`;
                    messageDiv.innerHTML = 'Live server connection lost - Editor window was closed';
                    document.body.appendChild(messageDiv);
                },
                
                reload: function() {
                    if (window.opener && window.opener.editor) {
                        const content = window.opener.editor.getPageContent(this.currentPage);
                        if (content) {
                            const scrollPos = { x: window.scrollX, y: window.scrollY };
                            document.open();
                            document.write(content);
                            document.close();
                            
                            // Restore scroll position
                            setTimeout(() => {
                                window.scrollTo(scrollPos.x, scrollPos.y);
                            }, 50);
                        }
                    }
                },
                
                resolveRelativePath: function(href, currentPage) {
                    // Handle different types of links
                    if (href.startsWith('http') || href.startsWith('//')) {
                        return null; // External link
                    }
                    
                    if (href.startsWith('#')) {
                        return null; // Anchor link
                    }
                    
                    if (href.startsWith('/')) {
                        return href.substring(1); // Absolute path
                    }
                    
                    // Handle relative paths
                    const currentDir = currentPage.includes('/') ? currentPage.substring(0, currentPage.lastIndexOf('/')) : '';
                    let resolvedPath = href;
                    
                    // Handle ../
                    if (href.startsWith('../')) {
                        const parts = currentDir.split('/').filter(p => p);
                        let upLevels = 0;
                        let tempHref = href;
                        
                        while (tempHref.startsWith('../')) {
                            upLevels++;
                            tempHref = tempHref.substring(3);
                        }
                        
                        const newParts = parts.slice(0, -upLevels);
                        resolvedPath = newParts.length > 0 ? newParts.join('/') + '/' + tempHref : tempHref;
                    } else if (currentDir) {
                        // Handle ./
                        if (href.startsWith('./')) {
                            resolvedPath = currentDir + '/' + href.substring(2);
                        } else {
                            resolvedPath = currentDir + '/' + href;
                        }
                    }
                    
                    return resolvedPath;
                }
            };
            
            // Set up auto-refresh
            setInterval(function() {
                window.liveServer.checkForUpdates();
            }, 1000);
            
            // Handle navigation when DOM is loaded
            document.addEventListener('DOMContentLoaded', function() {
                console.log('Live server initialized for:', window.liveServer.currentPage);
                
                // Override all link clicks
                document.addEventListener('click', function(e) {
                    const link = e.target.closest('a');
                    if (link && link.href) {
                        const href = link.getAttribute('href');
                        console.log('Link clicked:', href);
                        
                        if (href && (href.endsWith('.html') || href.includes('.html'))) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const targetPage = window.liveServer.resolveRelativePath(href, window.liveServer.currentPage);
                            if (targetPage) {
                                console.log('Resolved target page:', targetPage);
                                window.liveServer.navigate(targetPage);
                            } else {
                                console.log('External or anchor link, allowing default behavior');
                            }
                            return false;
                        }
                    }
                }, true);
                
                // Handle browser back/forward
                window.addEventListener('popstate', function(e) {
                    if (e.state && e.state.page) {
                        window.liveServer.navigate(e.state.page);
                    }
                });
                
                // Handle page refresh
                window.addEventListener('beforeunload', function() {
                    // Store current page in sessionStorage
                    try {
                        sessionStorage.setItem('liveServerCurrentPage', window.liveServer.currentPage);
                    } catch(e) {
                        // Ignore storage errors
                    }
                });
                
                // Restore page on load
                try {
                    const storedPage = sessionStorage.getItem('liveServerCurrentPage');
                    if (storedPage && storedPage !== window.liveServer.currentPage) {
                        window.liveServer.navigate(storedPage);
                    }
                } catch(e) {
                    // Ignore storage errors
                }
            });
        </script>
    `;
    
    if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${liveReloadScript}\n</body>`);
    } else {
        htmlContent = htmlContent + liveReloadScript;
    }
    
    return htmlContent;
}

getCurrentPageFromUrl() {
    // Extract current page from URL hash or default to index.html
    const hash = window.location.hash.substring(1);
    return hash || 'index.html';
}

getFileMap() {
    // Create a map of available HTML files for navigation
    const fileMap = {};
    for (const [path, file] of this.fileSystem.files) {
        if (file.type === 'html') {
            fileMap[path] = {
                type: 'html',
                lastModified: file.lastModified.getTime()
            };
        }
    }
    return fileMap;
}

getPageContent(pagePath) {
    // Normalize the path
    let normalizedPath = pagePath;
    
    // Remove leading slash if present
    if (normalizedPath.startsWith('/')) {
        normalizedPath = normalizedPath.substring(1);
    }
    
    // Add .html extension if missing
    if (!normalizedPath.endsWith('.html') && !normalizedPath.includes('.')) {
        normalizedPath += '.html';
    }
    
    console.log('Getting page content for:', normalizedPath);
    
    if (this.fileSystem.files.has(normalizedPath)) {
        const file = this.fileSystem.files.get(normalizedPath);
        if (file.type === 'html') {
            let content = this.processHTMLContent(file.content, normalizedPath);
            content = this.addEnhancedLiveReloadScript(content);
            return content;
        }
    }
    
    // Try to find the file with different path variations
    const variations = [
        normalizedPath,
        `pages/${normalizedPath}`,
        normalizedPath.replace('pages/', ''),
        normalizedPath.replace('../', ''),
    ];
    
    for (const variation of variations) {
        if (this.fileSystem.files.has(variation)) {
            const file = this.fileSystem.files.get(variation);
            if (file.type === 'html') {
                let content = this.processHTMLContent(file.content, variation);
                content = this.addEnhancedLiveReloadScript(content);
                return content;
            }
        }
    }
    
    console.warn('Page not found:', pagePath, 'Variations tried:', variations);
    return null;
}


    processHTMLContent(htmlContent) {
        // Collect all CSS and JS content
        let cssContent = '';
        let jsContent = '';
        
        for (const [path, file] of this.fileSystem.files) {
            if (file.type === 'css') {
                cssContent += `/* File: ${path} */\n${file.content}\n\n`;
            } else if (file.type === 'js') {
                jsContent += `// File: ${path}\n${file.content}\n\n`;
            }
        }
        
        // Replace CSS links with inline styles
        if (cssContent) {
            const styleTag = `<style>\n${cssContent}</style>`;
            
            // Try to replace existing link tags first
            htmlContent = htmlContent.replace(/<link[^>]*rel=['"]*stylesheet['"]*[^>]*>/gi, '');
            
            // Insert style tag before closing head or at the beginning
            if (htmlContent.includes('</head>')) {
                htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
            } else if (htmlContent.includes('<head>')) {
                htmlContent = htmlContent.replace('<head>', `<head>\n${styleTag}`);
            } else {
                htmlContent = `<head>${styleTag}</head>\n${htmlContent}`;
            }
        }
        
        // Replace JS script tags with inline scripts
        if (jsContent) {
            const scriptTag = `<script>\n${jsContent}\n</script>`;
            
            // Try to replace existing script tags first
            htmlContent = htmlContent.replace(/<script[^>]*src=[^>]*><\/script>/gi, '');
            
            // Insert script tag before closing body or at the end
            if (htmlContent.includes('</body>')) {
                htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
            } else {
                htmlContent = htmlContent + `\n${scriptTag}`;
            }
        }
        
        return htmlContent;
    }

    addLiveReloadScript(htmlContent) {
        const liveReloadScript = `
            <script>
                // Live Server Navigation and Reload
                window.liveServer = {
                    currentPage: 'index.html',
                    lastModified: ${Date.now()},
                    
                    navigate: function(page) {
                        if (window.opener && window.opener.editor) {
                            const content = window.opener.editor.getPageContent(page);
                            if (content) {
                                document.open();
                                document.write(content);
                                document.close();
                                this.currentPage = page;
                                this.updateURL(page);
                            }
                        }
                    },
                    
                    updateURL: function(page) {
                        try {
                            history.pushState({page: page}, '', '#' + page);
                        } catch(e) {
                            // Ignore history API errors
                        }
                    },
                    
                    checkForUpdates: function() {
                        if (window.opener && !window.opener.closed && window.opener.editor) {
                            try {
                                const editor = window.opener.editor;
                                const newModified = editor.getLastModified();
                                if (newModified > this.lastModified) {
                                    this.lastModified = newModified;
                                    this.reload();
                                }
                            } catch (e) {
                                // Cross-origin or other error, ignore
                            }
                        }
                    },
                    
                    reload: function() {
                        if (window.opener && window.opener.editor) {
                            const content = window.opener.editor.getPageContent(this.currentPage);
                            if (content) {
                                document.open();
                                document.write(content);
                                document.close();
                            }
                        }
                    }
                };
                
                // Set up auto-refresh
                setInterval(function() {
                    window.liveServer.checkForUpdates();
                }, 1000);
                
                // Handle navigation links
                document.addEventListener('DOMContentLoaded', function() {
                    // Override link clicks for navigation
                    document.addEventListener('click', function(e) {
                        const link = e.target.closest('a');
                        if (link && link.href) {
                            const href = link.getAttribute('href');
                            if (href && (href.endsWith('.html') || href.includes('.html'))) {
                                e.preventDefault();
                                const page = href.replace('../', '').replace('./', '');
                                window.liveServer.navigate(page);
                                return false;
                            }
                        }
                    });
                    
                    // Handle browser back/forward
                    window.addEventListener('popstate', function(e) {
                        if (e.state && e.state.page) {
                            window.liveServer.navigate(e.state.page);
                        }
                    });
                });
                
                console.log('Live Server initialized for page:', window.liveServer.currentPage);
            </script>
        `;
        
        if (htmlContent.includes('</body>')) {
            htmlContent = htmlContent.replace('</body>', `${liveReloadScript}\n</body>`);
        } else {
            htmlContent = htmlContent + liveReloadScript;
        }
        
        return htmlContent;
    }

    setupLiveServerNavigation(window) {
        // This method sets up navigation handling in the live server window
        // The actual navigation is handled by the injected script
    }

    getPageContent(pagePath) {
        // Normalize the path
        const normalizedPath = pagePath.startsWith('/') ? pagePath.substring(1) : pagePath;
        
        if (this.fileSystem.files.has(normalizedPath)) {
            const file = this.fileSystem.files.get(normalizedPath);
            if (file.type === 'html') {
                let content = this.processHTMLContent(file.content);
                content = this.addLiveReloadScript(content);
                return content;
            }
        }
        
        return null;
    }

    startLiveReload() {
        if (this.liveReloadInterval) {
            clearInterval(this.liveReloadInterval);
        }
        
        // The live reload is now handled by the injected script in the live server window
        // This method is kept for compatibility
    }

    updateLivePreview() {
        // The live preview updates are now handled automatically by the injected script
        // This method triggers an update by changing the lastModified timestamp
        if (this.liveServerWindow && !this.liveServerWindow.closed) {
            // The script in the live server window will detect this change
        }
    }

    getLastModified() {
        let lastModified = 0;
        for (const [path, file] of this.fileSystem.files) {
            if (file.lastModified && file.lastModified.getTime() > lastModified) {
                lastModified = file.lastModified.getTime();
            }
        }
        return lastModified;
    }

    showNewFileModal() {
        document.getElementById('newFileModal').style.display = 'flex';
        document.getElementById('newFileName').focus();
    }

    showNewFolderModal() {
        document.getElementById('newFolderModal').style.display = 'flex';
        document.getElementById('newFolderName').focus();
    }

    showShortcutsModal() {
        document.getElementById('shortcutsModal').style.display = 'flex';
    }

    setupModalEventListeners() {
    // New File Modal
    const newFileModal = document.getElementById('newFileModal');
    const newFileNameInput = document.getElementById('newFileName');
    
    newFileModal.querySelector('.close-modal').addEventListener('click', () => {
        newFileModal.style.display = 'none';
        this.selectedFolder = null;
    });
    
    newFileModal.querySelector('.btn-cancel').addEventListener('click', () => {
        newFileModal.style.display = 'none';
        this.selectedFolder = null;
    });
    
    newFileModal.querySelector('.btn-create').addEventListener('click', () => {
        const fileName = newFileNameInput.value.trim();
        if (fileName) {
            this.createNewFile(fileName);
            newFileModal.style.display = 'none';
            newFileNameInput.value = '';
        }
    });
    
    // Template buttons - update filename based on selected folder
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const template = btn.dataset.template;
            const extension = template === 'html' ? '.html' : template === 'css' ? '.css' : '.js';
            const baseName = template === 'html' ? 'page' : template === 'css' ? 'styles' : 'script';
            let fileName = baseName + extension;
            
            // Suggest appropriate filename based on folder
            if (this.selectedFolder) {
                if (this.selectedFolder === 'css' && template === 'css') {
                    fileName = 'styles.css';
                } else if (this.selectedFolder === 'js' && template === 'js') {
                    fileName = 'script.js';
                } else if (this.selectedFolder === 'pages' && template === 'html') {
                    fileName = 'page.html';
                }
            }
            
            newFileNameInput.value = this.getUniqueFileName(this.selectedFolder ? `${this.selectedFolder}/${fileName}` : fileName).split('/').pop();
        });
    });
    
    // New Folder Modal
    const newFolderModal = document.getElementById('newFolderModal');
    const newFolderNameInput = document.getElementById('newFolderName');
    
    newFolderModal.querySelector('.close-modal').addEventListener('click', () => {
        newFolderModal.style.display = 'none';
        this.selectedFolder = null;
    });
    
    newFolderModal.querySelector('.btn-cancel').addEventListener('click', () => {
        newFolderModal.style.display = 'none';
        this.selectedFolder = null;
    });
    
    newFolderModal.querySelector('.btn-create').addEventListener('click', () => {
        const folderName = newFolderNameInput.value.trim();
        if (folderName) {
            this.createNewFolder(folderName);
            newFolderModal.style.display = 'none';
            newFolderNameInput.value = '';
        }
    });
    
    // Shortcuts Modal
    const shortcutsModal = document.getElementById('shortcutsModal');
    shortcutsModal.querySelector('.close-modal').addEventListener('click', () => {
        shortcutsModal.style.display = 'none';
    });
    
    // Enter key support
    newFileNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            newFileModal.querySelector('.btn-create').click();
        }
    });
    
    newFolderNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            newFolderModal.querySelector('.btn-create').click();
        }
    });

    // Close modals when clicking outside
    [newFileModal, newFolderModal, shortcutsModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                this.selectedFolder = null;
            }
        });
    });
}


    createNewFile(fileName) {
    if (!fileName.trim()) {
        this.showAlert('Please enter a file name', 'error');
        return;
    }

    // Determine the full path based on selected folder
    let fullPath = fileName;
    if (this.selectedFolder) {
        fullPath = `${this.selectedFolder}/${fileName}`;
    }

    // Ensure unique filename
    const uniqueFileName = this.getUniqueFileName(fullPath);
    
    // Determine file type
    const extension = uniqueFileName.split('.').pop().toLowerCase();
    const fileType = this.getFileType(extension);
    
    // Get template content
    let content = this.getTemplateContent(fileType, uniqueFileName);
    
    // Create file
    this.fileSystem.files.set(uniqueFileName, {
        content: content,
        type: fileType,
        modified: false,
        created: new Date(),
        lastModified: new Date()
    });
    
    // If creating in a folder, ensure the folder exists
    if (this.selectedFolder) {
        this.fileSystem.folders.add(this.selectedFolder);
    }
    
    this.renderFileTree();
    this.openFile(uniqueFileName);
    this.showAlert(`File "${uniqueFileName}" created successfully!`, 'success');
    
    // Reset selected folder
    this.selectedFolder = null;
    
    console.log('New file created:', uniqueFileName);
}


    createNewFolder(folderName) {
    if (!folderName.trim()) {
        this.showAlert('Please enter a folder name', 'error');
        return;
    }

    // Determine the full path based on selected parent folder
    let fullPath = folderName;
    if (this.selectedFolder) {
        fullPath = `${this.selectedFolder}/${folderName}`;
    }

    if (this.fileSystem.folders.has(fullPath)) {
        this.showAlert(`Folder "${fullPath}" already exists!`, 'error');
        return;
    }
    
    this.fileSystem.folders.add(fullPath);
    
    // Ensure parent folder exists too
    if (this.selectedFolder) {
        this.fileSystem.folders.add(this.selectedFolder);
    }
    
    this.renderFileTree();
    this.showAlert(`Folder "${fullPath}" created successfully!`, 'success');
    
    // Reset selected folder
    this.selectedFolder = null;
    
    console.log('New folder created:', fullPath);
}


    getUniqueFileName(fileName) {
        if (!this.fileSystem.files.has(fileName)) {
            return fileName;
        }
        
        const parts = fileName.split('.');
        const extension = parts.length > 1 ? '.' + parts.pop() : '';
        const baseName = parts.join('.');
        
        let counter = 1;
        let uniqueName;
        
        do {
            uniqueName = `${baseName}_${counter}${extension}`;
            counter++;
        } while (this.fileSystem.files.has(uniqueName));
        
        return uniqueName;
    }

    getFileType(extension) {
        const types = {
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'js': 'js',
            'json': 'json',
            'md': 'md',
            'txt': 'txt'
        };
        return types[extension] || 'txt';
    }

    getTemplateContent(fileType, fileName) {
        const templates = {
            'html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName.replace('.html', '')}</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <nav>
            <div class="logo">
                <h1>My Website</h1>
            </div>
            <ul class="nav-links">
                <li><a href="index.html">Home</a></li>
                <li><a href="pages/about.html">About</a></li>
                <li><a href="pages/contact.html">Contact</a></li>
                <li><a href="pages/services.html">Services</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section class="page-header">
            <div class="container">
                <h2>Welcome to ${fileName.replace('.html', '')}</h2>
                <p>Start building your amazing content here!</p>
            </div>
        </section>
        
        <section class="page-content">
            <div class="container">
                <h2>Your Content Here</h2>
                <p>Add your amazing content to this page.</p>
            </div>
        </section>
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; 2024 Eye Coders Club. All rights reserved.</p>
        </div>
    </footer>
    
    <script src="js/script.js"></script>
</body>
</html>`,
            'css': `/* Styles for ${fileName} */

/* Add your custom styles here */
.custom-section {
    padding: 2rem 0;
    background: #f8f9fa;
}

.custom-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Example styles */
.highlight {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem;
    border-radius: 8px;
}

.card {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
}

.button {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.button:hover {
    background: #5a67d8;
    transform: translateY(-2px);
}
`,
            'js': `// JavaScript for ${fileName}

console.log('${fileName} loaded successfully!');

// Add your JavaScript code here
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded for ${fileName}');
    
    // Initialize your functionality here
    initializePage();
});

function initializePage() {
    console.log('Initializing page functionality...');
    
    // Add event listeners
    setupEventListeners();
    
    // Add animations or other functionality
    setupAnimations();
}

function setupEventListeners() {
    // Example: Add click listeners to buttons
    const buttons = document.querySelectorAll('.button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Button clicked:', this.textContent);
            // Add your button functionality here
        });
    });
}

function setupAnimations() {
    // Example: Add scroll animations
    const elements = document.querySelectorAll('.card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.6s ease';
        observer.observe(element);
    });
}

// Utility functions
function showNotification(message, type = 'info') {
    // Use the global notification function if available
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        console.log(\`[\${type.toUpperCase()}] \${message}\`);
    }
}

function getCurrentTime() {
    return new Date().toLocaleTimeString();
}

console.log('${fileName} script initialized at', getCurrentTime());
`,
            'json': `{
    "name": "${fileName.replace('.json', '')}",
    "version": "1.0.0",
    "description": "Configuration file for ${fileName.replace('.json', '')}",
    "author": "Eye Coders Club",
    "created": "${new Date().toISOString()}",
    "settings": {
        "theme": "default",
        "language": "en",
        "debug": false
    },
    "features": [
        "feature1",
        "feature2",
        "feature3"
    ]
}`,
            'md': `# ${fileName.replace('.md', '')}

## Description

This is a markdown file for ${fileName.replace('.md', '')}.

## Features

- Feature 1: Description of feature 1
- Feature 2: Description of feature 2
- Feature 3: Description of feature 3

## Usage

\`\`\`javascript
// Example code usage
console.log('Hello from ${fileName}');
\`\`\`

## Installation

1. Step 1: First step description
2. Step 2: Second step description
3. Step 3: Third step description

## Contributing

Feel free to contribute to this project!

---

*Created by Eye Coders Club - ${new Date().toLocaleDateString()}*
`,
            'txt': `This is a text file: ${fileName}

Created on: ${new Date().toLocaleString()}
Author: Eye Coders Club

Add your content here.

Instructions:
1. Replace this content with your own text
2. Use this file for notes, documentation, or plain text content
3. Save regularly to keep your changes

---

Happy coding!
`
        };
        
        return templates[fileType] || '';
    }

    deleteFile(path) {
        if (!confirm(`Are you sure you want to delete "${path.split('/').pop()}"?`)) {
            return;
        }
        
        this.fileSystem.files.delete(path);
        this.openTabs.delete(path);
        
        if (this.activeTab === path) {
            const remainingTabs = Array.from(this.openTabs.keys());
            this.activeTab = remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1] : null;
        }
        
        this.renderFileTree();
        this.renderTabs();
        this.renderEditor();
        this.updateStatusBar();
        
        this.showAlert(`File "${path.split('/').pop()}" deleted successfully!`, 'success');
        
        console.log('File deleted:', path);
    }

    deleteFolder(folderName) {
        if (!confirm(`Are you sure you want to delete folder "${folderName}" and all its contents?`)) {
            return;
        }
        
        // Delete all files in the folder
        const filesToDelete = [];
        for (const [path, file] of this.fileSystem.files) {
            if (path.startsWith(folderName + '/')) {
                filesToDelete.push(path);
            }
        }
        
        filesToDelete.forEach(path => {
            this.fileSystem.files.delete(path);
            this.openTabs.delete(path);
            
            if (this.activeTab === path) {
                const remainingTabs = Array.from(this.openTabs.keys());
                this.activeTab = remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1] : null;
            }
        });
        
        this.fileSystem.folders.delete(folderName);
        
        this.renderFileTree();
        this.renderTabs();
        this.renderEditor();
        this.updateStatusBar();
        
        this.showAlert(`Folder "${folderName}" and ${filesToDelete.length} files deleted successfully!`, 'success');
        
        console.log('Folder deleted:', folderName, 'with', filesToDelete.length, 'files');
    }

    renameFile(path) {
        const currentName = path.split('/').pop();
        const newName = prompt(`Rename "${currentName}" to:`, currentName);
        
        if (!newName || newName === currentName) {
            return;
        }
        
        const newPath = path.replace(currentName, newName);
        
        if (this.fileSystem.files.has(newPath)) {
            this.showAlert(`File "${newName}" already exists!`, 'error');
            return;
        }
        
        // Move file data
        const fileData = this.fileSystem.files.get(path);
        this.fileSystem.files.set(newPath, fileData);
        this.fileSystem.files.delete(path);
        
        // Update open tabs
        if (this.openTabs.has(path)) {
            const tabInfo = this.openTabs.get(path);
            this.openTabs.set(newPath, tabInfo);
            this.openTabs.delete(path);
        }
        
        // Update active tab
        if (this.activeTab === path) {
            this.activeTab = newPath;
        }
        
        this.renderFileTree();
        this.renderTabs();
        this.renderEditor();
        this.updateStatusBar();
        
        this.showAlert(`File renamed to "${newName}" successfully!`, 'success');
        
        console.log('File renamed:', path, '->', newPath);
    }

    performSearch(query) {
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = '';
        
        if (!query.trim()) {
            return;
        }
        
        const results = [];
        
        for (const [path, file] of this.fileSystem.files) {
            const content = file.content.toLowerCase();
            const queryLower = query.toLowerCase();
            
            if (content.includes(queryLower)) {
                const lines = file.content.split('\n');
                lines.forEach((line, index) => {
                    if (line.toLowerCase().includes(queryLower)) {
                        results.push({
                            path,
                            line: index + 1,
                            content: line.trim(),
                            fileName: path.split('/').pop()
                        });
                    }
                });
            }
        }
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result">No results found</div>';
            return;
        }
        
        results.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = 'search-result';
            resultElement.innerHTML = `
                <strong>${result.fileName}</strong> (Line ${result.line})<br>
                <small>${result.content}</small>
            `;
            
            resultElement.addEventListener('click', () => {
                this.openFile(result.path);
                // Focus the search term (basic implementation)
                setTimeout(() => {
                    const editor = document.querySelector('.code-editor');
                    if (editor) {
                        editor.focus();
                    }
                }, 100);
            });
            
            searchResults.appendChild(resultElement);
        });
        
        console.log('Search performed for:', query, 'Results:', results.length);
    }

    changeTheme(theme) {
        document.body.className = theme + '-theme';
        localStorage.setItem('editor-theme', theme);
        console.log('Theme changed to:', theme);
    }

    changeFontSize(size) {
        const editors = document.querySelectorAll('.code-editor');
        editors.forEach(editor => {
            editor.style.fontSize = size + 'px';
        });
        localStorage.setItem('editor-font-size', size);
        console.log('Font size changed to:', size + 'px');
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    this.saveAllFiles();
                    break;
                case 'n':
                    e.preventDefault();
                    this.showNewFileModal();
                    break;
                case 'w':
                    e.preventDefault();
                    if (this.activeTab) {
                        this.closeTab(this.activeTab);
                    }
                    break;
                case 'f':
                    e.preventDefault();
                     this.switchActivityView('search');
                    document.getElementById('searchInput').focus();
                    break;
                case '`':
                    e.preventDefault();
                    this.toggleLiveServer();
                    break;
            }
        }
        
        // Tab navigation
        if (e.ctrlKey && e.key === 'Tab') {
            e.preventDefault();
            const tabs = Array.from(this.openTabs.keys());
            const currentIndex = tabs.indexOf(this.activeTab);
            const nextIndex = e.shiftKey ? 
                (currentIndex - 1 + tabs.length) % tabs.length :
                (currentIndex + 1) % tabs.length;
            
            if (tabs[nextIndex]) {
                this.switchTab(tabs[nextIndex]);
            }
        }
        
        // Escape key to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    }

    async saveAllFiles() {
        this.showAutoSaveIndicator('saving');
        
        try {
            // Mark all files as saved
            for (const [path, tabInfo] of this.openTabs) {
                tabInfo.modified = false;
            }
            
            await this.autoSaveProject();
            this.renderTabs();
            this.showAutoSaveIndicator('success');
            
        } catch (error) {
            console.error('Save error:', error);
            this.showAlert('Error saving files: ' + error.message, 'error');
        }
    }

    async loadSavedProject() {
        if (!this.currentTeam) return;
        
        try {
            console.log('Loading saved project...');
            
            const response = await fetch('/api/client/restore-data', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.hasTempCode) {
                    console.log('Found saved project data');
                    
                    const savedData = result.tempCode;
                    if (savedData.projectStructure) {
                        this.loadProjectStructure(JSON.parse(savedData.projectStructure));
                        this.showAlert('Previous project loaded successfully!', 'success');
                    } else {
                        // Fallback to legacy format
                        if (savedData.htmlCode || savedData.cssCode || savedData.jsCode) {
                            this.loadLegacyProject(savedData);
                            this.showAlert('Previous work restored!', 'success');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading saved project:', error);
        }
    }

    loadProjectStructure(structure) {
        if (structure.files) {
            // Clear existing files except default ones if this is a real restore
            this.fileSystem.files.clear();
            
            for (const [path, fileData] of Object.entries(structure.files)) {
                this.fileSystem.files.set(path, {
                    ...fileData,
                    created: new Date(fileData.created),
                    lastModified: new Date(fileData.lastModified)
                });
            }
        }
        
        if (structure.folders) {
            this.fileSystem.folders = new Set(structure.folders);
        }
        
        this.renderFileTree();
        console.log('Project structure loaded:', structure);
    }

    loadLegacyProject(savedData) {
        // Update existing files with saved content
        if (savedData.htmlCode && this.fileSystem.files.has('index.html')) {
            const file = this.fileSystem.files.get('index.html');
            file.content = savedData.htmlCode;
            file.lastModified = new Date();
        }
        
        if (savedData.cssCode && this.fileSystem.files.has('css/style.css')) {
            const file = this.fileSystem.files.get('css/style.css');
            file.content = savedData.cssCode;
            file.lastModified = new Date();
        }
        
        if (savedData.jsCode && this.fileSystem.files.has('js/script.js')) {
            const file = this.fileSystem.files.get('js/script.js');
            file.content = savedData.jsCode;
            file.lastModified = new Date();
        }
        
        this.renderFileTree();
    }

    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(async () => {
            if (this.currentTeam) {
                await this.autoSaveProject();
            }
        }, 10000); // Auto-save every 10 seconds
        
        console.log('Auto-save started');
    }

    async autoSaveProject() {
        if (!this.currentTeam) return;
        
        try {
            // Prepare project structure
            const projectStructure = {
                files: {},
                folders: Array.from(this.fileSystem.folders),
                lastSaved: new Date().toISOString()
            };
            
            for (const [path, file] of this.fileSystem.files) {
                projectStructure.files[path] = {
                    content: file.content,
                    type: file.type,
                    modified: file.modified,
                    created: file.created.toISOString(),
                    lastModified: file.lastModified.toISOString()
                };
            }
            
            // Get main files for backward compatibility
            const htmlCode = this.fileSystem.files.get('index.html')?.content || '';
            const cssCode = this.fileSystem.files.get('css/style.css')?.content || '';
            const jsCode = this.fileSystem.files.get('js/script.js')?.content || '';
            
            const response = await fetch('/api/client/temp-save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    htmlCode,
                    cssCode,
                    jsCode,
                    projectStructure: JSON.stringify(projectStructure)
                })
            });
            
            if (response.ok) {
                this.showAutoSaveIndicator('success');
            }
            
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    async submitCode() {
        if (!this.currentTeam) {
            this.showAlert('No team information found. Cannot submit code.', 'error');
            return;
        }
        
        if (!confirm('Are you sure you want to submit your project? This will save all your files and create a submission.')) {
            return;
        }
        
        try {
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            
            // Prepare project data
            const projectStructure = {
                files: {},
                folders: Array.from(this.fileSystem.folders),
                submittedAt: new Date().toISOString()
            };
            
            for (const [path, file] of this.fileSystem.files) {
                projectStructure.files[path] = {
                    content: file.content,
                    type: file.type,
                    created: file.created.toISOString(),
                    lastModified: file.lastModified.toISOString()
                };
            }
            
            // Get main files for backward compatibility
            const htmlCode = this.fileSystem.files.get('index.html')?.content || '';
            const cssCode = this.fileSystem.files.get('css/style.css')?.content || '';
            const jsCode = this.fileSystem.files.get('js/script.js')?.content || '';
            
            const response = await fetch('/api/client/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    htmlCode,
                    cssCode,
                    jsCode,
                    projectStructure: JSON.stringify(projectStructure)
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showAlert(`Project submitted successfully! ${result.message}`, 'success');
                
                // Mark all files as saved
                for (const [path, tabInfo] of this.openTabs) {
                    tabInfo.modified = false;
                }
                this.renderTabs();
                
            } else {
                this.showAlert('Submission failed: ' + result.message, 'error');
            }
            
        } catch (error) {
            this.showAlert('Error submitting project: ' + error.message, 'error');
        } finally {
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-upload"></i> Submit Code';
        }
    }

    showAutoSaveIndicator(status) {
        const indicator = document.getElementById('autoSaveIndicator');
        
        indicator.style.display = 'flex';
        
        if (status === 'saving') {
            indicator.className = 'auto-save-indicator';
            indicator.innerHTML = '<span class="save-icon">💾</span><span class="save-text">Auto-saving...</span>';
        } else if (status === 'success') {
            indicator.className = 'auto-save-indicator success';
            indicator.innerHTML = '<span class="save-icon">✅</span><span class="save-text">Saved</span>';
        } else if (status === 'changed') {
            indicator.className = 'auto-save-indicator';
            indicator.innerHTML = '<span class="save-icon">📝</span><span class="save-text">Changes detected</span>';
        }
        
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 2000);
    }

    showAlert(message, type) {
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${type}`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 1001;
            max-width: 400px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 
              type === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' :
              'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;'}
        `;
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Global functions for inline event handlers
window.editor = null;

// Initialize the editor when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing VS Code Editor...');
    window.editor = new VSCodeEditor();
});

// Export editor instance for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VSCodeEditor;
}