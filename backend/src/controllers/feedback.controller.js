const supabase = require('../services/supabase.service');

async function getFeedback(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`*, quizzes(difficulty, questions, documents(filename))`)
      .eq('id', id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Feedback not found' });
    res.json({ feedback: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getFeedback };
