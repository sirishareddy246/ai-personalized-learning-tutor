const supabase = require('../src/services/supabase.service');

async function checkChunks() {
  const { data, error } = await supabase
    .from('chunks')
    .select('content, chunk_index')
    .eq('document_id', 'd1642989-ee18-47c8-b675-ba52e00b3553');
  
  if (error) {
    console.error('Error fetching chunks:', error);
  } else {
    console.log('Chunks:', JSON.stringify(data, null, 2));
  }
}

checkChunks();
