
import React, { useState, useRef, useCallback } from 'react';
import { BackendService } from '../services/backendService';

export const AudioTranscription: React.FC = () => {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [transcription, setTranscription] = useState<string>('');
    const [error, setError] = useState<string>('');

    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (transcriptionIntervalRef.current) {
            clearInterval(transcriptionIntervalRef.current);
            transcriptionIntervalRef.current = null;
        }
        setIsRecording(false);
    }, []);
    const handleAudioDataAvailable = useCallback((event: BlobEvent) => {
        if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
        }
    }, []);

    const processAudioChunks = useCallback(async () => {
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = []; // Clear chunks

        try {
            // Convert blob to file for upload
            const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

            // Upload the audio file first
            const uploadResponse = await BackendService.uploadFile(audioFile);
            
            // Then transcribe using the uploaded file URL
            const transcriptResponse = await BackendService.transcribeAudio(uploadResponse.url);
            
            if (transcriptResponse.trim()) {
                setTranscription(prev => prev + ' ' + transcriptResponse);
            }
        } catch (error) {
            console.error('Transcription error:', error);
            setError('Gagal mentranskrip audio');
        }
    }, []);
    
    const startRecording = async () => {
        if (isRecording) return;
        setIsRecording(true);
        setError('');
        setTranscription('');
        audioChunksRef.current = [];
    
        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true 
                } 
            });

            mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current.addEventListener('dataavailable', handleAudioDataAvailable);
            
            mediaRecorderRef.current.addEventListener('stop', () => {
                processAudioChunks();
            });

            // Start recording and set up interval for periodic transcription
            mediaRecorderRef.current.start(1000); // Collect data every 1 second

            // Process audio chunks every 3 seconds
            transcriptionIntervalRef.current = setInterval(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.requestData();
                }
            }, 3000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memulai rekaman.');
            console.error(err);
            stopRecording();
        }
    };
    

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-4 text-indigo-400">Transkripsi Audio Real-time</h2>
            <p className="text-gray-400 mb-6">Klik "Mulai Merekam" dan berbicaralah ke mikrofon Anda. Kata-kata Anda akan ditranskripsi secara langsung.</p>

            <div className="flex justify-center mb-6">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-8 py-4 text-white font-bold rounded-full transition-all duration-300 flex items-center gap-3 text-lg shadow-lg
                    ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-white'}`}></div>
                    {isRecording ? 'Hentikan Merekam' : 'Mulai Merekam'}
                </button>
            </div>

            <div className="flex-grow bg-gray-900/50 rounded-lg border border-gray-700 p-4 overflow-y-auto">
                <p className="text-gray-200 whitespace-pre-wrap min-h-[10rem]">
                    {transcription || <span className="text-gray-500">Menunggu audio...</span>}
                </p>
            </div>

            {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
        </div>
    );
};
