import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import PrismaticBurst from '../components/ui/PrismaticBurst';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const oauth = params.get('oauth');
      if (oauth === '1') {
        (async () => {
          try {
            const res = await fetch('/api/auth/oauth-token');
            if (res.ok) {
              const json = await res.json();
              sessionStorage.setItem('gamesta_token', json.token);
              navigate('/');
            }
          } catch (e) {
            console.error('OAuth exchange error', e);
          }
        })();
      }
    } catch (e) {
      console.error('Error parsing URL params', e);
    }
  }, [navigate]);

  async function submit(e) {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) return setError('Please enter a valid email address');
    const mitaoeDomainRegex = /@mitaoe\.ac\.in$/i;
    if (authMode === 'register') {
      if (!mitaoeDomainRegex.test(email)) return setError('Please register with your MITAOE email (mitaoe.ac.in)');
      const local = email.split('@')[0] || '';
      const prnRegex = /^\d{12}$/;
      if (!prnRegex.test(local)) return setError('Use your 12-digit numeric PRN as the email local-part');
      if (!name || name.trim().length === 0) return setError('Please provide your name');
    }
    if (!password || password.length < 6) return setError('Password must be at least 6 characters');

    setLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/signin' : '/api/auth/signup';
      const res = await fetch(endpoint, { 
        method: 'POST', 
        body: JSON.stringify({ email, password, name: name || email.split('@')[0] }), 
        headers: { 'Content-Type': 'application/json' } 
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('gamesta_token', data.token);
        navigate('/');
      } else {
        const json = await res.json().catch(() => null);
        setError((json && json.error) || 'Failed to sign in');
      }
    } catch (e) {
      setError(e?.message || 'Failed to sign in');
    }
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen w-full">
      {/* Fixed Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 " />
        <div className="absolute inset-0">
          <PrismaticBurst
            intensity={0.6}
            speed={0.8}
            animationType="rotate3d"
            colors={["#ff5ec8", "#7a5cff", "#00f6ff"]}
            mixBlendMode="screen"
          />
        </div>
      </div>

      {/* Scrollable Content Container */}
      <div className="relative z-10 min-h-screen w-full flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md">
            {/* Auth Card */}
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-3xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">
                  {authMode === 'login' ? 'Welcome Back 👋' : 'Create Your Account ✨'}
                </CardTitle>
                <CardDescription className="text-white/70 mt-1">
                  {authMode === 'login' 
                    ? 'Sign in to continue your journey' 
                    : 'Join the Gamesta community of creators'}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={submit} className="space-y-6">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Email</label>
                    <input
                      type="email"
                      placeholder="prn@mitaoe.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Registration Fields */}
                  {authMode === 'register' && (
                    <div className="space-y-4">
                      <p className="text-xs text-white/60">
                        Register with your MITAOE email only.
                      </p>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Full Name</label>
                        <input
                          type="text"
                          placeholder="Enter your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Password Input with Show/Hide */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 pr-10 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-400/40 text-sm text-red-200 text-center">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full text-white bg-gradient-to-r from-[#6f0684] via-[#622195] to-[#ff5ec8] py-2 rounded-lg text-base font-semibold shadow-lg border-0"
                    loading={loading}
                  >
                    {loading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Register'}
                  </Button>

                  {/* Google Login */}
                  {authMode === 'register' && (
                    <div className="my-5 flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/30" />
                      <span className="text-sm text-white/60">OR</span>
                      <div className="flex-1 h-px bg-white/30" />
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        // Redirect to OAuth endpoint
                        window.location.href = '/api/auth/google?callbackUrl=' + encodeURIComponent('/login?oauth=1');
                      }}
                      className="w-full flex items-center justify-center gap-3 bg-white/10 border border-white/20 rounded-lg py-2 text-white/90"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 533.5 544.3">
                        <path fill="#4285F4" d="M533.5 278.4c0-18.5-1.6-37.2-4.9-55.1H272.1v104.3h146.9c-6.3 34.1-25.3 62.9-54 82.1v68.2h87.4c51.1-47.1 80.1-116.4 80.1-199.5z"/>
                        <path fill="#34A853" d="M272.1 544.3c73.7 0 135.6-24.5 180.8-66.6l-87.4-68.2c-24.3 16.3-55.4 26-93.4 26-71.7 0-132.5-48.3-154.2-113.1H28.3v70.9C73.2 485 166 544.3 272.1 544.3z"/>
                        <path fill="#FBBC05" d="M117.9 332.4c-10.8-32.1-10.8-66.5 0-98.6V162.9H28.3c-40.4 79.6-40.4 174.2 0 253.8l89.6-84.3z"/>
                        <path fill="#EA4335" d="M272.1 107.7c39.9 0 75.9 13.7 104.1 40.7l78.1-78.1C407.7 22.1 345.8 0 272.1 0 166 0 73.2 59.3 28.3 162.9l89.6 70.9C139.6 156 200.4 107.7 272.1 107.7z"/>
                      </svg>
                      Continue with Google
                    </button>
                  </div>

                  {/* Toggle Mode */}
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                      className="text-sm text-white/70"
                    >
                      {authMode === 'login' ? "Don’t have an account? " : "Already have an account? "}
                      <span className="text-[#00f6ff] font-medium">
                        {authMode === 'login' ? 'Sign up' : 'Sign in'}
                      </span>
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center text-white/70 text-sm tracking-wide mt-6">
              © 2025 Gamesta — Built with 💜 for MITAOE Innovators
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
