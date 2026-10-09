import React from 'react';
import { Sparkles, PhoneCall } from 'lucide-react';
import { Patient } from '../../types';

interface Props {
  patient: Patient;
  onTakeSuggestedAction: () => void;
}

export const ScreenWhyFlaggedPanel: React.FC<Props> = ({
  patient,
  onTakeSuggestedAction,
}) => {
  const isHigh = patient.riskBand === 'High';
  const isMed = patient.riskBand === 'Medium';

  return (
    <div className="bg-white rounded-2xl border border-[#D0E3E1] p-6 shadow-sm">
      {/* Panel Top Header: Risk Chip & One sentence summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E8F2F1]">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-[#1B2B2A] tracking-tight">
              Why this patient is flagged
            </h3>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                isHigh
                  ? 'bg-[#FFE5D9] text-[#A62F18]'
                  : isMed
                  ? 'bg-[#FFF1D6] text-[#8A5D00]'
                  : 'bg-[#E9F5EF] text-[#2E7D5B]'
              }`}
            >
              {patient.riskBand} risk
            </span>
          </div>
          <p className="text-base text-[#4B6361] mt-1.5 leading-relaxed">
            {patient.flagSummary}
          </p>
        </div>
      </div>

      {/* Main Body: Ranked List of 4 Plain-Language Reasons (Left) + Suggested Next Step (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Side (7 cols): Ranked list of plain-language reasons with small horizontal bars */}
        <div className="lg:col-span-7 space-y-4">
          <span className="text-xs font-bold text-[#4B6361] uppercase tracking-wider block">
            Key Contributing Drivers
          </span>

          <div className="space-y-4">
            {patient.reasons.map((reason, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm font-semibold text-[#1B2B2A]">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#E8F2F1] text-xs font-bold text-[#0F5F5C] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{reason.text}</span>
                  </span>
                  <span className="text-xs text-[#4B6361] font-medium">
                    {reason.impact}% weight
                  </span>
                </div>

                {/* Small horizontal impact bar */}
                <div className="w-full bg-[#E8F2F1] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      idx === 0
                        ? 'bg-[#0F5F5C]'
                        : idx === 1
                        ? 'bg-[#147975]'
                        : 'bg-[#5B9592]'
                    }`}
                    style={{ width: `${reason.impact}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side (5 cols): "Suggested next step" card */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#FFF1D6] rounded-2xl p-6 border border-[#FFE0A3] shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-[#8A5D00] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Suggested Next Step</span>
            </div>
            <p className="text-lg font-bold text-[#1B2B2A] leading-snug">
              {patient.suggestedAction}
            </p>
            <p className="text-xs text-[#8A5D00] mt-2 leading-relaxed">
              Timely supportive intervention prevents habitual dropout and protects drug sensitivity.
            </p>
          </div>

          <button
            onClick={onTakeSuggestedAction}
            className="w-full h-12 bg-[#0F5F5C] hover:bg-[#0C4E4B] text-white rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-colors mt-6 shadow-xs"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call Patient Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
