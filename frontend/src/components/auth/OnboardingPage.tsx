import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Hash, BookOpen, Calendar, Users, ShieldCheck, Loader2, LogOut, ArrowRight } from 'lucide-react';
import { studentsApi } from '../../api/students.api';
import { toast } from '../../utils/toast';

export const BRANCHES = [
  'B.Tech - Computer Science and Engineering',
  'B.Tech - Information Technology',
  'B.Tech - Electronics and Communication',
  'B.Tech - Mechanical Engineering',
  'B.Tech - Civil Engineering',
  'B.Tech - Electrical Engineering',
];

const GENDERS = ['Male', 'Female', 'Other'];

const inputClass =
  'block w-full pl-10 pr-3 bg-white border border-gray-300 rounded-lg py-2.5 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors';

interface OnboardingPageProps {
  user: { name: string; email: string; avatarUrl?: string };
  onComplete: () => void;
  onLogout: () => void;
}

const Field = ({
  label,
  icon: IconComp,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <IconComp className="h-5 w-5 text-gray-400" />
      </div>
      {children}
    </div>
  </div>
);

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ user, onComplete, onLogout }) => {
  const [rollNo, setRollNo] = useState('');
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [batchYear, setBatchYear] = useState(new Date().getFullYear() + 4);
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { student } = await studentsApi.onboard({
        rollNo: rollNo.trim(),
        branch,
        batchYear,
        gender,
        phone: phone.trim(),
      });

      toast.success(
        student.supersetId
          ? `Profile created. Your Superset ID is ${student.supersetId}`
          : 'Profile created successfully'
      );
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Could not create your profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex w-fit items-center gap-3">
            <div className="rounded-xl bg-emerald-600 p-2.5 shadow-lg shadow-emerald-200/50">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">SUPERSET</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Complete your profile</h1>
          <p className="mt-2 text-sm text-gray-500">
            Signed in as <span className="font-medium text-gray-700">{user.email}</span>. We just
            need a few academic details before you can continue.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/50 sm:p-8">
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-xs leading-relaxed text-emerald-800">
              These details are used for placement eligibility and cannot be changed later without
              coordinator approval. Your Superset ID is generated automatically on submit.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Roll No" icon={Hash}>
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className={inputClass}
                  placeholder="2022BTCS001"
                />
              </Field>
              <Field label="Batch Year" icon={Calendar}>
                <input
                  type="number"
                  required
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 10}
                  value={batchYear}
                  onChange={(e) => setBatchYear(parseInt(e.target.value, 10))}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Branch" icon={BookOpen}>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className={`${inputClass} cursor-pointer appearance-none`}
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Gender" icon={Users}>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={`${inputClass} cursor-pointer appearance-none`}
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Phone (optional)" icon={Users}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="98765 43210"
              />
            </Field>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/50 transition-all hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={onLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </motion.div>
    </div>
  );
};