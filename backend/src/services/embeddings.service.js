let extractor = null;

async function getExtractor() {
  if (!extractor) {
    console.log('Loading embedding model (first run may take a moment)...');
    const { pipeline } = await import('@xenova/transformers');
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Embedding model loaded.');
  }
  return extractor;
}

async function generateEmbedding(text) {
  const ext = await getExtractor();
  const output = await ext(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

async function generateEmbeddings(texts) {
  const ext = await getExtractor();
  return Promise.all(
    texts.map(async (text) => {
      const output = await ext(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    })
  );
}

module.exports = { generateEmbedding, generateEmbeddings };
