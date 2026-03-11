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
        <div className="bg-white/5 p-8 rounded-xl border border-white/5 text-center text-gray-500">
          No pending deposits to verify.
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Driver</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Amount</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Proof</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Submitted</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                          {deposit.driver_name?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-text">{deposit.driver_name}</p>
                          <p className="text-xs text-gray-500 font-medium">{deposit.driver_phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-black text-sm">
                        K {deposit.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={deposit.proof_photo} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block w-12 h-12 rounded-lg border border-white/10 overflow-hidden hover:opacity-80 transition-opacity"
                        title="Click to view full size"
                      >
                        <img src={deposit.proof_photo} alt="Proof" className="w-full h-full object-cover" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-400 font-medium">{new Date(deposit.created_at).toLocaleDateString()}</p>
                      <p className="text-[10px] text-gray-500">{new Date(deposit.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleVerify(deposit.id, 'rejected')}
                          className="px-4 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerify(deposit.id, 'approved')}
                          className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-black hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletApprovals;
