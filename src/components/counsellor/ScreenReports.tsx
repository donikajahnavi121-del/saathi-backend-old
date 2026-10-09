import React from 'react';
import { ShieldCheck, TrendingUp, Users, Clock } from 'lucide-react';

export const ScreenReports: React.FC = () => {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#E8F2F1]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B2B2A] tracking-tight">
          District Adherence & Impact Reports
        </h1>
        <p className="text-base text-[#4B6361] mt-1">
          Quarterly outcomes and default prevention analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-[#D0E3E1] shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#E9F5EF] text-[#2E7D5B] flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-3xl font-extrabold text-[#1B2B2A]">18 Potential Defaults</div>
          <div className="text-sm font-semibold text-[#2E7D5B] mt-1">Prevented this month</div>
          <p className="text-xs text-[#4B6361] mt-2">
            Early counsellor intervention reached patients before the critical 7-day default threshold.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#D0E3E1] shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#E8F2F1] text-[#0F5F5C] flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-3xl font-extrabold text-[#1B2B2A]">34 Hours Saved</div>
          <div className="text-sm font-semibold text-[#0F5F5C] mt-1">Per counsellor weekly</div>
          <p className="text-xs text-[#4B6361] mt-2">
            Eliminated blanket calls by focusing strictly on the 12 flagged patients who truly need help.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#D0E3E1] shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#FFF1D6] text-[#8A5D00] flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="text-3xl font-extrabold text-[#1B2B2A]">89.4% Adherence</div>
          <div className="text-sm font-semibold text-[#8A5D00] mt-1">Cohort average</div>
          <p className="text-xs text-[#4B6361] mt-2">
            Up from baseline 71.2% prior to Saathi proactive photo check-in deployment.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[#D0E3E1] shadow-sm">
        <h3 className="text-lg font-bold text-[#1B2B2A] mb-3">
          Clinical Adherence Principles
        </h3>
        <p className="text-sm text-[#4B6361] leading-relaxed">
          In national TB programs, the highest risk of drug default occurs during the transition between the Intensive and Continuation phases.
          By combining stigma-free daily photo check-ins (which require less than 20 seconds from the patient) with non-judgmental proactive support,
          Saathi turns passive surveillance into human-centered adherence partnership.
        </p>
      </div>
    </div>
  );
};
