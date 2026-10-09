import React from 'react';
import { PhoneCall, Calendar } from 'lucide-react';
import { FollowUpLog } from '../../types';

interface Props {
  followUpLogs: FollowUpLog[];
  onOpenLogModal: () => void;
}

export const ScreenFollowUps: React.FC<Props> = ({ followUpLogs }) => {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#E8F2F1]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B2A] tracking-tight">
            Follow-up Queue & History
          </h1>
          <p className="text-base text-[#4B6361] mt-1">
            Track reached patients, callback schedules, and intervention notes
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#D0E3E1] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F9F8] border-b border-[#D0E3E1] text-[#4B6361] text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Patient</th>
                <th className="py-4 px-6">Call Reason</th>
                <th className="py-4 px-6">Outcome</th>
                <th className="py-4 px-6">Notes</th>
                <th className="py-4 px-6">Next Follow-up</th>
                <th className="py-4 px-6">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8F2F1]">
              {followUpLogs.map((log) => {
                const isReached = log.outcome === 'Reached';
                const isNoAnswer = log.outcome === 'No answer';

                return (
                  <tr key={log.id} className="hover:bg-[#F9FCFB] transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-[#1B2B2A] block">{log.patientName}</span>
                      <span className="text-xs text-[#4B6361]">{log.patientId}</span>
                    </td>
                    <td className="py-4 px-6 font-medium text-sm text-[#1B2B2A]">
                      {log.reason}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          isReached
                            ? 'bg-[#E9F5EF] text-[#2E7D5B]'
                            : isNoAnswer
                            ? 'bg-[#FFF1D6] text-[#8A5D00]'
                            : 'bg-[#FFE5D9] text-[#A62F18]'
                        }`}
                      >
                        {log.outcome}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B6361] max-w-xs truncate">
                      {log.notes}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-[#0F5F5C]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {log.nextFollowUpDate}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-[#4B6361]">
                      {log.loggedAt}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
