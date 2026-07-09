const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const officeParser = require('officeparser');
const config = require('../config/config');

async function extractText(fileBuffer, mimetype, originalname) {
  const ext = originalname.split('.').pop().toLowerCase();

  if (ext === 'pdf') {
    const data = await pdfParse(fileBuffer);
    return data.text;
  }

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  }

  if (ext === 'pptx' || ext === 'ppt') {
    return new Promise((resolve, reject) => {
      officeParser.parseOfficeAsync(fileBuffer, { outputErrorToConsole: false })
        .then(resolve)
        .catch(reject);
    });
  }

  throw new Error(`Unsupported file type: .${ext}. Supported: PDF, DOCX, PPTX`);
}

function chunkText(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks;
}

module.exports = { extractText, chunkText };
