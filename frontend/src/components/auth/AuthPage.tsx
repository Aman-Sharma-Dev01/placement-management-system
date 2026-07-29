import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Building,
  BookOpen,
  Users,
  Hash,
  Calendar,
  KeyRound,
  Loader2,
  ShieldCheck,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { toast } from '../../utils/toast';

interface AuthPageProps {
  onLoginSuccess: (user: any, token: string) => void;
}

const branches = [
  'B.Tech - Computer Science and Engineering',
  'B.Tech - Information Technology',
  'B.Tech - Electronics and Communication',
  'B.Tech - Mechanical Engineering',
  'B.Tech - Civil Engineering',
  'B.Tech - Electrical Engineering',
];

const highlights = [
  { icon: ShieldCheck, text: 'Role-based access for every stage of placement' },
  { icon: BarChart3, text: 'Live analytics for coordinators and TPOs' },
  { icon: Sparkles, text: 'One dashboard from registration to offer letter' },
];

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [rollNo, setRollNo] = useState('');
  const [branch, setBranch] = useState(branches[0]);
  const [batchYear, setBatchYear] = useState(2026);
  const [gender, setGender] = useState('Male');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const data = await authApi.login({ email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        onLoginSuccess(data, data.token);
        toast.success(`Welcome back, ${data.name}!`);
      } else {
        const data = await authApi.register({
          name,
          email,
          password,
          role,
          ...(role === 'student' && { rollNo, branch, batchYear, gender }),
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        onLoginSuccess(data, data.token);
        toast.success('Registration successful!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ---------------------------------------------------------- */}
      {/* Left brand panel — hidden on small screens                  */}
      {/* ---------------------------------------------------------- */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500">
        <div className="absolute -top-40 -left-32 w-[26rem] h-[26rem] rounded-full bg-emerald-400/20 blur-[100px]" />
        <div className="absolute bottom-0 -right-20 w-[24rem] h-[24rem] rounded-full bg-emerald-300/15 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="bg-white/20 p-2.5 rounded-xl shadow-lg shadow-emerald-900/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">SUPRESET</span>
          </motion.div>

          <div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-bold text-white leading-tight tracking-tight"
            >
              One platform for
              <br />
              your entire placement
              <br />
              cycle.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-emerald-50/80 max-w-sm leading-relaxed"
            >
              Students, coordinators, TPOs and recruiters — every role gets its own
              dashboard, connected in real time.
            </motion.p>

            <div className="mt-10 space-y-4">
              {highlights.map((h, i) => (
                <motion.div
                  key={h.text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 border border-white/20 text-emerald-200">
                    <h.icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm text-emerald-50/90">{h.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-emerald-50/60"
          >
            © {new Date().getFullYear()} SUPRESET Placement Platform
          </motion.p>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Right form panel                                             */}
      {/* ---------------------------------------------------------- */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[28rem] h-[28rem] rounded-full bg-emerald-100/60 blur-[120px] lg:hidden pointer-events-none" />

        <div className="mx-auto w-full max-w-md relative z-10">
          {/* Mobile-only logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center lg:hidden"
          >
            <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-200/50">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-6 lg:mt-0 text-center lg:text-left text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight"
          >
            {isLogin ? 'Welcome back' : 'Create your account'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-2 text-center lg:text-left text-sm text-gray-500"
          >
            {isLogin
              ? 'Sign in to access your placement dashboard'
              : 'A few details and you are ready to go'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 p-6 sm:p-8">
              {/* Toggle Login/Register */}
              <div className="relative flex bg-gray-100 p-1 rounded-xl mb-7 border border-gray-200">
                <motion.div
                  className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-emerald-600 shadow-md shadow-emerald-200/40"
                  animate={{ left: isLogin ? 4 : 'calc(50% + 0px)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    isLogin ? 'text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    !isLogin ? 'text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Register
                </button>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <AnimatePresence mode="popLayout" initial={false}>
                  {!isLogin && (
                    <motion.div
                      key="register-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-5 overflow-hidden"
                    >
                      <Field label="Full Name" icon={User}>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={inputClass}
                          placeholder="John Doe"
                        />
                      </Field>

                      <Field label="Account Type" icon={Building}>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className={`${inputClass} appearance-none cursor-pointer`}
                        >
                          <option value="student">Student</option>
                          <option value="placement_coordinator">Placement Coordinator</option>
                        </select>
                      </Field>

                      {role === 'student' && (
                        <>
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
                              className={`${inputClass} appearance-none cursor-pointer`}
                            >
                              {branches.map((b) => (
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
                              className={`${inputClass} appearance-none cursor-pointer`}
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </Field>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Field label="Email address" icon={Mail}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@university.edu.in"
                  />
                </Field>

                <Field label="Password" icon={Lock}>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </Field>

                {isLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 bg-white text-emerald-600 focus:ring-emerald-500"
                      />
                      Remember me
                    </label>
                    <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                      Forgot password?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-200/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isLogin ? (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Sign In
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                {isLogin ? 'Register' : 'Sign in'}
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Shared field wrapper                                               */
/* ------------------------------------------------------------------ */

const inputClass =
  'block w-full pl-10 pr-3 bg-white border border-gray-300 rounded-lg py-2.5 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors';

function Field({
  label,
  icon: IconComp,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <IconComp className="h-5 w-5 text-gray-400" />
        </div>
        {children}
      </div>
    </div>
  );
}