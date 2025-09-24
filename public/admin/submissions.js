let teamsData = {};
let currentTeam = null;

document.addEventListener('DOMContentLoaded', function() {
    loadTeamsAndSubmissions();
    setupEventListeners();
});

function setupEventListeners() {
    // Download all teams button
    document.getElementById('downloadAllBtn').addEventListener('click', downloadAllTeams);
}

async function loadTeamsAndSubmissions() {
    try {
        showLoading(true);
        
        const response = await fetch('/api/admin/teams-with-submissions');
        const result = await response.json();
        
        if (result.success) {
            teamsData = result.teamsWithSubmissions;
            renderTeamsList();
        } else {
            showAlert('Error loading data: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error loading teams and submissions:', error);
        showAlert('Error loading data: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function renderTeamsList() {
    const teamsList = document.getElementById('teamsList');
    const teams = Object.keys(teamsData);
    
    if (teams.length === 0) {
        teamsList.innerHTML = '<p>No teams found.</p>';
        return;
    }
    
    const teamsHTML = teams.map(teamName => {
        const teamData = teamsData[teamName];
        const submissionCount = teamData.submissions.length;
        
        return `
            <div class="team-item" onclick="selectTeam('${teamName}')">
                <div class="team-name">${teamName}</div>
                <div class="team-info">
                    Leader: ${teamData.teamInfo.teamLeaderName}<br>
                    IP: ${teamData.teamInfo.pcIP}
                </div>
                <div class="submission-count">${submissionCount}</div>
            </div>
        `;
    }).join('');
    
    teamsList.innerHTML = teamsHTML;
    // If a team was specified via query string, auto-select it
    autoSelectFromQueryParam();
}

function selectTeam(teamName) {
    // Update active team classes
    document.querySelectorAll('.team-item').forEach(item => item.classList.remove('active'));

    // Try to find the clicked element by matching the team name text
    const targetNameNormalized = teamName ? teamName.trim().toLowerCase() : '';
    const matchedItem = Array.from(document.querySelectorAll('.team-item')).find(it => {
        const nameEl = it.querySelector('.team-name');
        const nameText = nameEl ? nameEl.textContent.trim().toLowerCase() : '';
        return nameText === targetNameNormalized;
    });

    if (matchedItem) {
        matchedItem.classList.add('active');
    }

    currentTeam = teamName;
    renderSubmissions(teamName);
}

// Auto-select team if `team` query parameter is present in the URL
function autoSelectFromQueryParam() {
    try {
        const params = new URLSearchParams(window.location.search);
        const teamParam = params.get('team');
        if (teamParam && teamsData && teamsData[teamParam]) {
            // Delay slightly to ensure DOM is rendered
            setTimeout(() => selectTeam(teamParam), 50);
        }
    } catch (e) {
        // ignore
        console.debug('autoSelectFromQueryParam error', e);
    }
}


function renderSubmissions(teamName) {
    const container = document.getElementById('submissionsContainer');
    const teamData = teamsData[teamName];
    const submissions = teamData.submissions;
    
    if (submissions.length === 0) {
        container.innerHTML = `
            <div class="no-submissions">
                <h3>No submissions found</h3>
                <p>Team "${teamName}" hasn't made any submissions yet.</p>
            </div>
        `;
        return;
    }
    
    const submissionsHTML = `
        <div class="submissions-header">
            <h2>${teamName} Submissions</h2>
            <div class="submissions-count">${submissions.length} submission${submissions.length !== 1 ? 's' : ''}</div>
        </div>
        
        <div class="submissions-grid">
            ${submissions.map((submission, index) => `
                <div class="submission-card ${index === 0 ? 'latest-submission' : ''}">
                    <div class="submission-header">
                        <div class="submission-info">
                            <div class="submission-id">${submission.submissionId}</div>
                            <div class="submission-badge">
                                Submission #${submission.submissionNumber || (submissions.length - index)}
                                ${index === 0 ? '<span class="latest-badge">LATEST</span>' : ''}
                            </div>
                        </div>
                        <div class="submission-date">
                            ${new Date(submission.submittedAt).toLocaleDateString()}<br>
                            ${new Date(submission.submittedAt).toLocaleTimeString()}
                        </div>
                    </div>
                    
                    <div class="submission-details">
                        <div class="detail-item">
                            <div class="detail-label">Team Name</div>
                            <div class="detail-value">${submission.teamName}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Student ID</div>
                            <div class="detail-value">${submission.studentId}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">PC IP</div>
                            <div class="detail-value">${submission.pcIP}</div>
                        </div>
                    </div>
                    
                                    <div class="project-preview">
                                        ${renderProjectPreviewHTML(submission)}
                                    </div>
                    
                                    <div class="submission-actions">
                                        <button class="download-btn" onclick="downloadSubmission('${submission._id}')">
                                            📥 Download ZIP
                                        </button>
                                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = submissionsHTML;
}

async function downloadSubmission(submissionId) {
    try {
        showLoading(true, 'Preparing download...');
        
        const response = await fetch(`/api/admin/download/${submissionId}`);
        
        if (!response.ok) {
            throw new Error('Download failed');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Get filename from response headers
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'submission.zip';
        
        if (contentDisposition) {
            const matches = /filename="([^"]*)"/.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = matches[1];
            }
        }
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showAlert('Download started successfully!', 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showAlert('Download failed: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}


async function downloadAllTeams() {
    let downloadBtn;
    
    try {
        // First, check if server is responding
        await checkServerHealth();
        
        // Count teams with submissions
        const teamsWithSubmissions = Object.keys(teamsData).filter(
            teamName => teamsData[teamName].submissions.length > 0
        ).length;
        
        if (teamsWithSubmissions === 0) {
            showAlert('No teams with submissions found!', 'error');
            return;
        }
        
        // Use SEB-safe modal confirm if available (from opener/editor), else fallback to native confirm
        let proceed = true;
        try {
            if (window.opener && window.opener.editor && typeof window.opener.editor.showConfirm === 'function') {
                proceed = await window.opener.editor.showConfirm(`This will download the latest submission from ${teamsWithSubmissions} teams. Continue?`);
            } else if (typeof showConfirm === 'function') {
                proceed = await showConfirm(`This will download the latest submission from ${teamsWithSubmissions} teams. Continue?`);
            } else {
                proceed = confirm(`This will download the latest submission from ${teamsWithSubmissions} teams. Continue?`);
            }
        } catch (e) {
            // If modal fails for any reason, fallback to native confirm
            proceed = confirm(`This will download the latest submission from ${teamsWithSubmissions} teams. Continue?`);
        }

        if (!proceed) {
            return;
        }
        
        // Disable the button
        downloadBtn = document.getElementById('downloadAllBtn');
        downloadBtn.disabled = true;
        downloadBtn.textContent = '📦 Preparing...';
        
        // Show progress indicator
        showDownloadProgress('Connecting to server...', 10);
        
        console.log('Starting download request...');
        
        // Make the request with a longer timeout
        const response = await fetch('/api/admin/download-all-teams', {
            method: 'GET',
            headers: {
                'Accept': 'application/zip, application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        console.log('Response received:', response.status, response.statusText);
        
        // Update progress
        showDownloadProgress('Processing response...', 50);
        
        if (!response.ok) {
            let errorMessage = `Server error: ${response.status} ${response.statusText}`;
            
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
            }
            
            throw new Error(errorMessage);
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/zip')) {
            throw new Error('Invalid response type. Expected ZIP file.');
        }
        
        // Update progress
        showDownloadProgress('Downloading file...', 75);
        
        const blob = await response.blob();
        
        if (blob.size === 0) {
            throw new Error('Downloaded file is empty');
        }
        
        console.log('Blob size:', blob.size);
        
        // Update progress
        showDownloadProgress('Preparing download...', 90);
        
        const url = window.URL.createObjectURL(blob);
        
        // Get filename from response headers
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `All_Teams_Submissions_${new Date().toISOString().split('T')[0]}.zip`;
        
        if (contentDisposition) {
            const matches = /filename="([^"]*)"/.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = matches[1];
            }
        }
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        
        // Clean up blob URL after a delay
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 1000);
        
        // Update progress
        showDownloadProgress('Download completed!', 100);
        
        setTimeout(() => {
            hideDownloadProgress();
        }, 2000);
        
        showAlert(`Download completed! File: ${filename} (${Math.round(blob.size / 1024)} KB)`, 'success');
        
    } catch (error) {
        console.error('Download all teams error:', error);
        
        let errorMessage = 'Download failed';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to server. Please check if the server is running.';
        } else if (error.name === 'AbortError') {
            errorMessage = 'Download timed out. Please try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showAlert(errorMessage, 'error');
        hideDownloadProgress();
        
    } finally {
        // Re-enable the button
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.textContent = '📦 Download All Teams';
        }
    }
}

// Function to check server health
async function checkServerHealth() {
    try {
        const response = await fetch('/api/admin/test', {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error('Server health check failed');
        }
        
        const data = await response.json();
        console.log('Server health check:', data);
        
        return true;
    } catch (error) {
        console.error('Server health check failed:', error);
        throw new Error('Server is not responding. Please check if the server is running.');
    }
}

// Add a test button for debugging (you can remove this later)
function addTestButton() {
    const header = document.querySelector('.header-actions');
    if (header && !document.getElementById('testBtn')) {
        const testBtn = document.createElement('button');
        testBtn.id = 'testBtn';
        testBtn.textContent = '🔧 Test Server';
        testBtn.className = 'back-btn';
        testBtn.style.background = '#ffc107';
        testBtn.style.color = '#000';
        testBtn.onclick = async () => {
            try {
                await checkServerHealth();
                showAlert('Server is responding correctly!', 'success');
            } catch (error) {
                showAlert('Server test failed: ' + error.message, 'error');
            }
        };
        header.insertBefore(testBtn, header.firstChild);
    }
}

// Add test button when page loads (for debugging)
document.addEventListener('DOMContentLoaded', function() {
    loadTeamsAndSubmissions();
    setupEventListeners();
    addTestButton(); // Remove this line in production
});

// Enhanced progress display
function showDownloadProgress(message, percentage) {
    let progressDiv = document.getElementById('downloadProgress');
    
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'downloadProgress';
        progressDiv.className = 'download-progress';
        progressDiv.innerHTML = `
            <div class="progress-text">Processing...</div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="progress-details">Please wait...</div>
            <div class="progress-note">This may take several minutes for large downloads.</div>
        `;
        document.body.appendChild(progressDiv);
    }
    
    progressDiv.querySelector('.progress-text').textContent = message;
    progressDiv.querySelector('.progress-fill').style.width = percentage + '%';
    progressDiv.querySelector('.progress-details').textContent = `${Math.round(percentage)}% complete`;
}

function hideDownloadProgress() {
    const progressDiv = document.getElementById('downloadProgress');
    if (progressDiv) {
        progressDiv.remove();
    }
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(show, message = 'Loading submissions...') {
    const overlay = document.getElementById('loadingOverlay');
    const messageElement = overlay.querySelector('p');
    
    messageElement.textContent = message;
    overlay.style.display = show ? 'flex' : 'none';
}

function showAlert(message, type) {
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

// Render a project's file list into a collapsible tree and preview hooks
function renderProjectPreviewHTML(submission) {
    // submission.projectStructure is expected to be a JSON string or an object
    let project = submission.projectStructure;
    try {
        if (typeof project === 'string') project = JSON.parse(project);
    } catch (e) {
        console.warn('Invalid projectStructure JSON, falling back to individual files', e);
        project = null;
    }

    // If project object available, build a file tree, else show fallback previews
    if (project && project.files) {
        const files = Object.keys(project.files);
        const treeHtml = buildFileTreeHtml(files, project.files, submission._id);
        return `
            <div class="project-tree">
                <h4>Project Files</h4>
                <div class="tree-container">${treeHtml}</div>
            </div>
        `;
    }

    // fallback: show the small code previews
    return `
        <div class="code-previews">
            <div class="code-preview">
                <h4>HTML</h4>
                <pre>${escapeHtml(submission.htmlCode ? submission.htmlCode.substring(0,200) : '')}${submission.htmlCode && submission.htmlCode.length > 200 ? '...' : ''}</pre>
            </div>
            <div class="code-preview">
                <h4>CSS</h4>
                <pre>${escapeHtml(submission.cssCode ? submission.cssCode.substring(0,200) : '')}${submission.cssCode && submission.cssCode.length > 200 ? '...' : ''}</pre>
            </div>
            <div class="code-preview">
                <h4>JavaScript</h4>
                <pre>${escapeHtml(submission.jsCode ? submission.jsCode.substring(0,200) : '')}${submission.jsCode && submission.jsCode.length > 200 ? '...' : ''}</pre>
            </div>
        </div>
    `;
}

// Build a nested file tree HTML from file paths
function buildFileTreeHtml(paths, filesMap, submissionId) {
    // Create a nested object
    const root = {};
    paths.forEach(p => {
        const parts = p.split('/');
        let node = root;
        parts.forEach((part, idx) => {
            if (!node[part]) node[part] = { __children: {}, __isFile: idx === parts.length - 1 };
            node = node[part].__children;
        });
    });

    // Render recursively
    function renderNode(obj, prefix = '') {
        return Object.keys(obj).map(key => {
            const child = obj[key];
            const isFile = child.__isFile;
            const fullPath = prefix ? (prefix + '/' + key) : key;
            if (isFile) {
                return `<div class="tree-file"><button class="file-link" onclick="showSubmissionFile('${submissionId}', '${escapeJs(fullPath)}')">${key}</button></div>`;
            } else {
                const inner = renderNode(child.__children, fullPath);
                return `<div class="tree-folder"><div class="folder-name">${key}</div><div class="folder-children">${inner.join('')}</div></div>`;
            }
        }).join('');
    }

    return renderNode(root);
}

// Escape string for single-quoted JS context
function escapeJs(s) {
    return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Show file contents from a submission by fetching a small endpoint that returns the file
async function showSubmissionFile(submissionId, filePath) {
    try {
        showLoading(true, 'Loading file...');
        const response = await fetch(`/api/admin/submission/${submissionId}`);
        if (!response.ok) throw new Error('Failed to load submission data');
        const data = await response.json();

        const project = data.projectStructure ? (typeof data.projectStructure === 'string' ? JSON.parse(data.projectStructure) : data.projectStructure) : null;
        let content = '';
        if (project && project.files && project.files[filePath]) {
            content = project.files[filePath].content || '';
        } else if (data.htmlCode && filePath.endsWith('.html')) {
            content = data.htmlCode;
        } else if (data.cssCode && filePath.endsWith('.css')) {
            content = data.cssCode;
        } else if (data.jsCode && (filePath.endsWith('.js') || filePath.endsWith('.mjs'))) {
            content = data.jsCode;
        } else {
            content = '[File content not available]';
        }

        showFileModal(filePath, content);
    } catch (error) {
        console.error('showSubmissionFile error:', error);
        showAlert('Cannot load file: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Simple file viewer modal
function showFileModal(fileName, content) {
    // Remove existing modal if any
    const existing = document.getElementById('fileViewModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'fileViewModal';
    modal.className = 'modal file-view-modal';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>${escapeHtml(fileName)}</h3>
                <button class="close-modal" onclick="document.getElementById('fileViewModal')?.remove()">×</button>
            </div>
            <div class="modal-body">
                <pre>${escapeHtml(content)}</pre>
            </div>
            <div class="modal-footer">
                <button class="btn-close" onclick="document.getElementById('fileViewModal')?.remove()">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}