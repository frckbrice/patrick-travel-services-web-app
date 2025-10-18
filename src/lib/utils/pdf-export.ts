// PDF export utility using jsPDF

import jsPDF from 'jspdf';

interface CaseData {
  referenceNumber: string;
  serviceType: string;
  status: string;
  priority: string;
  submissionDate: string;
  lastUpdated: string;
  client: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  assignedAgent?: {
    firstName: string;
    lastName: string;
  };
  documents?: Array<{
    originalName: string;
    documentType: string;
    status: string;
    uploadDate: string;
  }>;
  internalNotes?: string;
}

export function exportCaseReport(caseData: CaseData): void {
  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.text('Case Report', 20, y);
  y += 15;

  // Case Info
  doc.setFontSize(12);
  doc.text(`Reference: ${caseData.referenceNumber}`, 20, y);
  y += 7;
  doc.text(`Service Type: ${caseData.serviceType.replace(/_/g, ' ')}`, 20, y);
  y += 7;
  doc.text(`Status: ${caseData.status.replace(/_/g, ' ')}`, 20, y);
  y += 7;
  doc.text(`Priority: ${caseData.priority}`, 20, y);
  y += 10;

  // Client Info
  doc.setFontSize(14);
  doc.text('Client Information', 20, y);
  y += 7;
  doc.setFontSize(11);
  doc.text(`Name: ${caseData.client.firstName} ${caseData.client.lastName}`, 20, y);
  y += 6;
  doc.text(`Email: ${caseData.client.email}`, 20, y);
  y += 6;
  if (caseData.client.phone) {
    doc.text(`Phone: ${caseData.client.phone}`, 20, y);
    y += 6;
  }
  y += 5;

  // Documents
  if (caseData.documents && caseData.documents.length > 0) {
    doc.setFontSize(14);
    doc.text('Documents', 20, y);
    y += 7;
    doc.setFontSize(10);
    caseData.documents.forEach((d, i) => {
      doc.text(`${i + 1}. ${d.originalName} - ${d.status}`, 25, y);
      y += 5;
    });
    y += 5;
  }

  // Internal Notes
  if (caseData.internalNotes) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.text('Internal Notes', 20, y);
    y += 7;
    doc.setFontSize(9);
    const notes = doc.splitTextToSize(caseData.internalNotes, 170);
    notes.forEach((line: string) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 5;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 285);
  doc.text('Patrick Travel Services - Confidential', 105, 285, { align: 'center' });

  // Download
  doc.save(`Case_Report_${caseData.referenceNumber}.pdf`);
}
