document.addEventListener('DOMContentLoaded', () => {
    const pdfList = document.getElementById('pdfList');
  
    // List of PDF files in the "pdfs" folder
    const pdfFiles = [
      'BOLD- Dataset and Metrics for Measuring Biases in Open-Ended Language Generation.pdf',
      'Challenging Systematic Prejudices.pdf'
    ];
  
    // Generate file items for each PDF
    pdfFiles.forEach(pdf => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
  
      const fileIcon = document.createElement('div');
      fileIcon.className = 'file-icon';
  
      const fileName = document.createElement('div');
      fileName.className = 'file-name';
      fileName.textContent = pdf;
  
      // Wrap the icon and name in a link
      const link = document.createElement('a');
      link.href = `/library/pdfs/${pdf}`; // Add "library/" to the path
      link.target = '_blank';
      link.appendChild(fileIcon);
      link.appendChild(fileName);
  
      fileItem.appendChild(link);
      pdfList.appendChild(fileItem);
    });
  });