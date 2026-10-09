import React, { useState } from 'react';
import { Lock, ShieldCheck, HeartPulse, User, KeyRound, Building2 } from 'lucide-react';

interface Props {
  onLoginSuccess: (counsellorName: string, district: string) => void;
  onBackToPatientApp: () => void;
}

export const ScreenCounsellorLogin: React.FC<Props> = ({
  onLoginSuccess,
  onBackToPatientApp,
}) => {
  const [email, setEmail] = useState('sunita.rao@delhihealth.gov.in');
  const [password, setPassword] = useState('••••••••');
  const [district, setDistrict] = useState('South Delhi - Chirag Delhi TB Unit');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter your Counsellor ID and security password.');
      return;
    }
    onLoginSuccess('Sunita Rao', district);
  };

  const handleQuickDemoLogin = () => {
    onLoginSuccess('Sunita Rao', district);
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-6 bg-[#E8F2F1] min-h-[600px]">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-[#D0E3E1] shadow-xl">
        {/* Brand & Emblem */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#0F5F5C] text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <HeartPulse className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold text-[#0F5F5C] uppercase tracking-wider block">
            National Health Mission • Adherence Portal
          </span>
          <h1 className="text-2xl font-extrabold text-[#1B2B2A] mt-1 tracking-tight">
            Counsellor Sign In
          </h1>
          <p className="text-sm text-[#4B6361] mt-1">
            Restricted to authorized TB adherence field workers
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-[#FFE5D9] text-[#A62F18] rounded-xl text-sm font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Field 1: Official Email / ID */}
          <div>
            <label className="block text-sm font-bold text-[#1B2B2A] mb-1.5">
              Official Email / Counsellor ID
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-[#4B6361] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@delhihealth.gov.in"
                className="w-full h-12 pl-11 pr-4 bg-white border-2 border-[#D0E3E1] rounded-xl text-sm font-medium text-[#1B2B2A] outline-none focus:border-[#0F5F5C] transition-colors"
                required
              />
            </div>
          </div>

          {/* Field 2: Password */}
          <div>
            <label className="block text-sm font-bold text-[#1B2B2A] mb-1.5">
              Secure Passcode / PIN
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-[#4B6361] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-11 pr-4 bg-white border-2 border-[#D0E3E1] rounded-xl text-sm font-medium text-[#1B2B2A] outline-none focus:border-[#0F5F5C] transition-colors"
                required
              />
            </div>
          </div>

          {/* Field 3: District Clinic */}
          <div>
            <label className="block text-sm font-bold text-[#1B2B2A] mb-1.5">
              Assigned Health Center / Unit
            </label>
            <div className="relative">
              <Building2 className="w-5 h-5 text-[#4B6361] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-white border-2 border-[#D0E3E1] rounded-xl text-sm font-medium text-[#1B2B2A] outline-none focus:border-[#0F5F5C] transition-colors cursor-pointer"
              >
                <option value="South Delhi - Chirag Delhi TB Unit">
                  South Delhi - Chirag Delhi TB Unit
                </option>
                <option value="South East Delhi - Lajpat Nagar Clinic">
                  South East Delhi - Lajpat Nagar Clinic
                </option>
                <option value="Central Delhi - Daryaganj Chest Clinic">
                  Central Delhi - Daryaganj Chest Clinic
                </option>
                <option value="West Delhi - Rajouri Garden PHC">
                  West Delhi - Rajouri Garden PHC
                </option>
              </select>
            </div>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            className="w-full h-14 bg-[#0F5F5C] hover:bg-[#0C4E4B] text-white rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-colors shadow-sm mt-2"
          >
            <Lock className="w-4 h-4" />
            <span>Authenticate & Open Portal</span>
          </button>
        </form>

        {/* Demo Convenience Button */}
        <div className="mt-4 pt-4 border-t border-[#E8F2F1] text-center">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="text-xs font-bold text-[#0F5F5C] bg-[#E9F5EF] px-3 py-1.5 rounded-lg hover:bg-[#D5EFE3] transition-colors"
          >
            ⚡ Quick Demo Sign In (1-Click)
          </button>
        </div>

        {/* Security Reassurance */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#4B6361]">
          <ShieldCheck className="w-4 h-4 text-[#0F5F5C]" />
          <span>Patient records encrypted & restricted by role</span>
        </div>

        {/* Link back to Patient Experience */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBackToPatientApp}
            className="text-sm font-medium text-[#4B6361] hover:text-[#1B2B2A] hover:underline"
          >
            ← Return to Patient Companion App
          </button>
        </div>
      </div>
    </div>
  );
};
