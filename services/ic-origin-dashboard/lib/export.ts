import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // 1. Prepare element (hide UI elements we don't want in PDF)
    const exportButton = element.querySelector('button');
    const brandingText = element.querySelector('span');
    if (exportButton) exportButton.style.display = 'none';
    if (brandingText) brandingText.style.opacity = '0';

    try {
        const canvas = await html2canvas(element, {
            scale: 3, // Higher scale for text clarity
            backgroundColor: '#05070A',
            useCORS: true,
            logging: false,
            windowWidth: 1200, // Force a desktop-like width for consistent layout
        });

        const imgData = canvas.toDataURL('image/png');

        // A4 Dimensions in px (at 72 DPI) are roughly 595 x 842
        // But we'll use a larger canvas and let jsPDF scale it
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Add Header Branding
        pdf.setFillColor(5, 7, 10); // Match terminal background
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        pdf.setTextColor(16, 185, 129); // Emerald-500
        pdf.setFontSize(8);
        pdf.text('IC ORIGIN // INSTITUTIONAL INTELLIGENCE DOSSIER', 15, 15);

        pdf.setTextColor(51, 65, 85); // Slate-700
        pdf.text(new Date().toLocaleString(), pageWidth - 60, 15);

        // Calculate dimensions to fit A4 with margins
        const margin = 15;
        const targetWidth = pageWidth - (margin * 2);
        const imgProps = (pdf as any).getImageProperties(imgData);
        const targetHeight = (imgProps.height * targetWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', margin, 25, targetWidth, targetHeight);

        // Add Footer
        pdf.setTextColor(51, 65, 85);
        pdf.setFontSize(7);
        pdf.text('CONFIDENTIAL // FOR INTERNAL STRATEGIC USE ONLY', pageWidth / 2, pageHeight - 10, { align: 'center' });

        pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error("PDF Export Failed:", error);
    } finally {
        // Restore element visibility
        if (exportButton) exportButton.style.display = 'flex';
        if (brandingText) brandingText.style.opacity = '1';
    }
};
