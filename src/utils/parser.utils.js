// basic text extraction. For better parsing, integrate libraries like pdf-parse or mammoth for docx.
const fs = require('fs');
const pdfParse = require('pdf-parse'); // install if using pdfs
const textract = require('textract'); // optional: extract from many formats

async function extractText(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  if (ext === 'pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }
  // fallback using textract (works for docx, doc, txt)
  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(filePath, (err, text) => {
      if (err) return reject(err);
      resolve(text || '');
    });
  });
}

module.exports = { extractText };
