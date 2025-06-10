import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import axios from 'axios';

const UserDashboard = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [timer, setTimer] = useState(30);
  const navigate = useNavigate();

  useEffect(() => {
    if (poll && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [poll, timer]);

  const joinSession = async () => {
    try {
      const snapshot = await db.collection('sessions').doc(sessionCode).get();
      if (snapshot.exists) {
        setPoll(snapshot.data());
      } else {
        alert('Invalid session code');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const submitResponse = async () => {
    if (timer === 0) return alert('Poll timed out');
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/responses`, {
        sessionCode,
        option: selectedOption
      });
      alert('Response submitted');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter Session Code"
          className="border p-2 w-full mb-2"
          value={sessionCode}
          onChange={(e) => setSessionCode(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white p-2 rounded"
          onClick={joinSession}
        >
          Join Session
        </button>
      </div>
      {poll && (
        <div className="animate-fadeIn">
          <h2 className="text-xl mb-2">{poll.pollQuestion}</h2>
          <p>Time Left: {timer}s</p>
          {poll.options.map((opt, idx) => (
            <div key={idx} className="mb-2">
              <input
                type="radio"
                name="option"
                value={opt}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              <label className="ml-2">{opt}</label>
            </div>
          ))}
          <button
            className="bg-green-500 text-white p-2 rounded"
            onClick={submitResponse}
            disabled={timer === 0}
          >
            Submit
          </button>
        </div>
      )}
      <button
        className="bg-red-500 text-white p-2 rounded mt-4"
        onClick={() => navigate('/')}
      >
        Logout
      </button>
    </div>
  );
};

export default UserDashboard;