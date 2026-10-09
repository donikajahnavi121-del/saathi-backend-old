import React, { useState } from 'react';
import { Lock, HelpCircle, KeyRound, Phone } from 'lucide-react';
import { Translations } from '../../data/translations';

interface Props {
  onSignInSuccess: () => void;
  onNeedHelp: () => void;
  t: Translations;
}

export const ScreenSignIn: React.FC<Props> = ({
  onSignInSuccess,
  onNeedHelp,
  t,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('94123 78901');
  const [usePinMode, setUsePinMode] = useState(false);
  const [pin, setPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignInSuccess();
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-[#E8F2F1] overflow-y-auto">
      {/* Brand & Heading */}
      <div className="pt-6">
        <div className="w-14 h-14 rounded-2xl bg-[#0F5F5C] flex items-center justify-center text-white mb-6 shadow-sm">
          <Phone className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-[#1B2B2A] tracking-tight">
          {t.welcomeHeading}
        </h1>
        <p className="text-base text-[#4B6361] mt-2">
          Your daily medicine companion
        </p>
      </div>

      {/* Sign In Form */}
      <form onSubmit={handleSubmit} className="my-auto w-full flex flex-col gap-5">
        <div>
          <label className="block text-base font-semibold text-[#1B2B2A] mb-2">
            {t.mobileNumberLabel}
          </label>
          <div className="flex items-center bg-white rounded-2xl border-2 border-[#D0E3E1] px-4 h-14 focus-within:border-[#0F5F5C] transition-colors shadow-sm">
            <span className="text-lg font-bold text-[#0F5F5C] mr-3 pr-3 border-r border-[#D0E3E1]">
              +91
            </span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="98765 43210"
              className="w-full text-lg font-medium text-[#1B2B2A] bg-transparent outline-none tracking-wide"
              maxLength={12}
              required
            />
          </div>
        </div>

        {usePinMode && (
          <div>
            <label className="block text-base font-semibold text-[#1B2B2A] mb-2">
              4-Digit PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full h-14 bg-white rounded-2xl border-2 border-[#D0E3E1] px-4 text-center text-2xl tracking-[0.5em] font-bold text-[#1B2B2A] outline-none focus:border-[#0F5F5C] transition-colors shadow-sm"
              maxLength={4}
            />
          </div>
        )}

        {/* Big Teal Button (56px tall): Send code / Sign in */}
        <button
          type="submit"
          className="w-full h-14 bg-[#0F5F5C] hover:bg-[#0C4E4B] text-white rounded-2xl text-lg font-bold flex items-center justify-center transition-colors shadow-sm mt-2"
        >
          {usePinMode ? 'Sign In with PIN' : t.sendCode}
        </button>

        {/* Links below: "Use PIN instead" and "Need help?" */}
        <div className="flex items-center justify-between pt-2 text-base">
          <button
            type="button"
            onClick={() => setUsePinMode(!usePinMode)}
            className="flex items-center text-[#0F5F5C] font-semibold hover:underline"
          >
            <KeyRound className="w-4 h-4 mr-1.5" />
            {usePinMode ? 'Use SMS Code instead' : t.usePinInstead}
          </button>

          <button
            type="button"
            onClick={onNeedHelp}
            className="flex items-center text-[#4B6361] hover:text-[#1B2B2A] font-medium"
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            Need help?
          </button>
        </div>
      </form>

      {/* Privacy line: "Your information stays private." */}
      <div className="flex items-center justify-center gap-2 text-[#4B6361] pb-3 text-center">
        <Lock className="w-4 h-4 stroke-[2.2] text-[#0F5F5C]" />
        <span className="text-sm font-medium">{t.privacyGuaranteed}</span>
      </div>
    </div>
  );
};
