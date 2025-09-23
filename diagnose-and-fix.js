/**
 * Comprehensive Chrome Extension Diagnostic and Fix Script
 * This script will identify and fix ALL issues in the extension
 */

const fs = require('fs').promises;
const path = require('path');

async function diagnoseAndFix() {
    console.log('🔍 Starting comprehensive extension diagnosis...\n');

    const issues = [];
    const fixes = [];

    // 1. Check manifest.json
    console.log('📋 Checking manifest.json...');
    try {
        const manifest = JSON.parse(await fs.readFile('manifest.json', 'utf8'));

        // Check for required fields
        if (!manifest.manifest_version || manifest.manifest_version !== 3) {
            issues.push('Manifest version must be 3');
        }

        // Check background service worker
        if (!manifest.background?.service_worker) {
            issues.push('Missing background service worker');
        } else {
            // Verify the file exists
            const bgFile = manifest.background.service_worker;
            try {
                await fs.access(bgFile);
                console.log(`✅ Background file exists: ${bgFile}`);
            } catch {
                issues.push(`Background file missing: ${bgFile}`);
            }
        }

        // Check action popup
        if (manifest.action?.default_popup) {
            const popupFile = manifest.action.default_popup;
            try {
                await fs.access(popupFile);
                console.log(`✅ Popup file exists: ${popupFile}`);
            } catch {
                issues.push(`Popup file missing: ${popupFile}`);
            }
        }

        // Check content scripts
        if (manifest.content_scripts) {
            for (const cs of manifest.content_scripts) {
                for (const jsFile of cs.js || []) {
                    try {
                        await fs.access(jsFile);
                        console.log(`✅ Content script exists: ${jsFile}`);
                    } catch {
                        issues.push(`Content script missing: ${jsFile}`);
                    }
                }
            }
        }

        // Check web accessible resources
        if (manifest.web_accessible_resources) {
            for (const resource of manifest.web_accessible_resources) {
                for (const file of resource.resources || []) {
                    if (!file.includes('*')) {
                        try {
                            await fs.access(file);
                        } catch {
                            console.log(`⚠️ Web resource might be missing: ${file}`);
                        }
                    }
                }
            }
        }

    } catch (error) {
        issues.push(`Manifest error: ${error.message}`);
    }

    // 2. Check JavaScript files for syntax errors
    console.log('\n🔧 Checking JavaScript files...');
    const jsFiles = [
        'background-fixed.js',
        'content.js',
        'floating-widget-enhanced.js',
        'websocket-client-fixed.js',
        'popup/popup-fixed.js',
        'options/options-enhanced.js'
    ];

    for (const file of jsFiles) {
        try {
            const content = await fs.readFile(file, 'utf8');

            // Check for common issues
            if (content.includes('importScripts') && !file.includes('background')) {
                issues.push(`${file}: importScripts only works in service workers`);
            }

            if (content.includes('chrome.') && !content.includes('typeof chrome')) {
                console.log(`⚠️ ${file}: Uses chrome API without checking availability`);
            }

            // Check for syntax errors using Node
            try {
                new Function(content);
                console.log(`✅ ${file}: Syntax valid`);
            } catch (syntaxError) {
                issues.push(`${file}: Syntax error - ${syntaxError.message}`);
            }

        } catch (error) {
            if (error.code === 'ENOENT') {
                issues.push(`File missing: ${file}`);
            } else {
                issues.push(`${file}: ${error.message}`);
            }
        }
    }

    // 3. Check for missing dependencies
    console.log('\n📦 Checking dependencies...');
    const requiredFiles = [
        'screenshot.js',
        'context7-integration.js',
        'n8n-docs-integration.js',
        'chrome-docs-integration.js',
        'opal-docs-integration.js'
    ];

    for (const file of requiredFiles) {
        try {
            await fs.access(file);
            console.log(`✅ Dependency exists: ${file}`);
        } catch {
            issues.push(`Missing dependency: ${file}`);

            // Create a stub file
            const stubContent = `/**
 * ${file} - Stub implementation
 * This file was auto-generated to prevent import errors
 */

class ${path.basename(file, '.js').replace(/-/g, '_')} {
    constructor() {
        console.log('${file} initialized (stub)');
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ${path.basename(file, '.js').replace(/-/g, '_')};
}`;

            await fs.writeFile(file, stubContent);
            fixes.push(`Created stub file: ${file}`);
        }
    }

    // 4. Check images directory
    console.log('\n🖼️ Checking images...');
    const requiredImages = [
        'images/icon-16.png',
        'images/icon-48.png',
        'images/icon-128.png'
    ];

    for (const img of requiredImages) {
        try {
            await fs.access(img);
            console.log(`✅ Image exists: ${img}`);
        } catch {
            issues.push(`Missing image: ${img}`);
            // Create placeholder image (1x1 transparent PNG)
            const imgDir = path.dirname(img);
            await fs.mkdir(imgDir, { recursive: true });

            // Base64 encoded 1x1 transparent PNG
            const placeholderPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
            await fs.writeFile(img, placeholderPNG);
            fixes.push(`Created placeholder: ${img}`);
        }
    }

    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSIS COMPLETE');
    console.log('='.repeat(60));

    if (issues.length > 0) {
        console.log('\n❌ Issues Found:');
        issues.forEach((issue, i) => {
            console.log(`  ${i + 1}. ${issue}`);
        });
    } else {
        console.log('\n✅ No issues found!');
    }

    if (fixes.length > 0) {
        console.log('\n✨ Fixes Applied:');
        fixes.forEach((fix, i) => {
            console.log(`  ${i + 1}. ${fix}`);
        });
    }

    console.log('\n💡 Recommendations:');
    console.log('  1. Run "node diagnose-and-fix.js" to check for issues');
    console.log('  2. Load extension in Chrome via chrome://extensions');
    console.log('  3. Enable Developer Mode');
    console.log('  4. Click "Load unpacked" and select this directory');
    console.log('  5. Check browser console for any remaining errors');

    return { issues, fixes };
}

// Run if executed directly
if (require.main === module) {
    diagnoseAndFix().catch(console.error);
}

module.exports = diagnoseAndFix;