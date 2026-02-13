import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UploadReceipt from './components/UploadReceipt';
import ReceiptList from './components/ReceiptList';
import MonthlyExpenditure from './components/MonthlyExpenditure';

const queryClient = new QueryClient();

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        
        <nav className="bg-blue-600 text-white p-4 shadow-lg">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold">Billify</h1>
            <p className="text-sm text-blue-100">Smart Receipt Scanner & Expense Tracker</p>
          </div>
        </nav>

        <div className="container mx-auto p-4">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Upload Receipt
            </button>
            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'receipts'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Receipts
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Monthly Expenditure
            </button>
          </div>

          {/* Tab Content */}
          <div className="max-w-4xl mx-auto">
            {activeTab === 'upload' && <UploadReceipt onUploadSuccess={handleUploadSuccess} />}
            {activeTab === 'receipts' && <ReceiptList refresh={refreshKey} />}
            {activeTab === 'monthly' && <MonthlyExpenditure />}
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;