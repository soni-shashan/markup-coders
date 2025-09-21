let teams = [];
let submissions = [];
let currentTeamToDelete = null;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    loadTeams();
    loadSubmissions();
    loadAvailableImages(); 
    
    document.getElementById('teamForm').addEventListener('submit', handleTeamSubmit);
    
    const imageSelect = document.getElementById('assignedImage');
    if (imageSelect) {
        imageSelect.addEventListener('change', function() {
            showImagePreview(this.value);
        });
    }

    // Setup confirmation input listener
    const confirmInput = document.getElementById('confirmTeamName');
    if (confirmInput) {
        confirmInput.addEventListener('input', function() {
            const confirmBtn = document.getElementById('confirmDeleteBtn');
            const teamName = document.getElementById('deleteTeamName').textContent;
            
            if (this.value === teamName) {
                confirmBtn.disabled = false;
            } else {
                confirmBtn.disabled = true;
            }
        });
    }
    
    // Setup file upload
    setupFileUpload();
});

function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'submissions') {
        loadSubmissions();
    }
}

async function loadAvailableImages() {
    try {
        const response = await fetch('/api/admin/available-images');
        const result = await response.json();
        
        if (result.success) {
            const imageSelect = document.getElementById('assignedImage');
            if (imageSelect) {
                // Clear existing options except the first one
                imageSelect.innerHTML = '<option value="">Select an image...</option>';
                
                result.images.forEach(image => {
                    const option = document.createElement('option');
                    option.value = image;
                    console.log(image);
                    option.textContent = image.replace(/\.[^/.]+$/, ""); // Remove extension for display
                    imageSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading images:', error);
    }
}

function showImagePreview(imageName) {
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (imageName && preview && previewImg) {
        previewImg.src = `/images/${imageName}`;
        preview.style.display = 'block';
    } else if (preview) {
        preview.style.display = 'none';
    }
}


async function handleTeamSubmit(event) {
    event.preventDefault();
    
    const formData = {
        teamName: document.getElementById('teamName').value.trim(),
        teamLeaderName: document.getElementById('teamLeaderName').value.trim(),
        studentId: document.getElementById('studentId').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        assignedImage: document.getElementById('assignedImage').value 
    };
    
    // Validate email format on frontend
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }
    
    // Validate required fields
    if (!formData.teamName || !formData.teamLeaderName || !formData.studentId || !formData.email) {
        showAlert('All fields are required', 'error');
        return;
    }
    
    try {
        
        const response = await fetch('/api/admin/teams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: await JSON.stringify(formData)
        });
        const result = await response.json();
        
        if (result.success) {
            showAlert('Team added successfully!', 'success');
            document.getElementById('teamForm').reset();
            loadTeams();
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        showAlert('Error adding team: ' + error.message, 'error');
    }
}

async function loadTeams() {
    try {
        const response = await fetch('/api/admin/teams');
        const result = await response.json();
        
        if (result.success) {
            teams = result.teams;
            renderTeamsTable();
            updateTeamsSummary();
        }
    } catch (error) {
        console.error('Error loading teams:', error);
        showAlert('Error loading teams: ' + error.message, 'error');
    }
}

async function loadSubmissions() {
    try {
        const response = await fetch('/api/admin/submissions');
        const result = await response.json();
        
        if (result.success) {
            submissions = result.submissions;
            renderSubmissionsTable();
        }
    } catch (error) {
        console.error('Error loading submissions:', error);
        showAlert('Error loading submissions: ' + error.message, 'error');
    }
}

function updateTeamsSummary() {
    const totalTeams = teams.length;
    const teamsWithSubmissions = new Set(submissions.map(sub => sub.teamName)).size;
    const authenticatedTeams = teams.filter(team => team.isAuthenticated).length;
    
    document.getElementById('totalTeams').textContent = totalTeams;
    document.getElementById('activeTeams').textContent = teamsWithSubmissions;
    
    // Update additional stats if elements exist
    const authenticatedElement = document.getElementById('authenticatedTeams');
    if (authenticatedElement) {
        authenticatedElement.textContent = authenticatedTeams;
    }
}

function renderTeamsTable() {
    const container = document.getElementById('teamsTable');
    
    if (teams.length === 0) {
        container.innerHTML = '<p class="no-data">No teams registered yet.</p>';
        return;
    }
    
    const table = `
        <table class="teams-table">
            <thead>
                <tr>
                    <th>Team Name</th>
                    <th>Team Leader</th>
                    <th>Student ID</th>
                    <th>Email</th>
                    <th>Created At</th>
                    <th>Assigned Image</th>
                    <th>Last Login</th>
                    <th>Status</th>
                    <th>Submissions</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${teams.map(team => {
                    const teamSubmissions = submissions.filter(sub => sub.teamName === team.teamName);
                    const lastLogin = team.lastLogin ? new Date(team.lastLogin).toLocaleDateString() : 'Never';
                    const isAuthenticated = team.isAuthenticated;
                    
                    return `
                        <tr class="${isAuthenticated ? 'authenticated' : 'not-authenticated'}">
                            <td>
                                <div class="team-name-cell">
                                    <strong>${team.teamName}</strong>
                                    ${isAuthenticated ? '<span class="auth-badge">✓</span>' : ''}
                                </div>
                            </td>
                            <td>${team.teamLeaderName}</td>
                            <td><code>${team.studentId}</code></td>
                            <td>
                                <div class="email-cell">
                                    <span>${team.email}</span>
                                    ${team.profilePicture ? `<img src="${team.profilePicture}" class="profile-pic" alt="Profile">` : ''}
                                </div>
                            </td>
                            <td>
                                <div class="assigned-image-cell">
                                    ${team.assignedImage ? `
                                        <img src="/images/${team.assignedImage}" alt="Assigned" class="assigned-image-thumb" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                                        <span class="image-name">${team.assignedImage}</span>
                                    ` : 'No image'}
                                </div>
                            </td>
                            <td><span class="date">${new Date(team.createdAt).toLocaleDateString()}</span></td>
                            <td>
                                <span class="login-status ${isAuthenticated ? 'active' : 'inactive'}">
                                    ${lastLogin}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge ${isAuthenticated ? 'online' : 'offline'}">
                                    ${isAuthenticated ? 'Online' : 'Offline'}
                                </span>
                            </td>
                            <td>
                                <span class="submission-count ${teamSubmissions.length > 0 ? 'has-submissions' : 'no-submissions'}">
                                    ${teamSubmissions.length}
                                    ${teamSubmissions.length > 0 ? `<small>(Latest: ${new Date(teamSubmissions[0].submittedAt).toLocaleDateString()})</small>` : ''}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="delete-btn" onclick="showDeleteModal('${team._id}', '${team.teamName}')" title="Delete team">
                                        🗑️
                                    </button>
                                    ${teamSubmissions.length > 0 ? `
                                        <button class="view-btn" onclick="viewTeamSubmissions('${team.teamName}')" title="View submissions">
                                            👁️
                                        </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

function renderSubmissionsTable() {
    const container = document.getElementById('submissionsTable');
    
    if (submissions.length === 0) {
        container.innerHTML = '<p class="no-data">No submissions yet.</p>';
        return;
    }
    
    const table = `
        <table class="submissions-table">
            <thead>
                <tr>
                    <th>Submission ID</th>
                    <th>Team Name</th>
                    <th>Student ID</th>
                    <th>Email</th>
                    <th>Submission #</th>
                    <th>Submitted At</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${submissions.map((submission, index) => `
                    <tr class="${index < 5 ? 'recent-submission' : ''}">
                        <td><code>${submission.submissionId}</code></td>
                        <td><strong>${submission.teamName}</strong></td>
                        <td><code>${submission.studentId}</code></td>
                        <td>${submission.email}</td>
                        <td>
                            <span class="submission-number">
                                #${submission.submissionNumber || 1}
                            </span>
                        </td>
                        <td>
                            <div class="submission-time">
                                <span class="date">${new Date(submission.submittedAt).toLocaleDateString()}</span>
                                <span class="time">${new Date(submission.submittedAt).toLocaleTimeString()}</span>
                            </div>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="view-btn" onclick="viewSubmission('${submission._id}')" title="View submission">
                                    👁️
                                </button>
                                <button class="download-btn" onclick="downloadSubmission('${submission._id}')" title="Download submission">
                                    📥
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

function viewTeamSubmissions(teamName) {
    window.open(`/admin/submissions?team=${encodeURIComponent(teamName)}`, '_blank');
}

function viewSubmission(submissionId) {
    window.open(`/admin/view-submission/${submissionId}`, '_blank');
}

async function downloadSubmission(submissionId) {
    try {
        const response = await fetch(`/api/admin/download/${submissionId}`);
        
        if (!response.ok) {
            throw new Error('Download failed');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'submission.zip';
        
        if (contentDisposition) {
            const matches = /filename="([^"]*)"/.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = matches[1];
            }
        }
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showAlert('Download started successfully!', 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showAlert('Download failed: ' + error.message, 'error');
    }
}

async function showDeleteModal(teamId, teamName) {
    currentTeamToDelete = { id: teamId, name: teamName };
    
    // Update modal content
    document.getElementById('deleteTeamName').textContent = teamName;
    document.getElementById('confirmTeamName').value = '';
    document.getElementById('confirmDeleteBtn').disabled = true;
    
    // Show loading state for counts
    document.getElementById('submissionsCount').textContent = 'Loading...';
    document.getElementById('tempCodesCount').textContent = 'Loading...';
    
    // Show modal
    document.getElementById('deleteModal').style.display = 'flex';
    
    try {
        // Get team statistics
        const team = teams.find(t => t._id === teamId);
        const teamSubmissions = submissions.filter(s => s.teamName === teamName);
        
        document.getElementById('submissionsCount').textContent = teamSubmissions.length;
        document.getElementById('tempCodesCount').textContent = team.isAuthenticated ? '1+' : '0';
        
    } catch (error) {
        console.error('Error loading team stats:', error);
        document.getElementById('submissionsCount').textContent = 'Error';
        document.getElementById('tempCodesCount').textContent = 'Error';
    }
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentTeamToDelete = null;
}

async function confirmTeamDeletion() {
    if (!currentTeamToDelete) return;
    
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.textContent;
    
    try {
        // Show loading state
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Deleting...';
        
        const response = await fetch(`/api/admin/teams/${currentTeamToDelete.id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert(
                `Team "${currentTeamToDelete.name}" and all related data deleted successfully! ` +
                `(${result.deletedData.submissions} submissions, ${result.deletedData.tempCodes} temp codes)`,
                'success'
            );
            
            closeDeleteModal();
            loadTeams();
            loadSubmissions();
        } else {
            showAlert(result.message, 'error');
        }
        
    } catch (error) {
        showAlert('Error deleting team: ' + error.message, 'error');
    } finally {
        // Reset button state
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

// Bulk Import Functions
function showBulkImportModal() {
    document.getElementById('bulkImportModal').style.display = 'flex';
    resetFileUpload();
}

function closeBulkImportModal() {
    document.getElementById('bulkImportModal').style.display = 'none';
    resetFileUpload();
}

function closeImportResultsModal() {
    document.getElementById('importResultsModal').style.display = 'none';
    loadTeams();
}

async function downloadTemplate() {
    try {
        const response = await fetch('/api/admin/download-template');
        
        if (!response.ok) {
            throw new Error('Failed to download template');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'teams_template.xlsx';
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showAlert('Template downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Template download error:', error);
        showAlert('Error downloading template: ' + error.message, 'error');
    }
}

function setupFileUpload() {
    const fileInput = document.getElementById('excelFileInput');
    const uploadArea = document.getElementById('fileUploadArea');
    
    if (!fileInput || !uploadArea) return;
    
    // File input change event
    fileInput.addEventListener('change', function(e) {
        handleFileSelect(e.target.files[0]);
    });
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });
}

function handleFileSelect(file) {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const isExcelFile = allowedTypes.includes(file.type) || file.name.match(/\.(xlsx|xls)$/);
    
    if (!isExcelFile) {
        showAlert('Please select a valid Excel file (.xlsx or .xls)', 'error');
        return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size must be less than 5MB', 'error');
        return;
    }
    
    // Show selected file
    document.querySelector('.upload-placeholder').style.display = 'none';
    document.getElementById('selectedFile').style.display = 'flex';
    
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    
    // Enable import button
    document.getElementById('importBtn').disabled = false;
    
    // Store file for upload
    document.getElementById('excelFileInput').files = createFileList(file);
}

function removeSelectedFile() {
    resetFileUpload();
}

function resetFileUpload() {
    const placeholder = document.querySelector('.upload-placeholder');
    const selectedFile = document.getElementById('selectedFile');
    const fileInput = document.getElementById('excelFileInput');
    const importBtn = document.getElementById('importBtn');
    
    if (placeholder) placeholder.style.display = 'block';
    if (selectedFile) selectedFile.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (importBtn) importBtn.disabled = true;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function createFileList(file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    return dt.files;
}

async function startBulkImport() {
    const fileInput = document.getElementById('excelFileInput');
    const importBtn = document.getElementById('importBtn');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        showAlert('Please select an Excel file first', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('excelFile', file);
    
    try {
        // Show loading state
        importBtn.disabled = true;
        importBtn.classList.add('loading');
        importBtn.textContent = 'Importing...';
        
        const response = await fetch('/api/admin/bulk-import', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        // Close bulk import modal
        closeBulkImportModal();
        
        // Show results
        showImportResults(result);
        
    } catch (error) {
        console.error('Bulk import error:', error);
        showAlert('Error importing teams: ' + error.message, 'error');
    } finally {
        // Reset button state
        importBtn.disabled = false;
        importBtn.classList.remove('loading');
        importBtn.textContent = '📊 Import Teams';
    }
}

function showImportResults(result) {
    const modal = document.getElementById('importResultsModal');
    const title = document.getElementById('resultsTitle');
    const summary = document.getElementById('resultsSummary');
    const details = document.getElementById('resultsDetails');
    
    // Set title based on success/failure
    if (result.success) {
        title.textContent = result.results.successful.length > 0 ? '✅ Import Completed' : '⚠️ Import Issues';
    } else {
        title.textContent = '❌ Import Failed';
    }
    
    // Create summary
    if (result.success) {
        const stats = result.results;
        summary.innerHTML = `
            <h3>Import Summary</h3>
            <div class="results-stats">
                <div class="stat-card success">
                    <div class="stat-number">${stats.successful.length}</div>
                    <div class="stat-label">Successful</div>
                </div>
                <div class="stat-card error">
                    <div class="stat-number">${stats.failed.length}</div>
                    <div class="stat-label">Failed</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-number">${stats.duplicates.length}</div>
                    <div class="stat-label">Duplicates</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.total}</div>
                    <div class="stat-label">Total Processed</div>
                </div>
            </div>
            <p><strong>Message:</strong> ${result.message}</p>
        `;
        
        // Create details
        let detailsHTML = '';
        
        // Successful imports
        if (stats.successful.length > 0) {
            detailsHTML += `
                <div class="result-section success">
                    <h4>✅ Successfully Imported (${stats.successful.length})</h4>
                    ${stats.successful.map(item => `
                        <div class="result-item">
                            <div class="result-item-header">Row ${item.row}: ${item.data.teamName}</div>
                            <div class="result-item-details">
                                Leader: ${item.data.teamLeaderName} | ID: ${item.data.studentId} | Email: ${item.data.email}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Failed imports
        if (stats.failed.length > 0) {
            detailsHTML += `
                <div class="result-section error">
                    <h4>❌ Failed Imports (${stats.failed.length})</h4>
                    ${stats.failed.map(item => `
                        <div class="result-item">
                            <div class="result-item-header">Row ${item.row}</div>
                            <div class="error-message">${item.error}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Duplicate imports
        if (stats.duplicates.length > 0) {
            detailsHTML += `
                <div class="result-section warning">
                    <h4>⚠️ Duplicates Skipped (${stats.duplicates.length})</h4>
                    ${stats.duplicates.map(item => `
                        <div class="result-item">
                            <div class="result-item-header">Row ${item.row}: ${item.data.teamName}</div>
                            <div class="error-message">${item.error}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        details.innerHTML = detailsHTML;
    } else {
        summary.innerHTML = `
            <div class="results-stats">
                <div class="stat-card error">
                    <div class="stat-number">0</div>
                    <div class="stat-label">Imported</div>
                </div>
            </div>
            <p><strong>Error:</strong> ${result.message}</p>
        `;
        details.innerHTML = '';
    }
    
    // Show modal
    modal.style.display = 'flex';
}

function showAlert(message, type) {
    // Remove existing alerts
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 3000;
        max-width: 500px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.3s ease;
        ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
    `;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 8000);
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const bulkModal = document.getElementById('bulkImportModal');
    const resultsModal = document.getElementById('importResultsModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (event.target === bulkModal) {
        closeBulkImportModal();
    }
    if (event.target === resultsModal) {
        closeImportResultsModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeBulkImportModal();
        closeImportResultsModal();
        closeDeleteModal();
    }
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
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
`;
document.head.appendChild(style);

// Show loading state while images are being loaded
function showImageLoadingState() {
    const imageSelect = document.getElementById('assignedImage');
    if (imageSelect) {
        imageSelect.innerHTML = '<option value="">Loading images...</option>';
        imageSelect.disabled = true;
    }
}

// Show error state if images fail to load
function showImageErrorState(error) {
    const imageSelect = document.getElementById('assignedImage');
    if (imageSelect) {
        imageSelect.innerHTML = `
            <option value="">Error loading images</option>
            <option value="" disabled>Please check server logs</option>
        `;
        imageSelect.disabled = false;
    }
    console.error('Image loading error:', error);
}

// Update loadAvailableImages with better error handling
async function loadAvailableImages() {
    showImageLoadingState();
    
    try {
        console.log('Loading available images...');
        
        const response = await fetch('/api/admin/available-images');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Images API response:', result);
        
        const imageSelect = document.getElementById('assignedImage');
        if (!imageSelect) {
            console.error('Image select element not found');
            return;
        }
        
        // Enable the select
        imageSelect.disabled = false;
        
        if (result.success) {
            // Clear existing options
            imageSelect.innerHTML = '<option value="">Select an image...</option>';
            
            if (result.images && result.images.length > 0) {
                result.images.forEach(image => {
                    const option = document.createElement('option');
                    option.value = image;
                    // Show filename and extension for clarity
                    option.textContent = image;
                    imageSelect.appendChild(option);
                });
                
                console.log(`Successfully loaded ${result.images.length} images`);
                
                // Show success message
                if (result.count === 0) {
                    showAlert('No images found. Please add images to /public/images/ directory', 'warning');
                }
            } else {
                // Add message when no images found
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No images found - Add images to /public/images/';
                option.disabled = true;
                imageSelect.appendChild(option);
                
                showAlert('No images found in /public/images/ directory. Please add some images first.', 'warning');
            }
        } else {
            throw new Error(result.message || 'Failed to load images');
        }
        
    } catch (error) {
        console.error('Error loading images:', error);
        showImageErrorState(error);
        showAlert(`Error loading images: ${error.message}. Please check if /public/images/ directory exists and contains image files.`, 'error');
    }
}
