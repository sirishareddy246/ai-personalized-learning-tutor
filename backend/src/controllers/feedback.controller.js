const supabase = require('../services/supabase.service');
const { getFeedback: getAdaptiveFeedback } = require('../services/adaptiveQuiz.service');

async function getFeedback(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`*, quizzes(difficulty, questions, documents(filename))`)
      .eq('id', id)
      .single();

    if (data && !error) {
      return res.json({ feedback: data });
    }

    // Fallback: Check if id is an adaptive_quiz_session ID
    try {
      const adaptiveFeedback = await getAdaptiveFeedback(id);
      if (adaptiveFeedback) {
        return res.json({ feedback: adaptiveFeedback, type: 'adaptive' });
      }
    } catch {
      // ignore adaptive lookup error
    }

    return res.status(404).json({ error: 'Feedback not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getFeedback };
