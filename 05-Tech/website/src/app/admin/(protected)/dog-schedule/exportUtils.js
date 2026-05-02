'use client';

async function ensureFontsReady() {
    if (document?.fonts?.ready) {
        try { await document.fonts.ready; } catch {}
    }
}

// Clone the preview node into an off-screen container so any parent transforms
// (e.g. the on-screen 80% scale wrapper) don't affect the capture.
async function captureCanvas(node) {
    await ensureFontsReady();
    const html2canvas = (await import('html2canvas-pro')).default;

    const clone = node.cloneNode(true);
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-99999px;top:0;background:#ffffff;z-index:-1;pointer-events:none;';
    host.appendChild(clone);
    document.body.appendChild(host);

    try {
        return await html2canvas(clone, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
        });
    } finally {
        host.remove();
    }
}

function triggerDownload(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export async function exportToJPG(node, dogName) {
    if (!node) throw new Error('預覽節點不存在');
    const canvas = await captureCanvas(node);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    triggerDownload(dataUrl, `${dogName || 'dog'}-每日作息時間表.jpg`);
}

export async function exportToPDF(node, dogName) {
    if (!node) throw new Error('預覽節點不存在');
    const canvas = await captureCanvas(node);
    const { jsPDF } = await import('jspdf');

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    // Fit-to-page: scale by whichever axis is more constrained, then center
    const scale = Math.min(usableWidth / canvas.width, usableHeight / canvas.height);
    const renderWidth = canvas.width * scale;
    const renderHeight = canvas.height * scale;
    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', x, y, renderWidth, renderHeight, undefined, 'FAST');

    pdf.save(`${dogName || 'dog'}-每日作息時間表.pdf`);
}
