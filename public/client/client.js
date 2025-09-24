class VSCodeEditor {
    constructor() {
        this.currentTeam = null;
        this.fileSystem = {
            files: new Map(),
            folders: new Set(['assets', 'css', 'js', 'pages'])
        };
        this.openTabs = new Map();
        this.activeTab = null;
        this.liveServerWindow = null;
        this.liveServerPort = null;
        this.autoSaveInterval = null;
        this.editorHistory = new Map();
        
        this.initializeDefaultFiles();
        this.init();
    }

    initializeDefaultFiles() {
        // Default files with templates
        const defaultFiles = [
            {
                path: 'index.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <h1>Welcome to Eye Coders Club!</h1>
        <nav>
            <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="pages/about.html">About</a></li>
                <li><a href="pages/contact.html">Contact</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section class="hero">
            <h2>Start Building Amazing Projects</h2>
            <p>This is your starting template. Customize it as needed!</p>
            <button onclick="showMessage()">Click Me!</button>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 Eye Coders Club. All rights reserved.</p>
    </footer>
    
    <script src="js/script.js"></script>
</body>
</html>`,
                type: 'html'
            },
            {
                path: 'css/style.css',
                content: `/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

/* Header Styles */
header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 1rem 2rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

header h1 {
    color: #333;
    margin-bottom: 0.5rem;
}

nav ul {
    list-style: none;
    display: flex;
    gap: 2rem;
}

nav a {
    text-decoration: none;
    color: #666;
    font-weight: 500;
    transition: color 0.3s ease;
}

nav a:hover {
    color: #667eea;
}

/* Main Content */
main {
    padding: 4rem 2rem;
    text-align: center;
}

.hero {
    background: rgba(255, 255, 255, 0.9);
    padding: 3rem;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    margin: 0 auto;
}

.hero h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #333;
}

.hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    color: #666;
}

button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 25px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

/* Footer */
footer {
    background: rgba(0, 0, 0, 0.1);
    color: white;
    text-align: center;
    padding: 2rem;
    margin-top: auto;
}

/* Responsive Design */
@media (max-width: 768px) {
    nav ul {
        flex-direction: column;
        gap: 1rem;
    }
    
    .hero {
        padding: 2rem;
    }
    
    .hero h2 {
        font-size: 2rem;
    }
}`,
                type: 'css'
            },
            {
                path: 'js/script.js',
                content: `// Welcome to Eye Coders Club JavaScript!
console.log('🚀 Eye Coders Club Project Loaded Successfully!');

// Interactive functionality
function showMessage() {
    const messages = [
        'Welcome to Eye Coders Club! 🎉',
        'Keep coding and stay awesome! 💻',
        'You are building something amazing! ⭐',
        'Great job on your project! 🎯',
        'The future is bright with your code! 🌟'
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Create and show notification
    showNotification(randomMessage);
    
    // Add some visual feedback
    const button = event.target;
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 150);
}

function showNotification(message) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = \`
        <div class="notification-content">
            <span>\${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    \`;
    
    // Add styles
    notification.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    \`;
    
    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = \`
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
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
            }
        \`;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Page load animation
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM Content Loaded - Initializing animations...');
    
    // Add fade-in animation to hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(30px)';
        hero.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            hero.style.opacity = '1';
            hero.style.transform = 'translateY(0)';
        }, 300);
    }
    
    // Add hover effects to navigation
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.transition = 'transform 0.2s ease';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// Utility functions
function getCurrentTime() {
    return new Date().toLocaleTimeString();
}

function log(message) {
    console.log(\`[\${getCurrentTime()}] \${message}\`);
}

// Example of modern JavaScript features
const projectInfo = {
    name: 'Eye Coders Club Project',
    version: '1.0.0',
    author: 'Your Name',
    created: new Date().toISOString().split('T')[0]
};

log(\`Project Info: \${JSON.stringify(projectInfo, null, 2)}\`);`,
                type: 'js'
            },
            {
                path: 'pages/about.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About - My Project</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <header>
        <h1>About Us</h1>
        <nav>
            <ul>
                <li><a href="../index.html">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="contact.html">Contact</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section class="hero">
            <h2>About Our Project</h2>
            <p>This is the about page where you can describe your project, team, or company.</p>
            <p>Add your own content here to make it unique and engaging!</p>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 Eye Coders Club. All rights reserved.</p>
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
    <title>Contact - My Project</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <header>
        <h1>Contact Us</h1>
        <nav>
            <ul>
                <li><a href="../index.html">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="contact.html">Contact</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section class="hero">
            <h2>Get In Touch</h2>
            <p>We'd love to hear from you! Contact us using the information below.</p>
            <div style="text-align: left; max-width: 400px; margin: 2rem auto;">
                <p><strong>Email:</strong> info@eyecodersclub.com</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                <p><strong>Address:</strong> 123 Code Street, Tech City, TC 12345</p>
            </div>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 Eye Coders Club. All rights reserved.</p>
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
    }

    async init() {
        try {
            document.getElementById('loadingOverlay').style.display = 'flex';
            
            const authStatus = await this.checkAuthenticationStatus();
            
            if (!authStatus.authenticated) {
                this.showLoginPrompt();
                return;
            }
            
            this.currentTeam = authStatus.team;
            document.getElementById('loadingOverlay').style.display = 'none';
            
            await this.updateTeamDisplay();
            await this.loadSavedProject();
            
            this.setupEventListeners();
            this.renderFileTree();
            this.startAutoSave();
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showAlert('Error loading team information: ' + error.message, 'error');
            document.getElementById('loadingOverlay').style.display = 'none';
            this.showLoginPrompt();
        }
    }

    async checkAuthenticationStatus() {
        try {
            const response = await fetch('/auth/status', {
                credentials: 'include',
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                return result;
            } else {
                throw new Error(result.message || 'Authentication check failed');
            }
        } catch (error) {
            console.error('Auth status check error:', error);
            return { authenticated: false };
        }
    }

    showLoginPrompt() {
        document.getElementById('loadingOverlay').style.display = 'none';
        
        const existingPrompt = document.querySelector('.login-prompt');
        if (existingPrompt) {
            existingPrompt.remove();
        }
        
        const loginDiv = document.createElement('div');
        loginDiv.className = 'login-prompt';
        loginDiv.innerHTML = `
            <div class="login-content">
                <img src="../assets/logo.png" alt="Eye Coders Club" class="login-logo">
                <h2>Welcome to Eye Coders Club IDE</h2>
                <p>Please sign in with your registered Google account to continue.</p>
                <button class="google-login-btn" onclick="window.location.href='/auth/google'">
                    <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google">
                    Sign in with Google
                </button>
            </div>
        `;
        
        document.body.appendChild(loginDiv);
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

        // Go Live button
        document.getElementById('goLiveBtn').addEventListener('click', () => {
            this.toggleLiveServer();
        });

        // Submit button
        document.getElementById('submitBtn').addEventListener('click', () => {
            this.submitCode();
        });

        // Theme selector
        document.getElementById('themeSelector').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        // Font size selector
        document.getElementById('fontSizeSelector').addEventListener('change', (e) => {
            this.changeFontSize(e.target.value);
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

        // Render root files
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
    }

    createFileElement(path, file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        if (this.activeTab === path) {
            fileItem.classList.add('active');
        }

        const icon = this.getFileIcon(file.type);
        const fileName = path.split('/').pop();

        fileItem.innerHTML = `
            <i class="${icon}"></i>
            <span>${fileName}</span>
            <div class="file-actions">
                <button class="file-action-btn" onclick="editor.renameFile('${path}')" title="Rename">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="file-action-btn" onclick="editor.deleteFile('${path}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        fileItem.addEventListener('click', () => {
            this.openFile(path);
        });

        return fileItem;
    }

    createFolderElement(folderName, files) {
        const folderContainer = document.createElement('div');
        
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item expanded';
        folderItem.innerHTML = `
            <i class="fas fa-folder-open"></i>
            <span>${folderName}</span>
            <div class="file-actions">
                <button class="file-action-btn" onclick="editor.deleteFolder('${folderName}')" title="Delete Folder">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        const folderContents = document.createElement('div');
        folderContents.className = 'folder-contents';

        files.forEach(({ path, file }) => {
            folderContents.appendChild(this.createFileElement(path, file));
        });

        folderItem.addEventListener('click', (e) => {
            e.stopPropagation();
            folderItem.classList.toggle('expanded');
            folderItem.classList.toggle('collapsed');
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
        if (!this.fileSystem.files.has(path)) return;

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
                <button class="tab-close" onclick="editor.closeTab('${path}', event)">
                    <i class="fas fa-times"></i>
                </button>
            `;

            tab.addEventListener('click', (e) => {
                if (!e.target.closest('.tab-close')) {
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

        editorContainer.appendChild(editor);

        // Restore scroll position
        const tabInfo = this.openTabs.get(this.activeTab);
        if (tabInfo && tabInfo.scrollPosition) {
            textarea.scrollTop = tabInfo.scrollPosition;
        }

        // Focus the editor
        setTimeout(() => textarea.focus(), 100);
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

    closeTab(path, event) {
        event.stopPropagation();
        
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
                return item.querySelector('span').textContent === fileName;
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
            if (activeEditor) {
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
        } else {
            // Start live server
            const htmlContent = this.generatePreviewHTML();
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            this.liveServerWindow = window.open(url, 'LivePreview', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            
            if (this.liveServerWindow) {
                goLiveBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Live Server';
                goLiveBtn.classList.add('active');
                liveServerStatus.innerHTML = '<i class="fas fa-circle"></i> <span>Live Server: Online</span>';
                liveServerStatus.classList.remove('offline');
                liveServerStatus.classList.add('online');
                
                // Auto-refresh preview when files change
                this.startLiveReload();
            }
        }
    }

    generatePreviewHTML() {
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
            return '<html><body><h1>No HTML file found</h1><p>Create an HTML file to see the preview.</p></body></html>';
        }
        
        let htmlContent = this.fileSystem.files.get(mainHtmlPath).content;
        
        // Inject CSS and JS inline
        let cssContent = '';
        let jsContent = '';
        
        for (const [path, file] of this.fileSystem.files) {
            if (file.type === 'css') {
                cssContent += file.content + '\n';
            } else if (file.type === 'js') {
                jsContent += file.content + '\n';
            }
        }
        
        // Replace external CSS links with inline styles
        if (cssContent) {
            const styleTag = `<style>\n${cssContent}\n</style>`;
            if (htmlContent.includes('</head>')) {
                htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
            } else {
                htmlContent = `<head>${styleTag}</head>\n` + htmlContent;
            }
        }
        
        // Replace external JS links with inline scripts
        if (jsContent) {
            const scriptTag = `<script>\n${jsContent}\n</script>`;
            if (htmlContent.includes('</body>')) {
                htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
            } else {
                htmlContent = htmlContent + `\n${scriptTag}`;
            }
        }
        
        // Add live reload script
        const liveReloadScript = `
            <script>
                // Live reload functionality
                let lastModified = ${Date.now()};
                setInterval(() => {
                    if (window.opener && !window.opener.closed) {
                        try {
                            const editor = window.opener.editor;
                            if (editor && editor.getLastModified() > lastModified) {
                                lastModified = editor.getLastModified();
                                location.reload();
                            }
                        } catch (e) {
                            // Cross-origin or other error, ignore
                        }
                    }
                }, 1000);
            </script>
        `;
        
        if (htmlContent.includes('</body>')) {
            htmlContent = htmlContent.replace('</body>', `${liveReloadScript}\n</body>`);
        } else {
            htmlContent = htmlContent + liveReloadScript;
        }
        
        return htmlContent;
    }

    startLiveReload() {
        // This method will be called when files change to update the preview
        if (this.liveReloadInterval) {
            clearInterval(this.liveReloadInterval);
        }
        
        this.liveReloadInterval = setInterval(() => {
            if (this.liveServerWindow && !this.liveServerWindow.closed) {
                // Check if any file has been modified recently
                let shouldReload = false;
                for (const [path, file] of this.fileSystem.files) {
                    if (file.lastModified && Date.now() - file.lastModified.getTime() < 2000) {
                        shouldReload = true;
                        break;
                    }
                }
                
                if (shouldReload) {
                    try {
                        const newHtml = this.generatePreviewHTML();
                        const blob = new Blob([newHtml], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        this.liveServerWindow.location.href = url;
                    } catch (error) {
                        console.error('Live reload error:', error);
                    }
                }
            } else {
                clearInterval(this.liveReloadInterval);
            }
        }, 1000);
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

    setupModalEventListeners() {
        // New File Modal
        const newFileModal = document.getElementById('newFileModal');
        const newFileNameInput = document.getElementById('newFileName');
        
        newFileModal.querySelector('.close-modal').addEventListener('click', () => {
            newFileModal.style.display = 'none';
        });
        
        newFileModal.querySelector('.btn-cancel').addEventListener('click', () => {
            newFileModal.style.display = 'none';
        });
        
        newFileModal.querySelector('.btn-create').addEventListener('click', () => {
            const fileName = newFileNameInput.value.trim();
            if (fileName) {
                this.createNewFile(fileName);
                newFileModal.style.display = 'none';
                newFileNameInput.value = '';
            }
        });
        
        // Template buttons
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const template = btn.dataset.template;
                const extension = template === 'html' ? '.html' : template === 'css' ? '.css' : '.js';
                const baseName = template === 'html' ? 'page' : template === 'css' ? 'styles' : 'script';
                newFileNameInput.value = this.getUniqueFileName(baseName + extension);
            });
        });
        
        // New Folder Modal
        const newFolderModal = document.getElementById('newFolderModal');
        const newFolderNameInput = document.getElementById('newFolderName');
        
        newFolderModal.querySelector('.close-modal').addEventListener('click', () => {
            newFolderModal.style.display = 'none';
        });
        
        newFolderModal.querySelector('.btn-cancel').addEventListener('click', () => {
            newFolderModal.style.display = 'none';
        });
        
        newFolderModal.querySelector('.btn-create').addEventListener('click', () => {
            const folderName = newFolderNameInput.value.trim();
            if (folderName) {
                this.createNewFolder(folderName);
                newFolderModal.style.display = 'none';
                newFolderNameInput.value = '';
            }
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
    }

    createNewFile(fileName, template = null) {
        // Ensure unique filename
        const uniqueFileName = this.getUniqueFileName(fileName);
        
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
        
        this.renderFileTree();
        this.openFile(uniqueFileName);
        this.showAlert(`File "${uniqueFileName}" created successfully!`, 'success');
    }

    createNewFolder(folderName) {
        if (this.fileSystem.folders.has(folderName)) {
            this.showAlert(`Folder "${folderName}" already exists!`, 'error');
            return;
        }
        
        this.fileSystem.folders.add(folderName);
        this.renderFileTree();
        this.showAlert(`Folder "${folderName}" created successfully!`, 'success');
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
        <h1>Welcome to ${fileName.replace('.html', '')}</h1>
    </header>
    
    <main>
        <p>Start building your amazing content here!</p>
    </main>
    
    <footer>
        <p>&copy; 2024 Eye Coders Club. All rights reserved.</p>
    </footer>
    
    <script src="js/script.js"></script>
</body>
</html>`,
            'css': `/* Styles for ${fileName} */

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
}

/* Add your custom styles here */
`,
            'js': `// JavaScript for ${fileName}

console.log('${fileName} loaded successfully!');

// Add your JavaScript code here
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Your initialization code here
});

// Example function
function exampleFunction() {
    console.log('Example function called');
}
`,
            'json': `{
    "name": "${fileName.replace('.json', '')}",
    "version": "1.0.0",
    "description": "Configuration file",
    "author": "Eye Coders Club"
}`,
            'md': `# ${fileName.replace('.md', '')}

## Description

Add your content here.

## Features

- Feature 1
- Feature 2
- Feature 3

## Usage

Describe how to use this.
`,
            'txt': `This is a text file: ${fileName}

Add your content here.
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
                // TODO: Jump to specific line
            });
            
            searchResults.appendChild(resultElement);
        });
    }

    changeTheme(theme) {
        document.body.className = theme + '-theme';
        localStorage.setItem('editor-theme', theme);
    }

    changeFontSize(size) {
        const editors = document.querySelectorAll('.code-editor');
        editors.forEach(editor => {
            editor.style.fontSize = size + 'px';
        });
        localStorage.setItem('editor-font-size', size);
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
                case 'o':
                    e.preventDefault();
                    // TODO: Open file dialog
                    break;
                case 'w':
                    e.preventDefault();
                    if (this.activeTab) {
                        this.closeTab(this.activeTab, { stopPropagation: () => {} });
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
            const response = await fetch('/api/client/restore-data', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.hasTempCode) {
                    // Load saved project structure
                    const savedData = result.tempCode;
                    if (savedData.projectStructure) {
                        this.loadProjectStructure(JSON.parse(savedData.projectStructure));
                    }
                }
            }
        } catch (error) {
            console.error('Error loading saved project:', error);
        }
    }

    loadProjectStructure(structure) {
        if (structure.files) {
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
        
        if (!confirm('Are you sure you want to submit your project? This will save all your files.')) {
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
            ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
        `;
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Global functions for inline event handlers
window.createNewFile = function(fileName) {
    window.editor.createNewFile(fileName);
};

// Initialize the editor when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.editor = new VSCodeEditor();
});
