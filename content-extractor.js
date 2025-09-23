// Content extraction utilities for various types of web content

class ContentExtractor {
    constructor() {
        this.extractors = {
            youtube: new YouTubeExtractor(),
            gmail: new GmailExtractor(),
            pdf: new PDFExtractor(),
            general: new GeneralExtractor()
        };
    }

    async extract(url = window.location.href) {
        // Determine which extractor to use
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return await this.extractors.youtube.extract();
        } else if (url.includes('mail.google.com')) {
            return await this.extractors.gmail.extract();
        } else if (url.endsWith('.pdf')) {
            return await this.extractors.pdf.extract();
        } else {
            return await this.extractors.general.extract();
        }
    }

    async extractSelection() {
        const selection = window.getSelection();
        if (!selection.toString()) {
            return null;
        }

        return {
            type: 'selection',
            text: selection.toString(),
            html: this.getSelectionHTML(selection),
            context: {
                url: window.location.href,
                title: document.title
            }
        };
    }

    getSelectionHTML(selection) {
        const range = selection.getRangeAt(0);
        const container = document.createElement('div');
        container.appendChild(range.cloneContents());
        return container.innerHTML;
    }
}

// YouTube content extractor
class YouTubeExtractor {
    async extract() {
        const data = {
            type: 'youtube',
            url: window.location.href,
            title: '',
            channel: '',
            description: '',
            transcript: [],
            comments: [],
            metadata: {}
        };

        // Get video title
        const titleElement = document.querySelector('h1.title, h1 yt-formatted-string');
        if (titleElement) {
            data.title = titleElement.textContent.trim();
        }

        // Get channel name
        const channelElement = document.querySelector('#channel-name a, #owner #text');
        if (channelElement) {
            data.channel = channelElement.textContent.trim();
        }

        // Get description
        const descElement = document.querySelector('#description, ytd-expander #content');
        if (descElement) {
            data.description = descElement.textContent.trim();
        }

        // Try to get transcript
        data.transcript = await this.extractTranscript();

        // Get top comments
        data.comments = this.extractComments();

        // Get metadata
        data.metadata = this.extractMetadata();

        return data;
    }

    async extractTranscript() {
        // Check if transcript button exists
        const transcriptBtn = document.querySelector('button[aria-label*="transcript"], button[aria-label*="Transcript"]');

        if (!transcriptBtn) {
            return [];
        }

        // Click transcript button
        transcriptBtn.click();

        // Wait for transcript to load
        await new Promise(resolve => setTimeout(resolve, 1000));

        const transcript = [];
        const transcriptElements = document.querySelectorAll('ytd-transcript-segment-renderer');

        transcriptElements.forEach(element => {
            const time = element.querySelector('.segment-timestamp')?.textContent.trim();
            const text = element.querySelector('.segment-text')?.textContent.trim();

            if (time && text) {
                transcript.push({ time, text });
            }
        });

        return transcript;
    }

    extractComments() {
        const comments = [];
        const commentElements = document.querySelectorAll('ytd-comment-thread-renderer');

        commentElements.forEach((element, index) => {
            if (index >= 10) return; // Limit to top 10 comments

            const author = element.querySelector('#author-text')?.textContent.trim();
            const text = element.querySelector('#content-text')?.textContent.trim();
            const likes = element.querySelector('#vote-count-middle')?.textContent.trim();

            if (author && text) {
                comments.push({ author, text, likes });
            }
        });

        return comments;
    }

    extractMetadata() {
        const metadata = {};

        // Views
        const viewsElement = document.querySelector('.view-count, ytd-video-view-count-renderer');
        if (viewsElement) {
            metadata.views = viewsElement.textContent.trim();
        }

        // Likes
        const likesElement = document.querySelector('ytd-toggle-button-renderer #text[aria-label*="like"]');
        if (likesElement) {
            metadata.likes = likesElement.textContent.trim();
        }

        // Duration
        const durationElement = document.querySelector('.ytp-time-duration');
        if (durationElement) {
            metadata.duration = durationElement.textContent.trim();
        }

        // Upload date
        const dateElement = document.querySelector('#info-strings yt-formatted-string');
        if (dateElement) {
            metadata.uploadDate = dateElement.textContent.trim();
        }

        return metadata;
    }
}

// Gmail content extractor
class GmailExtractor {
    extract() {
        const data = {
            type: 'gmail',
            emails: [],
            currentEmail: null
        };

        // Check if an email is open
        const emailContainer = document.querySelector('[role="main"] [role="article"]');
        if (emailContainer) {
            data.currentEmail = this.extractEmail(emailContainer);
        }

        // Get list of visible emails
        const emailListItems = document.querySelectorAll('[role="main"] [role="row"]');
        emailListItems.forEach((item, index) => {
            if (index >= 20) return; // Limit to 20 emails

            const email = this.extractEmailPreview(item);
            if (email) {
                data.emails.push(email);
            }
        });

        return data;
    }

    extractEmail(container) {
        const email = {
            subject: '',
            from: '',
            to: '',
            date: '',
            body: '',
            attachments: []
        };

        // Subject
        const subjectElement = container.querySelector('h2');
        if (subjectElement) {
            email.subject = subjectElement.textContent.trim();
        }

        // From
        const fromElement = container.querySelector('[email]');
        if (fromElement) {
            email.from = fromElement.getAttribute('email');
        }

        // Date
        const dateElement = container.querySelector('[title*="20"]');
        if (dateElement) {
            email.date = dateElement.getAttribute('title');
        }

        // Body
        const bodyElement = container.querySelector('[dir="ltr"]');
        if (bodyElement) {
            email.body = bodyElement.textContent.trim();
        }

        // Attachments
        const attachmentElements = container.querySelectorAll('[role="button"][aria-label*="Download"]');
        attachmentElements.forEach(attachment => {
            const name = attachment.textContent.trim();
            if (name) {
                email.attachments.push(name);
            }
        });

        return email;
    }

    extractEmailPreview(item) {
        const preview = {
            from: '',
            subject: '',
            snippet: '',
            date: '',
            unread: false
        };

        // From
        const fromElement = item.querySelector('[email]');
        if (fromElement) {
            preview.from = fromElement.textContent.trim();
        }

        // Subject and snippet
        const textElements = item.querySelectorAll('span[id^=":"]');
        if (textElements.length >= 2) {
            preview.subject = textElements[0].textContent.trim();
            preview.snippet = textElements[1].textContent.trim();
        }

        // Date
        const dateElement = item.querySelector('[title*="20"], [title*="19"]');
        if (dateElement) {
            preview.date = dateElement.getAttribute('title');
        }

        // Check if unread
        preview.unread = item.querySelector('[aria-label*="unread"]') !== null;

        return preview.from || preview.subject ? preview : null;
    }
}

// PDF content extractor
class PDFExtractor {
    async extract() {
        const data = {
            type: 'pdf',
            url: window.location.href,
            title: document.title,
            text: '',
            pages: 0
        };

        // Check if PDF.js viewer is present
        const pdfViewer = document.querySelector('#viewer');
        if (pdfViewer) {
            // Extract text from PDF.js viewer
            const textLayers = document.querySelectorAll('.textLayer');
            textLayers.forEach(layer => {
                data.text += layer.textContent + '\n';
            });
            data.pages = textLayers.length;
        } else {
            // Try to extract from embedded PDF
            const embed = document.querySelector('embed[type="application/pdf"]');
            if (embed) {
                data.text = 'PDF detected but text extraction requires PDF.js viewer';
            }
        }

        return data;
    }
}

// General content extractor
class GeneralExtractor {
    extract() {
        const data = {
            type: 'general',
            url: window.location.href,
            title: document.title,
            description: '',
            headers: [],
            paragraphs: [],
            links: [],
            images: [],
            forms: [],
            tables: [],
            metadata: {}
        };

        // Get meta description
        const metaDesc = document.querySelector('meta[name="description"], meta[property="og:description"]');
        if (metaDesc) {
            data.description = metaDesc.getAttribute('content');
        }

        // Get headers
        document.querySelectorAll('h1, h2, h3').forEach((header, index) => {
            if (index < 20) {
                data.headers.push({
                    level: header.tagName,
                    text: header.textContent.trim()
                });
            }
        });

        // Get paragraphs
        document.querySelectorAll('p').forEach((p, index) => {
            if (index < 20 && p.textContent.length > 50) {
                data.paragraphs.push(p.textContent.trim());
            }
        });

        // Get links
        document.querySelectorAll('a[href]').forEach((link, index) => {
            if (index < 30) {
                data.links.push({
                    text: link.textContent.trim(),
                    href: link.href
                });
            }
        });

        // Get images
        document.querySelectorAll('img[src]').forEach((img, index) => {
            if (index < 20) {
                data.images.push({
                    src: img.src,
                    alt: img.alt,
                    title: img.title
                });
            }
        });

        // Detect forms
        data.forms = this.extractForms();

        // Extract tables
        data.tables = this.extractTables();

        // Get metadata
        data.metadata = this.extractMetadata();

        return data;
    }

    extractForms() {
        const forms = [];
        document.querySelectorAll('form').forEach((form, index) => {
            const formData = {
                index: index,
                action: form.action,
                method: form.method,
                fields: []
            };

            form.querySelectorAll('input, select, textarea').forEach(field => {
                formData.fields.push({
                    type: field.type || field.tagName.toLowerCase(),
                    name: field.name,
                    id: field.id,
                    placeholder: field.placeholder,
                    required: field.required,
                    value: field.value
                });
            });

            forms.push(formData);
        });
        return forms;
    }

    extractTables() {
        const tables = [];
        document.querySelectorAll('table').forEach((table, index) => {
            if (index >= 5) return; // Limit to 5 tables

            const tableData = {
                headers: [],
                rows: []
            };

            // Get headers
            table.querySelectorAll('th').forEach(th => {
                tableData.headers.push(th.textContent.trim());
            });

            // Get rows
            table.querySelectorAll('tbody tr').forEach((tr, rowIndex) => {
                if (rowIndex >= 20) return; // Limit rows

                const row = [];
                tr.querySelectorAll('td').forEach(td => {
                    row.push(td.textContent.trim());
                });
                if (row.length > 0) {
                    tableData.rows.push(row);
                }
            });

            if (tableData.headers.length > 0 || tableData.rows.length > 0) {
                tables.push(tableData);
            }
        });
        return tables;
    }

    extractMetadata() {
        const metadata = {};

        // Open Graph data
        document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
            const property = meta.getAttribute('property').replace('og:', '');
            metadata[property] = meta.getAttribute('content');
        });

        // Twitter Card data
        document.querySelectorAll('meta[name^="twitter:"]').forEach(meta => {
            const name = meta.getAttribute('name').replace('twitter:', '');
            metadata[name] = meta.getAttribute('content');
        });

        // JSON-LD data
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
            try {
                metadata.structuredData = JSON.parse(jsonLd.textContent);
            } catch (e) {
                // Invalid JSON
            }
        }

        return metadata;
    }
}

// Auto-form filler
class FormAutoFiller {
    constructor() {
        this.userData = {};
        this.loadUserData();
    }

    async loadUserData() {
        const data = await chrome.storage.sync.get('userFormData');
        this.userData = data.userFormData || {};
    }

    async saveUserData(data) {
        Object.assign(this.userData, data);
        await chrome.storage.sync.set({ userFormData: this.userData });
    }

    autoFill(formIndex = 0) {
        const forms = document.querySelectorAll('form');
        if (!forms[formIndex]) return false;

        const form = forms[formIndex];
        let filled = 0;

        form.querySelectorAll('input, select, textarea').forEach(field => {
            const value = this.getValueForField(field);
            if (value) {
                field.value = value;
                field.dispatchEvent(new Event('change', { bubbles: true }));
                filled++;
            }
        });

        return filled > 0;
    }

    getValueForField(field) {
        const name = field.name?.toLowerCase() || '';
        const id = field.id?.toLowerCase() || '';
        const placeholder = field.placeholder?.toLowerCase() || '';
        const type = field.type?.toLowerCase() || '';

        // Check for common field patterns
        if (name.includes('email') || id.includes('email') || type === 'email') {
            return this.userData.email;
        }
        if (name.includes('name') || id.includes('name')) {
            if (name.includes('first') || id.includes('first')) {
                return this.userData.firstName;
            }
            if (name.includes('last') || id.includes('last')) {
                return this.userData.lastName;
            }
            return this.userData.fullName;
        }
        if (name.includes('phone') || id.includes('phone') || type === 'tel') {
            return this.userData.phone;
        }
        if (name.includes('address') || id.includes('address')) {
            return this.userData.address;
        }
        if (name.includes('city') || id.includes('city')) {
            return this.userData.city;
        }
        if (name.includes('zip') || id.includes('zip') || name.includes('postal')) {
            return this.userData.zipCode;
        }
        if (name.includes('country') || id.includes('country')) {
            return this.userData.country;
        }

        return null;
    }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ContentExtractor,
        FormAutoFiller
    };
}