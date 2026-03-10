import React, { useState, useEffect } from 'react';
import api from '../services/api';

const WalletApprovals: React.FC = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const res = await api.get('/wallet/admin/pending-deposits');
      if (res.data.success) {
        setDeposits(res.data.deposits);
      }
    } catch (error) {
      console.error('Failed to fetch pending deposits');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, status: 'approved' | 'rejected') => {
    try {
      if (!window.confirm(`Are you sure you want to ${status} this deposit?`)) return;

      const res = await api.post('/wallet/admin/verify-deposit', {
        transaction_id: id,
        status
      });
      if (res.data.success) {
        alert(`Deposit ${status} successfully`);
        setDeposits(deposits.filter(d => d.id !== id));
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      alert('Verification failed');
    }
  };

  if (loading) return <div className="p-8">Loading deposits...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Deposit Verifications</h1>
      
      {deposits.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-gray-500">
          No pending deposits to verify.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deposits.map((deposit) => (
            <div key={deposit.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <span className="font-semibold text-lg">K{deposit.amount}</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full uppercase">Pending</span>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Driver:</span>
                  <span className="font-medium">{deposit.driver_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium">{deposit.driver_phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium text-xs">{new Date(deposit.created_at).toLocaleString()}</span>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Payment Proof</p>
                  <a 
                    href={deposit.proof_photo} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
                  >
                    <img src={deposit.proof_photo} alt="Proof" className="w-full h-48 object-cover" />
                  </a>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => handleVerify(deposit.id, 'rejected')}
                    className="flex-1 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerify(deposit.id, 'approved')}
                    className="flex-1 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletApprovals;
