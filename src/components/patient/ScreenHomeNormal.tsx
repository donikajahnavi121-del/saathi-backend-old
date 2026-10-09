import React from 'react';
import { Pill, Lock } from 'lucide-react';
import { Translations } from '../../data/translations';

interface Props {
  onStartCheckIn: () => void;
  t: Translations;
  isCheckedInToday: boolean;
}

export const ScreenHomeNormal: React.FC<Props> = ({
  onStartCheckIn,
  t,
  isCheckedInToday,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
      {/* Top Section: Small Greeting */}
      <div>
        <p className="text-base font-medium text-[#4B6361]">{t.greeting}</p>
      </div>

      {/* Centre of screen: One huge teal button with simple pill icon */}
      <div className="flex flex-col items-center justify-center my-auto w-full">
        <button
          onClick={onStartCheckIn}
          className="w-full bg-[#0F5F5C] hover:bg-[#0C4E4B] text-white rounded-2xl p-7 shadow-sm transition-all duration-200 flex flex-col items-center justify-center text-center group active:scale-[0.99] border-2 border-[#0F5F5C]"
          style={{ minHeight: '180px' }}
          aria-label={t.checkInButton}
        >
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
            <Pill className="w-9 h-9 text-white stroke-[2.2]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white leading-tight">
            {t.checkInButton}
          </span>
          <span className="text-base text-white/90 mt-2 font-medium">
            {isCheckedInToday ? t.checkInSavedTitle : t.notDoneYet}
          </span>
        </button>
      </div>

      {/* Bottom Section: Privacy reassurance */}
      <div className="flex items-center justify-center gap-2 text-[#4B6361] pb-2 text-center">
        <Lock className="w-4 h-4 shrink-0 stroke-[2.2]" />
        <span className="text-sm font-medium">{t.privacyNote}</span>
      </div>
    </div>
  );
};
