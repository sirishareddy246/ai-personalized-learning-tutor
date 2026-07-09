const { extractText, chunkText } = require('../services/textExtraction.service');
const { generateEmbeddings } = require('../services/embeddings.service');
const supabase = require('../services/supabase.service');
const config = require('../config/config');

async function uploadDocument(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { originalname, buffer, mimetype } = req.file;
    const userId = req.headers['x-user-id'] || null;

    // Upload raw file to Supabase Storage (non-fatal — anon key may lack permission)
    const storagePath = `uploads/${Date.now()}_${originalname}`;
    try {
      await supabase.storage.from('documents').upload(storagePath, buffer, { contentType: mimetype });
    } catch (storageErr) {
      console.warn('Storage upload skipped (non-fatal):', storageErr.message);
    }

    // Extract + chunk text
    const text = await extractText(buffer, mimetype, originalname);
    if (!text || text.trim().length === 0)
      return res.status(422).json({ error: 'Could not extract text from file' });

    const chunks = chunkText(text, config.chunkSize, config.chunkOverlap);

    // Insert document record
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .insert({ user_id: userId, filename: originalname, storage_path: storagePath })
      .select()
      .single();
    if (docErr) throw new Error(`DB insert failed: ${docErr.message}`);

    // Generate embeddings and insert chunks
    console.log(`Generating embeddings for ${chunks.length} chunks...`);
    const embeddings = await generateEmbeddings(chunks);
    const rows = chunks.map((content, i) => ({
      document_id: doc.id,
      content,
      embedding: embeddings[i],
      chunk_index: i,
    }));

    const { error: chunkErr } = await supabase.from('chunks').insert(rows);
    if (chunkErr) throw new Error(`Chunk insert failed: ${chunkErr.message}`);

    res.status(201).json({ message: 'Document processed', document: doc, chunksCreated: chunks.length });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
}

async function listDocuments(req, res) {
  try {
    const userId = req.headers['x-user-id'] || null;
    let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ documents: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { uploadDocument, listDocuments };
