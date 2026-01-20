import { useState, useEffect } from 'react';
import { getScoreProgress } from '../utils/api';
import {
  uploadResume,
  getPreviousSessions,
  getSessionDetails,
  scoreInterview
} from '../utils/api';
import Interview from './interview';
import ViewDetails from './ViewDetails';

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [interviewData, setInterviewData] = useState(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [interviewResults, setInterviewResults] = useState(null);
  const [scoring, setScoring] = useState(false);
  const [scoreProgress, setScoreProgress] = useState({ current: 0, total: 0 });
  const [submittedAnswers, setSubmittedAnswers] = useState([]);

  const userId = localStorage.getItem("user_id");

  
  useEffect(() => {
    if (userId) {
      getPreviousSessions(userId).then(data => {
        setSessions(data.sessions || []);
      });
    }
  }, [userId]);

  const retakeInterview = async (sessionId) => {
    try {
      const data = await getSessionDetails(sessionId);
      setInterviewData({
        session_id: sessionId,
        generated_questions: data.generated_questions || data.questions || [],
        resume_category: data.resume_category
      });
      setInterviewStarted(true);
    } catch {
      alert("Failed to load interview session.");
    }
  };

  const openDetails = (sessionId) => {
    setActiveSessionId(sessionId);
    setDetailsOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    window.location.href = '/';
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
    setInterviewData(null);
  };

  const handleUploadResume = async () => {
    if (!selectedFile) return alert("Select a PDF first!");

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("user_id", parseInt(userId));

      const response = await uploadResume(formData);
      setInterviewData(response);

      alert("Resume analyzed! Click Start Interview.");
    } catch {
      alert("Failed to upload resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    if (!interviewData?.generated_questions?.length) {
      alert("No questions available");
      return;
    }
    setInterviewStarted(true);
  };

  // SCORE SESSION
  const handleInterviewComplete = async (answers) => {
    if (!interviewData?.session_id) {
      alert("Session ID missing — cannot score interview.");
      return;
    }

    try {
      setSubmittedAnswers(answers);
      setScoring(true);
      setScoreProgress({ current: 0, total: answers.length });

      const payload = {
        session_id: interviewData.session_id,
        questions: interviewData.generated_questions,
        answers: answers.map(a => a.answer)
      };

      const result = await scoreInterview(payload);
      setInterviewResults(result);

      setInterviewStarted(false);
      setInterviewData(null);
    } catch (err) {
      console.error(err);
      alert("Error scoring interview.");
    } finally {
      setScoring(false);
    }
  };

  useEffect(() => {
    if (!scoring || !interviewData?.session_id) return;

    const interval = setInterval(async () => {
      try {
        const data = await getScoreProgress(interviewData.session_id);
        setScoreProgress(data);
      } catch {}
    }, 800);

    return () => clearInterval(interval);
  }, [scoring, interviewData?.session_id]);


  // SCORING LOADER
  if (scoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a] relative overflow-hidden">

        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col items-center gap-6">

          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-400/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin shadow-[0_0_25px_rgba(34,211,238,0.8)]"></div>
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold text-cyan-300 tracking-wide">
              Scoring {scoreProgress.current} of {scoreProgress.total} answers
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Interviewer is analyzing your responses…
            </p>
          </div>

        </div>
      </div>
    );
  }

    // RESULTS PAGE
    if (interviewResults) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white p-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <h1 className="text-3xl font-bold text-center mb-10">
            Interview Results
          </h1>

          {/* Score Ring */}
          <div className="flex justify-center mb-12">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#22c55e"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={440}
                  strokeDashoffset={
                    440 - (440 * interviewResults.overall_score) / 100
                  }
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-extrabold">
                  {interviewResults.overall_score}
                </span>
              </div>
            </div>
          </div>

          {/* Per Question Breakdown */}
            <div className="space-y-6">
              {interviewResults.details?.map((item, i) => {
                const qa = submittedAnswers?.[i];
                return (
                  <details
                    key={i}
                    className="bg-white/10 border border-white/20 rounded-xl p-5 group"
                  >
                    <summary className="cursor-pointer font-semibold text-lg flex justify-between items-center">
                      Question {i + 1}
                      <span className="text-green-400">
                        {item.score}/10
                      </span>
                    </summary>

                    {qa && (
                      <div className="mt-4 rounded-lg bg-slate-900/60 border border-slate-700 p-4">
                        <p className="text-sm text-cyan-300 font-semibold mb-1">
                          AI Question
                        </p>
                        <p className="text-slate-200 text-sm mb-4">
                          {qa.question}
                        </p>

                        <p className="text-sm text-green-300 font-semibold mb-1">
                          Your Answer
                        </p>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">
                          {qa.answer}
                        </p>
                      </div>
                    )}

                    {/* Skill bars */}
                    <div className="mt-5 space-y-3">
                      {Object.entries(item.breakdown || {}).map(([skill, value]) => (
                        <div key={skill}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{skill}</span>
                            <span>{value}/10</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-700"
                              style={{ width: `${(value / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Why marks lost */}
                    {item.why_lost?.length > 0 && (
                      <div className="mt-4 bg-red-500/10 border-l-4 border-red-500 p-4 rounded">
                        <p className="text-red-400 font-semibold mb-2">
                          Why marks were lost
                        </p>
                        <ul className="list-disc ml-5 text-sm text-slate-300">
                          {item.why_lost.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </details>
                );
              })}
            </div>


          {/* Back Button */}
          <div className="text-center mt-10">
            <button
              onClick={() => setInterviewResults(null)}
              className="px-8 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:scale-[1.03] transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }


  // INTERVIEW SCREEN
  if (interviewStarted) {
    return (
      <Interview
        questions={interviewData.generated_questions}
        onInterviewComplete={handleInterviewComplete}
      />
    );
  }

  // Interview session id missing
  if (interviewStarted && interviewData?.generated_questions) {
    return (
      <Interview
        questions={interviewData?.generated_questions || []}
        onInterviewComplete={handleInterviewComplete}
      />
    );
  }

  

  // VIEW DETAILS
  if (detailsOpen) {
    return (
      <ViewDetails
        sessionId={activeSessionId}
        onClose={() => setDetailsOpen(false)}
      />
    );
  }

  // DASHBOARD
      return (
      <div className="min-h-screen bg-[#0f172a] text-white">

        {/* Header */}
        <div className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">

          <div
            className="
              col-span-1 bg-white/10 backdrop-blur-xl
              border border-white/20 rounded-2xl p-6
              shadow-lg transition-all duration-300
              hover:scale-[1.02] hover:-translate-y-1
            "
          >
            <h2 className="text-xl font-semibold mb-4">
              Start New Interview
            </h2>

            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="w-full mb-4 text-sm text-gray-300
              file:bg-white/20 file:border-0 file:rounded-lg
              file:px-4 file:py-2 file:text-white"
            />

            <button
              onClick={handleUploadResume}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold transition
                ${loading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-white text-slate-900 hover:scale-[1.02]"}
              `}
            >
              {loading ? "Analyzing…" : "Upload & Analyze"}
            </button>

            {interviewData && (
              <>
                <button
                  onClick={handleStartInterview}
                  disabled={interviewStarted}
                  className="w-full mt-4 py-3 rounded-xl bg-green-500 text-slate-900 font-semibold hover:scale-[1.02] transition"
                >
                  Start AI Interview
                </button>

                <p className="text-sm text-gray-300 mt-3">
                  Category:{" "}
                  <span className="font-semibold text-white">
                    {interviewData.resume_category}
                  </span>
                </p>
              </>
            )}
          </div>

          {/* Recent Interviews */}
          <div
            className="
              md:col-span-2 bg-white/10 backdrop-blur-xl
              border border-white/20 rounded-2xl p-6
              shadow-lg
            "
          >
            <h2 className="text-xl font-semibold mb-4">
              Recent Interviews
            </h2>

            {sessions.length === 0 ? (
              <p className="text-gray-400">
                No previous interview sessions
              </p>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="
                      bg-white/5 border border-white/10 rounded-xl p-4
                      hover:bg-white/10 transition
                    "
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">
                        Score:{" "}
                        <span className="text-green-400">
                          {s.score ?? "Not scored"}
                        </span>
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(s.created_at).toLocaleString()}
                      </p>
                    </div>

                    <p className="text-sm text-gray-300 mt-1">
                      Questions: {s.num_questions}
                    </p>

                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => retakeInterview(s.id)}
                        className="px-4 py-1.5 rounded-lg bg-green-500 text-slate-900 text-sm font-semibold hover:scale-[1.05] transition"
                      >
                        Retake
                      </button>

                      <button
                        onClick={() => openDetails(s.id)}
                        className="px-4 py-1.5 rounded-lg bg-white/10 border border-white/20 text-sm hover:bg-white/20 transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  
}
