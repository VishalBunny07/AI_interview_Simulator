import { useState, useEffect, useRef } from 'react';
import { getInterviewerReactions } from '../utils/api';
import { getLiveFollowup } from "../utils/api";

export default function Interview({ questions, sessionId, onInterviewComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewStatus, setInterviewStatus] = useState('ready');
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answerMode, setAnswerMode] = useState('typing');
  const [interviewerReactions, setInterviewerReactions] = useState([]);
  const [liveFeedback, setLiveFeedback] = useState(null);
  const [followup, setFollowup] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [followupMode, setFollowupMode] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const speechRecognitionRef = useRef(null);

  const goToNextQuestion = async () => {
  setShowFeedback(false);
  setLiveFeedback(null);
  setInterviewerReactions([]);
  setFollowup(null);
  setFollowupMode(false);

  if (currentAnswer.trim()) {
    setUserAnswers(prev => [
      ...prev,
      {
        question: questions[currentQuestionIndex]?.question || questions[currentQuestionIndex],
        answer: currentAnswer,
        mode: answerMode,
        timestamp: new Date().toISOString()
      }
    ]);
    setCurrentAnswer('');
  }

  if (currentQuestionIndex < questions.length - 1) {
    setCurrentQuestionIndex(prev => prev + 1);
    setInterviewStatus('reading');
  } else {
    await finishInterview();
  }
};


  useEffect(() => {
    const speakQuestion = () => {
      if ('speechSynthesis' in window && answerMode === 'voice') {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(questions[currentQuestionIndex]);
        utterance.rate = 0.9;
        utterance.onend = () => setInterviewStatus('answering');
        speechSynthesis.speak(utterance);
      } else {
        setInterviewStatus('answering');
      }
    };

    if (interviewStatus === 'reading') {
      speakQuestion();
    }
  }, [currentQuestionIndex, interviewStatus, answerMode, questions]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;

      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }

      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;

      speechRecognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentAnswer(transcript);
      };

      speechRecognitionRef.current.start();
    }

    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
        speechRecognitionRef.current = null;
      }
    };
  }, [answerMode, interviewStatus]);

  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(async () => {
      try {
        const res = await getInterviewerReactions(sessionId);
        if (res.events?.length) {
          setInterviewerReactions(res.events);
        }
      } catch {}
    }, 1200);

    return () => clearInterval(interval);
  }, [sessionId]);

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    setIsThinking(true);

    try {
      const result = await getLiveFollowup(
        questions?.[currentQuestionIndex]?.question || questions?.[currentQuestionIndex],
        currentAnswer
      );

      setLiveFeedback(result);
      setShowFeedback(true);
        setInterviewerReactions(prev => [
          ...prev,
          { type: result?.type, text: result?.text }
        ]);

      if (result.followup_question) {
        setFollowup(result.followup_question);
        setFollowupMode(true);
      } else {
        setInterviewStatus("reviewing");
      }

    } catch (err) {
      alert("AI failed to respond");
    } finally {
      setIsThinking(false);
    }
  };

  const submitFollowup = () => {
    setUserAnswers(prev => [
      ...prev,
      {
        question: followup,
        answer: currentAnswer,
        is_followup: true
      }
    ]);

    setCurrentAnswer("");
    setFollowup(null);
    setFollowupMode(false);
    setInterviewStatus("reviewing");
  };



  const handleModeToggle = () => {
    setAnswerMode(prev => (prev === 'typing' ? 'voice' : 'typing'));
    setCurrentAnswer('');
  };

  const finishInterview = async () => {
    try {
      let finalAnswers = [...userAnswers];

      if (currentAnswer.trim()) {
        finalAnswers = [
          ...finalAnswers,
          {
            question: questions[currentQuestionIndex],
            answer: currentAnswer,
            mode: answerMode,
            timestamp: new Date().toISOString()
          }
        ];
      }

      onInterviewComplete(finalAnswers);
    } catch (error) {
      console.error(error);
      alert("Failed to finish interview.");
    }
  };
 


  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/30 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl w-full
        bg-black/40 backdrop-blur-2xl rounded-3xl p-8
        border border-white/10
        shadow-[0_30px_90px_rgba(0,0,0,0.9)]
        hover:scale-[1.01] transition-all duration-300"
        >


        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${questions?.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0}%`
            }}
          />
        </div>

      
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>

          <p className="text-sm text-cyan-300 mb-2">
              Difficulty: <strong>{questions[currentQuestionIndex]?.difficulty}</strong>
          </p>

          <div className="flex justify-center items-center space-x-4 mb-4">
            <span className="text-gray-300">Answer Mode:</span>

            <button
               onClick={handleModeToggle}
                disabled={isThinking}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  isThinking
                    ? "bg-gray-300 cursor-not-allowed"
                    : answerMode === 'typing'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
            >
              Typing
            </button>

            <button
              onClick={handleModeToggle}
              disabled={isThinking}
              className={`px-4 py-2 rounded-lg font-semibold ${
                isThinking
                  ? "bg-gray-300 cursor-not-allowed"
                  : answerMode === 'voice'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Voice
            </button>
          </div>
        </div>

        <div
          key={currentQuestionIndex + (followupMode ? "-f" : "-q")}
          className="bg-black/30 backdrop-blur-xl rounded-xl
            border border-white/10 shadow-lg
            p-6 mb-6 animate-[fadeSlide_0.5s_ease-out]"
          >

          <p className="text-xl font-medium text-white">
            {followupMode ? followup : questions[currentQuestionIndex]?.question || questions[currentQuestionIndex] || "Loading question..."}
          </p>
        </div>


        {(interviewStatus === 'answering' || interviewStatus === 'reviewing') ? (
          <div className="bg-black/35 backdrop-blur-xl rounded-2xl p-6 mb-6
          border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]
          hover:scale-[1.01] hover:shadow-2xl transition-all duration-300">
            <h3 className="font-semibold text-lg mb-3 text-white">
              Your Answer ({answerMode}):

              {isThinking && (
                <div className="mt-4 flex items-center gap-3 text-sm text-gray-600 animate-pulse">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Interviewer is thinking…</span>
                </div>
              )}

            </h3>
            
              {(interviewerReactions.length > 0 || liveFeedback) && (
                <div className="mt-6 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-sm">
                  <button
                    onClick={() => setShowFeedback(prev => !prev)}
                    className="flex items-center justify-between w-full px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                       <span>AI Feedback</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {showFeedback ? "Hide ▲" : "Show ▼"}
                    </span>
                  </button>

                  {showFeedback && (
                    <div className="px-5 pb-5 space-y-5 animate-[fadeSlide_0.4s_ease-out]">

                      {interviewerReactions.length > 0 && (
                        <div className="flex gap-3 p-4 rounded-lg bg-amber-400/10 backdrop-blur-md border border-amber-400/30 text-amber-200">
                          <div>
                            <p className="font-semibold text-amber-300 mb-1">
                              Interviewer
                            </p>
                            <p className="text-amber-100 text-sm">
                              {interviewerReactions[interviewerReactions.length - 1]?.text}
                            </p>
                          </div>
                        </div>
                      )}

                      {liveFeedback?.why_lost?.length > 0 && (
                        <div className="p-4 rounded-lg bg-red-500/10 backdrop-blur-md border border-red-500/30 text-red-200">
                          <p className="font-semibold text-red-300 mb-2 flex items-center gap-2">
                             Improvement Areas
                          </p>
                          <ul className="list-disc ml-5 text-red-100 text-sm space-y-1">
                            {liveFeedback.why_lost.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {liveFeedback?.breakdown && (
                        <div className="p-4 rounded-lg bg-cyan-500/10 backdrop-blur-md border border-cyan-400/30 text-cyan-200">
                          <p className="font-semibold text-blue-700 mb-4 flex items-center gap-2">
                             Skill Breakdown
                          </p>

                          {Object.entries(liveFeedback.breakdown).map(([skill, value]) => (
                            <div key={skill} className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize text-cyan-200">{skill}</span>
                                <span className="text-cyan-300 font-medium">{value}/10</span>
                              </div>
                              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-cyan-400 h-2 rounded-full transition-all duration-700"
                                  style={{ width: `${(value / 10) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )}

            {interviewerReactions.length > 0 && (
                <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <p className="font-semibold text-yellow-800">Interviewer:</p>
                  <p className="text-gray-700">
                    {interviewerReactions[interviewerReactions.length - 1]?.text}
                  </p>
                </div>
            )}


            {answerMode === 'typing' ? (
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-32 p-4 rounded-lg resize-none
                  bg-black/40 backdrop-blur-md
                  border border-white/10
                  text-white placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                disabled={interviewStatus === 'reviewing'}
              />
            ) : (
              <div className="p-4 bg-white rounded border min-h-32">
                <p className="text-gray-700">
                  {currentAnswer || 'Speak your answer...'}
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500 text-right mt-1">
              {currentAnswer.split(" ").filter(Boolean).length} / 250 words
            </p>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setCurrentAnswer('')}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                disabled={interviewStatus === 'reviewing'}
              >
                Clear Answer
              </button>

              {interviewStatus === 'answering' ? (
                <button
                disabled={isThinking || !currentAnswer.trim()}
                  onClick={followupMode ? submitFollowup : handleSubmitAnswer}
                   className={`px-6 py-2 rounded-lg text-white ${isThinking ? "bg-gray-400 cursor-not-allowed" : "bg-green-600"}`}
                >
                  {isThinking ? "AI thinking…" : followupMode ? "Submit Follow-up" : "Submit Answer"} 
                </button>
              ) : 
              
              (
                <button
                  onClick={
                    currentQuestionIndex < questions.length - 1
                      ? goToNextQuestion
                      : finishInterview
                  }
                  disabled={isThinking}
                  className={`px-6 py-2 rounded-lg text-white ${
                    isThinking ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
                  }`}
                >

                  {currentQuestionIndex < questions.length - 1
                    ? "Next Question"
                    : "Finish Interview"}
                </button>

              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <button
              onClick={() => setInterviewStatus('reading')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold"
            >
              Start This Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
