import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import Chart from 'chart.js/auto';
import axios from 'axios';

const AdminDashboard = () => {
  const [pollQuestion, setPollQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [sessionCode, setSessionCode] = useState('');
  const [results, setResults] = useState({});
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = document.getElementById('pollChart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Votes',
          data: [],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      }
    });

    const unsubscribe = onSnapshot(collection(db, 'responses'), (snapshot) => {
      const counts = {};
      snapshot.forEach(doc => {
        const { option } = doc.data();
        counts[option] = (counts[option] || 0) + 1;
      });
      chart.data.labels = Object.keys(counts);
      chart.data.datasets[0].data = Object.values(counts);
      chart.update();
      setResults(counts);
    });

    // Fetch history
    axios.get(`${process.env.REACT_APP_API_URL}/api/history`)
      .then(res => setHistory(res.data));

    return () => {
      chart.destroy();
      unsubscribe();
    };
  }, []);

  const handleCreatePoll = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/sessions`, {
        pollQuestion,
        options
      });
      setSessionCode(res.data.sessionCode);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Poll Question"
          className="border p-2 w-full mb-2"
          value={pollQuestion}
          onChange={(e) => setPollQuestion(e.target.value)}
        />
        {options.map((opt, idx) => (
          <input
            key={idx}
            type="text"
            placeholder={`Option ${idx + 1}`}
            className="border p-2 w-full mb-2"
            value={opt}
            onChange={(e) => {
              const newOptions = [...options];
              newOptions[idx] = e.target.value;
              setOptions(newOptions);
            }}
          />
        ))}
        <button
          className="bg-blue-500 text-white p-2 rounded"
          onClick={handleCreatePoll}
        >
          Create Poll
        </button>
        {sessionCode && <p className="mt-2">Session Code: {sessionCode}</p>}
      </div>
      <canvas id="pollChart" className="mb-4"></canvas>
      <h2 className="text-xl font-bold mb-2">Session History</h2>
      <ul>
        {history.map(session => (
          <li key={session.id}>{session.pollQuestion} - {session.createdAt.toDate().toLocaleString()}</li>
        ))}
      </ul>
      <button
        className="bg-red-500 text-white p-2 rounded mt-4"
        onClick={() => navigate('/')}
      >
        Logout
      </button>
    </div>
  );
};

export default AdminDashboard;