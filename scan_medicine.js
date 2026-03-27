const SUPABASE_URL = "https://akubhszvwhfafwyhrvzt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdWJoc3p2d2hmYWZ3eWhydnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjQwNTMsImV4cCI6MjA5MDIwMDA1M30.Uxfzp8boA7uPSYL7M5rDyg5cwt8IChtqs_75iCDCJmM";

const videoElement = document.getElementById('camera-stream');
const canvasElement = document.getElementById('scan-canvas');
const fileInput = document.getElementById('file-input');

const btnCapture = document.getElementById('btn-capture');
const btnGallery = document.getElementById('btn-gallery');
const btnFlash = document.getElementById('btn-flash');

const resultCard = document.getElementById('result-card');
const scannerView = document.getElementById('scanner-view');
const scanLine = document.getElementById('scan-line');
const scanText = document.getElementById('scan-text');

let stream = null;
let flashOn = false;

// UI Elements for Results
const resName = document.getElementById('res-name');
const resUsage = document.getElementById('res-usage');
const resPurpose = document.getElementById('res-purpose');
const resWarning = document.getElementById('res-warning');
const warningBanner = document.getElementById('warning-banner');

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        videoElement.srcObject = stream;
    } catch (err) {
        console.error("Camera error:", err);
        scanText.innerText = "Camera not available. Please use Gallery.";
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

async function analyzeMedicine(base64Image) {
    // Show Scanning UI
    scanLine.classList.remove('hidden');
    scanLine.classList.add('animate-pulse');
    scanText.innerText = "AI analyzing medicine...";
    btnCapture.disabled = true;

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-medicine`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({ imageBase64: base64Image })
        });

        const data = await response.json();

        if (data.error || data.identified === false) {
            alert(data.error || "Could not identify the medicine. Please try a clearer image.");
            resetScanner();
            return;
        }

        displayResult(data);

    } catch (err) {
        console.error(err);
        alert("Failed to analyze medicine. Please try again.");
        resetScanner();
    }
}

function displayResult(data) {
    // Hide Scanner
    scannerView.classList.add('hidden');
    
    // Quick formatter for text lines into bullet points
    const formatText = (text) => {
        if (!text) return "Not Specified";
        return text.split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => `<span class="block mb-2">• ${line.replace(/\*\*/g, '').trim()}</span>`)
            .join("");
    };

    // Populate Data
    resName.innerText = data.name || "Unknown Medicine";
    resPurpose.innerHTML = formatText(data.purpose);
    resUsage.innerHTML = formatText(data.usage);

    if (data.warning) {
        warningBanner.classList.remove('hidden');
        resWarning.innerHTML = formatText(data.warning);
    } else {
        warningBanner.classList.add('hidden');
    }

    // Show Result Card
    resultCard.classList.remove('hidden');
}

function resetScanner() {
    scanLine.classList.add('hidden');
    scanLine.classList.remove('animate-pulse');
    scanText.innerText = "Center the medicine label within the frame";
    btnCapture.disabled = false;
    resultCard.classList.add('hidden');
    scannerView.classList.remove('hidden');
    startCamera();
}

// Event Listeners
btnCapture.addEventListener('click', () => {
    if (!stream) return;
    const canvas = canvasElement;
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    stopCamera();
    analyzeMedicine(base64Image);
});

btnGallery.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Image = event.target.result;
            stopCamera();
            analyzeMedicine(base64Image);
        };
        reader.readAsDataURL(file);
    }
});

btnFlash.addEventListener('click', async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
        await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
        flashOn = !flashOn;
        if (flashOn) {
            btnFlash.classList.add('text-primary');
        } else {
            btnFlash.classList.remove('text-primary');
        }
    } catch (err) {
        console.log("Flash not supported", err);
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    startCamera();
});
