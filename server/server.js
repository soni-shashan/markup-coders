const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const archiver = require('archiver');
const puppeteer = require('puppeteer');
const fs = require('fs');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const multer = require('multer');
const xlsx = require('xlsx');
const crypto = require('crypto');
const zlib = require('zlib');

// Load environment variables
require('dotenv').config();

const Team = require('./models/Team');
const Submission = require('./models/Submission');
const TempCode = require('./models/TempCode');

const app = express();
app.use(express.json()); 
const PORT = process.env.PORT || 3000;

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eyecoders';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('Missing Google OAuth credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file');
    process.exit(1);
}

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());


// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "https://markup-coders.klevoradigital.in/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value.toLowerCase();
        console.log(`OAuth attempt for email: ${email}`);
        
        // Find team by email
        let team = await Team.findOne({ email: email });
        
        if (team) {
            // Update team with Google ID and login info
            team.googleId = profile.id;
            team.isAuthenticated = true;
            team.lastLogin = new Date();
            team.profilePicture = profile.photos[0]?.value || null;
            await team.save();
            
            console.log(`Successful login for team: ${team.teamName}`);
            return done(null, team);
        } else {
            console.log(`No team found for email: ${email}`);
            return done(null, false, { message: 'No team registered with this email address' });
        }
    } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
    }
}));

// Passport serialization
passport.serializeUser((team, done) => {
    done(null, team._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const team = await Team.findById(id);
        done(null, team);
    } catch (error) {
        done(error, null);
    }
});

// Static file serving
app.use(express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// MongoDB connection
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(error => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
});

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        redirectTo: '/auth/google'
    });
}

// Helper functions
function generateSHA256Hash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function sanitizeFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function encryptWithRNCryptor(data, password) {
    try {
        const version = 3;
        const options = 1;
        const encryptionSalt = crypto.randomBytes(8);
        const hmacSalt = crypto.randomBytes(8);
        const iv = crypto.randomBytes(16);
        
        const encryptionKey = crypto.pbkdf2Sync(password, encryptionSalt, 10000, 32, 'sha1');
        const hmacKey = crypto.pbkdf2Sync(password, hmacSalt, 10000, 32, 'sha1');
        
        const blockSize = 16;
        const padding = blockSize - (data.length % blockSize);
        const paddedData = Buffer.concat([data, Buffer.alloc(padding, padding)]);
        
        const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
        cipher.setAutoPadding(false);
        
        let encrypted = cipher.update(paddedData);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        const message = Buffer.concat([
            Buffer.from([version]),
            Buffer.from([options]),
            encryptionSalt,
            hmacSalt,
            iv,
            encrypted
        ]);
        
        const hmac = crypto.createHmac('sha256', hmacKey);
        hmac.update(message);
        const hmacDigest = hmac.digest();
        
        return Buffer.concat([message, hmacDigest]);
        
    } catch (error) {
        console.error('RNCryptor encryption error:', error);
        throw error;
    }
}

function createEncryptedSEB(configXML, password) {
    try {
        console.log('Creating encrypted SEB file...');
        
        const compressedData = zlib.gzipSync(Buffer.from(configXML, 'utf8'), {
            level: 6
        });
        
        console.log(`Original XML size: ${configXML.length}`);
        console.log(`Compressed size: ${compressedData.length}`);

        const encryptedData = encryptWithRNCryptor(compressedData, password);
        
        console.log(`Encrypted size: ${encryptedData.length}`);

        const sebHeader = Buffer.from([0x53, 0x45, 0x42, 0x58]);
        
        const finalSEBFile = Buffer.concat([sebHeader, encryptedData]);
        
        console.log(`Final SEB file size: ${finalSEBFile.length}`);
        
        return finalSEBFile;

    } catch (error) {
        console.error('SEB encryption error:', error);
        throw new Error('Failed to create encrypted SEB: ' + error.message);
    }
}

function generateSEBConfigurationXML(entryPass, exitPass, serverURL) {
    const hashedExitPassword = crypto.createHash('sha256').update(exitPass).digest('hex');
    const hashedEntryPassword = crypto.createHash('sha256').update(entryPass).digest('hex');
    const timestamp = new Date().toISOString();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>originatorVersion</key>
    <string>EyeCoders-SEB-Generator</string>
    <key>sebConfigPurpose</key>
    <integer>1</integer>
    
    <key>hashedAdminPassword</key>
    <string>${hashedEntryPassword}</string>
    
    <key>hashedQuitPassword</key>
    <string>${hashedExitPassword}</string>
    
    <key>startURL</key>
    <string>${serverURL}/client</string>
    <key>quitURL</key>
    <string>${serverURL}/exit</string>
    
    <key>browserExamKey</key>
    <string>${crypto.createHash('sha256').update(entryPass + serverURL + exitPass).digest('hex')}</string>
    
    <key>allowQuit</key>
    <true/>
    <key>quitURLConfirm</key>
    <true/>
    <key>showTaskBar</key>
    <true/>
    <key>showTime</key>
    <true/>
    <key>showInputLanguage</key>
    <true/>
    <key>showReloadButton</key>
    <true/>
    
    <key>allowWlan</key>
    <false/>
    <key>allowApplicationLog</key>
    <false/>
    <key>allowDisplayMirroring</key>
    <false/>
    <key>allowSwitchToApplications</key>
    <false/>
    <key>allowVirtualMachine</key>
    <false/>
    
    <key>audioControlEnabled</key>
    <false/>
    <key>audioMute</key>
    <false/>
    <key>browserMediaCaptureCamera</key>
    <false/>
    <key>browserMediaCaptureMicrophone</key>
    <false/>
    
    <key>browserWindowWebView</key>
    <integer>3</integer>
    <key>browserWindowAllowReload</key>
    <true/>
    <key>allowSpellCheck</key>
    <false/>
    <key>allowBrowsingBackForward</key>
    <true/>
    
    <key>URLFilterEnable</key>
    <false/>
    <key>URLFilterEnableContentFilter</key>
    <false/>
    <key>URLFilterRules</key>
    <array/>
    
    <key>examSessionClearCookiesOnStart</key>
    <false/>
    <key>sendBrowserExamKey</key>
    <true/>
    <key>restartExamPasswordProtected</key>
    <true/>
    
    <key>prohibitedProcesses</key>
    <array>
        <dict>
            <key>active</key>
            <true/>
            <key>executable</key>
            <string>taskmgr.exe</string>
            <key>description</key>
            <string>Task Manager</string>
        </dict>
        <dict>
            <key>active</key>
            <true/>
            <key>executable</key>
            <string>cmd.exe</string>
            <key>description</key>
            <string>Command Prompt</string>
        </dict>
    </array>
    
    <key>detectStoppedProcess</key>
    <true/>
    <key>killExplorerShell</key>
    <true/>
    <key>allowUserSwitching</key>
    <false/>
    
    <key>browserWindowTitleSuffix</key>
    <string> - EyeCoders Competition</string>
    <key>creationDate</key>
    <date>${timestamp}</date>
</dict>
</plist>`;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'teams-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/octet-stream'
        ];
        
        if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// Helper function for creating submission files
async function createSubmissionFiles(submission, outputDir) {
    try {
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${submission.teamName} - Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    ${submission.htmlCode.replace(/<html[^>]*>|<\/html>|<head[^>]*>|<\/head>|<body[^>]*>|<\/body>|<!DOCTYPE[^>]*>/gi, '')}
    <script src="script.js"></script>
</body>
</html>`;
        
        await writeFile(path.join(outputDir, 'index.html'), htmlContent);
        await writeFile(path.join(outputDir, 'style.css'), submission.cssCode || '');
        await writeFile(path.join(outputDir, 'script.js'), submission.jsCode || '');
        
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setContent(htmlContent);
            await page.addStyleTag({ content: submission.cssCode || '' });
            
            const pdfBuffer = await page.pdf({ 
                format: 'A4',
                printBackground: true,
                margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
            });
            
            await writeFile(path.join(outputDir, 'output.pdf'), pdfBuffer);
        } catch (pdfError) {
            console.error(`PDF generation failed for ${submission.teamName}:`, pdfError);
            await writeFile(path.join(outputDir, 'output_error.txt'), 'PDF generation failed: ' + pdfError.message);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
        
        const infoContent = `Submission Information
=====================
Team Name: ${submission.teamName}
Student ID: ${submission.studentId}
Email: ${submission.email}
Submission ID: ${submission.submissionId}
Submitted At: ${new Date(submission.submittedAt).toLocaleString()}

Files Included:
- index.html (Main HTML file)
- style.css (CSS styles)
- script.js (JavaScript code)
- output.pdf (PDF of the rendered output)
- info.txt (This file)
`;
        
        await writeFile(path.join(outputDir, 'info.txt'), infoContent);
        
    } catch (error) {
        console.error('Error creating submission files:', error);
        throw error;
    }
}

function createCompleteHtmlContent(submission) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${submission.teamName} - Complete Project</title>
    <style>
        ${submission.cssCode || '/* No CSS provided */'}
    </style>
</head>
<body>
    ${submission.htmlCode ? submission.htmlCode.replace(/<html[^>]*>|<\/html>|<head[^>]*>|<\/head>|<body[^>]*>|<\/body>|<!DOCTYPE[^>]*>/gi, '') : '<!-- No HTML content provided -->'}
    
    <script>
        try {
            ${submission.jsCode || '// No JavaScript provided'}
        } catch(error) {
            console.error('JavaScript Error:', error);
            document.body.innerHTML += '<div style="background: #ff6b6b; color: white; padding: 15px; margin: 15px; border-radius: 8px; font-family: Arial, sans-serif;"><strong>JavaScript Error:</strong> ' + error.message + '</div>';
        }
    </script>
</body>
</html>`;
}

function createInfoContent(submission) {
    return `Submission Information
=====================
Team Name: ${submission.teamName}
Student ID: ${submission.studentId}
Email: ${submission.email}
Submission ID: ${submission.submissionId}
Submitted At: ${new Date(submission.submittedAt).toLocaleString()}

Files Included:
- complete.html (Complete project in single file - OPEN THIS FILE)
- index.html (Original HTML file)
- style.css (CSS styles)
- script.js (JavaScript code)
- info.txt (This file)

Instructions:
1. Open 'complete.html' in a web browser to view the complete project
2. The other files are separated for development purposes
3. PDF generation was skipped for faster bulk download

Note: Use individual team download for PDF output.
`;
}

function extractTeamData(row, rowNumber) {
    const result = {
        isValid: false,
        error: null,
        teamName: null,
        teamLeaderName: null,
        studentId: null,
        email: null
    };

    try {
        const columnMappings = {
            teamName: ['team_name', 'teamname', 'team name', 'name', 'Team Name', 'Team_Name'],
            teamLeaderName: ['team_leader', 'leader', 'team_leader_name', 'leader_name', 'Team Leader', 'Team Leader Name'],
            studentId: ['student_id', 'studentid', 'id', 'Student ID', 'Student_ID', 'roll_no', 'Roll No'],
            email: ['email', 'email_address', 'Email', 'Email Address', 'Email_Address', 'gmail', 'Gmail']
        };

        for (const [field, possibleColumns] of Object.entries(columnMappings)) {
            let value = null;
            
            for (const col of possibleColumns) {
                if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
                    value = String(row[col]).trim();
                    break;
                }
            }
            
            if (!value) {
                const rowKeys = Object.keys(row);
                for (const col of possibleColumns) {
                    const matchingKey = rowKeys.find(key => 
                        key.toLowerCase().replace(/[_\s]/g, '') === col.toLowerCase().replace(/[_\s]/g, '')
                    );
                    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && row[matchingKey] !== '') {
                        value = String(row[matchingKey]).trim();
                        break;
                    }
                }
            }
            
            result[field] = value;
        }

        const missingFields = [];
        if (!result.teamName) missingFields.push('Team Name');
        if (!result.teamLeaderName) missingFields.push('Team Leader');
        if (!result.studentId) missingFields.push('Student ID');
        if (!result.email) missingFields.push('Email');

        if (missingFields.length > 0) {
            result.error = `Missing required fields: ${missingFields.join(', ')}. Available columns: ${Object.keys(row).join(', ')}`;
            return result;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(result.email)) {
            result.error = `Invalid email format: ${result.email}`;
            return result;
        }

        // Convert email to lowercase
        result.email = result.email.toLowerCase();

        result.isValid = true;
        return result;

    } catch (error) {
        result.error = `Error processing row: ${error.message}`;
        return result;
    }
}

// OAuth Routes
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login-failed' }),
    (req, res) => {
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
            }
            res.redirect('/client');
        });
    }
);

// API to mark user as not first time
app.get('/isFirstTimeUser', requireAuth, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }

    try {
        // Update the user's isFirstTimeUser to false
        const updatedTeam = await Team.findOneAndUpdate(
            { teamName: req.user.teamName, email: req.user.email },
            { isFirstTimeUser: false },
            { upsert: true, new: true } // return the updated document
        );

        res.json({
            success: true,
            isFirstTimeUser: updatedTeam.isFirstTimeUser
        });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/auth/logout', (req, res) => {
    const teamName = req.user ? req.user.teamName : 'Unknown';
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        console.log(`User logged out: ${teamName}`);
        res.redirect('/');
    });
});

app.get('/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            success: true,
            authenticated: true,
            team: {
                teamName: req.user.teamName,
                teamLeaderName: req.user.teamLeaderName,
                email: req.user.email,
                studentId: req.user.studentId,
                profilePicture: req.user.profilePicture,
                isFirstTimeUser: req.user.isFirstTimeUser,
                image: req.user.image || null
            }
        });
    } else {
        res.json({
            success: true,
            authenticated: false
        });
    }
});

// SEB Routes
app.get('/seb', (req, res) => {
    try {
        const { entrypass, exitpass } = req.query;
        
        if (!entrypass || !exitpass) {
            return res.status(400).json({
                success: false,
                message: 'Both entrypass and exitpass parameters are required'
            });
        }
        
        if (entrypass.length < 4 || exitpass.length < 4) {
            return res.status(400).json({
                success: false,
                message: 'Passwords must be at least 4 characters long'
            });
        }
        
        const protocol = req.protocol;
        const host = req.get('host');
        const serverURL = `${protocol}://${host}`;
        
        console.log(`Generating encrypted SEB config for ${serverURL}`);
        
        const sebConfigXML = generateSEBConfigurationXML(entrypass, exitpass, serverURL);
        
        res.setHeader('Content-Type', 'application/x-sebconfig');
        res.setHeader('Content-Disposition', 'attachment; filename="eyecoders_exam.seb"');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Length', sebConfigXML.length);
        
        res.send(sebConfigXML);
        
    } catch (error) {
        console.error('SEB generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating SEB configuration: ' + error.message
        });
    }
});

app.get('/seb-download', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/seb-download.html'));
});

// Admin Routes
app.post('/api/admin/teams', async (req, res) => {
    try {
        const { teamName, teamLeaderName,studentId, email, image } = req.body;
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }
        
        const team = new Team({
            teamName: teamName.trim(),
            teamLeaderName: teamLeaderName.trim(),
            email: email.toLowerCase().trim(),
            studentId: studentId.trim(),
            image: image.trim() || null
        });
        
        await team.save();
        console.log(`New team created: ${team.teamName} (${team.email})`);
        res.json({ success: true, message: 'Team created successfully', team });
    } catch (error) {
        console.error('Error creating team:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const value = error.keyValue[field];
            res.status(400).json({ 
                success: false, 
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists ${teamName},${teamLeaderName},${email},${studentId}` 
            });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
});

app.get('/api/admin/teams', async (req, res) => {
    try {
        const teams = await Team.find().sort({ createdAt: -1 });
        res.json({ success: true, teams });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/admin/teams/:id', async (req, res) => {
    try {
        const teamId = req.params.id;
        
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }
        
        console.log(`Starting deletion process for team: ${team.teamName}`);
        
        const submissionsCount = await Submission.countDocuments({ teamName: team.teamName });
        const tempCodesCount = await TempCode.countDocuments({ teamName: team.teamName });
        
        const deletionPromises = [
            Submission.deleteMany({ teamName: team.teamName }),
            TempCode.deleteMany({ teamName: team.teamName }),
            Team.findByIdAndDelete(teamId)
        ];
        
        const results = await Promise.all(deletionPromises);
        
        console.log(`Deletion completed for team: ${team.teamName}`);
        console.log(`- Submissions deleted: ${results[0].deletedCount}`);
        console.log(`- Temp codes deleted: ${results[1].deletedCount}`);
        
        res.json({ 
            success: true, 
            message: `Team "${team.teamName}" and all related data deleted successfully`,
            deletedData: {
                team: team.teamName,
                submissions: results[0].deletedCount,
                tempCodes: results[1].deletedCount
            }
        });
        
    } catch (error) {
        console.error('Error deleting team and related data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting team: ' + error.message 
        });
    }
});

app.post('/api/admin/bulk-import', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        console.log('Processing Excel file:', req.file.filename);

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Excel file is empty or has no valid data'
            });
        }

        console.log(`Found ${jsonData.length} rows in Excel file`);

        const results = {
            successful: [],
            failed: [],
            duplicates: [],
            total: jsonData.length
        };

        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            const rowNumber = i + 2;

            try {
                const teamData = extractTeamData(row, rowNumber);
                
                if (!teamData.isValid) {
                    results.failed.push({
                        row: rowNumber,
                        data: row,
                        error: teamData.error
                    });
                    continue;
                }

                const existingTeam = await Team.findOne({
                    $or: [
                        { teamName: teamData.teamName },
                        { email: teamData.email },
                        { studentId: teamData.studentId }
                    ]
                });

                if (existingTeam) {
                    let duplicateReason;
                    if (existingTeam.teamName === teamData.teamName) {
                        duplicateReason = `Team name "${teamData.teamName}" already exists`;
                    } else if (existingTeam.email === teamData.email) {
                        duplicateReason = `Email "${teamData.email}" already assigned to team "${existingTeam.teamName}"`;
                    } else {
                        duplicateReason = `Student ID "${teamData.studentId}" already assigned to team "${existingTeam.teamName}"`;
                    }
                    
                    results.duplicates.push({
                        row: rowNumber,
                        data: teamData,
                        error: duplicateReason
                    });
                    continue;
                }
                if(teamData.image.trim()=="1"){
                    teamData.image='https://drive.google.com/thumbnail?id=1IWi0Xn1ksNWxyG2Y9nCUO2yKy44FKEfG&sz=w1000'
                }else if (teamData.image.trim()=="2"){
                    teamData.image='https://drive.google.com/thumbnail?id=1OlFq1OExHQJZ04xz5wXP0k2ln1gmTZDS&sz=w1000'
                }
                const team = new Team({
                    teamName: teamData.teamName,
                    teamLeaderName: teamData.teamLeaderName,
                    studentId: teamData.studentId,
                    email: teamData.email,
                    image: teamData.image.trim()|| null
                });

                await team.save();
                
                results.successful.push({
                    row: rowNumber,
                    data: teamData
                });

                console.log(`Successfully created team: ${teamData.teamName} (${teamData.email})`);

            } catch (error) {
                console.error(`Error processing row ${rowNumber}:`, error);
                results.failed.push({
                    row: rowNumber,
                    data: row,
                    error: error.message
                });
            }
        }

        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            message: `Import completed: ${results.successful.length} successful, ${results.failed.length} failed, ${results.duplicates.length} duplicates`,
            results: results
        });

    } catch (error) {
        console.error('Bulk import error:', error);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error processing Excel file: ' + error.message
        });
    }
});

app.get('/api/admin/download-template', (req, res) => {
    try {
        const sampleData = [
            {
                'Team Name': 'Alpha Coders',
                'Team Leader': 'John Doe',
                'Student ID': 'CS001',
                'Email': 'john.doe@gmail.com',
                'image':'1'
            },
            {
                'Team Name': 'Beta Developers',
                'Team Leader': 'Jane Smith',
                'Student ID': 'CS002',
                'Email': 'jane.smith@gmail.com',
                'image':'2'
            },
            {
                'Team Name': 'Gamma Tech',
                'Team Leader': 'Bob Johnson',
                'Student ID': 'CS003',
                'Email': 'bob.johnson@gmail.com',
                'image':'1'
            }
        ];

        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(sampleData);
        
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Teams Data');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="teams_template.xlsx"');
        
        res.send(buffer);

    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating template: ' + error.message
        });
    }
});

app.get('/api/admin/submissions', async (req, res) => {
    try {
        const submissions = await Submission.find().sort({ submittedAt: -1 });
        res.json({ success: true, submissions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/admin/teams-with-submissions', async (req, res) => {
    try {
        const submissions = await Submission.find().sort({ submittedAt: -1 });
        const teams = await Team.find();
        
        const teamsWithSubmissions = {};
        
        teams.forEach(team => {
            const teamSubmissions = submissions.filter(sub => sub.teamName === team.teamName);
            teamsWithSubmissions[team.teamName] = {
                teamInfo: team,
                submissions: teamSubmissions,
                totalSubmissions: teamSubmissions.length,
                latestSubmission: teamSubmissions[0] || null
            };
        });
        
        res.json({ success: true, teamsWithSubmissions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/admin/submission/:id', async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (submission) {
            res.json({ success: true, submission });
        } else {
            res.status(404).json({ success: false, message: 'Submission not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/admin/download/:id', async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }
        
        const tempDir = path.join(__dirname, 'temp', sanitizeFileName(submission.submissionId));
        await mkdir(tempDir, { recursive: true });
        
        await createSubmissionFiles(submission, tempDir);
        
        const zipFileName = `${sanitizeFileName(submission.submissionId)}.zip`;
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
        
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.on('error', (err) => {
            throw err;
        });
        
        archive.pipe(res);
        archive.directory(tempDir, false);
        await archive.finalize();
        
        setTimeout(() => {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }, 5000);
        
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/admin/download-all-teams', async (req, res) => {
    console.log('Download all teams request received');
    
    try {
        const teams = await Team.find();
        const allSubmissions = await Submission.find().sort({ submittedAt: -1 });
        
        console.log(`Found ${teams.length} teams and ${allSubmissions.length} submissions`);
        
        const teamsWithSubmissions = [];
        for (const team of teams) {
            const latestSubmission = allSubmissions.find(sub => sub.teamName === team.teamName);
            if (latestSubmission) {
                teamsWithSubmissions.push({
                    team: team,
                    submission: latestSubmission
                });
            }
        }
        
        if (teamsWithSubmissions.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No teams with submissions found' 
            });
        }
        
        console.log(`Processing ${teamsWithSubmissions.length} teams with submissions`);
        
        const zipFileName = `All_Teams_Submissions_${new Date().toISOString().split('T')[0]}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
        
        const archive = archiver('zip', { 
            zlib: { level: 1 },
            store: true
        });
        
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).end();
            }
        });
        
        archive.on('warning', (err) => {
            console.warn('Archive warning:', err);
        });
        
        archive.pipe(res);
        
        for (const teamData of teamsWithSubmissions) {
            const { team, submission } = teamData;
            const teamFolderName = sanitizeFileName(team.teamName);
            
            console.log(`Adding files for team: ${team.teamName}`);
            
            try {
                const htmlContent = createCompleteHtmlContent(submission);
                
                archive.append(htmlContent, { name: `${teamFolderName}/complete.html` });
                archive.append(submission.htmlCode || '', { name: `${teamFolderName}/index.html` });
                archive.append(submission.cssCode || '', { name: `${teamFolderName}/style.css` });
                archive.append(submission.jsCode || '', { name: `${teamFolderName}/script.js` });
                
                const infoContent = createInfoContent(submission);
                archive.append(infoContent, { name: `${teamFolderName}/info.txt` });
                
            } catch (teamError) {
                console.error(`Error processing team ${team.teamName}:`, teamError);
                archive.append(`Error processing team: ${teamError.message}`, { 
                    name: `${teamFolderName}/error.txt` 
                });
            }
        }
        
        console.log('Finalizing archive...');
        await archive.finalize();
        console.log('Archive sent successfully');
        
    } catch (error) {
        console.error('Download all teams error:', error);
        
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, 
                message: 'Server error: ' + error.message 
            });
        }
    }
});

app.get('/api/admin/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is responding',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Client Routes
app.get('/api/client/team-info', requireAuth, async (req, res) => {
    try {
        res.json({ 
            success: true, 
            team: {
                teamName: req.user.teamName,
                teamLeaderName: req.user.teamLeaderName,
                email: req.user.email,
                studentId: req.user.studentId,
                profilePicture: req.user.profilePicture
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Auto-save temp code
app.post('/api/client/temp-save', requireAuth, async (req, res) => {
    try {
        const { htmlCode, cssCode, jsCode } = req.body;
        
        await TempCode.findOneAndUpdate(
            { teamName: req.user.teamName, email: req.user.email },
            {
                teamName: req.user.teamName,
                studentId: req.user.studentId,
                email: req.user.email,
                htmlCode: htmlCode || '',
                cssCode: cssCode || '',
                jsCode: jsCode || '',
                lastSaved: new Date(),
                isActive: true
            },
            { 
                upsert: true, 
                new: true 
            }
        );
        
        res.json({ success: true, message: 'Code auto-saved' });
    } catch (error) {
        console.error('Temp save error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get temp code and latest submission for comparison
app.get('/api/client/restore-data', requireAuth, async (req, res) => {
    try {
        console.log(`Restore data request for team: ${req.user.teamName}, Email: ${req.user.email}`);
        
        const tempCode = await TempCode.findOne({ 
            teamName: req.user.teamName, 
            email: req.user.email,
            isActive: true 
        });
        
        const latestSubmission = await Submission.findOne({ 
            teamName: req.user.teamName,
            email: req.user.email 
        }).sort({ submittedAt: -1 });
        
        console.log(`Found temp code: ${!!tempCode}, Found submission: ${!!latestSubmission}`);
        
        res.json({ 
            success: true, 
            tempCode: tempCode,
            latestSubmission: latestSubmission,
            hasTempCode: !!tempCode,
            hasSubmission: !!latestSubmission
        });
    } catch (error) {
        console.error('Restore data error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Clear temp code after submission
app.delete('/api/client/temp-code', requireAuth, async (req, res) => {
    try {
        await TempCode.findOneAndUpdate(
            { teamName: req.user.teamName, email: req.user.email },
            { isActive: false }
        );
        
        res.json({ success: true, message: 'Temp code cleared' });
    } catch (error) {
        console.error('Clear temp code error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Submit code
app.post('/api/client/submit', requireAuth, async (req, res) => {
    try {
        const { htmlCode, cssCode, jsCode } = req.body;
        
        const existingSubmissions = await Submission.find({ 
            teamName: req.user.teamName 
        }).sort({ submittedAt: -1 });
        
        const submissionNumber = existingSubmissions.length + 1;
        
        const baseSubmissionId = `${req.user.teamName}@${req.user.studentId}:${req.user.email}`;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const uniqueSubmissionId = `${baseSubmissionId}_${submissionNumber}_${timestamp}`;
        
        const submission = new Submission({
            teamName: req.user.teamName,
            studentId: req.user.studentId,
            email: req.user.email,
            htmlCode,
            cssCode,
            jsCode,
            submissionId: baseSubmissionId,
            submissionNumber: submissionNumber,
            uniqueSubmissionId: uniqueSubmissionId
        });
        
        await submission.save();
        
        // Clear temp code after successful submission
        await TempCode.findOneAndUpdate(
            { teamName: req.user.teamName, email: req.user.email },
            { isActive: false }
        );
        
        console.log(`Submission #${submissionNumber} saved for team: ${req.user.teamName}`);
        
        res.json({ 
            success: true, 
            message: `Submission #${submissionNumber} saved successfully!`, 
            submissionId: baseSubmissionId,
            submissionNumber: submissionNumber,
            uniqueId: uniqueSubmissionId
        });
    } catch (error) {
        console.error('Submission error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

app.get('/api/admin/temp-codes', async (req, res) => {
    try {
        const tempCodes = await TempCode.find({ isActive: true }).sort({ lastSaved: -1 });
        res.json({ success: true, tempCodes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Static routes
app.get('/login-failed', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/client/login-failed.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

app.get('/admin/submissions', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/submissions.html'));
});

app.get('/admin/view-submission/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/view-submission.html'));
});

app.get('/exit', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/client/seb_exit.html'));
});

app.get('/', (req, res) => {
    res.redirect('/client');
});

app.get('/client', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/client/index.html'));
});

// Catch-all route
app.get('*', (req, res) => {
    res.redirect('/client');
});

// Process monitoring
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Memory monitoring
setInterval(() => {
    const used = process.memoryUsage();
    console.log('Memory usage:', {
        rss: Math.round(used.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB'
    });
}, 300000); // Every 5 minutes

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Client Interface: http://localhost:${PORT}/client`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`Submissions Viewer: http://localhost:${PORT}/admin/submissions`);
    console.log(`Google OAuth: http://localhost:${PORT}/auth/google`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
    console.log(`SEB Download: http://localhost:${PORT}/seb-download`);
});