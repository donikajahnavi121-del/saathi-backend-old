import React, { useState } from 'react';
import { Search, Phone } from 'lucide-react';
import { Patient, RiskLevel } from '../../types';

interface Props {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onCallPatient: (patient: Patient) => void;
}

export const ScreenPriorityQueue: React.FC<Props> = ({
  patients,
  onSelectPatient,
  onCallPatient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<RiskLevel | 'All'>('All');

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk = filterRisk === 'All' || patient.riskBand === filterRisk;

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#E8F2F1]">
      {/* Title & Context */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B2B2A] tracking-tight">
          Priority Queue
        </h1>
        <p className="text-base text-[#4B6361] mt-1">
          Ranked patient list for proactive counsellor intervention
        </p>
      </div>

      {/* Search Bar & Filter Chips Above */}
      <div className="bg-white rounded-2xl p-5 border border-[#D0E3E1] shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-[#4B6361] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or name (e.g. P-0142, Anita)..."
            className="w-full h-11 pl-11 pr-4 bg-[#F4F9F8] border border-[#D0E3E1] rounded-xl text-base text-[#1B2B2A] outline-none focus:border-[#0F5F5C] transition-colors"
          />
        </div>

        {/* Filter Chips: All, High, Medium, Low */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-sm font-semibold text-[#4B6361] mr-1">Filter:</span>
          {(['All', 'High', 'Medium', 'Low'] as const).map((risk) => {
            const isActive = filterRisk === risk;
            return (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#0F5F5C] text-white shadow-xs'
                    : 'bg-[#F4F9F8] text-[#4B6361] hover:bg-[#E8F2F1] hover:text-[#1B2B2A] border border-[#D0E3E1]'
                }`}
              >
                {risk}
              </button>
            );
          })}
        </div>
      </div>

      {/* Priority Queue Table (Max 6 Columns, Comfortable Row Height) */}
      <div className="bg-white rounded-2xl border border-[#D0E3E1] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F9F8] border-b border-[#D0E3E1] text-[#4B6361] text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6 w-16">Rank</th>
                <th className="py-4 px-6">Patient</th>
                <th className="py-4 px-6 w-36">Risk Level</th>
                <th className="py-4 px-6">Reason</th>
                <th className="py-4 px-6 w-36">Last Contact</th>
                <th className="py-4 px-6 w-32 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8F2F1]">
              {filteredPatients.map((patient, idx) => {
                const isHigh = patient.riskBand === 'High';
                const isMed = patient.riskBand === 'Medium';

                return (
                  <tr
                    key={patient.id}
                    className="hover:bg-[#F9FCFB] transition-colors group"
                  >
                    {/* 1. Rank */}
                    <td className="py-5 px-6 font-bold text-base text-[#4B6361]">
                      #{idx + 1}
                    </td>

                    {/* 2. Patient ID and First Name */}
                    <td className="py-5 px-6">
                      <button
                        onClick={() => onSelectPatient(patient)}
                        className="text-lg font-bold text-[#1B2B2A] hover:text-[#0F5F5C] hover:underline text-left block"
                      >
                        {patient.id} {patient.firstName}
                      </button>
                      <div className="text-xs text-[#4B6361]">{patient.name}</div>
                    </td>

                    {/* 3. Risk Label Chip */}
                    <td className="py-5 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          isHigh
                            ? 'bg-[#FFE5D9] text-[#A62F18]'
                            : isMed
                            ? 'bg-[#FFF1D6] text-[#8A5D00]'
                            : 'bg-[#E9F5EF] text-[#2E7D5B]'
                        }`}
                      >
                        {patient.riskBand}
                      </span>
                    </td>

                    {/* 4. One-line Reason */}
                    <td className="py-5 px-6 text-base font-medium text-[#1B2B2A]">
                      {patient.oneLineReason}
                    </td>

                    {/* 5. Last Contact */}
                    <td className="py-5 px-6 text-sm text-[#4B6361] font-medium">
                      {patient.lastContact}
                    </td>

                    {/* 6. Call Button */}
                    <td className="py-5 px-6 text-right">
                      <button
                        onClick={() => onCallPatient(patient)}
                        className="h-10 px-4 bg-[#0F5F5C] hover:bg-[#0C4E4B] text-white rounded-xl text-sm font-bold inline-flex items-center gap-2 transition-colors shadow-xs"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#4B6361]">
                    No patients match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
