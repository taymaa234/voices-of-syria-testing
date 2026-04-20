// src/api/transcriptionService.js
import axios from 'axios';
import { TRANSCRIPTION_BASE_URL } from './config';

// Create a separate client for the transcription service
const transcriptionClient = axios.create({
  baseURL: TRANSCRIPTION_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'multipart/form-data',
  },
  timeout: 600000, // 10 minutes timeout for transcription
});

/**
 * Transcribe an audio file
 * @param {File} audioFile - The audio file to transcribe
 * @param {string} language - Optional language code (e.g., 'ar' for Arabic)
 * @param {string} quality - Optional quality setting ('fast', 'balanced', 'high')
 * @returns {Promise<{success: boolean, transcript?: string, language?: string, duration?: number, processing_time?: number, error?: string}>}
 */
export const transcribeAudio = async (audioFile, language = null, quality = 'balanced') => {
  try {
    const formData = new FormData();
    formData.append('file', audioFile);

    if (language) {
      formData.append('language', language);
    }
    
    if (quality) {
      formData.append('quality', quality);
    }

    const response = await transcriptionClient.post('/transcribe', formData, {
      timeout: 900000 // 15 minutes timeout specifically for this request
    });

    if (response.data.success) {
      return {
        success: true,
        transcript: response.data.transcript,
        language: response.data.language,
        duration: response.data.duration,
        processing_time: response.data.processing_time,
        confidence: response.data.confidence,
        segments: response.data.segments,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Transcription failed',
      };
    }
  } catch (error) {
    console.error('Transcription service error:', error);

    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
      return {
        success: false,
        error: errorMessage,
      };
    } else if (error.request) {
      // Network error
      return {
        success: false,
        error: 'Unable to connect to transcription service. Please check if the service is running.',
      };
    } else {
      // Other error
      return {
        success: false,
        error: error.message || 'Unknown transcription error',
      };
    }
  }
};

/**
 * Check transcription service health
 * @returns {Promise<{status: string, model?: string, model_loaded?: boolean, supported_formats?: string[], error?: string}>}
 */
export const checkTranscriptionHealth = async () => {
  try {
    const response = await transcriptionClient.get('/health');
    return {
      status: response.data.status,
      model: response.data.model,
      model_loaded: response.data.model_loaded,
      supported_formats: response.data.supported_formats,
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      status: 'error',
      error: 'Unable to connect to transcription service',
    };
  }
};

export default {
  transcribeAudio,
  checkTranscriptionHealth,
};

export const getTranscriptFromBackend = async (storyId, token) => {
  try {
    const response = await axios.post(
      `/api/transcription/story/${storyId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, transcript: response.data.transcript };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Check transcription status for a story
 * Returns { status: "done"|"pending"|"not_found", transcript?, language? }
 */
export const getTranscriptionStatus = async (storyId) => {
  try {
    const response = await axios.get(
      `http://localhost:8080/api/transcription/story/${storyId}/status`
    );
    return response.data;
  } catch (error) {
    return { status: 'error', error: error.message };
  }
};
