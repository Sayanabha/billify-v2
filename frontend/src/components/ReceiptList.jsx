import { useState, useEffect } from 'react';
import api from '../api/axios';

const ReceiptList = ({ refresh }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchReceipts();
  }, [refresh]);

  const fetchReceipts = async () => {
    try {
      const response = await api.get('/receipts');
      setReceipts(response.data);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReceipt = async (id) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try {
        await api.delete(`/receipts/${id}`);
        fetchReceipts();
        setSelectedReceipt(null);
      } catch (error) {
        console.error('Error deleting receipt:', error);
      }
    }
  };

  const addItem = async (receiptId) => {
    const name = prompt('Item name:');
    const price = prompt('Item price:');
    const quantity = prompt('Quantity:', '1');

    if (name && price) {
      try {
        await api.post(`/receipts/${receiptId}/items`, {
          name,
          price: parseFloat(price),
          quantity: parseInt(quantity) || 1,
        });
        fetchReceipts();
        if (selectedReceipt?._id === receiptId) {
          const response = await api.get(`/receipts/${receiptId}`);
          setSelectedReceipt(response.data);
        }
      } catch (error) {
        console.error('Error adding item:', error);
      }
    }
  };

  const updateItem = async (receiptId, itemId) => {
    const item = selectedReceipt.items.find(i => i._id === itemId);
    const name = prompt('Item name:', item.name);
    const price = prompt('Item price:', item.price);
    const quantity = prompt('Quantity:', item.quantity);

    if (name && price) {
      try {
        await api.put(`/receipts/${receiptId}/items/${itemId}`, {
          name,
          price: parseFloat(price),
          quantity: parseInt(quantity) || 1,
        });
        fetchReceipts();
        const response = await api.get(`/receipts/${receiptId}`);
        setSelectedReceipt(response.data);
      } catch (error) {
        console.error('Error updating item:', error);
      }
    }
  };

  const deleteItem = async (receiptId, itemId) => {
    if (window.confirm('Delete this item?')) {
      try {
        await api.delete(`/receipts/${receiptId}/items/${itemId}`);
        fetchReceipts();
        const response = await api.get(`/receipts/${receiptId}`);
        setSelectedReceipt(response.data);
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading receipts...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">All Receipts</h2>
      
      {receipts.length === 0 ? (
        <p className="text-gray-500">No receipts found. Upload your first receipt!</p>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <div
              key={receipt._id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedReceipt(receipt)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{receipt.storeName}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(receipt.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Items: {receipt.items.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">
                    ₹{receipt.totalAmount.toFixed(2)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteReceipt(receipt._id);
                    }}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold">{selectedReceipt.storeName}</h3>
                <p className="text-gray-600">
                  {new Date(selectedReceipt.date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-lg">Items</h4>
                <button
                  onClick={() => addItem(selectedReceipt._id)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  + Add Item
                </button>
              </div>
              
              <div className="space-y-2">
                {selectedReceipt.items.map((item) => (
                  <div
                    key={item._id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => updateItem(selectedReceipt._id, item._id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(selectedReceipt._id, item._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-green-600">
                  ₹{selectedReceipt.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptList;