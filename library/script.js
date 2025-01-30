document.addEventListener('DOMContentLoaded', () => {
    const pdfList = document.getElementById('pdfList');
  
    // List of PDF files in the "pdfs" folder
    const pdfFiles = [
      'book1.pdf',
      'book2.pdf',
      'book3.pdf'
    ];
  
    // Generate links for each PDF
    pdfFiles.forEach(pdf => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = `pdfs/${pdf}`; // Correct path to the PDF file
      link.textContent = pdf;
      link.target = '_blank'; // Open in a new tab
      listItem.appendChild(link);
      pdfList.appendChild(listItem);
    });
  });