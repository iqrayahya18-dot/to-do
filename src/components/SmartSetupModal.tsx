import React, { useState } from 'react';
import { Check, ChevronRight, Sparkles, X } from 'lucide-react';
import { DayOfWeekName, UserProfile } from '../types/todo';
import { DAYS_OF_WEEK } from '../utils/dateAndParser';

interface SmartSetupModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onCompleteSetup: (updated: {
    name: string;
    wakeUpTime: string;
    sleepTime: string;
    workStudyHours: string;
    offDay: DayOfWeekName;
  }) => void;
}

export const SmartSetupModal: React.FC<SmartSetupModalProps> = ({
  isOpen,
  profile,
  onClose,
  onCompleteSetup,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile.name || 'Iqra');
  const [wakeUpTime, setWakeUpTime] = useState(profile.wakeUpTime || '07:00');
  const [sleepTime, setSleepTime] = useState(profile.sleepTime || '23:00');
  const [workStudyHours, setWorkStudyHours] = useState(
    profile.workStudyHours || '08:30 – 17:00'
  );
  const [offDay, setOffDay] = useState<DayOfWeekName>(
    profile.offDay || 'Sunday'
  );

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      onCompleteSetup({
        name: name.trim() || 'Iqra',
        wakeUpTime,
        sleepTime,
        workStudyHours,
        offDay,
      });
      setStep(1);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#161820] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#972828] dark:text-[#FCAD38]">
            <Sparkles className="w-4 h-4" />
            <span>Smart Routine Setup · Step {step} of 5</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
            aria-label="Close setup wizard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#972828] via-[#E45742] to-[#FCAD38] transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="py-2">
          {step === 1 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Step 1: What should we call you?
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                We’ll personalize your morning and evening dashboard greetings.
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (e.g. Iqra)"
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-base font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Step 2: Typical Wake-Up Time
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Your morning routine and breakfast will automatically align to this time.
              </p>
              <input
                type="time"
                value={wakeUpTime}
                onChange={(e) => setWakeUpTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-lg font-mono font-bold text-neutral-900 dark:text-white"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Step 3: Typical Sleep Time
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                We’ll schedule your evening reading and sleep wind-down reminder before bed.
              </p>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-lg font-mono font-bold text-neutral-900 dark:text-white"
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Step 4: Working / Study Hours
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                When do you focus on core study or work sessions?
              </p>
              <input
                type="text"
                value={workStudyHours}
                onChange={(e) => setWorkStudyHours(e.target.value)}
                placeholder="e.g. 08:30 – 17:00"
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-900 dark:text-white"
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Step 5: Weekly Off Day
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                We’ll automatically mark this day as your restorative Off Day.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setOffDay(d)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      offDay === d
                        ? 'bg-[#972828] text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              Back
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="min-h-[42px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#972828] to-[#E45742] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            {step < 5 ? (
              <>
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Generate Smart Routine</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
