import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Mail, Lock, User, Building, Phone, BookOpen, KeyRound, Loader2 } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { toast } from '../../utils/toast';

interface AuthPageProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [rollNo, setRollNo] = useState('');
  const [branch, setBranch] = useState('B.Tech - Computer Science and Engineering');
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-emerald-900/20 blur-[120px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-900/50">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight"
        >
          Placement Portal
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-center text-sm text-slate-400"
        >
          {isLogin ? 'Sign in to access your dashboard' : 'Create an account to get started'}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-black/50 sm:rounded-2xl sm:px-10 border border-slate-800">
          
          {/* Toggle Login/Register */}
          <div className="flex bg-slate-800/50 p-1 rounded-lg mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isLogin ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isLogin ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 bg-slate-950 border border-slate-800 rounded-lg py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Account Type</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-slate-500" />
                    </div>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="block w-full pl-10 bg-slate-950 border border-slate-800 rounded-lg py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors appearance-none"
                    >
                      <option value="student">Student</option>
                      <option value="placement_coordinator">Placement Coordinator</option>
                    </select>
                  </div>
                </div>

                {role === 'student' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Roll No</label>
                      <input
                        type="text"
                        required
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        className="block w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-emerald-500 sm:text-sm"
                        placeholder="2022BTCS001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Batch Year</label>
                      <input
                        type="number"
                        required
                        value={batchYear}
                        onChange={(e) => setBatchYear(parseInt(e.target.value))}
                        className="block w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 bg-slate-950 border border-slate-800 rounded-lg py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                  placeholder="you@university.edu.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 bg-slate-950 border border-slate-800 rounded-lg py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-950"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-400">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Sign In
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
