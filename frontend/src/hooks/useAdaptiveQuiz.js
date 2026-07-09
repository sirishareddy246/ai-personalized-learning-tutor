import { useState, useCallback } from 'react';
import api from '../lib/apiClient';

export function useAdaptiveQuiz(documentId) {
  const [sessionId, setSessionId] = useState(null);
  const [level, setLevel] = useState('easy');
  const [questions, setQuestions] = useState([]);
  const [remediationSummary, setRemediationSummary] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | active | ended

  const start = useCallback(async () => {
    if (!documentId) return;
    const { data } = await api.post('/adaptive-quiz/start', { documentId });
    setSessionId(data.session.id);
    setLevel(data.session.current_level);
    setQuestions(data.questions);
    setRemediationSummary(null);
    setFeedback(null);
    setStatus('active');
  }, [documentId]);

  const submitAnswer = useCallback(
    async (questionId, selectedAnswer) => {
      const { data } = await api.post('/adaptive-quiz/answer', {
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
    if (!sessionId) return;
    const { data } = await api.post('/adaptive-quiz/exit', { sessionId });
    setFeedback(data.feedback);
    setStatus('ended');
  }, [sessionId]);

  const resetQuiz = useCallback(() => {
    setSessionId(null);
    setLevel('easy');
    setQuestions([]);
    setRemediationSummary(null);
    setFeedback(null);
    setStatus('idle');
  }, []);

  return {
    status,
    level,
    questions,
    remediationSummary,
    feedback,
    start,
    submitAnswer,
    exitQuiz,
    resetQuiz,
  };
}
