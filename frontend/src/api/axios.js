import axios from 'axios';

const api = axios.create({
  baseURL: 'https://billify-v2.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;