import React from 'react';
import { Check } from 'lucide-react';
import { Translations } from '../../data/translations';

interface Props {
  onViewHistory: () => void;
  onBackToHome: () => void;
  onReportProblems?: () => void;
  t: Translations;
}

export const ScreenCheckInSuccess: React.FC<Props> = ({
  onViewHistory,
  onBackToHome,
  onReportProblems,
  t,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
      <div />

      {/* Main Success Container */}
      <div className="flex flex-col items-center text-center my-auto">
        {/* Large calm green check circle */}
        <div className="w-24 h-24 rounded-full bg-[#E9F5EF] flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#2E7D5B] flex items-center justify-center shadow-sm">
            <Check className="w-10 h-10 text-white stroke-[3]" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-[#1B2B2A] tracking-tight">
          {t.checkInSavedTitle}
        </h1>
        <p className="text-xl text-[#4B6361] mt-2">
          {t.checkInSavedSubtext}
        </p>

        {onReportProblems && (
          <button
            onClick={onReportProblems}
            className="mt-6 text-base font-semibold text-[#0F5F5C] hover:underline"
          >
            {t.anyProblemTitle}
          </button>
        )}
      </div>

      {/* Bottom actions: One full-width secondary button and a text link */}
      <div className="flex flex-col items-center gap-4 w-full pb-4">
        <button
          onClick={onViewHistory}
          className="w-full h-14 bg-white hover:bg-slate-50 text-[#1B2B2A] border-2 border-[#D0E3E1] rounded-2xl text-lg font-bold flex items-center justify-center transition-colors shadow-sm"
        >
          {t.viewMyHistory}
        </button>

        <button
          onClick={onBackToHome}
          className="text-lg font-medium text-[#0F5F5C] hover:text-[#0C4E4B] underline underline-offset-4 py-2"
        >
          {t.backToHome}
        </button>
      </div>
    </div>
  );
};
