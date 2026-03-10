import React, { useState, useEffect } from 'react';
import api from '../services/api';

const FinancialSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    trip_deduction: 3,
    min_deposit: 20,
    max_deposit: 500,
    min_online_balance: 5,
    low_balance_warning: 10
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/financial-settings');
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch financial settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/financial-settings', { settings });
      if (res.data.success) {
        alert('Financial settings updated successfully');
      }
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Financial Control Panel</h1>
      
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trip Deduction Amount (K)
          </label>
          <p className="text-xs text-gray-500 mb-2">Amount deducted from driver wallet after each completed trip.</p>
          <input
            type="number"
            className="w-full px-4 py-2 border rounded-lg"
            value={settings.trip_deduction}
            onChange={(e) => setSettings({ ...settings, trip_deduction: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Deposit Allowed (K)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg"
              value={settings.min_deposit}
              onChange={(e) => setSettings({ ...settings, min_deposit: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Deposit Allowed (K)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg"
              value={settings.max_deposit}
              onChange={(e) => setSettings({ ...settings, max_deposit: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Balance to Go Online (K)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg"
              value={settings.min_online_balance}
              onChange={(e) => setSettings({ ...settings, min_online_balance: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Low Balance Warning (K)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg"
              value={settings.low_balance_warning}
              onChange={(e) => setSettings({ ...settings, low_balance_warning: e.target.value })}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default FinancialSettings;
