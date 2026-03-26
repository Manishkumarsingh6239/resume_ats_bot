const { Document, Packer, Paragraph } = require('docx');

async function generateDOCX(text) {
  const doc = new Document({
    sections: [{
      children: text.split('\n').map(line => new Paragraph(line)),
    }],
  });
  return await Packer.toBuffer(doc);
}

module.exports = { generateDOCX };