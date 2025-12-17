import { useState, useEffect } from 'react';
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
        generated_questions: data.questions,
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
    window.location.href = '/login';
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
      setScoring(true);

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

  // SCORING LOADER
  if (scoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-xl font-semibold text-gray-700">
            Scoring your interview…
          </p>
          <p className="text-gray-500">
            Please wait, this may take a moment.
          </p>
        </div>
      </div>
    );
  }

  // RESULTS PAGE
  if (interviewResults) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-xl">

          <h1 className="text-3xl font-bold mb-4 text-center">Interview Summary</h1>

          <div className="text-center text-5xl font-extrabold text-blue-600 mb-6">
            {interviewResults.overall_score}/100
          </div>

          <h2 className="text-xl font-semibold mb-3">Detailed Scores</h2>

          <div className="space-y-4">
            {Array.isArray(interviewResults.details) &&
            interviewResults.details.map((item, i) => (
              <div key={i} className="p-4 border bg-gray-50 rounded-lg">
                <p className="font-bold">Question {i + 1}</p>
                <p><strong>Score:</strong> {item.score}</p>

                {item.feedback?.length > 0 && (
                  <ul className="list-disc ml-6 mt-2 text-gray-700">
                    {item.feedback.map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => setInterviewResults(null)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
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
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">

  
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Start New Interview</h3>

          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="w-full mb-4 p-2 border rounded"
          />

          <button
            onClick={handleUploadResume}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Analyzing..." : "Upload & Analyze"}
          </button>

          {interviewData && (
            <>
              <button
                onClick={handleStartInterview}
                disabled={interviewStarted || loading}
                className="w-full bg-green-600 mt-4 text-white py-3 rounded-lg font-semibold"
              >
                Start AI Interview
              </button>

              <p className="text-sm text-gray-600 mt-2">
                Category: <strong>{interviewData.resume_category}</strong>
              </p>
            </>
          )}
        </div>

  
        <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Recent Interviews</h3>

          {sessions.length === 0 ? (
            <p className="text-gray-600">No previous sessions</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sessions.map((s) => (
                <div key={s.id} className="p-3 bg-blue-50 rounded-lg border">
                  <p className="font-semibold">
                    Score: {s.score ?? "Not scored"}
                  </p>
                  <p className="text-gray-700">
                    Questions: {s.num_questions} |{" "}
                    {new Date(s.created_at).toLocaleString()}
                  </p>

                  <button
                    onClick={() => retakeInterview(s.id)}
                    className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Retake
                  </button>

                  <button
                    onClick={() => openDetails(s.id)}
                    className="mt-2 ml-2 bg-gray-600 text-white px-3 py-1 rounded text-sm"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
