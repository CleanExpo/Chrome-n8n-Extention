/**
 * SEO Content Helper - Runs in page context to extract detailed SEO data
 * Provides real-time page analysis capabilities
 */

(function() {
    'use strict';

    class SEOContentHelper {
        constructor() {
            this.setupMessageListener();
            this.observer = null;
            this.lastAnalysis = null;
        }

        /**
         * Set up message listener for requests from extension
         */
        setupMessageListener() {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.type === 'GET_PAGE_DATA') {
                    const pageData = this.extractPageData();
                    sendResponse({ pageData });
                    return false;
                }

                if (request.type === 'START_MONITORING') {
                    this.startMonitoring();
                    sendResponse({ success: true });
                    return false;
                }

                if (request.type === 'STOP_MONITORING') {
                    this.stopMonitoring();
                    sendResponse({ success: true });
                    return false;
                }

                if (request.type === 'HIGHLIGHT_SEO_ISSUES') {
                    this.highlightSEOIssues();
                    sendResponse({ success: true });
                    return false;
                }

                if (request.type === 'CLEAR_HIGHLIGHTS') {
                    this.clearHighlights();
                    sendResponse({ success: true });
                    return false;
                }

                return false;
            });
        }

        /**
         * Extract comprehensive page data for SEO analysis
         */
        extractPageData() {
            const data = {
                url: window.location.href,
                title: document.title,
                meta: this.extractMetaTags(),
                headers: this.extractHeaders(),
                images: this.extractImages(),
                links: this.extractLinks(),
                scripts: this.extractScripts(),
                structuredData: this.extractStructuredData(),
                text: this.extractText(),
                performance: this.extractPerformance(),
                social: this.extractSocialSignals(),
                forms: this.extractForms(),
                videos: this.extractVideos(),
                accessibility: this.extractAccessibility()
            };

            this.lastAnalysis = data;
            return data;
        }

        /**
         * Extract meta tags
         */
        extractMetaTags() {
            const meta = {
                title: document.title,
                titleLength: document.title.length,
                description: '',
                keywords: '',
                robots: '',
                canonical: '',
                author: '',
                viewport: '',
                charset: document.characterSet,
                openGraph: {},
                twitter: {},
                other: {}
            };

            // Standard meta tags
            document.querySelectorAll('meta').forEach(tag => {
                const name = tag.getAttribute('name') || tag.getAttribute('property');
                const content = tag.getAttribute('content');

                if (!name || !content) return;

                // Standard tags
                if (name === 'description') meta.description = content;
                else if (name === 'keywords') meta.keywords = content;
                else if (name === 'robots') meta.robots = content;
                else if (name === 'author') meta.author = content;
                else if (name === 'viewport') meta.viewport = content;

                // Open Graph
                else if (name.startsWith('og:')) {
                    meta.openGraph[name.replace('og:', '')] = content;
                }

                // Twitter Card
                else if (name.startsWith('twitter:')) {
                    meta.twitter[name.replace('twitter:', '')] = content;
                }

                // Other
                else {
                    meta.other[name] = content;
                }
            });

            // Canonical link
            const canonical = document.querySelector('link[rel="canonical"]');
            if (canonical) {
                meta.canonical = canonical.href;
            }

            // Alternate languages
            meta.alternateLanguages = [];
            document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => {
                meta.alternateLanguages.push({
                    lang: link.hreflang,
                    url: link.href
                });
            });

            return meta;
        }

        /**
         * Extract headers with hierarchy
         */
        extractHeaders() {
            const headers = {
                h1: [],
                h2: [],
                h3: [],
                h4: [],
                h5: [],
                h6: [],
                structure: [],
                issues: []
            };

            let lastH1Index = -1;

            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
                document.querySelectorAll(tag).forEach((element, index) => {
                    const text = element.textContent.trim();
                    const level = parseInt(tag[1]);

                    headers[tag].push({
                        text,
                        length: text.length,
                        wordCount: text.split(/\s+/).length,
                        hasKeywords: false, // Will be analyzed later
                        position: this.getElementPosition(element)
                    });

                    headers.structure.push({
                        level,
                        tag,
                        text,
                        index
                    });

                    // Check for issues
                    if (tag === 'h1') {
                        lastH1Index = headers.structure.length - 1;
                    }

                    if (text.length > 70) {
                        headers.issues.push({
                            type: 'long_header',
                            tag,
                            text: text.substring(0, 50) + '...'
                        });
                    }

                    if (text.length < 10) {
                        headers.issues.push({
                            type: 'short_header',
                            tag,
                            text
                        });
                    }
                });
            });

            // Check hierarchy issues
            let previousLevel = 0;
            headers.structure.forEach(item => {
                if (item.level > previousLevel + 1) {
                    headers.issues.push({
                        type: 'skipped_level',
                        from: `h${previousLevel}`,
                        to: item.tag
                    });
                }
                previousLevel = item.level;
            });

            return headers;
        }

        /**
         * Extract images with SEO analysis
         */
        extractImages() {
            const images = [];

            document.querySelectorAll('img').forEach(img => {
                const imageData = {
                    src: img.src,
                    alt: img.alt,
                    title: img.title,
                    width: img.width || img.naturalWidth,
                    height: img.height || img.naturalHeight,
                    loading: img.loading,
                    decoding: img.decoding,
                    srcset: img.srcset,
                    sizes: img.sizes,
                    fileSize: null, // Would need server request
                    format: this.getImageFormat(img.src),
                    isAboveFold: this.isAboveFold(img),
                    issues: []
                };

                // Check for issues
                if (!img.alt) {
                    imageData.issues.push('missing_alt');
                } else if (img.alt.length > 125) {
                    imageData.issues.push('alt_too_long');
                }

                if (!img.width || !img.height) {
                    imageData.issues.push('missing_dimensions');
                }

                if (!img.loading && !imageData.isAboveFold) {
                    imageData.issues.push('no_lazy_loading');
                }

                if (imageData.format && !['webp', 'avif'].includes(imageData.format)) {
                    imageData.issues.push('not_optimized_format');
                }

                images.push(imageData);
            });

            return images;
        }

        /**
         * Extract links with classification
         */
        extractLinks() {
            const links = {
                internal: [],
                external: [],
                broken: [],
                nofollow: [],
                dofollow: [],
                total: 0,
                uniqueDomains: new Set()
            };

            const currentHost = window.location.hostname;

            document.querySelectorAll('a[href]').forEach(link => {
                const href = link.href;
                const text = link.textContent.trim();
                const rel = link.getAttribute('rel') || '';

                try {
                    const url = new URL(href);
                    const linkData = {
                        url: url.href,
                        text,
                        title: link.title,
                        rel,
                        target: link.target,
                        isNofollow: rel.includes('nofollow'),
                        isSponsored: rel.includes('sponsored'),
                        isUGC: rel.includes('ugc'),
                        isExternal: url.hostname !== currentHost,
                        anchor: link.id || '',
                        position: this.getElementPosition(link)
                    };

                    links.total++;

                    if (linkData.isExternal) {
                        links.external.push(linkData);
                        links.uniqueDomains.add(url.hostname);
                    } else {
                        links.internal.push(linkData);
                    }

                    if (linkData.isNofollow) {
                        links.nofollow.push(linkData);
                    } else {
                        links.dofollow.push(linkData);
                    }

                } catch (e) {
                    links.broken.push({
                        url: href,
                        text,
                        error: e.message
                    });
                }
            });

            links.uniqueDomains = Array.from(links.uniqueDomains);
            return links;
        }

        /**
         * Extract scripts
         */
        extractScripts() {
            const scripts = [];

            document.querySelectorAll('script').forEach(script => {
                scripts.push({
                    src: script.src || 'inline',
                    async: script.async,
                    defer: script.defer,
                    type: script.type || 'text/javascript',
                    module: script.type === 'module',
                    nomodule: script.hasAttribute('nomodule'),
                    isBlocking: !script.async && !script.defer && script.src,
                    size: script.src ? null : script.textContent.length,
                    position: script.src ? null : (document.head.contains(script) ? 'head' : 'body')
                });
            });

            return scripts;
        }

        /**
         * Extract structured data
         */
        extractStructuredData() {
            const structuredData = {
                jsonLd: [],
                microdata: [],
                rdfa: [],
                hasSchema: false,
                types: []
            };

            // JSON-LD
            document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
                try {
                    const data = JSON.parse(script.textContent);
                    structuredData.jsonLd.push(data);
                    structuredData.hasSchema = true;

                    // Extract types
                    if (data['@type']) {
                        if (Array.isArray(data['@type'])) {
                            structuredData.types.push(...data['@type']);
                        } else {
                            structuredData.types.push(data['@type']);
                        }
                    }
                } catch (e) {
                    console.warn('Invalid JSON-LD:', e);
                }
            });

            // Microdata
            const microdataItems = document.querySelectorAll('[itemscope]');
            if (microdataItems.length > 0) {
                structuredData.hasSchema = true;
                microdataItems.forEach(item => {
                    const itemData = {
                        type: item.getAttribute('itemtype'),
                        properties: {}
                    };

                    item.querySelectorAll('[itemprop]').forEach(prop => {
                        const name = prop.getAttribute('itemprop');
                        const content = prop.getAttribute('content') ||
                                       prop.textContent.trim() ||
                                       prop.getAttribute('href') ||
                                       prop.getAttribute('src');
                        itemData.properties[name] = content;
                    });

                    structuredData.microdata.push(itemData);
                    if (itemData.type) {
                        structuredData.types.push(itemData.type);
                    }
                });
            }

            // RDFa
            const rdfaItems = document.querySelectorAll('[typeof]');
            if (rdfaItems.length > 0) {
                structuredData.hasSchema = true;
                rdfaItems.forEach(item => {
                    structuredData.rdfa.push({
                        type: item.getAttribute('typeof'),
                        about: item.getAttribute('about')
                    });
                });
            }

            return structuredData;
        }

        /**
         * Extract text content
         */
        extractText() {
            // Clone body to avoid modifying the actual page
            const bodyClone = document.body.cloneNode(true);

            // Remove script and style elements
            bodyClone.querySelectorAll('script, style, noscript').forEach(el => el.remove());

            const text = bodyClone.textContent || '';
            const words = text.split(/\s+/).filter(word => word.length > 0);
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const paragraphs = document.querySelectorAll('p');

            return {
                content: text.substring(0, 10000), // Limit for performance
                wordCount: words.length,
                characterCount: text.length,
                sentenceCount: sentences.length,
                paragraphCount: paragraphs.length,
                averageWordLength: words.length > 0 ?
                    words.reduce((sum, word) => sum + word.length, 0) / words.length : 0,
                averageSentenceLength: sentences.length > 0 ?
                    words.length / sentences.length : 0,
                firstParagraph: paragraphs[0]?.textContent.trim() || ''
            };
        }

        /**
         * Extract performance metrics
         */
        extractPerformance() {
            const perf = {
                timing: {},
                resources: [],
                paint: {},
                navigation: {}
            };

            // Navigation timing
            if (performance.timing) {
                const timing = performance.timing;
                perf.timing = {
                    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                    loadComplete: timing.loadEventEnd - timing.navigationStart,
                    ttfb: timing.responseStart - timing.navigationStart,
                    domInteractive: timing.domInteractive - timing.navigationStart,
                    serverResponse: timing.responseEnd - timing.requestStart
                };
            }

            // Paint timing
            if (performance.getEntriesByType) {
                const paintEntries = performance.getEntriesByType('paint');
                paintEntries.forEach(entry => {
                    perf.paint[entry.name] = entry.startTime;
                });

                // Largest Contentful Paint
                const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
                if (lcpEntries.length > 0) {
                    perf.paint.lcp = lcpEntries[lcpEntries.length - 1].startTime;
                }
            }

            // Resource timing (top 10 slowest)
            if (performance.getEntriesByType) {
                const resources = performance.getEntriesByType('resource');
                perf.resources = resources
                    .sort((a, b) => b.duration - a.duration)
                    .slice(0, 10)
                    .map(r => ({
                        name: r.name.split('/').pop(),
                        type: r.initiatorType,
                        duration: Math.round(r.duration),
                        size: r.transferSize
                    }));
            }

            return perf;
        }

        /**
         * Extract social signals
         */
        extractSocialSignals() {
            const social = {
                shareButtons: [],
                embedWidgets: [],
                metaTags: {}
            };

            // Common share button patterns
            const sharePatterns = [
                'share', 'facebook', 'twitter', 'linkedin', 'pinterest',
                'reddit', 'whatsapp', 'telegram', 'email'
            ];

            sharePatterns.forEach(pattern => {
                const elements = document.querySelectorAll(
                    `[class*="${pattern}"], [id*="${pattern}"], [data-share="${pattern}"]`
                );
                if (elements.length > 0) {
                    social.shareButtons.push({
                        platform: pattern,
                        count: elements.length
                    });
                }
            });

            // Social embeds
            if (document.querySelector('iframe[src*="facebook.com"]')) {
                social.embedWidgets.push('facebook');
            }
            if (document.querySelector('iframe[src*="twitter.com"], iframe[src*="x.com"]')) {
                social.embedWidgets.push('twitter');
            }
            if (document.querySelector('iframe[src*="youtube.com"]')) {
                social.embedWidgets.push('youtube');
            }
            if (document.querySelector('iframe[src*="instagram.com"]')) {
                social.embedWidgets.push('instagram');
            }

            return social;
        }

        /**
         * Extract form information
         */
        extractForms() {
            const forms = [];

            document.querySelectorAll('form').forEach(form => {
                const formData = {
                    action: form.action,
                    method: form.method,
                    name: form.name,
                    id: form.id,
                    fields: [],
                    hasValidation: false,
                    hasHoneypot: false
                };

                // Extract fields
                form.querySelectorAll('input, textarea, select').forEach(field => {
                    const fieldData = {
                        type: field.type || field.tagName.toLowerCase(),
                        name: field.name,
                        required: field.required,
                        placeholder: field.placeholder,
                        label: this.findLabel(field)
                    };

                    formData.fields.push(fieldData);

                    // Check for validation
                    if (field.required || field.pattern) {
                        formData.hasValidation = true;
                    }

                    // Check for honeypot
                    if (field.style.display === 'none' || field.style.visibility === 'hidden') {
                        formData.hasHoneypot = true;
                    }
                });

                forms.push(formData);
            });

            return forms;
        }

        /**
         * Extract video information
         */
        extractVideos() {
            const videos = [];

            // HTML5 videos
            document.querySelectorAll('video').forEach(video => {
                videos.push({
                    type: 'html5',
                    src: video.src || video.querySelector('source')?.src,
                    poster: video.poster,
                    autoplay: video.autoplay,
                    muted: video.muted,
                    controls: video.controls,
                    width: video.width,
                    height: video.height
                });
            });

            // YouTube embeds
            document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').forEach(iframe => {
                videos.push({
                    type: 'youtube',
                    src: iframe.src,
                    width: iframe.width,
                    height: iframe.height
                });
            });

            // Vimeo embeds
            document.querySelectorAll('iframe[src*="vimeo.com"]').forEach(iframe => {
                videos.push({
                    type: 'vimeo',
                    src: iframe.src,
                    width: iframe.width,
                    height: iframe.height
                });
            });

            return videos;
        }

        /**
         * Extract accessibility information
         */
        extractAccessibility() {
            const a11y = {
                lang: document.documentElement.lang,
                hasSkipLinks: false,
                ariaLandmarks: [],
                headingStructure: true,
                imagesWithoutAlt: 0,
                linksWithoutText: 0,
                formsWithoutLabels: 0,
                contrastIssues: [],
                ariaAttributes: 0
            };

            // Skip links
            a11y.hasSkipLinks = !!document.querySelector('[href^="#"][class*="skip"], [href^="#main"]');

            // ARIA landmarks
            const landmarks = ['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'search'];
            landmarks.forEach(role => {
                const elements = document.querySelectorAll(`[role="${role}"]`);
                if (elements.length > 0) {
                    a11y.ariaLandmarks.push({
                        role,
                        count: elements.length
                    });
                }
            });

            // Images without alt
            a11y.imagesWithoutAlt = document.querySelectorAll('img:not([alt])').length;

            // Links without text
            document.querySelectorAll('a').forEach(link => {
                if (!link.textContent.trim() && !link.querySelector('img[alt]')) {
                    a11y.linksWithoutText++;
                }
            });

            // Forms without labels
            document.querySelectorAll('input, select, textarea').forEach(field => {
                if (!this.findLabel(field)) {
                    a11y.formsWithoutLabels++;
                }
            });

            // Count ARIA attributes
            a11y.ariaAttributes = document.querySelectorAll('[aria-label], [aria-describedby], [aria-labelledby]').length;

            return a11y;
        }

        /**
         * Helper: Get element position
         */
        getElementPosition(element) {
            const rect = element.getBoundingClientRect();
            return {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                visible: rect.top < window.innerHeight && rect.bottom > 0
            };
        }

        /**
         * Helper: Check if element is above the fold
         */
        isAboveFold(element) {
            const rect = element.getBoundingClientRect();
            return rect.top < window.innerHeight;
        }

        /**
         * Helper: Get image format from URL
         */
        getImageFormat(src) {
            const match = src.match(/\.(\w+)(\?|$)/);
            return match ? match[1].toLowerCase() : null;
        }

        /**
         * Helper: Find label for form field
         */
        findLabel(field) {
            // Check for associated label
            if (field.id) {
                const label = document.querySelector(`label[for="${field.id}"]`);
                if (label) return label.textContent.trim();
            }

            // Check for parent label
            const parentLabel = field.closest('label');
            if (parentLabel) {
                return parentLabel.textContent.trim();
            }

            // Check for aria-label
            return field.getAttribute('aria-label') || '';
        }

        /**
         * Start monitoring for SEO changes
         */
        startMonitoring() {
            if (this.observer) return;

            this.observer = new MutationObserver((mutations) => {
                // Debounce analysis
                clearTimeout(this.monitorTimeout);
                this.monitorTimeout = setTimeout(() => {
                    const newData = this.extractPageData();

                    // Compare with last analysis
                    if (this.lastAnalysis) {
                        const changes = this.compareAnalyses(this.lastAnalysis, newData);
                        if (changes.length > 0) {
                            chrome.runtime.sendMessage({
                                type: 'SEO_CHANGES_DETECTED',
                                changes,
                                newData
                            });
                        }
                    }

                    this.lastAnalysis = newData;
                }, 1000);
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['title', 'alt', 'href', 'src']
            });
        }

        /**
         * Stop monitoring
         */
        stopMonitoring() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        }

        /**
         * Compare two analyses for changes
         */
        compareAnalyses(oldData, newData) {
            const changes = [];

            // Title change
            if (oldData.title !== newData.title) {
                changes.push({
                    type: 'title',
                    old: oldData.title,
                    new: newData.title
                });
            }

            // Meta description change
            if (oldData.meta.description !== newData.meta.description) {
                changes.push({
                    type: 'meta_description',
                    old: oldData.meta.description,
                    new: newData.meta.description
                });
            }

            // H1 changes
            if (oldData.headers.h1.length !== newData.headers.h1.length) {
                changes.push({
                    type: 'h1_count',
                    old: oldData.headers.h1.length,
                    new: newData.headers.h1.length
                });
            }

            // Image changes
            if (oldData.images.length !== newData.images.length) {
                changes.push({
                    type: 'image_count',
                    old: oldData.images.length,
                    new: newData.images.length
                });
            }

            return changes;
        }

        /**
         * Highlight SEO issues on the page
         */
        highlightSEOIssues() {
            // Clear existing highlights
            this.clearHighlights();

            // Create styles
            const style = document.createElement('style');
            style.id = 'seo-highlight-styles';
            style.textContent = `
                .seo-issue-missing-alt {
                    border: 3px solid red !important;
                    position: relative;
                }
                .seo-issue-missing-alt::after {
                    content: 'Missing ALT text';
                    position: absolute;
                    top: 0;
                    left: 0;
                    background: red;
                    color: white;
                    padding: 2px 5px;
                    font-size: 12px;
                    z-index: 10000;
                }
                .seo-issue-no-h1 {
                    border-top: 5px solid orange !important;
                }
                .seo-issue-long-title {
                    background: yellow !important;
                    color: black !important;
                }
                .seo-issue-broken-link {
                    text-decoration: line-through !important;
                    color: red !important;
                }
                .seo-tooltip {
                    position: absolute;
                    background: black;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 3px;
                    font-size: 12px;
                    z-index: 10001;
                    pointer-events: none;
                }
            `;
            document.head.appendChild(style);

            // Highlight images without alt
            document.querySelectorAll('img:not([alt])').forEach(img => {
                img.classList.add('seo-issue-missing-alt');
            });

            // Highlight if no H1
            if (document.querySelectorAll('h1').length === 0) {
                document.body.classList.add('seo-issue-no-h1');
                this.showTooltip('No H1 tag found on this page', document.body);
            }

            // Highlight long titles
            document.querySelectorAll('h1, h2, h3').forEach(heading => {
                if (heading.textContent.length > 70) {
                    heading.classList.add('seo-issue-long-title');
                }
            });

            // Mark broken links (simplified check)
            document.querySelectorAll('a[href^="#"]').forEach(link => {
                const target = link.getAttribute('href');
                if (target !== '#' && !document.querySelector(target)) {
                    link.classList.add('seo-issue-broken-link');
                }
            });
        }

        /**
         * Clear all SEO highlights
         */
        clearHighlights() {
            // Remove style
            const style = document.getElementById('seo-highlight-styles');
            if (style) style.remove();

            // Remove classes
            document.querySelectorAll('[class*="seo-issue-"]').forEach(el => {
                el.className = el.className.replace(/seo-issue-[\w-]+/g, '').trim();
            });

            // Remove tooltips
            document.querySelectorAll('.seo-tooltip').forEach(el => el.remove());
        }

        /**
         * Show tooltip
         */
        showTooltip(message, element) {
            const tooltip = document.createElement('div');
            tooltip.className = 'seo-tooltip';
            tooltip.textContent = message;

            const rect = element.getBoundingClientRect();
            tooltip.style.top = `${rect.top - 30}px`;
            tooltip.style.left = `${rect.left}px`;

            document.body.appendChild(tooltip);

            setTimeout(() => tooltip.remove(), 5000);
        }
    }

    // Initialize the helper
    const seoHelper = new SEOContentHelper();

    // Expose to window for debugging
    window.__seoHelper = seoHelper;

})();