// --- src/app.js ---
import { Conversation } from '@11labs/client';
import SkeletonModel from './skeletonModel';
import MovementParser from './movementParser';

let conversation = null;
let skeletonModel = null;
let movementParser = null;
let lastTranscript = '';

// Initialize the 3D skeleton model when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const skeletonContainer = document.getElementById('skeletonContainer');
    if (skeletonContainer) {
        skeletonModel = new SkeletonModel(skeletonContainer);
        movementParser = new MovementParser();
    }
});

async function requestMicrophonePermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
    } catch (error) {
        console.error('Microphone permission denied:', error);
        return false;
    }
}

async function getSignedUrl() {
    try {
        const response = await fetch('/api/signed-url');
        if (!response.ok) throw new Error('Failed to get signed URL');
        const data = await response.json();
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting signed URL:', error);
        throw error;
    }
}

async function getAgentId() {
    const response = await fetch('/api/getAgentId');
    const { agentId } = await response.json();
    return agentId;
}

function updateStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.textContent = isConnected ? 'Connected' : 'Disconnected';
    statusElement.classList.toggle('connected', isConnected);
}

function updateSpeakingStatus(mode) {
    const statusElement = document.getElementById('speakingStatus');
    // Update based on the exact mode string we receive
    const isSpeaking = mode.mode === 'speaking';
    statusElement.textContent = isSpeaking ? 'Agent Speaking' : 'Agent Silent';
    statusElement.classList.toggle('speaking', isSpeaking);
    console.log('Speaking status updated:', { mode, isSpeaking }); // Debug log
}

// Process the user's voice command and update the skeleton model
async function processVoiceCommand(transcript) {
    if (!transcript || transcript === lastTranscript) return;
    
    lastTranscript = transcript;
    console.log('Processing voice command:', transcript);
    
    // Update the UI to show the last command
    const lastCommandElement = document.getElementById('lastCommand');
    if (lastCommandElement) {
        lastCommandElement.textContent = `Last command: "${transcript}"`;
    }
    
    try {
        // Send the command to the backend for processing
        const response = await fetch('/api/process-command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command: transcript }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to process command');
        }
        
        // Process the command locally using the movement parser
        if (movementParser && skeletonModel) {
            const movements = movementParser.parseCommand(transcript);
            
            if (movements.length > 0) {
                console.log('Parsed movements:', movements);
                
                // Apply each movement to the skeleton
                movements.forEach(movement => {
                    if (movement.type === 'reset') {
                        skeletonModel.reset();
                    } else if (movement.type === 'move') {
                        skeletonModel.moveJoint(movement.joint, movement.axis, movement.angle);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error processing voice command:', error);
    }
}

async function startConversation() {
    const startButton = document.getElementById('startButton');
    const endButton = document.getElementById('endButton');
    
    try {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert('Microphone permission is required for the conversation.');
            return;
        }

        const signedUrl = await getSignedUrl();
        //const agentId = await getAgentId(); // You can switch to agentID for public agents
        
        conversation = await Conversation.startSession({
            signedUrl: signedUrl,
            //agentId: agentId, // You can switch to agentID for public agents
            onConnect: () => {
                console.log('Connected');
                updateStatus(true);
                startButton.disabled = true;
                endButton.disabled = false;
            },
            onDisconnect: () => {
                console.log('Disconnected');
                updateStatus(false);
                startButton.disabled = false;
                endButton.disabled = true;
                updateSpeakingStatus({ mode: 'listening' }); // Reset to listening mode on disconnect
            },
            onError: (error) => {
                console.error('Conversation error:', error);
                alert('An error occurred during the conversation.');
            },
            onModeChange: (mode) => {
                console.log('Mode changed:', mode); // Debug log to see exact mode object
                updateSpeakingStatus(mode);
            },
            // Add transcript handler to process voice commands
            onTranscript: (transcript) => {
                console.log('Transcript received:', transcript);
                processVoiceCommand(transcript.text);
            }
        });
    } catch (error) {
        console.error('Error starting conversation:', error);
        alert('Failed to start conversation. Please try again.');
    }
}

async function endConversation() {
    if (conversation) {
        await conversation.endSession();
        conversation = null;
    }
}

// Clean up resources when the window is closed
window.addEventListener('beforeunload', () => {
    if (skeletonModel) {
        skeletonModel.dispose();
    }
    
    if (conversation) {
        conversation.endSession();
    }
});

document.getElementById('startButton').addEventListener('click', startConversation);
document.getElementById('endButton').addEventListener('click', endConversation);

window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});