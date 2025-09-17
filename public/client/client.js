let currentTeam = null;
let autoSaveInterval = null;
let restoreData = null;

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

import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';
// Initialize client interface
document.addEventListener('DOMContentLoaded', function() {
    initializeInterface();
    setupEventListeners();
    setupKeyboardShortcuts();

	createChat({
		webhookUrl: 'https://n8n.klevoradigital.in/webhook/fcf4fde7-6200-4a99-8b04-f7a9c3a4bed5/chat',
        initialMessages: [
		'Hi there! 👋',
		'I Am Eye Coders Club Assistant, here to help you with HTML, CSS for markup mania.',
	    ],
        i18n: {
		en: {
			title: 'EYE CODERS CLUB',
			subtitle: "Start a chat. We're here to help you 24/7.",
			footer: '',
			getStarted: 'New Conversation',
			inputPlaceholder: 'Type your question..',
            chatSessionKey:currentTeam.studentId,
		},
	}
	});
});

async function initializeInterface() {
    try {
        document.getElementById('loadingOverlay').style.display = 'flex';
        
        // Check authentication status
        const authStatus = await checkAuthenticationStatus();
        
        if (!authStatus.authenticated) {
            showLoginPrompt();
            return;
        }
        
        currentTeam = authStatus.team;
        
        document.getElementById('loadingOverlay').style.display = 'none';
        
        if (currentTeam) {
            updateTeamDisplay();
            document.getElementById('submitBtn').disabled = false;
            await checkForRestoreData();
            startAutoSave();
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
        const response = await fetch('/auth/status', {
            credentials: 'include'
        });
        const result = await response.json();
        
        if (result.success) {
            return result;
        } else {
            throw new Error('Authentication check failed');
        }
    } catch (error) {
        console.error('Auth status check error:', error);
        return { authenticated: false };
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

function updateTeamDisplay() {
    if (currentTeam) {
        document.getElementById('teamName').textContent = currentTeam.teamName;
        document.getElementById('teamLeader').textContent = `Leader: ${currentTeam.teamLeaderName}`;
        document.getElementById('studentId').textContent = `ID: ${currentTeam.studentId}`;
        document.getElementById('pcIP').textContent = `Email: ${currentTeam.email}`;
    }
}

function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    document.getElementById('submitBtn').addEventListener('click', submitCode);
    
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
                    if (currentTeam && !document.getElementById('submitBtn').disabled) {
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
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('submitBtn').textContent = 'Submitting...';
        
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
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('submitBtn').textContent = 'Submit Code';
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

