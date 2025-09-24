/**
 * Google Cloud Speech-to-Text and Text-to-Speech Client
 * Voice processing capabilities for the Chrome extension
 */

class GoogleSpeechClient {
    constructor(config) {
        this.projectId = config.projectId;
        this.credentials = config.credentials;
        this.speechToTextUrl = 'https://speech.googleapis.com/v1';
        this.textToSpeechUrl = 'https://texttospeech.googleapis.com/v1';
        this.authManager = config.authManager || window.googleAuthManager;
    }

    /**
     * Speech-to-Text: Convert audio to text
     */
    async speechToText(audioData, options = {}) {
        try {
            const endpoint = `${this.speechToTextUrl}/speech:recognize`;

            const requestBody = {
                config: {
                    encoding: options.encoding || 'WEBM_OPUS',
                    sampleRateHertz: options.sampleRate || 48000,
                    languageCode: options.languageCode || 'en-US',
                    alternativeLanguageCodes: options.alternativeLanguages || [],
                    maxAlternatives: options.maxAlternatives || 1,
                    profanityFilter: options.profanityFilter || false,
                    enableWordTimeOffsets: options.enableWordTimeOffsets || false,
                    enableWordConfidence: options.enableWordConfidence || false,
                    enableAutomaticPunctuation: options.enableAutomaticPunctuation || true,
                    enableSpokenPunctuation: options.enableSpokenPunctuation || false,
                    enableSpokenEmojis: options.enableSpokenEmojis || false,
                    audioChannelCount: options.audioChannelCount || 1,
                    model: options.model || 'latest_long',
                    useEnhanced: options.useEnhanced || true
                },
                audio: {
                    content: audioData // Base64 encoded audio data
                }
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                results: response.results.map(result => ({
                    alternatives: result.alternatives.map(alt => ({
                        transcript: alt.transcript,
                        confidence: alt.confidence,
                        words: alt.words || []
                    })),
                    channelTag: result.channelTag,
                    resultEndTime: result.resultEndTime,
                    languageCode: result.languageCode
                }))
            };
        } catch (error) {
            console.error('Speech-to-text failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Long running speech recognition for audio files
     */
    async longRunningSpeechToText(audioUri, options = {}) {
        try {
            const endpoint = `${this.speechToTextUrl}/speech:longrunningrecognize`;

            const requestBody = {
                config: {
                    encoding: options.encoding || 'FLAC',
                    sampleRateHertz: options.sampleRate || 44100,
                    languageCode: options.languageCode || 'en-US',
                    alternativeLanguageCodes: options.alternativeLanguages || [],
                    maxAlternatives: options.maxAlternatives || 1,
                    profanityFilter: options.profanityFilter || false,
                    enableWordTimeOffsets: options.enableWordTimeOffsets || true,
                    enableWordConfidence: options.enableWordConfidence || true,
                    enableAutomaticPunctuation: options.enableAutomaticPunctuation || true,
                    enableSeparateRecognitionPerChannel: options.enableSeparateRecognitionPerChannel || false,
                    audioChannelCount: options.audioChannelCount || 1,
                    model: options.model || 'latest_long',
                    useEnhanced: options.useEnhanced || true
                },
                audio: {
                    uri: audioUri // GCS URI
                }
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                operation: response.name,
                operationDetails: response
            };
        } catch (error) {
            console.error('Long running speech-to-text failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Text-to-Speech: Convert text to audio
     */
    async textToSpeech(text, options = {}) {
        try {
            const endpoint = `${this.textToSpeechUrl}/text:synthesize`;

            const requestBody = {
                input: options.ssml ? { ssml: text } : { text: text },
                voice: {
                    languageCode: options.languageCode || 'en-US',
                    name: options.voiceName || null,
                    ssmlGender: options.ssmlGender || 'NEUTRAL'
                },
                audioConfig: {
                    audioEncoding: options.audioEncoding || 'MP3',
                    speakingRate: options.speakingRate || 1.0,
                    pitch: options.pitch || 0.0,
                    volumeGainDb: options.volumeGainDb || 0.0,
                    sampleRateHertz: options.sampleRateHertz || null,
                    effectsProfileId: options.effectsProfileId || []
                }
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                audioContent: response.audioContent, // Base64 encoded audio
                audioConfig: response.audioConfig
            };
        } catch (error) {
            console.error('Text-to-speech failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get available voices
     */
    async getVoices(languageCode = null) {
        try {
            let endpoint = `${this.textToSpeechUrl}/voices`;

            if (languageCode) {
                endpoint += `?languageCode=${languageCode}`;
            }

            const response = await this.makeRequest(endpoint, {
                method: 'GET'
            });

            return {
                success: true,
                voices: response.voices.map(voice => ({
                    languageCodes: voice.languageCodes,
                    name: voice.name,
                    ssmlGender: voice.ssmlGender,
                    naturalSampleRateHertz: voice.naturalSampleRateHertz
                }))
            };
        } catch (error) {
            console.error('Failed to get voices:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Streaming speech recognition
     */
    createStreamingRecognition(options = {}) {
        try {
            const config = {
                encoding: options.encoding || 'WEBM_OPUS',
                sampleRateHertz: options.sampleRate || 48000,
                languageCode: options.languageCode || 'en-US',
                maxAlternatives: options.maxAlternatives || 1,
                profanityFilter: options.profanityFilter || false,
                enableWordTimeOffsets: options.enableWordTimeOffsets || false,
                enableWordConfidence: options.enableWordConfidence || false,
                enableAutomaticPunctuation: options.enableAutomaticPunctuation || true,
                enableSpokenPunctuation: options.enableSpokenPunctuation || false,
                enableSpokenEmojis: options.enableSpokenEmojis || false,
                model: options.model || 'latest_short',
                useEnhanced: options.useEnhanced || true,
                singleUtterance: options.singleUtterance || false,
                interimResults: options.interimResults || true
            };

            return new GoogleSpeechStream(this, config);
        } catch (error) {
            console.error('Failed to create streaming recognition:', error);
            throw error;
        }
    }

    /**
     * Record audio from microphone
     */
    async startMicrophoneRecording(onData, options = {}) {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('MediaDevices API not supported');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: options.sampleRate || 48000,
                    channelCount: options.channelCount || 1,
                    echoCancellation: options.echoCancellation !== false,
                    noiseSuppression: options.noiseSuppression !== false,
                    autoGainControl: options.autoGainControl !== false
                }
            });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: options.mimeType || 'audio/webm;codecs=opus'
            });

            const audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                    if (onData && typeof onData === 'function') {
                        onData(event.data);
                    }
                }
            };

            mediaRecorder.start(options.timeslice || 1000); // Record in 1-second chunks

            return {
                mediaRecorder,
                stream,
                stop: () => {
                    mediaRecorder.stop();
                    stream.getTracks().forEach(track => track.stop());
                    return audioChunks;
                }
            };
        } catch (error) {
            console.error('Microphone recording failed:', error);
            throw error;
        }
    }

    /**
     * Convert audio blob to base64
     */
    async audioToBase64(audioBlob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });
    }

    /**
     * Play audio from base64
     */
    async playAudio(base64Audio, mimeType = 'audio/mp3') {
        try {
            const audioBlob = new Blob([Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))], {
                type: mimeType
            });

            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            return new Promise((resolve, reject) => {
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                audio.onerror = reject;
                audio.play().catch(reject);
            });
        } catch (error) {
            console.error('Audio playback failed:', error);
            throw error;
        }
    }

    /**
     * Make authenticated request
     */
    async makeRequest(url, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...await this.authManager.getAuthHeaders()
            };

            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Speech API request failed:', error);
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const voicesResult = await this.getVoices();

            if (voicesResult.success) {
                return {
                    status: 'healthy',
                    service: 'Speech Services',
                    availableVoices: voicesResult.voices.length,
                    message: 'Service operational'
                };
            } else {
                return {
                    status: 'error',
                    service: 'Speech Services',
                    message: voicesResult.error
                };
            }
        } catch (error) {
            return {
                status: 'error',
                service: 'Speech Services',
                message: error.message
            };
        }
    }
}

/**
 * Streaming Speech Recognition Class
 */
class GoogleSpeechStream {
    constructor(speechClient, config) {
        this.speechClient = speechClient;
        this.config = config;
        this.websocket = null;
        this.isStreaming = false;
    }

    async start() {
        // Note: WebSocket streaming would require a proper WebSocket endpoint
        // This is a simplified implementation for demonstration
        console.log('Streaming speech recognition started with config:', this.config);
        this.isStreaming = true;
    }

    send(audioData) {
        if (!this.isStreaming) {
            throw new Error('Stream not started');
        }
        // Send audio data to streaming endpoint
        console.log('Sending audio data to stream');
    }

    stop() {
        this.isStreaming = false;
        console.log('Streaming speech recognition stopped');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GoogleSpeechClient, GoogleSpeechStream };
} else {
    window.GoogleSpeechClient = GoogleSpeechClient;
    window.GoogleSpeechStream = GoogleSpeechStream;
}