// Sahaya medicine scanner. This page is intentionally public (no login needed)
// and touches no user data — it only posts an image to the analysis function.

const U = window.SAHAYA_UTIL;
const I18N = window.SAHAYA_I18N;
const Voice = window.SAHAYA_VOICE;
const t = I18N ? I18N.t.bind(I18N) : (k) => k;
const cfg = window.SAHAYA_BACKEND.medicine;
const scanRateLimiter = new U.RateLimiter(5, 60000); // max 5 scans per minute

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

    // Result elements
    const resName = document.getElementById('res-name');
    const resUsage = document.getElementById('res-usage');
    const resPurpose = document.getElementById('res-purpose');
    const resWarning = document.getElementById('res-warning');
    const warningBanner = document.getElementById('warning-banner');

    let stream = null;
    let flashOn = false;

    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            videoElement.srcObject = stream;
            scanText.innerText = t('scan_instruction');
        } catch (err) {
            console.error("Camera error:", err);
            if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
                scanText.innerText = t('scan_cam_denied');
            } else {
                scanText.innerText = t('scan_cam_error');
            }
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    }

    async function analyzeMedicine(base64Image) {
        if (!scanRateLimiter.check()) {
            var waitSec = scanRateLimiter.getWaitSeconds();
            U.toast('Please wait ' + waitSec + ' seconds before scanning again.', 'info');
            return;
        }

        // Show Scanning UI
        scanLine.classList.remove('hidden');
        scanLine.classList.add('animate-pulse');
        scanText.innerText = t('scan_analyzing');
        btnCapture.disabled = true;

        try {
            const data = await U.fetchJson(cfg.base + cfg.analyzePath, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cfg.anonKey}`
                },
                body: JSON.stringify({ imageBase64: base64Image })
            }, cfg.timeoutMs);

            if (data.error || data.identified === false) {
                U.toast(data.error || t('scan_not_found'), 'error');
                resetScanner();
                return;
            }

            displayResult(data);

        } catch (err) {
            console.error(err);
            U.toast(err.message || t('error_generic'), 'error');
            resetScanner();
        }
    }

    function displayResult(data) {
        // Hide Scanner
        scannerView.classList.add('hidden');

        // Formatter that ESCAPES each line before wrapping it in markup.
        const formatText = (text) => {
            if (!text) return "<span class=\"block\">Not specified</span>";
            return String(text).split('\n')
                .filter(line => line.trim().length > 0)
                .map(line => `<span class="block mb-2">• ${U.escapeHtml(line.replace(/\*\*/g, '').trim())}</span>`)
                .join("");
        };

        resName.textContent = data.name || "Unknown Medicine";
        resPurpose.innerHTML = formatText(data.purpose);
        resUsage.innerHTML = formatText(data.usage);

        if (data.warning) {
            warningBanner.classList.remove('hidden');
            resWarning.innerHTML = formatText(data.warning);
        } else {
            warningBanner.classList.add('hidden');
        }

        resultCard.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (Voice) {
             Voice.greet('scan_voice_greeting');
        }
    }

    function resetScanner() {
        scanLine.classList.add('hidden');
        scanLine.classList.remove('animate-pulse');
        scanText.innerText = t('scan_instruction');
        btnCapture.disabled = false;
        fileInput.value = ''; // allow re-picking the same gallery image
        resultCard.classList.add('hidden');
        scannerView.classList.remove('hidden');
        startCamera();
    }

    btnCapture.addEventListener('click', () => {
        if (!stream) { startCamera(); return; }
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        const ctx = canvasElement.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        const base64Image = canvasElement.toDataURL('image/jpeg', 0.8);
        stopCamera();
        analyzeMedicine(base64Image);
    });

    btnGallery.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onerror = () => U.toast(t('error_generic'), 'error');
            reader.onload = (event) => {
                stopCamera();
                analyzeMedicine(event.target.result);
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
            btnFlash.classList.toggle('text-primary', flashOn);
        } catch (err) {
            U.toast("Flashlight isn't available on this camera.", 'info');
        }
    });

    window.resetScanner = resetScanner;

    document.addEventListener('DOMContentLoaded', startCamera);
    window.addEventListener('pagehide', stopCamera); // don't leave the torch on
