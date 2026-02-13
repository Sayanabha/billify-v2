import { useState } from 'react';
import api from '../api/axios';

const UploadReceipt = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const response = await api.post('/receipts/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        alert('Receipt uploaded and parsed successfully!');
        setFile(null);
        setPreview(null);
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload receipt');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Upload Receipt</h2>
      
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Select Receipt Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {preview && (
        <div className="mb-4">
          <img
            src={preview}
            alt="Receipt preview"
            className="max-w-full h-auto max-h-64 rounded-lg border"
          />
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Upload & Parse Receipt'}
      </button>
    </div>
  );
};

export default UploadReceipt;