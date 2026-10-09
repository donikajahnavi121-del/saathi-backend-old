import React from 'react';
import { Phone, ArrowRight, UserCheck } from 'lucide-react';
import { Patient } from '../../types';

interface Props {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onCallPatient: (patient: Patient) => void;
  onViewAllPatients: () => void;
}

export const ScreenCounsellorDashboard: React.FC<Props> = ({
  patients,
  onSelectPatient,
  onCallPatient,
  onViewAllPatients,
}) => {
  // 5 rows that need attention today
  const needsAttentionList = patients
    .filter((p) => p.riskBand === 'High' || p.riskBand === 'Medium')
    .slice(0, 5);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#E8F2F1]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B2A] tracking-tight">
            Dashboard
          </h1>
          <p className="text-base text-[#4B6361] mt-1">
            South District TB Adherence Care Hub • Today, 9 October 2026
          </p>
        </div>
      </div>

      {/* Top row of 4 simple metrics (White rounded cards, no charts) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {/* Metric 1: Patients 200 */}
        <div className="bg-white rounded-2xl p-6 border border-[#D0E3E1] shadow-sm">
          <span className="text-sm font-semibold text-[#4B6361] uppercase tracking-wider block">
            Patients
          </span>
          <div className="text-4xl font-extrabold text-[#1B2B2A] mt-2 tracking-tight">
            200
          </div>
          <span className="text-sm text-[#4B6361] mt-1 block">Active on regimen</span>
        </div>

        {/* Metric 2: Checked in today 164 */}
        <div className="bg-white rounded-2xl p-6 border border-[#D0E3E1] shadow-sm">
          <span className="text-sm font-semibold text-[#4B6361] uppercase tracking-wider block">
            Checked in today
          </span>
          <div className="text-4xl font-extrabold text-[#2E7D5B] mt-2 tracking-tight">
            164
          </div>
          <span className="text-sm text-[#2E7D5B] font-medium mt-1 block">82% daily rate</span>
        </div>

        {/* Metric 3: Need attention 12 */}
        <div className="bg-white rounded-2xl p-6 border border-[#D0E3E1] shadow-sm">
          <span className="text-sm font-semibold text-[#4B6361] uppercase tracking-wider block">
            Need attention
          </span>
          <div className="text-4xl font-extrabold text-[#8A5D00] mt-2 tracking-tight">
            12
          </div>
          <span className="text-sm text-[#8A5D00] font-medium mt-1 block">Missed check-in or alert</span>
        </div>

        {/* Metric 4: Follow-ups due 7 */}
        <div className="bg-white rounded-2xl p-6 border border-[#D0E3E1] shadow-sm">
          <span className="text-sm font-semibold text-[#4B6361] uppercase tracking-wider block">
            Follow-ups due
          </span>
          <div className="text-4xl font-extrabold text-[#0F5F5C] mt-2 tracking-tight">
            7
          </div>
          <span className="text-sm text-[#0F5F5C] font-medium mt-1 block">Scheduled for today</span>
        </div>
      </div>

      {/* Main Area: "Needs attention today" list of 5 rows (Lots of white space, no chart tiles) */}
      <div className="bg-white rounded-2xl border border-[#D0E3E1] shadow-sm p-6">
        <div className="flex items-center justify-between pb-6 border-b border-[#E8F2F1]">
          <div>
            <h2 className="text-xl font-bold text-[#1B2B2A] tracking-tight">
              Needs attention today
            </h2>
            <p className="text-sm text-[#4B6361] mt-0.5">
              Ranked by intervention priority • Target counsellor outreach
            </p>
          </div>
          <button
            onClick={onViewAllPatients}
            className="flex items-center gap-1.5 text-base font-bold text-[#0F5F5C] hover:text-[#0C4E4B]"
          >
            <span>View priority queue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 5 Rows */}
        <div className="divide-y divide-[#E8F2F1]">
          {needsAttentionList.map((patient, index) => {
            const isHigh = patient.riskBand === 'High';
            return (
              <div
                key={patient.id}
                className="py-5 flex items-center justify-between hover:bg-[#F4F9F8] transition-colors rounded-xl px-4"
              >
                {/* Column 1: Rank & Patient Details */}
                <div className="flex items-center gap-4 min-w-[220px]">
                  <span className="w-7 h-7 rounded-full bg-[#E8F2F1] text-xs font-bold text-[#4B6361] flex items-center justify-center shrink-0">
                    #{index + 1}
                  </span>
                  <div>
                    <button
                      onClick={() => onSelectPatient(patient)}
                      className="text-lg font-bold text-[#1B2B2A] hover:text-[#0F5F5C] text-left hover:underline"
                    >
                      {patient.id} {patient.firstName}
                    </button>
                    <div className="text-sm text-[#4B6361]">{patient.name} • {patient.phone}</div>
                  </div>
                </div>

                {/* Column 2: Risk Chip */}
                <div className="min-w-[100px]">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      isHigh
                        ? 'bg-[#FFE5D9] text-[#A62F18]'
                        : 'bg-[#FFF1D6] text-[#8A5D00]'
                    }`}
                  >
                    {patient.riskBand} Risk
                  </span>
                </div>

                {/* Column 3: One-line plain reason */}
                <div className="flex-1 px-6">
                  <div className="text-base font-medium text-[#1B2B2A]">
                    {patient.oneLineReason}
                  </div>
                  <div className="text-xs text-[#4B6361] mt-0.5">
                    Last contact: {patient.lastContact}
                  </div>
                </div>

                {/* Column 4: Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => onCallPatient(patient)}
                    className="h-10 px-4 bg-[#0F5F5C] hover:bg-[#0C4E4B] text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call</span>
                  </button>

                  <button
                    onClick={() => onSelectPatient(patient)}
                    className="h-10 px-4 bg-white border border-[#D0E3E1] hover:bg-slate-50 text-[#1B2B2A] rounded-xl text-sm font-semibold transition-colors"
                  >
                    <UserCheck className="w-4 h-4 mr-1.5 inline" />
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
