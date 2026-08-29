// ── Sahaya Report Generator ─────────────────────────────────────────────────
// Generates a downloadable PDF health assessment report using html2pdf.js.
// ES module — used by chat-history.html and results.html.
//
// Usage:
//   import { downloadReport } from "./report-generator.js";
//   downloadReport(assessment, profileData);

/**
 * Load html2pdf from local file if not already loaded.
 */
async function loadHtml2Pdf() {
  if (window.html2pdf) {
    return window.html2pdf;
  }
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.src = 'html2pdf.bundle.min.js';
    script.onload = function () {
      if (window.html2pdf) {
        resolve(window.html2pdf);
      } else {
        reject(new Error('html2pdf failed to load'));
      }
    };
    script.onerror = function () { reject(new Error('Could not load html2pdf library')); };
    document.head.appendChild(script);
  });
}

/**
 * Generate and trigger download of a PDF health assessment report.
 *
 * @param {Object} assessment - Assessment data from Firestore
 * @param {Object} profileData - { name, age, gender }
 */
export async function downloadReport(assessment, profileData) {
  var I18N = window.SAHAYA_I18N;
  var t = I18N ? I18N.t.bind(I18N) : function (k) { return k; };
  var U = window.SAHAYA_UTIL;

  try {
    await loadHtml2Pdf();
  } catch (e) {
    if (U) U.toast('Could not load PDF generator. Please check your connection.', 'error');
    return;
  }

  // Build an invisible HTML container for the PDF
  var container = document.createElement('div');
  container.style.width = '210mm'; // A4 width
  container.style.padding = '20mm';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = 'sans-serif';
  container.style.color = '#201a19';
  container.style.fontSize = '12pt';
  container.style.lineHeight = '1.5';
  container.style.background = '#ffffff';

  // Helper to escape HTML safely
  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function cleanBold(str) {
    return esc(str).replace(/\*\*/g, '');
  }

  var patient = assessment.patientSnapshot || profileData || {};
  var langName = '';
  if (I18N) langName = I18N.getLangName(assessment.language);

  var dateStr = '';
  if (assessment.createdAt && assessment.createdAt.toDate) {
    dateStr = assessment.createdAt.toDate().toLocaleString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } else {
    dateStr = new Date().toLocaleString('en-IN');
  }

  var riskLevel = String(assessment.riskLevel || 'Unknown');
  var riskColor = '#366759';
  if (riskLevel.toLowerCase() === 'high') riskColor = '#ba1a1a';
  else if (riskLevel.toLowerCase() === 'moderate') riskColor = '#815248';

  var html = `
    <!-- Header -->
    <div style="background-color: #366759; color: white; padding: 15px; margin: -20mm -20mm 10mm -20mm;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <div>
          <h1 style="margin: 0; font-size: 24pt;">SAHAYA</h1>
          <p style="margin: 5px 0 0 0; font-size: 10pt;">${esc(t('report_title'))}</p>
        </div>
        <div style="font-size: 10pt; text-align: right;">${esc(dateStr)}</div>
      </div>
    </div>

    <!-- Patient Info -->
    <h2 style="color: #366759; font-size: 14pt; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
      ${esc(t('report_patient').toUpperCase())} INFORMATION
    </h2>
    <div style="margin-bottom: 20px; font-size: 11pt;">
      ${patient.name ? `<div><b>${esc(t('report_patient'))}:</b> ${esc(patient.name)}</div>` : ''}
      ${patient.age ? `<div><b>${esc(t('report_age'))}:</b> ${esc(patient.age)}</div>` : ''}
      ${patient.gender ? `<div><b>${esc(t('report_gender'))}:</b> ${esc(patient.gender)}</div>` : ''}
      ${langName ? `<div><b>${esc(t('report_language'))}:</b> ${esc(langName)}</div>` : ''}
      <div><b>${esc(t('report_date'))}:</b> ${esc(dateStr)}</div>
    </div>

    <!-- Risk Level -->
    <div style="font-size: 14pt; font-weight: bold; color: ${riskColor}; margin-bottom: 15px;">
      ${esc(t('report_risk_level'))}: ${esc(riskLevel.toUpperCase())}
    </div>

    <!-- Summary -->
    ${assessment.summary ? `
      <h3 style="color: #366759; font-size: 12pt; margin-bottom: 5px;">${esc(t('report_summary'))}</h3>
      <p style="margin-top: 0; margin-bottom: 15px;">${cleanBold(assessment.summary)}</p>
    ` : ''}

    <!-- Content -->
    ${assessment.fullContent ? `
      <p style="margin-top: 0; margin-bottom: 15px;">${cleanBold(assessment.fullContent)}</p>
    ` : ''}
  `;

  // Do's
  if (Array.isArray(assessment.dos) && assessment.dos.length > 0) {
    html += `
      <h3 style="color: #366759; font-size: 12pt; margin-bottom: 5px;">&#9989; ${esc(t('report_dos'))}</h3>
      <ul style="margin-top: 0; margin-bottom: 15px; padding-left: 20px;">
        ${assessment.dos.map(d => `<li>${cleanBold(d)}</li>`).join('')}
      </ul>
    `;
  }

  // Don'ts
  if (Array.isArray(assessment.donts) && assessment.donts.length > 0) {
    html += `
      <h3 style="color: #ba1a1a; font-size: 12pt; margin-bottom: 5px;">&#10060; ${esc(t('report_donts'))}</h3>
      <ul style="margin-top: 0; margin-bottom: 15px; padding-left: 20px;">
        ${assessment.donts.map(d => `<li>${cleanBold(d)}</li>`).join('')}
      </ul>
    `;
  }

  // Transcript
  var transcript = assessment.chatTranscript || [];
  if (transcript.length > 0) {
    html += `
      <h2 style="color: #366759; font-size: 14pt; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; page-break-before: always;">
        ${esc(t('report_transcript'))}
      </h2>
      <div style="font-size: 10pt;">
    `;
    transcript.forEach(msg => {
      var label = msg.role === 'assistant' ? t('report_ai_label') : t('report_you_label');
      var color = msg.role === 'assistant' ? '#366759' : '#815248';
      html += `
        <div style="margin-bottom: 10px;">
          <strong style="color: ${color};">[${esc(label)}]</strong><br/>
          <span>${cleanBold(msg.content)}</span>
        </div>
      `;
    });
    html += `</div>`;
  }

  // Disclaimer
  html += `
    <div style="margin-top: 30px; font-size: 9pt; font-weight: bold; color: #ba1a1a; border-top: 1px solid #ccc; padding-top: 10px;">
      &#9872;&#65039; ${esc(t('report_disclaimer'))}
    </div>
  `;

  container.innerHTML = html;

  var filename = 'sahaya_report_' +
    (patient.name || 'patient').replace(/\s+/g, '_').substring(0, 20) + '_' +
    new Date().toISOString().slice(0, 10) + '.pdf';

  var opt = {
    margin:       0,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      var pdfBase64 = await window.html2pdf().set(opt).from(container).output('datauristring');
      var base64Data = pdfBase64.split(',')[1];
      var Filesystem = window.Capacitor.Plugins.Filesystem;
      
      try {
        await Filesystem.writeFile({
          path: 'Download/' + filename,
          data: base64Data,
          directory: 'EXTERNAL_STORAGE'
        });
        if (U) U.toast('Report saved to Downloads folder!', 'success');
      } catch (err) {
        console.error('Failed saving to Downloads:', err);
        try {
          await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: 'DOCUMENTS'
          });
          if (U) U.toast('Report saved to Documents folder!', 'success');
        } catch (err2) {
          console.error('Failed saving to Documents:', err2);
          if (U) U.toast('Error saving PDF', 'error');
        }
      }
    } catch (e) {
      console.error(e);
      if (U) U.toast('Error generating PDF', 'error');
    }
  } else {
    // Web
    window.html2pdf().set(opt).from(container).save().then(() => {
        if (U) U.toast(I18N ? I18N.t('saved') + ': ' + filename : 'Report downloaded!', 'success');
    });
  }
}
