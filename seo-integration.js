/**
 * SEO Integration Module - Connects SEO Analysis Engine with Chrome Extension
 * Handles real-time analysis, popup UI updates, and background processing
 */

class SEOIntegration {
    constructor() {
        this.engine = null;
        this.currentAnalysis = null;
        this.isAnalyzing = false;
        this.autoAnalyze = false;
        this.cache = new Map();

        // Initialize on load
        this.init();
    }

    async init() {
        try {
            // Initialize SEO engine
            this.engine = new SEOAnalysisEngine();
            console.log('SEO Analysis Engine initialized');

            // Load settings
            await this.loadSettings();

            // Set up message listeners
            this.setupMessageListeners();

            // Set up auto-analysis if enabled
            if (this.autoAnalyze) {
                this.setupAutoAnalysis();
            }

        } catch (error) {
            console.error('Failed to initialize SEO Integration:', error);
        }
    }

    /**
     * Load extension settings
     */
    async loadSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['seoSettings'], (result) => {
                if (result.seoSettings) {
                    this.autoAnalyze = result.seoSettings.autoAnalyze || false;
                    this.engine.config = { ...this.engine.config, ...result.seoSettings.config };
                }
                resolve();
            });
        });
    }

    /**
     * Set up message listeners for communication with popup and content script
     */
    setupMessageListeners() {
        // Listen for messages from popup or content script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'SEO_ANALYZE') {
                this.handleAnalyzeRequest(request, sender, sendResponse);
                return true; // Will respond asynchronously
            }

            if (request.type === 'SEO_GET_CURRENT') {
                sendResponse({ analysis: this.currentAnalysis });
                return false;
            }

            if (request.type === 'SEO_STOP_ANALYSIS') {
                this.isAnalyzing = false;
                sendResponse({ success: true });
                return false;
            }

            if (request.type === 'SEO_EXPORT_REPORT') {
                this.exportReport(request.format, sendResponse);
                return true;
            }

            if (request.type === 'SEO_TOGGLE_AUTO') {
                this.autoAnalyze = request.enabled;
                this.saveSettings();
                if (this.autoAnalyze) {
                    this.setupAutoAnalysis();
                }
                sendResponse({ success: true });
                return false;
            }

            return false;
        });
    }

    /**
     * Handle analyze request
     */
    async handleAnalyzeRequest(request, sender, sendResponse) {
        try {
            // Get current tab URL if not provided
            const url = request.url || await this.getCurrentTabUrl();

            if (!url) {
                sendResponse({ error: 'No URL to analyze' });
                return;
            }

            // Check cache first
            const cacheKey = `${url}_${JSON.stringify(request.options || {})}`;
            if (this.cache.has(cacheKey) && !request.forceRefresh) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < 15 * 60 * 1000) { // 15 minutes
                    sendResponse({ success: true, analysis: cached.data });
                    return;
                }
            }

            // Start analysis
            this.isAnalyzing = true;

            // Send initial status
            this.broadcastStatus('analyzing', 'Starting SEO analysis...');

            // Get page data from content script if analyzing current tab
            let pageData = null;
            if (sender.tab && sender.tab.id) {
                pageData = await this.getPageDataFromTab(sender.tab.id);
            }

            // Run analysis
            const analysis = await this.engine.analyzePage(url, {
                ...request.options,
                pageData,
                includeCompetitors: request.includeCompetitors || false,
                trackSerp: request.trackSerp || false,
                localSeo: request.localSeo || false,
                analyzeBacklinks: request.analyzeBacklinks || false,
                targetKeywords: request.keywords || []
            });

            // Store current analysis
            this.currentAnalysis = analysis;

            // Cache results
            this.cache.set(cacheKey, {
                timestamp: Date.now(),
                data: analysis
            });

            // Send complete status
            this.isAnalyzing = false;
            this.broadcastStatus('complete', 'Analysis complete!', analysis);

            sendResponse({ success: true, analysis });

        } catch (error) {
            console.error('SEO Analysis failed:', error);
            this.isAnalyzing = false;
            this.broadcastStatus('error', error.message);
            sendResponse({ error: error.message });
        }
    }

    /**
     * Get current tab URL
     */
    async getCurrentTabUrl() {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                resolve(tabs[0]?.url);
            });
        });
    }

    /**
     * Get page data from content script
     */
    async getPageDataFromTab(tabId) {
        return new Promise((resolve) => {
            chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_DATA' }, (response) => {
                resolve(response?.pageData || null);
            });
        });
    }

    /**
     * Broadcast status updates to all listeners
     */
    broadcastStatus(status, message, data = null) {
        chrome.runtime.sendMessage({
            type: 'SEO_STATUS_UPDATE',
            status,
            message,
            data
        });

        // Update badge
        if (status === 'analyzing') {
            chrome.action.setBadgeText({ text: '...' });
            chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });
        } else if (status === 'complete' && data) {
            chrome.action.setBadgeText({ text: String(data.score) });
            const color = data.score >= 70 ? '#00FF00' : data.score >= 40 ? '#FFA500' : '#FF0000';
            chrome.action.setBadgeBackgroundColor({ color });
        } else if (status === 'error') {
            chrome.action.setBadgeText({ text: '!' });
            chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
        }
    }

    /**
     * Set up auto-analysis for page navigation
     */
    setupAutoAnalysis() {
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && this.autoAnalyze && !this.isAnalyzing) {
                // Auto-analyze after page load
                setTimeout(() => {
                    this.handleAnalyzeRequest(
                        { url: tab.url, options: { basic: true } },
                        { tab },
                        () => {}
                    );
                }, 1000);
            }
        });
    }

    /**
     * Export analysis report
     */
    async exportReport(format, sendResponse) {
        if (!this.currentAnalysis) {
            sendResponse({ error: 'No analysis to export' });
            return;
        }

        try {
            let content;
            let filename;
            let type;

            switch (format) {
                case 'json':
                    content = JSON.stringify(this.currentAnalysis, null, 2);
                    filename = 'seo-analysis.json';
                    type = 'application/json';
                    break;

                case 'html':
                    content = this.generateHTMLReport(this.currentAnalysis);
                    filename = 'seo-analysis.html';
                    type = 'text/html';
                    break;

                case 'csv':
                    content = this.generateCSVReport(this.currentAnalysis);
                    filename = 'seo-analysis.csv';
                    type = 'text/csv';
                    break;

                default:
                    content = this.generateTextReport(this.currentAnalysis);
                    filename = 'seo-analysis.txt';
                    type = 'text/plain';
            }

            // Create blob and download
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);

            chrome.downloads.download({
                url,
                filename,
                saveAs: true
            }, (downloadId) => {
                sendResponse({ success: true, downloadId });
            });

        } catch (error) {
            console.error('Export failed:', error);
            sendResponse({ error: error.message });
        }
    }

    /**
     * Generate HTML report
     */
    generateHTMLReport(analysis) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO Analysis Report - ${analysis.url}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        h1 {
            color: #667eea;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        h2 {
            color: #764ba2;
            margin-top: 30px;
        }
        .score {
            font-size: 48px;
            font-weight: bold;
            color: ${analysis.score >= 70 ? '#4CAF50' : analysis.score >= 40 ? '#FFA500' : '#F44336'};
        }
        .executive-summary {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .recommendations {
            background: #fff9c4;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin: 10px 0;
        }
        .metric {
            display: inline-block;
            margin: 10px;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #667eea;
            color: white;
        }
        .priority-critical { color: #d32f2f; font-weight: bold; }
        .priority-high { color: #f57c00; font-weight: bold; }
        .priority-medium { color: #388e3c; }
        .priority-low { color: #616161; }
    </style>
</head>
<body>
    <div class="container">
        <h1>SEO Analysis Report</h1>
        <p><strong>URL:</strong> ${analysis.url}</p>
        <p><strong>Analysis Date:</strong> ${analysis.timestamp}</p>

        <div class="executive-summary">
            <h2>Executive Summary</h2>
            <div class="score">${analysis.score}/100</div>
            <p><strong>Grade:</strong> ${analysis.executiveSummary?.overallGrade || 'N/A'}</p>
            <p>${analysis.executiveSummary?.summary || ''}</p>
        </div>

        <h2>Key Recommendations</h2>
        ${this.generateRecommendationsHTML(analysis.recommendations)}

        <h2>Technical SEO</h2>
        ${this.generateTechnicalHTML(analysis.technical)}

        <h2>Content Analysis</h2>
        ${this.generateContentHTML(analysis.content)}

        <h2>Keyword Analysis</h2>
        ${this.generateKeywordsHTML(analysis.keywords)}

        ${analysis.backlinks ? `
        <h2>Backlink Profile</h2>
        ${this.generateBacklinksHTML(analysis.backlinks)}
        ` : ''}

        ${analysis.local ? `
        <h2>Local SEO</h2>
        ${this.generateLocalHTML(analysis.local)}
        ` : ''}

        <h2>Predictions</h2>
        ${this.generatePredictionsHTML(analysis.predictions)}
    </div>
</body>
</html>`;
    }

    generateRecommendationsHTML(recommendations) {
        if (!recommendations || recommendations.length === 0) {
            return '<p>No recommendations available.</p>';
        }

        return recommendations.map(rec => `
            <div class="recommendations">
                <p class="priority-${rec.priority.toLowerCase()}">Priority: ${rec.priority}</p>
                <p><strong>${rec.issue}</strong></p>
                <p>${rec.solution}</p>
                <p><em>Expected Impact: ${rec.predictedImpact || 'N/A'}</em></p>
            </div>
        `).join('');
    }

    generateTechnicalHTML(technical) {
        if (!technical) return '<p>No technical analysis available.</p>';

        return `
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Status</th>
                </tr>
                <tr>
                    <td>Mobile Responsive</td>
                    <td>${technical.mobile?.isResponsive ? 'Yes' : 'No'}</td>
                    <td>${technical.mobile?.isResponsive ? '✅' : '❌'}</td>
                </tr>
                <tr>
                    <td>HTTPS</td>
                    <td>${technical.issues?.find(i => i.type === 'Security') ? 'No' : 'Yes'}</td>
                    <td>${technical.issues?.find(i => i.type === 'Security') ? '❌' : '✅'}</td>
                </tr>
                <tr>
                    <td>LCP</td>
                    <td>${technical.webVitals?.metrics?.lcp || 'N/A'}ms</td>
                    <td>${technical.webVitals?.scores?.lcp === 'good' ? '✅' : '⚠️'}</td>
                </tr>
                <tr>
                    <td>FID</td>
                    <td>${technical.webVitals?.metrics?.fid || 'N/A'}ms</td>
                    <td>${technical.webVitals?.scores?.fid === 'good' ? '✅' : '⚠️'}</td>
                </tr>
                <tr>
                    <td>CLS</td>
                    <td>${technical.webVitals?.metrics?.cls || 'N/A'}</td>
                    <td>${technical.webVitals?.scores?.cls === 'good' ? '✅' : '⚠️'}</td>
                </tr>
            </table>
        `;
    }

    generateContentHTML(content) {
        if (!content) return '<p>No content analysis available.</p>';

        return `
            <div class="metric">Word Count: ${content.wordCount}</div>
            <div class="metric">Readability: ${content.readability?.interpretation || 'N/A'}</div>
            <div class="metric">Grade Level: ${content.readability?.gradeLevel?.toFixed(1) || 'N/A'}</div>

            <h3>Meta Tags</h3>
            <table>
                <tr>
                    <th>Tag</th>
                    <th>Content</th>
                    <th>Status</th>
                </tr>
                <tr>
                    <td>Title</td>
                    <td>${content.metaTags?.title?.content || 'Missing'}</td>
                    <td>${content.metaTags?.title?.isOptimal ? '✅' : '⚠️'}</td>
                </tr>
                <tr>
                    <td>Description</td>
                    <td>${content.metaTags?.description?.content || 'Missing'}</td>
                    <td>${content.metaTags?.description?.isOptimal ? '✅' : '⚠️'}</td>
                </tr>
            </table>
        `;
    }

    generateKeywordsHTML(keywords) {
        if (!keywords) return '<p>No keyword analysis available.</p>';

        return `
            <h3>Top Keywords</h3>
            <table>
                <tr>
                    <th>Keyword</th>
                    <th>Count</th>
                    <th>Density</th>
                </tr>
                ${(keywords.currentKeywords || []).slice(0, 10).map(kw => `
                    <tr>
                        <td>${kw}</td>
                        <td>-</td>
                        <td>-</td>
                    </tr>
                `).join('')}
            </table>
        `;
    }

    generateBacklinksHTML(backlinks) {
        if (!backlinks) return '';

        return `
            <div class="metric">Total Backlinks: ${backlinks.total}</div>
            <div class="metric">High Quality: ${backlinks.quality?.high || 0}</div>
            <div class="metric">Toxic: ${backlinks.quality?.toxic || 0}</div>
        `;
    }

    generateLocalHTML(local) {
        if (!local) return '';

        return `
            <div class="metric">Local Schema: ${local.localSchema?.present ? 'Yes' : 'No'}</div>
            <div class="metric">NAP Consistency: ${local.napConsistency?.found ? 'Yes' : 'No'}</div>
            <div class="metric">Google Map: ${local.googleBusinessProfile?.hasMap ? 'Yes' : 'No'}</div>
        `;
    }

    generatePredictionsHTML(predictions) {
        if (!predictions) return '<p>No predictions available.</p>';

        return `
            <div class="metric">Ranking Potential: ${predictions.rankingPotential?.potential || 'N/A'}/100</div>
            <div class="metric">Time to Rank: ${predictions.timeToRank || 'N/A'}</div>
            <div class="metric">Confidence: ${predictions.confidence || 'N/A'}</div>
        `;
    }

    /**
     * Generate CSV report
     */
    generateCSVReport(analysis) {
        const rows = [
            ['SEO Analysis Report'],
            ['URL', analysis.url],
            ['Date', analysis.timestamp],
            ['Overall Score', analysis.score],
            [''],
            ['Metric', 'Value', 'Status'],
            ['Word Count', analysis.content?.wordCount || 'N/A', ''],
            ['Title Length', analysis.content?.metaTags?.title?.length || 'N/A', analysis.content?.metaTags?.title?.isOptimal ? 'Optimal' : 'Needs Work'],
            ['Mobile Responsive', analysis.technical?.mobile?.isResponsive ? 'Yes' : 'No', ''],
            ['HTTPS', analysis.technical?.issues?.find(i => i.type === 'Security') ? 'No' : 'Yes', '']
        ];

        // Add recommendations
        if (analysis.recommendations && analysis.recommendations.length > 0) {
            rows.push([''], ['Recommendations']);
            analysis.recommendations.forEach(rec => {
                rows.push([rec.priority, rec.issue, rec.solution]);
            });
        }

        return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    }

    /**
     * Generate text report
     */
    generateTextReport(analysis) {
        let report = `SEO ANALYSIS REPORT
==========================================
URL: ${analysis.url}
Date: ${analysis.timestamp}
Overall Score: ${analysis.score}/100
Grade: ${analysis.executiveSummary?.overallGrade || 'N/A'}

EXECUTIVE SUMMARY
-----------------
${analysis.executiveSummary?.summary || 'No summary available'}

KEY RECOMMENDATIONS
-------------------
`;

        if (analysis.recommendations) {
            analysis.recommendations.forEach(rec => {
                report += `\n[${rec.priority}] ${rec.issue}\n`;
                report += `Solution: ${rec.solution}\n`;
                report += `Expected Impact: ${rec.predictedImpact || 'N/A'}\n`;
            });
        }

        return report;
    }

    /**
     * Save settings
     */
    saveSettings() {
        chrome.storage.sync.set({
            seoSettings: {
                autoAnalyze: this.autoAnalyze,
                config: this.engine.config
            }
        });
    }
}

// Initialize SEO integration
const seoIntegration = new SEOIntegration();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SEOIntegration;
} else {
    window.SEOIntegration = SEOIntegration;
}