import { ComplaintData } from '../context/AppContext';

export const printDiaries = (complaints: ComplaintData[], title: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const complaintsWithDiaries = complaints.filter(c => c.diaries && c.diaries.length > 0);

  if (complaintsWithDiaries.length === 0) {
    alert("No diaries available to print.");
    printWindow.close();
    return;
  }

  let htmlContent = `<h1>${title}</h1>`;

  complaintsWithDiaries.forEach(c => {
    htmlContent += `
      <div class="complaint-header">
        <strong>Complaint No:</strong> ${c.complaintNo} <br/>
        <strong>Parties:</strong> ${c.complainantName} V/S ${c.respondentName}
      </div>
    `;
    c.diaries?.forEach(diary => {
      htmlContent += `
        <div class="diary-entry">
          <div class="diary-date">Date: ${diary.date}</div>
          <div class="diary-text">${diary.diary}</div>
        </div>
      `;
    });
  });

  printWindow.document.write(`
    <html>
      <head>
        <title>${title} - Diaries</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #000; padding: 2rem; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 1.5rem; margin-bottom: 1rem; border-bottom: 2px solid #000; padding-bottom: 0.5rem; }
          .diary-entry { border: 1px solid #ccc; padding: 1rem; margin-bottom: 1rem; page-break-inside: avoid; border-radius: 4px; background: #fff; }
          .diary-date { font-weight: bold; margin-bottom: 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
          .diary-text { white-space: pre-wrap; font-size: 0.95rem; }
          .complaint-header { margin-top: 2rem; margin-bottom: 1rem; padding: 0.75rem; background: #f9f9f9; border-left: 4px solid #333; font-size: 1.1rem; }
          @media print {
            body { padding: 0; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
