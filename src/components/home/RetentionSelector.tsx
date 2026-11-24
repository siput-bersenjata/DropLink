'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { ALLOWED_RETENTION_MONTHS, RetentionMonths } from '@/lib/validation/file-validator';

interface RetentionSelectorProps {
  value: RetentionMonths;
  onChange: (value: RetentionMonths) => void;
  disabled?: boolean;
}

export default function RetentionSelector({
  value,
  onChange,
  disabled,
}: RetentionSelectorProps) {
  return (
    <div className="w-full max-w-md mx-auto my-4 text-left">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
        <Clock className="w-4 h-4 text-blue-600" />
        <span>Masa Aktif File (Otomatis Terhapus):</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {ALLOWED_RETENTION_MONTHS.map((months) => {
          const isSelected = value === months;
          return (
            <button
              key={months}
              type="button"
              disabled={disabled}
              onClick={() => onChange(months)}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all border text-center ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {months} Bulan
            </button>
          );
        })}
      </div>
    </div>
  );
}
