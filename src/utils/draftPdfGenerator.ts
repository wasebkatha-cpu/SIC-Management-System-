import { jsPDF } from 'jspdf';
import { NoticeDraftRecord } from './draftStorage';
import { toDisplayDateFormat } from './dateUtils';

export interface DraftPdfData {
  complaintNo: string;
  complainantName: string;
  respondentDept: string;
  designatedOfficialName?: string;
  designatedOfficialDesignation?: string;
  nextHearingDate?: string;
  title: string;
  category: 'Notice' | 'Order' | string;
  contentText: string;
  createdAt: string;
  createdByName?: string;
  createdByRole?: string;
}

/**
 * Generates an official Sindh Information Commission PDF document for a draft notice/order.
 */
export function generateDraftNoticePdf(data: DraftPdfData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - (margin * 2);

  // Colors
  const primaryColor = [16, 75, 48]; // Dark Sindh Commission Green
  const textColor = [30, 41, 59];
  const mutedColor = [100, 116, 139];
  const borderColor = [203, 213, 225];

  // Helper to format date
  const draftDateFormatted = data.createdAt ? toDisplayDateFormat(data.createdAt) : toDisplayDateFormat(new Date().toISOString());
  const nextHearingFormatted = data.nextHearingDate ? toDisplayDateFormat(data.nextHearingDate) : 'Not Yet Scheduled / To be Notified';

  let cursorY = margin;

  // 1. Commission Header
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, cursorY + 22, pageWidth - margin, cursorY + 22);

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SINDH INFORMATION COMMISSION', pageWidth / 2, cursorY + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('GOVERNMENT OF SINDH', pageWidth / 2, cursorY + 10, { align: 'center' });
  doc.text('Under the Sindh Transparency and Right to Information Act, 2016', pageWidth / 2, cursorY + 14, { align: 'center' });
  doc.text('Barrack No. 94, Sindh Secretariat 4-B, Court Road, Karachi • Tel: 021-99203300', pageWidth / 2, cursorY + 18, { align: 'center' });

  cursorY += 28;

  // 2. Metadata Bar (Complaint No, Draft Date, Next Hearing Date, Category Badge)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, cursorY, contentWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Complaint No: ${data.complaintNo}`, margin + 4, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(`Date of Draft: ${draftDateFormatted}`, margin + 4, cursorY + 12);
  doc.text(`Issuing Authority: ${data.createdByName || 'Commission'} (${data.createdByRole || 'Official'})`, margin + 4, cursorY + 17);

  // Right side of metadata bar: Next Hearing Date & Category
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(180, 83, 9); // Amber / Highlight for hearing date
  doc.text(`Next Date of Hearing: ${nextHearingFormatted}`, pageWidth - margin - 4, cursorY + 6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const isOrder = (data.category || '').toLowerCase() === 'order';
  doc.setTextColor(isOrder ? 147 : 2, isOrder ? 51 : 132, isOrder ? 234 : 199);
  doc.text(`Type: ${data.category.toUpperCase()}`, pageWidth - margin - 4, cursorY + 12, { align: 'right' });

  cursorY += 26;

  // 3. Parties Box (Complainant vs Respondent & Designated Official)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, cursorY, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('PARTIES TO THE PROCEEDINGS:', margin + 4, cursorY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Complainant:', margin + 4, cursorY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(data.complainantName || 'Complainant', margin + 30, cursorY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Respondent:', margin + 4, cursorY + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(data.respondentDept || 'Public Body / Department', margin + 30, cursorY + 17);

  doc.setFont('helvetica', 'bold');
  doc.text('Designated Off.:', margin + 4, cursorY + 23);
  doc.setFont('helvetica', 'normal');
  const officialFull = data.designatedOfficialName 
    ? `${data.designatedOfficialName}${data.designatedOfficialDesignation ? ` (${data.designatedOfficialDesignation})` : ''}`
    : 'Designated Public Information Officer (PIO)';
  doc.text(officialFull, margin + 30, cursorY + 23);

  cursorY += 32;

  // 4. Document Title
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  const splitTitle = doc.splitTextToSize(data.title.toUpperCase(), contentWidth);
  doc.text(splitTitle, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += (splitTitle.length * 6) + 4;

  // Divider line
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.4);
  doc.line(margin + 20, cursorY - 2, pageWidth - margin - 20, cursorY - 2);
  cursorY += 4;

  // 5. Body Text
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  // Clean raw html entities or tags if present
  let cleanText = data.contentText || '';
  if (!cleanText.trim()) {
    cleanText = 'No text content entered for this notice / order.';
  }

  const lines = doc.splitTextToSize(cleanText, contentWidth);
  const lineHeight = 5.2;

  for (let i = 0; i < lines.length; i++) {
    if (cursorY + lineHeight > pageHeight - 35) {
      // Add page
      addFooter(doc, pageWidth, pageHeight, margin, data);
      doc.addPage();
      cursorY = margin + 10;
      doc.setFont('times', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    }
    doc.text(lines[i], margin, cursorY);
    cursorY += lineHeight;
  }

  // 6. Signature / Commission Stamp Block
  if (cursorY + 30 > pageHeight - 25) {
    addFooter(doc, pageWidth, pageHeight, margin, data);
    doc.addPage();
    cursorY = margin + 15;
  } else {
    cursorY += 12;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('BY ORDER OF THE COMMISSION', pageWidth - margin - 5, cursorY, { align: 'right' });
  cursorY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Registrar / Reader to the Commission', pageWidth - margin - 5, cursorY, { align: 'right' });
  doc.text('Sindh Information Commission, Karachi', pageWidth - margin - 5, cursorY + 4, { align: 'right' });

  // Add footer to final page
  addFooter(doc, pageWidth, pageHeight, margin, data);

  return doc;
}

function addFooter(doc: jsPDF, pageWidth: number, pageHeight: number, margin: number, data: DraftPdfData) {
  const footerY = pageHeight - 14;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `SIC Case: ${data.complaintNo} | Next Hearing: ${data.nextHearingDate ? toDisplayDateFormat(data.nextHearingDate) : 'N/A'} | Generated via Electronic Case Management System (ECMS)`,
    margin,
    footerY
  );
  doc.text(
    'Official Statutory Communication • Government of Sindh',
    pageWidth - margin,
    footerY,
    { align: 'right' }
  );
}

/**
 * Downloads the draft notice as a PDF file
 */
export function downloadDraftNoticePdf(data: DraftPdfData, fileName?: string): void {
  const doc = generateDraftNoticePdf(data);
  const cleanComplaintNo = data.complaintNo.replace(/[^a-zA-Z0-9_-]/g, '_');
  const defaultName = fileName || `Notice_Draft_${cleanComplaintNo}.pdf`;
  doc.save(defaultName);
}

/**
 * Returns a Blob of the generated PDF (for Web Share API or upload)
 */
export function getDraftNoticePdfBlob(data: DraftPdfData): Blob {
  const doc = generateDraftNoticePdf(data);
  return doc.output('blob');
}

/**
 * Returns a Data URL string of the generated PDF (for instant preview in browser)
 */
export function getDraftNoticePdfDataUrl(data: DraftPdfData): string {
  const doc = generateDraftNoticePdf(data);
  return doc.output('dataurlstring');
}
