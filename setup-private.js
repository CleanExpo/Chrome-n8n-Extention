/**
 * Private Setup Script
 * Run this to configure your private Gmail accounts
 * This file should NEVER be committed to git
 */

const readline = require('readline');
const fs = require('fs');
const crypto = require('crypto');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🔒 Private Chrome Extension Setup\n');
console.log('This will configure the extension for your private Gmail accounts only.\n');

const config = {
    authorizedEmails: [],
    googleClientId: '',
    googleClientSecret: '',
    extensionId: '',
    encryptionKey: crypto.randomBytes(32).toString('hex')
};

async function setup() {
    // Get first Gmail account
    config.authorizedEmails[0] = await question('Enter your FIRST Gmail address: ');

    // Get second Gmail account
    config.authorizedEmails[1] = await question('Enter your SECOND Gmail address: ');

    // Validate emails
    if (!validateEmail(config.authorizedEmails[0]) || !validateEmail(config.authorizedEmails[1])) {
        console.error('\n❌ Invalid email format. Please run setup again.\n');
        process.exit(1);
    }

    console.log('\n✅ Authorized emails configured:');
    console.log(`   1. ${config.authorizedEmails[0]}`);
    console.log(`   2. ${config.authorizedEmails[1]}`);

    // Google OAuth2 setup
    console.log('\n📋 Google OAuth2 Setup (optional, press Enter to skip):');
    config.googleClientId = await question('Google Client ID (ends with .apps.googleusercontent.com): ');

    if (config.googleClientId) {
        config.googleClientSecret = await question('Google Client Secret: ');
    }

    // Generate extension ID
    config.extensionId = crypto.randomBytes(16).toString('hex');

    // Create .env file
    const envContent = `# Private Chrome Extension Configuration
# Generated: ${new Date().toISOString()}
# DO NOT COMMIT THIS FILE TO GIT

# Authorized Gmail Accounts
AUTHORIZED_EMAIL_1=${config.authorizedEmails[0]}
AUTHORIZED_EMAIL_2=${config.authorizedEmails[1]}

# Google OAuth2
GOOGLE_CLIENT_ID=${config.googleClientId}
GOOGLE_CLIENT_SECRET=${config.googleClientSecret}

# Extension Security
EXTENSION_ID=${config.extensionId}
ENCRYPTION_KEY=${config.encryptionKey}

# Session Configuration
SESSION_TIMEOUT_HOURS=24
STRICT_MODE=true
BLOCK_UNAUTHORIZED=true
`;

    fs.writeFileSync('.env', envContent);
    console.log('\n✅ Created .env file with your configuration');

    // Update background-private.js with actual emails
    updateBackgroundScript(config.authorizedEmails);

    // Update manifest.json with OAuth2 client ID
    if (config.googleClientId) {
        updateManifest(config.googleClientId);
    }

    console.log('\n🎉 Setup complete!\n');
    console.log('Next steps:');
    console.log('1. Load the extension in Chrome (chrome://extensions)');
    console.log('2. Sign in with one of your authorized Gmail accounts');
    console.log('3. The extension will automatically authenticate');
    console.log('\n⚠️  IMPORTANT: Keep your .env file secure and never commit it to git!\n');

    rl.close();
}

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer.trim());
        });
    });
}

function validateEmail(email) {
    const re = /^[^\s@]+@gmail\.com$/;
    return re.test(email);
}

function updateBackgroundScript(emails) {
    const backgroundPath = './background-private.js';

    if (fs.existsSync(backgroundPath)) {
        let content = fs.readFileSync(backgroundPath, 'utf8');

        // Replace placeholder emails with actual ones
        content = content.replace(
            "'your.first.email@gmail.com'",
            `'${emails[0]}'`
        );
        content = content.replace(
            "'your.second.email@gmail.com'",
            `'${emails[1]}'`
        );

        fs.writeFileSync(backgroundPath, content);
        console.log('✅ Updated background-private.js with your emails');
    }
}

function updateManifest(clientId) {
    const manifestPath = './manifest.json';

    if (fs.existsSync(manifestPath)) {
        let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        if (manifest.oauth2) {
            manifest.oauth2.client_id = clientId;
        }

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log('✅ Updated manifest.json with your OAuth2 client ID');
    }
}

// Run setup
setup().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
});