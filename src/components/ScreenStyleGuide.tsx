import React from 'react';
import { Pill, Check, Info, ShieldCheck, ArrowRight } from 'lucide-react';

interface Props {
  onGoToPatientApp: () => void;
  onGoToCounsellorPortal: () => void;
}

export const ScreenStyleGuide: React.FC<Props> = ({
  onGoToPatientApp,
  onGoToCounsellorPortal,
}) => {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#E8F2F1] max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D0E3E1] text-xs font-bold text-[#0F5F5C] mb-3">
          <ShieldCheck className="w-4 h-4" />
          <span>Design System Specification (Screen 1)</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#1B2B2A] tracking-tight">
          Saathi Design System & Foundations
        </h1>
        <p className="text-lg text-[#4B6361] mt-2">
          Clean, minimal, production-quality healthcare app UI adhering strictly to non-stigmatizing medical UX standards.
        </p>
      </div>

      {/* Palette Tokens */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-[#D0E3E1]">
          <div className="h-16 rounded-xl bg-[#0F5F5C] mb-3 shadow-inner" />
          <span className="text-xs font-bold text-[#4B6361] uppercase block">Deep Teal Primary</span>
          <span className="text-base font-bold text-[#1B2B2A]">#0F5F5C</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D0E3E1]">
          <div className="h-16 rounded-xl bg-[#E8F2F1] mb-3 border border-[#D0E3E1]" />
          <span className="text-xs font-bold text-[#4B6361] uppercase block">Pale Mint Background</span>
          <span className="text-base font-bold text-[#1B2B2A]">#E8F2F1</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D0E3E1]">
          <div className="h-16 rounded-xl bg-[#1B2B2A] mb-3 shadow-inner" />
          <span className="text-xs font-bold text-[#4B6361] uppercase block">Dark Slate Text</span>
          <span className="text-base font-bold text-[#1B2B2A]">#1B2B2A</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D0E3E1]">
          <div className="h-16 rounded-xl bg-[#FFF1D6] mb-3 border border-[#FFE0A3]" />
          <span className="text-xs font-bold text-[#4B6361] uppercase block">Soft Amber (Alerts)</span>
          <span className="text-base font-bold text-[#1B2B2A]">#FFF1D6</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D0E3E1]">
          <div className="h-16 rounded-xl bg-[#2E7D5B] mb-3 shadow-inner" />
          <span className="text-xs font-bold text-[#4B6361] uppercase block">Calm Green (Success)</span>
          <span className="text-base font-bold text-[#1B2B2A]">#2E7D5B</span>
        </div>
      </div>

      {/* Rules Compliance Matrix */}
      <div className="bg-white rounded-2xl border border-[#D0E3E1] p-6 shadow-sm mb-8 space-y-4">
        <h2 className="text-xl font-bold text-[#1B2B2A]">Design Rules Checklist</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium text-[#1B2B2A]">
          <div className="flex items-center gap-3 p-3 bg-[#E9F5EF] rounded-xl text-[#2E7D5B]">
            <Check className="w-5 h-5 shrink-0 stroke-[3]" />
            <span>56px tall full-width buttons (`h-14`)</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#E9F5EF] rounded-xl text-[#2E7D5B]">
            <Check className="w-5 h-5 shrink-0 stroke-[3]" />
            <span>Body text 18px minimum (patient app)</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#E9F5EF] rounded-xl text-[#2E7D5B]">
            <Check className="w-5 h-5 shrink-0 stroke-[3]" />
            <span>Headings bold 24–28px, high contrast</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#E9F5EF] rounded-xl text-[#2E7D5B]">
            <Check className="w-5 h-5 shrink-0 stroke-[3]" />
            <span>White rounded cards (16px radius `rounded-2xl`)</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#E9F5EF] rounded-xl text-[#2E7D5B]">
            <Check className="w-5 h-5 shrink-0 stroke-[3]" />
            <span>Zero 3D, zero glassmorphism, flat 2D production design</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#E9F5EF] rounded-xl text-[#2E7D5B]">
            <Check className="w-5 h-5 shrink-0 stroke-[3]" />
            <span>App name &quot;Saathi&quot; — never mentions TB or disease</span>
          </div>
        </div>
      </div>

      {/* Quick Launch Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onGoToPatientApp}
          className="flex-1 h-14 bg-[#0F5F5C] hover:bg-[#0C4E4B] text-white rounded-2xl text-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <span>Launch Patient App (Screens 2–10)</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={onGoToCounsellorPortal}
          className="flex-1 h-14 bg-white border-2 border-[#0F5F5C] hover:bg-slate-50 text-[#0F5F5C] rounded-2xl text-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <span>Launch Counsellor Portal (Screens 11–15)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
