import { useEffect, useState } from 'react';
import { getSessionDetails } from '../utils/api';

export default function ViewDetails({ sessionId, onClose }) {

  
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (sessionId) {
      getSessionDetails(sessionId).then(data => {
        setSession(data);
      });
    }
  }, [sessionId]);

  
  if (!sessionId) {
    return <div className="p-6 text-center">Invalid session.</div>;
  }

  if (!session) {
    return <div className="p-6 text-center">Loading details...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
      <div className="bg-white max-w-3xl w-full p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        
        <h2 className="text-2xl font-bold mb-4 text-blue-700">
          Interview Session Details
        </h2>

        <p><strong>Score:</strong> {session.score ?? "Not Scored"}</p>
        <p><strong>Date:</strong> {new Date(session.created_at).toLocaleString()}</p>

        <h3 className="text-lg font-semibold mt-4">Resume Summary</h3>
        <p className="text-gray-700 whitespace-pre-wrap">
          {session.resume_text || "No Resume Data"}
        </p>

        <h3 className="text-lg font-semibold mt-4">Questions & Answers</h3>
        {session.user_answers?.length > 0 ? (
          <div className="space-y-3 mt-3">
            {session.user_answers.map((ua, index) => (
              <div key={index} className="border p-3 rounded-lg bg-gray-50">
                <p className="font-bold">Q{index + 1}: {ua.question}</p>
                <p className="mt-1 text-gray-700"><strong>Ans:</strong> {ua.answer}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No answers saved</p>
        )}

        <button
          onClick={onClose}
          className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
}
