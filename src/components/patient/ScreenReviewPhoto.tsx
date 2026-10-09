import React, { useState } from 'react';
import { Check, RotateCcw, Wifi } from 'lucide-react';
import { Translations } from '../../data/translations';

interface Props {
  onConfirmPhoto: () => void;
  onRetake: () => void;
  t: Translations;
}

export const ScreenReviewPhoto: React.FC<Props> = ({
  onConfirmPhoto,
  onRetake,
  t,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUsePhoto = () => {
    setIsUploading(true);
    let progress = 10;
    const interval = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => {
          onConfirmPhoto();
        }, 350);
      } else {
        setUploadProgress(progress);
      }
    }, 250);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-[#E8F2F1] overflow-y-auto">
      {/* Heading */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-[#1B2B2A] text-center tracking-tight">
          {t.isPhotoClear}
        </h1>
        <p className="text-sm text-[#4B6361] text-center mt-1">
          Make sure the medicine strip is in focus
        </p>
      </div>

      {/* Captured Photo Preview in a Rounded Card (16px radius) */}
      <div className="my-auto w-full aspect-[4/3] bg-white rounded-2xl p-3 border-2 border-[#D0E3E1] shadow-sm flex flex-col items-center justify-center overflow-hidden">
        <div className="relative w-full h-full rounded-xl bg-[#243332] overflow-hidden flex items-center justify-center">
          {/* Simulated clear capture preview */}
          <svg
            viewBox="0 0 320 240"
            className="w-full h-full object-cover"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="320" height="240" fill="#2E3F3D" />
            {/* Table surface */}
            <rect y="180" width="320" height="60" fill="#243332" />
            {/* Blister pack clearly visible */}
            <rect
              x="80"
              y="50"
              width="160"
              height="120"
              rx="12"
              fill="#D2E3E0"
              stroke="#FFFFFF"
              strokeWidth="4"
            />
            {/* Pill foils */}
            <circle cx="120" cy="85" r="18" fill="#E84A3B" />
            <circle cx="200" cy="85" r="18" fill="#E84A3B" />
            <circle cx="120" cy="135" r="18" fill="#E84A3B" />
            <circle cx="200" cy="135" r="18" fill="#D9534F" />
            {/* Crisp text foil */}
            <text x="100" y="112" fill="#0F5F5C" fontSize="10" fontWeight="bold">
              DAILY DOSE 4-FDC
            </text>
          </svg>
          <div className="absolute bottom-2 right-2 bg-[#2E7D5B] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
            <Check className="w-3 h-3" />
            Clear
          </div>
        </div>
      </div>

      {/* Buttons & Upload Progress Bar */}
      <div className="flex flex-col gap-3 pb-2">
        {isUploading ? (
          <div className="bg-white rounded-2xl p-4 border border-[#D0E3E1] shadow-sm">
            <div className="flex justify-between text-sm font-semibold text-[#1B2B2A] mb-2">
              <span>{t.savingPleaseWait}</span>
              <span>{uploadProgress}%</span>
            </div>
            {/* Slim upload progress bar */}
            <div className="w-full bg-[#E8F2F1] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0F5F5C] h-full transition-all duration-300 ease-out rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#4B6361] mt-3">
              <Wifi className="w-3.5 h-3.5 text-[#0F5F5C]" />
              <span>{t.slowInternetNote}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Primary Button (56px tall): "Use this photo" */}
            <button
              onClick={handleUsePhoto}
              className="w-full h-14 bg-[#0F5F5C] hover:bg-[#0C4E4B] text-white rounded-2xl text-lg font-bold flex items-center justify-center transition-colors shadow-sm"
            >
              {t.useThisPhoto}
            </button>

            {/* Secondary Button: "Retake" */}
            <button
              onClick={onRetake}
              className="w-full h-14 bg-white hover:bg-slate-50 text-[#1B2B2A] border-2 border-[#D0E3E1] rounded-2xl text-lg font-bold flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-5 h-5 mr-2 text-[#4B6361]" />
              {t.retake}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
