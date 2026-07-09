import { useState, useCallback } from 'react';
import axios from 'axios';

export function useAdaptiveQuiz(documentId) {
  const [sessionId, setSessionId] = useState(null);
  const [level, setLevel] = useState('easy');
  const [questions, setQuestions] = useState([]);
  const [remediationSummary, setRemediationSummary] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | active | ended

  const start = useCallback(async () => {
    const { data } = await axios.post('/api/quiz/start', { documentId });
    setSessionId(data.session.id);
    setLevel(data.session.current_level);
    setQuestions(data.questions);
    setStatus('active');
  }, [documentId]);

  const submitAnswer = useCallback(
    async (questionId, selectedAnswer) => {
      const { data } = await axios.post('/api/quiz/answer', {
        sessionId,
        questionId,
        selectedAnswer,
      });

      if (data.status === 'in_progress') {
        return { isCorrect: data.isCorrect, explanation: data.explanation };
      }

      if (data.status === 'advanced' || data.status === 'demoted') {
        setLevel(data.level);
        setQuestions(data.questions);
        setRemediationSummary(null);
      }

      if (data.status === 'remediation') {
        setLevel(data.level);
        setQuestions(data.questions);
        setRemediationSummary(data.summary);
      }

      if (data.status === 'ended') {
        setFeedback(data.feedback);
        setStatus('ended');
      }

      return data;
    },
    [sessionId]
  );

  const exitQuiz = useCallback(async () => {
    const { data } = await axios.post('/api/quiz/exit', { sessionId });
    setFeedback(data.feedback);
    setStatus('ended');
  }, [sessionId]);

  return {
    status,
    level,
    questions,
    remediationSummary,
    feedback,
    start,
    submitAnswer,
    exitQuiz,
  };
}
