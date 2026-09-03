import React, { useState } from 'react';

const initialAssessments = [
  { id: 1, student: 'Aisha Bello', assessment: 'Quiz 1', score: 88 },
  { id: 2, student: 'Daniel James', assessment: 'Project', score: 76 },
  { id: 3, student: 'Grace Okafor', assessment: 'Midterm', score: 91 },
  { id: 4, student: 'Michael Stone', assessment: 'Quiz 2', score: 83 },
];

const TeacherGrades = () => {
  const [rows, setRows] = useState(initialAssessments);

  const updateScore = (id, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, score: Number(value) } : row))
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Assessments</h1>
        <p className="text-gray-500 mt-1">Enter and update marks for student assessments.</p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Assessment</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-gray-200">
                  <td className="px-4 py-3 text-gray-800">{row.student}</td>
                  <td className="px-4 py-3 text-gray-800">{row.assessment}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.score}
                      onChange={(e) => updateScore(row.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherGrades;
