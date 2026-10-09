import React from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { Translations } from '../../data/translations';

interface Props {
  onCheckInNow: () => void;
  onNeedHelp: () => void;
  t: Translations;
}

export const ScreenHomeMissed: React.FC<Props> = ({
  onCheckInNow,
  onNeedHelp,
  t,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
      {/* Small Greeting */}
      <div>
        <p className="text-base font-medium text-[#4B6361]">{t.greeting}</p>
      </div>

      {/* Gentle Amber Card: Centered */}
      <div className="my-auto">
        <div className="bg-[#FFF1D6] rounded-2xl p-6 border border-[#FFE0A3] shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#FFE5B4] flex items-center justify-center mb-4 text-[#8A5D00]">
            <Info className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B2B2A] tracking-tight leading-snug">
            {t.missedYesterdayTitle}
          </h2>
          <p className="text-lg text-[#1B2B2A]/80 mt-2 leading-relaxed">
            {t.missedYesterdaySubtext}
          </p>
        </div>

        {/* Two big buttons stacked (56px tall) */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onCheckInNow}
            className="w-full h-14 bg-[#0F5F5C] hover:bg-[#0C4E4B] text-white rounded-2xl text-lg font-bold flex items-center justify-center transition-colors shadow-sm"
          >
            {t.checkInNow}
          </button>

          <button
            onClick={onNeedHelp}
            className="w-full h-14 bg-white hover:bg-slate-50 text-[#1B2B2A] border-2 border-[#D0E3E1] rounded-2xl text-lg font-bold flex items-center justify-center transition-colors"
          >
            <HelpCircle className="w-5 h-5 mr-2 text-[#4B6361]" />
            {t.needHelp}
          </button>
        </div>
      </div>

      {/* Bottom spacer / clean breathing room */}
      <div className="text-center text-sm text-[#4B6361] pb-2">
        {t.privacyNote}
      </div>
    </div>
  );
};
