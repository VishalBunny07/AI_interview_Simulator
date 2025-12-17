import { useState, useEffect, useRef } from 'react';

export default function Interview({ questions, onInterviewComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewStatus, setInterviewStatus] = useState('ready');
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answerMode, setAnswerMode] = useState('typing');
  const speechRecognitionRef = useRef(null);

  const goToNextQuestion = async () => {
    if (currentAnswer.trim()) {
      const newAnswer = {
        question: questions[currentQuestionIndex],
        answer: currentAnswer,
        mode: answerMode,
        timestamp: new Date().toISOString()
      };

      setUserAnswers(prev => [...prev, newAnswer]);
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

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) {
      alert('Please provide an answer before proceeding.');
      return;
    }
    setInterviewStatus('reviewing');
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

      // Send all answers to Dashboard
      onInterviewComplete(finalAnswers);

    } catch (error) {
      console.error(error);
      alert("Failed to finish interview.");
    }
  };

  <div className="w-full bg-grey-200 rounded-full h-2 mb-4">
    <div className="bg-blue-600 h-2 rounded-full transition-all duration-500"
    style={{
      width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
    }}
    />
  </div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl p-8">

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>

          <div className="flex justify-center items-center space-x-4 mb-4">
            <span className="text-gray-600">Answer Mode:</span>

            <button
              onClick={handleModeToggle}
              className={`px-4 py-2 rounded-lg font-semibold ${
                answerMode === 'typing' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Typing
            </button>

            <button
              onClick={handleModeToggle}
              className={`px-4 py-2 rounded-lg font-semibold ${
                answerMode === 'voice' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Voice
            </button>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Question:</h3>
          <p className="text-xl text-gray-700 leading-relaxed">
            {questions[currentQuestionIndex]}
          </p>
        </div>

        {interviewStatus === 'answering' || interviewStatus === 'reviewing' ? (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-green-200">
            <h3 className="font-semibold text-lg mb-3 text-gray-800">
              Your Answer ({answerMode}):
            </h3>

            {answerMode === 'typing' ? (
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-32 p-4 border rounded-lg text-gray-700 resize-none"
                disabled={interviewStatus === 'reviewing'}
              />
            ) : (
              <div className="p-4 bg-white rounded border min-h-32">
                <p className="text-gray-700">
                  {currentAnswer || 'Speak your answer... (Voice mode may not work on all browsers)'}
                </p>

                {interviewStatus === 'answering' && (
                  <div className="text-center mt-4">
                    <div className="bg-red-500 text-white px-4 py-2 rounded-full animate-pulse">
                      Recording...
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setCurrentAnswer('')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                disabled={interviewStatus === 'reviewing'}
              >
                Clear Answer
              </button>

              {interviewStatus === 'answering' ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!currentAnswer.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={
                    currentQuestionIndex < questions.length - 1
                      ? goToNextQuestion
                      : finishInterview
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Interview"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <button
              onClick={() => setInterviewStatus('reading')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold"
            >
              Start This Question
            </button>
          </div>
        )}

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

      </div>
    </div>
  );
}
