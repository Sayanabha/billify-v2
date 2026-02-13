import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

const MonthlyExpenditure = () => {
  const [receipts, setReceipts] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await api.get('/receipts');
      setReceipts(response.data);
      calculateMonthlyData(response.data);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    }
  };

  const calculateMonthlyData = (receipts) => {
    const monthlyMap = {};
    let total = 0;

    receipts.forEach((receipt) => {
      const date = new Date(receipt.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap[monthYear]) {
        monthlyMap[monthYear] = 0;
      }
      
      monthlyMap[monthYear] += receipt.totalAmount;
      total += receipt.totalAmount;
    });

    const data = Object.keys(monthlyMap)
      .sort()
      .map((monthYear) => {
        const [year, month] = monthYear.split('-');
        const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return {
          month: monthName,
          amount: monthlyMap[monthYear],
        };
      });

    setMonthlyData(data);
    setTotalSpent(total);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Monthly Expenditure</h2>
      
      <div className="mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Spent</p>
          <p className="text-3xl font-bold text-blue-600">₹{totalSpent.toFixed(2)}</p>
        </div>
      </div>

      {monthlyData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#3b82f6" name="Amount (₹)" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500 text-center py-8">
          No data available. Upload receipts to see your monthly expenditure.
        </p>
      )}

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Monthly Breakdown</h3>
        <div className="space-y-2">
          {monthlyData.map((item, index) => (
            <div key={index} className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-700">{item.month}</span>
              <span className="font-semibold text-green-600">₹{item.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthlyExpenditure;