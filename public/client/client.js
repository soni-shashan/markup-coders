let currentTeam = null;
let autoSaveInterval = null;
let restoreData = null;

// Welcome banner configuration
const WELCOME_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function maybeShowWelcomeBanner() {
    try {
        console.log('maybeShowWelcomeBanner: entered', { currentTeam: !!currentTeam });
        
        if (!currentTeam) {
            console.log('maybeShowWelcomeBanner: no currentTeam yet, retrying shortly');
            setTimeout(maybeShowWelcomeBanner, 300);
            return;
        }
        
        // Wait a bit to ensure DOM is ready
        setTimeout(() => {
            console.log('maybeShowWelcomeBanner: showing welcome overlay');
            showWelcomeOverlay(WELCOME_DURATION_MS);
        }, 500);
        
    } catch (e) {
        console.error('maybeShowWelcomeBanner error', e);
    }
}

function showWelcomeOverlay(durationMs) {
    console.log('showWelcomeOverlay called', { durationMs });
    
    const overlay = document.getElementById('welcomeOverlay');
    const minutesEl = document.getElementById('countdownMinutes');
    const secondsEl = document.getElementById('countdownSeconds');
    const progressBar = document.getElementById('progressBar');
    const closeBtn = document.getElementById('welcomeClose');

    console.log('Elements found:', { 
        overlay: !!overlay, 
        minutes: !!minutesEl, 
        seconds: !!secondsEl,
        progressBar: !!progressBar,
        closeBtn: !!closeBtn 
    });

    if (!overlay) {
        console.error('showWelcomeOverlay: overlay element not found');
        return;
    }

    // Show the overlay with proper styling
    try {
        overlay.style.display = 'flex';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '10000';
        overlay.style.pointerEvents = 'auto';
        
        console.log('Overlay styles applied successfully');
    } catch (e) {
        console.error('Could not apply overlay styles', e);
    }

    document.body.classList.add('welcome-active');
    overlay.setAttribute('aria-hidden', 'false');

    const totalSeconds = Math.floor(durationMs / 1000);
    let remainingSeconds = totalSeconds;
    
    console.log('Starting countdown with', remainingSeconds, 'seconds');

    function updateCountdown() {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        
        // Update display if elements exist
        if (minutesEl) {
            minutesEl.textContent = minutes.toString().padStart(2, '0');
        }
        if (secondsEl) {
            secondsEl.textContent = seconds.toString().padStart(2, '0');
        }
        
        // Update progress bar if it exists
        if (progressBar) {
            const progressPercentage = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
            progressBar.style.width = progressPercentage + '%';
        }
        
        console.log(`Countdown: ${minutes}:${seconds.toString().padStart(2, '0')} (${remainingSeconds} seconds left)`);
        
        // Change colors when time is running low
        if (remainingSeconds <= 30) {
            if (minutesEl) minutesEl.style.color = '#ff6b6b';
            if (secondsEl) secondsEl.style.color = '#ff6b6b';
            if (progressBar) progressBar.style.background = 'linear-gradient(90deg, #ff6b6b, #ff4757)';
        } else if (remainingSeconds <= 60) {
            if (minutesEl) minutesEl.style.color = '#ffd93d';
            if (secondsEl) secondsEl.style.color = '#ffd93d';
            if (progressBar) progressBar.style.background = 'linear-gradient(90deg, #ffd93d, #ff6b6b)';
        }
    }

    // Initial update
    updateCountdown();

    const countdownInterval = setInterval(() => {
        remainingSeconds--;
        
        if (remainingSeconds < 0) {
            remainingSeconds = 0;
            updateCountdown();
            clearInterval(countdownInterval);
            console.log('Countdown finished, closing overlay');
            closeWelcomeOverlay();
            return;
        }
        
        updateCountdown();
    }, 1000);

    function onCloseEarly() {
        console.log('Close button clicked');
        clearInterval(countdownInterval);
        closeWelcomeOverlay();
    }

    // Attach close button listener
    if (closeBtn) {
        closeBtn.addEventListener('click', onCloseEarly, { once: true });
        console.log('Close button listener attached');
    } else {
        console.warn('Close button not found');
    }

    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            console.log('Escape key pressed');
            clearInterval(countdownInterval);
            closeWelcomeOverlay();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    console.log('Welcome overlay should now be visible with working countdown');
}

function closeWelcomeOverlay() {
    console.log('closeWelcomeOverlay called');
    
    const overlay = document.getElementById('welcomeOverlay');
    if (overlay) {
        // Add closing animation
        overlay.style.animation = 'fadeOut 0.5s ease-out forwards';
        
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.style.animation = '';
            console.log('Welcome overlay closed');
        }, 500);
    } else {
        console.error('Could not find overlay to close');
    }
    
    document.body.classList.remove('welcome-active');
}


// Enhanced editor functionality
let editorHistory = {
    html: { undo: [], redo: [] },
    css: { undo: [], redo: [] },
    js: { undo: [], redo: [] }
};

let lastContent = {
    html: '',
    css: '',
    js: ''
};

// Initialize client interface
document.addEventListener('DOMContentLoaded', function() {
    initializeInterface();
    setupEventListeners();
    setupKeyboardShortcuts();
});
async function initializeInterface() {
    try {
        document.getElementById('loadingOverlay').style.display = 'flex';
        
        console.log('Starting authentication check...');
        
        // Check authentication status
        const authStatus = await checkAuthenticationStatus();
        
        console.log('Auth Status Response:', authStatus);
        console.log('Is Authenticated:', authStatus.authenticated);
        console.log('Team Data:', authStatus.team);
        
        if (!authStatus.authenticated) {
            console.log('User not authenticated, showing login prompt');
            showLoginPrompt();
            return;
        }
        
        currentTeam = authStatus.team;
        console.log('Current Team Set:', currentTeam);
        
        document.getElementById('loadingOverlay').style.display = 'none';
        
        if (currentTeam) {
            console.log('Team found, updating display...');
            await updateTeamDisplay();
            const submitBtnEl = document.getElementById('submitBtn');
            if (submitBtnEl) {
                submitBtnEl.disabled = false;
            } else {
                console.warn('submitBtn not found when enabling submit');
            }
            await checkForRestoreData();
            startAutoSave();
        } else {
            console.error('No team data received despite authentication success');
            showAlert('No team information found. Please contact administrator.', 'error');
        }
        
        initializeEditorHistory();
        runCode();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Error loading team information: ' + error.message, 'error');
        document.getElementById('loadingOverlay').style.display = 'none';
        showLoginPrompt();
    }
}

async function checkAuthenticationStatus() {
    try {
        console.log('Making request to /auth/status...');
        
        const response = await fetch('/auth/status', {
            credentials: 'include',
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Raw server response:', result);
        
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

async function updateTeamDisplay() {
    console.log('updateTeamDisplay called with:', currentTeam);
    
    if (currentTeam) {
        // Update team information display
        const teamNameEl = document.getElementById('teamName');
        const teamLeaderEl = document.getElementById('teamLeader');
        const studentIdEl = document.getElementById('studentId');
        const pcIPEl = document.getElementById('pcIP');
        
        console.log('Team Name Element:', teamNameEl);
        console.log('Team Leader Element:', teamLeaderEl);
        console.log('Student ID Element:', studentIdEl);
        console.log('PC IP Element:', pcIPEl);
        
        if (teamNameEl) {
            teamNameEl.textContent = currentTeam.teamName || 'Unknown Team';
            console.log('Set team name to:', teamNameEl.textContent);
        }
        if (teamLeaderEl) {
            teamLeaderEl.textContent = `Leader: ${currentTeam.teamLeaderName || 'Unknown'}`;
            console.log('Set team leader to:', teamLeaderEl.textContent);
        }
        if (studentIdEl) {
            studentIdEl.textContent = `ID: ${currentTeam.studentId || 'Unknown'}`;
            console.log('Set student ID to:', studentIdEl.textContent);
        }
        if (pcIPEl) {
            pcIPEl.textContent = `Email: ${currentTeam.email || 'Unknown'}`;
            console.log('Set email to:', pcIPEl.textContent);
        }
        
        // Show welcome banner after team display is updated
        console.log('updateTeamDisplay: calling maybeShowWelcomeBanner');
        if (currentTeam.isFirstTimeUser) {
            await maybeShowWelcomeBanner();
            await markUserAsNotFirstTime();
        }
        
    } else {
        console.error('No currentTeam data available for display');
    }
}

async function markUserAsNotFirstTime() {
    try {
        const response = await fetch('/isFirstTimeUser', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.success) {
            console.log('User marked as not first time successfully');
            currentTeam.isFirstTimeUser = false;
        } else {
            console.error('Failed to mark user as not first time:', result.message);
        }
    } catch (error) {
        console.error('Error marking user as not first time:', error);
    }
}

function showLoginPrompt() {
    document.getElementById('loadingOverlay').style.display = 'none';
    
    // Remove any existing login prompt
    const existingPrompt = document.querySelector('.login-prompt');
    if (existingPrompt) {
        existingPrompt.remove();
    }
    
    // Create login prompt
    const loginDiv = document.createElement('div');
    loginDiv.className = 'login-prompt';
    loginDiv.innerHTML = `
        <div class="login-content">
            <img src="../assets/logo.png" alt="Eye Coders Club" class="login-logo">
            <h2>Welcome to Eye Coders Club</h2>
            <p>Please sign in with your registered Google account to continue.</p>
            <button class="google-login-btn" onclick="loginWithGoogle()">
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google">
                Sign in with Google
            </button>
            <div class="login-note">
                <p><strong>Note:</strong> Only registered team members can access this platform.</p>
                <p>If you're having trouble logging in, please contact your administrator.</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(loginDiv);
}

function loginWithGoogle() {
    window.location.href = '/auth/google';
}



function setupEventListeners() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns && tabBtns.length) {
        tabBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', function() {
                    switchTab(this.dataset.tab);
                });
            }
        });
    } else {
        console.warn('No .tab-btn elements found to attach listeners');
    }

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitCode);
    } else {
        console.warn('submitBtn not found; submit functionality disabled');
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    const shortcutsHint = document.querySelector('.shortcuts-hint');
    if (shortcutsHint) {
        shortcutsHint.addEventListener('click', showShortcutsModal);
    }
    
    document.querySelectorAll('.code-textarea, textarea').forEach(textarea => {
        const editorType = textarea.id.replace('Code', '');
        
        textarea.addEventListener('keydown', function(e) {
            handleKeyDown(e, this, editorType);
        });
        
        textarea.addEventListener('input', function() {
            handleInput(this, editorType);
            runCode();
        });
        
        textarea.addEventListener('blur', function() {
            saveToHistory(editorType);
        });
        
        textarea.setAttribute('data-lang', editorType);
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    const submitBtnEl = document.getElementById('submitBtn');
                    if (currentTeam && submitBtnEl && !submitBtnEl.disabled) {
                        submitCode();
                    }
                    break;
                case '1':
                    e.preventDefault();
                    switchTab('html');
                    break;
                case '2':
                    e.preventDefault();
                    switchTab('css');
                    break;
                case '3':
                    e.preventDefault();
                    switchTab('js');
                    break;
            }
        }
        
        if (e.key === 'F5') {
            e.preventDefault();
            runCode();
        }
        
        if (e.key === 'Escape') {
            closeShortcutsModal();
            closeRestoreModal();
        }
    });
}

function handleKeyDown(e, textarea, editorType) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'z':
                e.preventDefault();
                if (e.shiftKey) {
                    redo(editorType);
                } else {
                    undo(editorType);
                }
                break;
            case 'y':
                e.preventDefault();
                redo(editorType);
                break;
            case '/':
                e.preventDefault();
                toggleComment(textarea, editorType);
                break;
            case 'd':
                e.preventDefault();
                duplicateLine(textarea);
                break;
            case 'l':
                e.preventDefault();
                selectLine(textarea);
                break;
            case 'x':
                saveToHistory(editorType);
                break;
            case 'v':
                setTimeout(() => saveToHistory(editorType), 10);
                break;
        }
    }
    
    if (e.key === 'Tab') {
        e.preventDefault();
        
        if (e.shiftKey) {
            unindentText(textarea);
        } else {
            if (start !== end) {
                indentSelectedLines(textarea);
            } else {
                const newValue = value.substring(0, start) + '    ' + value.substring(end);
                textarea.value = newValue;
                textarea.selectionStart = textarea.selectionEnd = start + 4;
            }
        }
    }
    
    if (e.key === 'Enter') {
        const currentLine = value.substring(0, start).split('\n').pop();
        const indentMatch = currentLine.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';
        
        let extraIndent = '';
        if (currentLine.trim().endsWith('{') || currentLine.trim().endsWith('[') || currentLine.trim().endsWith('(')) {
            extraIndent = '    ';
        }
        
        setTimeout(() => {
            const currentStart = textarea.selectionStart;
            const currentValue = textarea.value;
            textarea.value = currentValue.substring(0, currentStart) + indent + extraIndent + currentValue.substring(currentStart);
            textarea.selectionStart = textarea.selectionEnd = currentStart + indent.length + extraIndent.length;
        }, 0);
    }
}

function handleInput(textarea, editorType) {
    if (currentTeam) {
        showAutoSaveIndicator('changed');
    }
}

function indentSelectedLines(textarea) {
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
}

function unindentText(textarea) {
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
}

function toggleComment(textarea, editorType) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    
    const commentSyntax = {
        html: { start: '<!-- ', end: ' -->' },
        css: { start: '/* ', end: ' */' },
        js: { start: '// ', end: '' }
    };
    
    const syntax = commentSyntax[editorType];
    if (!syntax) return;
    
    const beforeSelection = value.substring(0, start);
    const selection = value.substring(start, end);
    const afterSelection = value.substring(end);
    
    let newSelection;
    
    if (syntax.end === '') {
        const lines = selection.split('\n');
        const allCommented = lines.every(line => line.trim().startsWith(syntax.start.trim()) || line.trim() === '');
        
        if (allCommented) {
            newSelection = lines.map(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith(syntax.start.trim())) {
                    const indent = line.match(/^(\s*)/)[1];
                    return indent + line.trim().substring(syntax.start.trim().length);
                }
                return line;
            }).join('\n');
        } else {
            newSelection = lines.map(line => {
                if (line.trim() !== '') {
                    const indent = line.match(/^(\s*)/)[1];
                    return indent + syntax.start + line.trim();
                }
                return line;
            }).join('\n');
        }
    } else {
        if (selection.startsWith(syntax.start) && selection.endsWith(syntax.end)) {
            newSelection = selection.substring(syntax.start.length, selection.length - syntax.end.length);
        } else {
            newSelection = syntax.start + selection + syntax.end;
        }
    }
    
    textarea.value = beforeSelection + newSelection + afterSelection;
    textarea.selectionStart = start;
    textarea.selectionEnd = start + newSelection.length;
    
    saveToHistory(editorType);
}

function duplicateLine(textarea) {
    const start = textarea.selectionStart;
    const value = textarea.value;
    
    const beforeCursor = value.substring(0, start);
    const afterCursor = value.substring(start);
    
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    const lineEnd = afterCursor.indexOf('\n');
    const lineEndPos = lineEnd === -1 ? value.length : start + lineEnd;
    
    const currentLine = value.substring(lineStart, lineEndPos);
    const newLine = '\n' + currentLine;
    
    textarea.value = value.substring(0, lineEndPos) + newLine + value.substring(lineEndPos);
    textarea.selectionStart = textarea.selectionEnd = lineEndPos + newLine.length;
}

function selectLine(textarea) {
    const start = textarea.selectionStart;
    const value = textarea.value;
    
    const beforeCursor = value.substring(0, start);
    const afterCursor = value.substring(start);
    
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    const lineEnd = afterCursor.indexOf('\n');
    const lineEndPos = lineEnd === -1 ? value.length : start + lineEnd;
    
    textarea.selectionStart = lineStart;
    textarea.selectionEnd = lineEndPos;
}

function initializeEditorHistory() {
    ['html', 'css', 'js'].forEach(type => {
        const textarea = document.getElementById(type + 'Code');
        if (textarea) {
            lastContent[type] = textarea.value;
            editorHistory[type] = { undo: [textarea.value], redo: [] };
        }
    });
}

function saveToHistory(editorType) {
    const textarea = document.getElementById(editorType + 'Code');
    if (!textarea) return;
    
    const currentContent = textarea.value;
    
    if (currentContent !== lastContent[editorType]) {
        editorHistory[editorType].undo.push(currentContent);
        editorHistory[editorType].redo = [];
        
        if (editorHistory[editorType].undo.length > 50) {
            editorHistory[editorType].undo.shift();
        }
        
        lastContent[editorType] = currentContent;
    }
}

function undo(editorType) {
    const history = editorHistory[editorType];
    if (history.undo.length > 1) {
        const current = history.undo.pop();
        history.redo.push(current);
        
        const previous = history.undo[history.undo.length - 1];
        const textarea = document.getElementById(editorType + 'Code');
        
        if (textarea) {
            const cursorPos = textarea.selectionStart;
            textarea.value = previous;
            textarea.selectionStart = textarea.selectionEnd = Math.min(cursorPos, previous.length);
            lastContent[editorType] = previous;
        }
    }
}

function redo(editorType) {
    const history = editorHistory[editorType];
    if (history.redo.length > 0) {
        const next = history.redo.pop();
        history.undo.push(next);
        
        const textarea = document.getElementById(editorType + 'Code');
        if (textarea) {
            const cursorPos = textarea.selectionStart;
            textarea.value = next;
            textarea.selectionStart = textarea.selectionEnd = Math.min(cursorPos, next.length);
            lastContent[editorType] = next;
        }
    }
}

function showShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function startAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    autoSaveInterval = setInterval(async () => {
        if (currentTeam) {
            await autoSaveCode();
        }
    }, 5000);
}

async function autoSaveCode() {
    if (!currentTeam) return;
    
    try {
        const htmlCode = document.getElementById('htmlCode').value;
        const cssCode = document.getElementById('cssCode').value;
        const jsCode = document.getElementById('jsCode').value;
        
        showAutoSaveIndicator('saving');
        
        const response = await fetch('/api/client/temp-save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                htmlCode,
                cssCode,
                jsCode
            })
        });
        
        if (response.status === 401) {
            showAlert('Session expired. Please log in again.', 'error');
            setTimeout(() => {
                window.location.href = '/auth/google';
            }, 2000);
            return;
        }
        
        const result = await response.json();
        
        if (result.success) {
            showAutoSaveIndicator('success');
        } else {
            console.error('Auto-save failed:', result.message);
        }
        
    } catch (error) {
        console.error('Auto-save error:', error);
    }
}

function showAutoSaveIndicator(status) {
    const indicator = document.getElementById('autoSaveIndicator');
    if (!indicator) return;
    
    const icon = indicator.querySelector('.save-icon');
    const text = indicator.querySelector('.save-text');
    
    if (!icon || !text) return;
    
    indicator.style.display = 'flex';
    
    if (status === 'saving') {
        indicator.className = 'auto-save-indicator';
        icon.textContent = '💾';
        text.textContent = 'Auto-saving...';
    } else if (status === 'success') {
        indicator.className = 'auto-save-indicator auto-save-success';
        icon.textContent = '✅';
        text.textContent = 'Saved';
    } else if (status === 'changed') {
        indicator.className = 'auto-save-indicator';
        icon.textContent = '📝';
        text.textContent = 'Changes detected';
        
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 1000);
        return;
    }
    
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 2000);
}

async function checkForRestoreData() {
    if (!currentTeam) return;
    
    try {
        console.log(`Checking restore data for team: ${currentTeam.teamName}`);
        
        const response = await fetch('/api/client/restore-data', {
            credentials: 'include'
        });
        
        if (response.status === 401) {
            showAlert('Session expired. Please log in again.', 'error');
            setTimeout(() => {
                window.location.href = '/auth/google';
            }, 2000);
            return;
        }
        
        const result = await response.json();
        console.log('Restore data result:', result);
        
        if (result.success) {
            restoreData = result;
            
            if (result.hasTempCode || result.hasSubmission) {
                showRestoreModal();
            }
        }
    } catch (error) {
        console.error('Error checking restore data:', error);
    }
}

function showRestoreModal() {
    const modal = document.getElementById('restoreModal');
    if (!modal) return;
    
    const tempOption = document.getElementById('tempCodeOption');
    const submissionOption = document.getElementById('submissionOption');
    
    if (tempOption && restoreData.hasTempCode) {
        const tempTime = new Date(restoreData.tempCode.lastSaved).toLocaleString();
        const tempTimeElement = document.getElementById('tempCodeTime');
        if (tempTimeElement) {
            tempTimeElement.textContent = tempTime;
        }
        
        const preview = `HTML: ${restoreData.tempCode.htmlCode.substring(0, 100)}...\n` +
                       `CSS: ${restoreData.tempCode.cssCode.substring(0, 100)}...\n` +
                       `JS: ${restoreData.tempCode.jsCode.substring(0, 100)}...`;
        const previewElement = document.getElementById('tempCodePreview');
        if (previewElement) {
            previewElement.textContent = preview;
        }
        
        tempOption.style.display = 'block';
    } else if (tempOption) {
        tempOption.style.display = 'none';
    }
    
    if (submissionOption && restoreData.hasSubmission) {
        const subTime = new Date(restoreData.latestSubmission.submittedAt).toLocaleString();
        const subTimeElement = document.getElementById('submissionTime');
        if (subTimeElement) {
            subTimeElement.textContent = `Submission #${restoreData.latestSubmission.submissionNumber} - ${subTime}`;
        }
        
        const preview = `HTML: ${restoreData.latestSubmission.htmlCode.substring(0, 100)}...\n` +
                       `CSS: ${restoreData.latestSubmission.cssCode.substring(0, 100)}...\n` +
                       `JS: ${restoreData.latestSubmission.jsCode.substring(0, 100)}...`;
        const previewElement = document.getElementById('submissionPreview');
        if (previewElement) {
            previewElement.textContent = preview;
        }
        
        submissionOption.style.display = 'block';
    } else if (submissionOption) {
        submissionOption.style.display = 'none';
    }
    
    modal.style.display = 'flex';
}

function closeRestoreModal() {
    const modal = document.getElementById('restoreModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function restoreCode(type) {
    let codeData;
    
    if (type === 'temp' && restoreData.hasTempCode) {
        codeData = restoreData.tempCode;
        showAlert('Auto-saved code restored successfully!', 'success');
    } else if (type === 'submission' && restoreData.hasSubmission) {
        codeData = restoreData.latestSubmission;
        showAlert(`Latest submission (#${restoreData.latestSubmission.submissionNumber}) restored successfully!`, 'success');
    }
    
    if (codeData) {
        document.getElementById('htmlCode').value = codeData.htmlCode || '';
        document.getElementById('cssCode').value = codeData.cssCode || '';
        document.getElementById('jsCode').value = codeData.jsCode || '';
        runCode();
    }
    
    closeRestoreModal();
}

function startFresh() {
    showAlert('Starting with default template code', 'success');
    closeRestoreModal();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.editor').forEach(editor => {
        editor.classList.remove('active');
    });
    
    const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const editor = document.getElementById(`${tabName}Editor`);
    
    if (tabBtn) tabBtn.classList.add('active');
    if (editor) editor.classList.add('active');
}

function runCode() {
    const htmlCode = document.getElementById('htmlCode').value;
    const cssCode = document.getElementById('cssCode').value;
    const jsCode = document.getElementById('jsCode').value;
    
    const combinedCode = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview</title>
            <style>${cssCode}</style>
        </head>
        <body>
            ${htmlCode.replace(/<html[^>]*>|<\/html>|<head[^>]*>|<\/head>|<body[^>]*>|<\/body>|<!DOCTYPE[^>]*>/gi, '')}
            <script>
                try {
                    ${jsCode}
                } catch(error) {
                    console.error('JavaScript Error:', error);
                    document.body.innerHTML += '<div style="background: #ff6b6b; color: white; padding: 10px; margin: 10px; border-radius: 5px;"><strong>JavaScript Error:</strong> ' + error.message + '</div>';
                }
            </script>
        </body>
        </html>
    `;
    
    const preview = document.getElementById('preview');
    if (preview) {
        const blob = new Blob([combinedCode], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        preview.src = url;
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}

async function submitCode() {
    if (!currentTeam) {
        showAlert('No team information found. Cannot submit code.', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to submit your code? This will save your current work and clear auto-saved data.')) {
        return;
    }
    
    const htmlCode = document.getElementById('htmlCode').value;
    const cssCode = document.getElementById('cssCode').value;
    const jsCode = document.getElementById('jsCode').value;
    
    if (!htmlCode.trim() && !cssCode.trim() && !jsCode.trim()) {
        showAlert('Please write some code before submitting.', 'error');
        return;
    }
    
    try {
        const submitBtnEl = document.getElementById('submitBtn');
        if (submitBtnEl) {
            submitBtnEl.disabled = true;
            submitBtnEl.textContent = 'Submitting...';
        }
        
        const response = await fetch('/api/client/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                htmlCode,
                cssCode,
                jsCode
            })
        });
        
        if (response.status === 401) {
            showAlert('Session expired. Please log in again.', 'error');
            setTimeout(() => {
                window.location.href = '/auth/google';
            }, 2000);
            return;
        }
        
        const result = await response.json();
        
        if (result.success) {
            showAlert(`Code submitted successfully! ${result.message} Submission ID: ${result.submissionId}`, 'success');
            await clearTempCode();
        } else {
            showAlert('Submission failed: ' + result.message, 'error');
        }
        
    } catch (error) {
        showAlert('Error submitting code: ' + error.message, 'error');
    } finally {
        const submitBtnEl2 = document.getElementById('submitBtn');
        if (submitBtnEl2) {
            submitBtnEl2.disabled = false;
            submitBtnEl2.textContent = 'Submit Code';
        }
    }
}

async function clearTempCode() {
    if (!currentTeam) return;
    
    try {
        await fetch('/api/client/temp-code', {
            method: 'DELETE',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Error clearing temp code:', error);
    }
}

function logout() {
    if (confirm('Are you sure you want to log out?')) {
        window.location.href = '/auth/logout';
    }
}

function showAlert(message, type) {
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
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

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const shortcutsModal = document.getElementById('shortcutsModal');
    const restoreModal = document.getElementById('restoreModal');
    
    if (event.target === shortcutsModal) {
        closeShortcutsModal();
    }
    if (event.target === restoreModal) {
        closeRestoreModal();
    }
});

