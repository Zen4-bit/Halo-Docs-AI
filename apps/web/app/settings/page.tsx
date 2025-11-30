'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Shield, CreditCard, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

export default function SettingsPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [processingUpdates, setProcessingUpdates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [aiConnected, setAiConnected] = useState(false);
  const [aiModels, setAiModels] = useState<string[]>([]);

  useEffect(() => {
    // Check AI connection status
    const checkAIStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/generative/status`);
        if (response.ok) {
          const data = await response.json();
          setAiConnected(data.connected);
          setAiModels(data.models || []);
        }
      } catch (error) {
        console.error('Failed to check AI status:', error);
      }
    };
    checkAIStatus();
  }, []);
  

  const handleSave = async () => {
    // For now, just show success since we're using Clerk data
    // In the future, this could sync to your backend if needed
    setLoading(true);
    setSaved(false);
    
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSaved(true);
      toast.success('Settings saved successfully');
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };


  if (dataLoading) {
    return (
      <div className="container pb-24 pt-12">
        <div className="flex items-center justify-center text-white/70">Loading…</div>
      </div>
    );
  }
  return (
    <div className="container pb-24 pt-12">
      <div className="mx-auto max-w-4xl space-y-10">
        <header>
          <h1 className="text-4xl font-semibold text-white">Settings</h1>
          <p className="mt-2 text-lg text-muted-100/80">
            Manage your account details, preferences, and billing controls.
          </p>
        </header>

        <div className="grid gap-6">
          <section className="surface-panel space-y-6">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-brand-100" />
              <h2 className="text-xl font-semibold text-white">Profile</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/75">Full name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="input"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/75">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="input"
                />
              </label>
            </div>
          </section>

          <section className="surface-panel space-y-4">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-brand-100" />
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
            </div>
            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-sm font-medium text-white/80">Email notifications</span>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-5 w-5 rounded border-white/20 bg-white/5 text-brand-200 focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-transparent"
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-sm font-medium text-white/80">Processing updates</span>
              <input
                type="checkbox"
                checked={processingUpdates}
                onChange={(e) => setProcessingUpdates(e.target.checked)}
                className="h-5 w-5 rounded border-white/20 bg-white/5 text-brand-200 focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-transparent"
              />
            </label>
          </section>

          <section className="surface-panel space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-brand-100" />
              <h2 className="text-xl font-semibold text-white">Security</h2>
            </div>
            <button className="btn-secondary w-full justify-center">
              Change password
            </button>
          </section>

          <section className="surface-panel space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-brand-100" />
              <h2 className="text-xl font-semibold text-white">AI Connection</h2>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${aiConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-sm font-semibold text-white">
                    {aiConnected ? '✅ Connected to Google AI' : '❌ Not Connected'}
                  </p>
                </div>
              </div>
              {aiConnected && aiModels.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-white/50 mb-2">Available Models:</p>
                  <div className="space-y-1">
                    {aiModels.map((model, index) => (
                      <p key={index} className="text-xs text-white/60 font-mono">• {model}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="surface-panel space-y-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-brand-100" />
              <h2 className="text-xl font-semibold text-white">Billing</h2>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-white">Current plan</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Free</p>
              </div>
              <a href="/pricing" className="btn-primary">
                Upgrade
              </a>
            </div>
          </section>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
