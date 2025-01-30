document.addEventListener('DOMContentLoaded', () => {
    const pdfList = document.getElementById('pdfList');
  
    // List of PDF files in the "pdfs" folder
    const pdfFiles = [
      'library/pdfs/BOLD- Dataset and Metrics for Measuring Biases in Open-Ended Language Generation.pdf',
      'library/pdfs/Challenging Systematic Prejudices.pdf'
    ];
  
    // Generate links for each PDF
    pdfFiles.forEach(pdf => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = `pdfs/${pdf}`;
      link.textContent = pdf;
      link.target = '_blank'; // Open in a new tab
      listItem.appendChild(link);
      pdfList.appendChild(listItem);
    });
  });