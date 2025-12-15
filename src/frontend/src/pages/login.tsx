import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrismaticBurst from '../components/ui/PrismaticBurst';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [prn, setPrn] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Preserved OAuth logic
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

  // Preserved Auto-lookup name/email when PRN is entered
  useEffect(() => {
    (async () => {
      try {
        const prnRegex = /^\d{12}$/;
        if (!prnRegex.test(prn)) return;
        const res = await fetch(`/api/auth/lookup?prn=${encodeURIComponent(prn)}`);
        if (!res.ok) return;
        const json = await res.json();
        const data = json.data || {};
        if (data.name) setName(data.name);
        if (data.email) setEmail(data.email);
      } catch (e) {
        // ignore lookup errors
      }
    })();
  }, [prn]);

  // Preserved Submit logic
  async function submit(e, mode) {
    e.preventDefault();
    setError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (mode === 'login') {
      if (!email || !emailRegex.test(email)) return setError('Please enter a valid email address');
    }
    if (mode === 'register') {
      if (!name || name.trim().length === 0) return setError('Please provide your name');
      if (!email || !emailRegex.test(email)) return setError('Please enter a valid email address');
    }
    if (!password || password.length < 6) return setError('Password must be at least 6 characters');

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/signin' : '/api/auth/signup';
      const res = await fetch(endpoint, { 
        method: 'POST', 
        body: JSON.stringify({ 
          email: email, 
          password: password, 
          name: name || email.split('@')[0]
        }), 
        headers: { 'Content-Type': 'application/json' } 
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('gamesta_token', data.token);
        toast.success(`Welcome ${name}!`);
        navigate('/');
        window.location.reload();

      } else {
        const json = await res.json().catch(() => null);
        const errorMsg = (json && json.error) || 'Failed to sign in';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (e) {
      const errorMsg = e?.message || 'Failed to sign in';
      setError(errorMsg);
      toast.error(errorMsg);
    }
    setLoading(false);
  }

  return (
    <div className="relative flex flex-col items-center justify-center mt-10 bg-[#1a1a2e] p-5  text-white overflow-hidden">
      {/* Background PrismaticBurst */}
      <div className="fixed inset-0 pointer-events-none">
        <PrismaticBurst
          intensity={0.6}
          speed={0.8}
          animationType="rotate3d"
          colors={["#ff5ec8", "#7a5cff", "#00f6ff"]}
          mixBlendMode="screen"
        />
      </div>

      <style>{`
        /* Animations ported from style.css */
        @keyframes fadeOutDown { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(30px); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      {/* Auth Wrapper */}
      <div className={`relative bg-black rounded-4xl w-full max-w-[800px] h-[500px] border-2 border-fuchsia-500 shadow-[0_0_25px_rgba(217,70,239,0.5)] overflow-hidden transition-all duration-700 z-10 
        max-md:h-auto max-md:min-h-[500px] max-md:flex max-md:flex-col ${isRegisterMode ? 'toggled' : ''}`}>
        
        {/* Background Shapes */}
        {/* Primary Shape */}
        <div className={`absolute -top-[5px] right-[0px] h-[600px] w-[850px] bg-gradient-to-tr from-[#ce1fa2] to-purple-700 origin-bottom-right transition-all duration-[500ms] ease-out delay-[600ms]
          ${isRegisterMode ? 'rotate-0 skew-y-0 delay-[500ms]' : 'rotate-[10deg] skew-y-[40deg]'} max-md:hidden`} />
        
        {/* Secondary Shape */}
        <div className={`absolute top-full left-[250px] h-[700px] w-[850px] bg-black border-t-[3px] border-fuchsia-500 origin-bottom-left transition-all duration-[500ms] ease-out delay-[300ms]
          ${isRegisterMode ? '-rotate-[11deg] -skew-y-[41deg] delay-[200ms]' : 'rotate-0 skew-y-0'} max-md:hidden`} />

        {/* ===== Sign In Panel ===== */}
        <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center px-10 transition-all duration-700
          max-md:relative max-md:w-full max-md:p-8 max-md:left-0 max-md:right-0
          ${isRegisterMode 
            ? 'opacity-0 translate-x-[-120%] z-0 max-md:hidden max-md:animate-[fadeOutDown_0.6s_ease_forwards]' 
            : 'opacity-100 translate-x-0 z-10 max-md:flex max-md:animate-[fadeInUp_0.6s_ease_forwards]'}`}
        >
          <h2 className={`text-4xl text-center text-white mb-5 transition-transform duration-700 delay-[1100ms]
             ${isRegisterMode ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'}
             max-md:delay-100 max-md:opacity-0 max-md:animate-[slideInUp_0.5s_ease_forwards_0.1s]`}>
             Login
          </h2>
          <form onSubmit={(e) => submit(e, 'login')}>
            
            {/* Email Field */}
            <div className={`relative w-full h-[50px] mt-6 transition-transform duration-700 delay-[1200ms]
               ${isRegisterMode ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'}
               max-md:delay-200 max-md:opacity-0 max-md:animate-[slideInUp_0.5s_ease_forwards_0.2s]`}>
              <input 
                type="text" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="peer w-full h-full bg-black border-none outline-none text-base text-white font-semibold border-b-2  pr-6 transition-all duration-500 "
              />
              <label className="absolute top-1/2 left-0 -translate-y-1/2 text-base text-white transition-all duration-500 pointer-events-none peer-focus:-top-[5px] peer-focus:text-fuchsia-400 peer-valid:-top-[5px] peer-valid:text-fuchsia-400 peer-[&:not(:placeholder-shown)]:-top-[5px] peer-[&:not(:placeholder-shown)]:text-fuchsia-400">
                Email Address
              </label>
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 448 512" 
                className="absolute top-1/2 right-0 -translate-y-1/2 text-lg text-white transition-colors duration-500 peer-focus:text-fuchsia-400 peer-valid:text-fuchsia-400 peer-[&:not(:placeholder-shown)]:text-fuchsia-400">
                <path fill="currentColor" d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0S96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"/>
              </svg>
            </div>

           {/* Password Field */}
<div className={`relative w-full h-[50px] mt-6 transition-transform duration-700 delay-[1300ms]
   ${isRegisterMode ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'}
   max-md:delay-300 max-md:opacity-0 max-md:animate-[slideInUp_0.5s_ease_forwards_0.3s]`}>

  <input 
    type={showPassword ? "text" : "password"}
    required 
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder=" "
    className="peer w-full h-full bg-transparent border-none outline-none text-base text-white font-semibold
               border-b-2 border-white pr-10 transition-all duration-500
               focus:border-fuchsia-400 valid:border-fuchsia-400 placeholder-shown:border-white"
  />

  <label className="absolute top-1/2 left-0 -translate-y-1/2 text-base text-white transition-all duration-500
                     pointer-events-none peer-focus:-top-[5px] peer-focus:text-fuchsia-400
                     peer-valid:-top-[5px] peer-valid:text-fuchsia-400
                     peer-[&:not(:placeholder-shown)]:-top-[5px]
                     peer-[&:not(:placeholder-shown)]:text-fuchsia-400">
    Password
  </label>

  {/* Show / Hide Button */}
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute top-1/2 right-0 -translate-y-1/2 text-white text-lg
               hover:text-fuchsia-400 transition-colors duration-300"
  >
    {showPassword ? (
      // Eye Slash Icon
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 640 512">
        <path fill="currentColor"
          d="M320 400c-75.9 0-137.25-58.71-142.9-133.17l-72.18-55.58C63.1 243.47 27.94 285.9 8.6 320c19.34 34.1 54.5 76.53 96.32 108.75C155.3 461.6 230.2 496 320 496c47.2 0 90.4-9.5 128.2-25.8l-49.7-38.3C373.6 393.8 347.6 400 320 400zM633.8 458.1l-110.5-85.1c29.5-23.4 54.5-50.5 73.1-75.1c-19.3-34.1-54.5-76.5-96.3-108.7C449.7 50.4 374.8 16 285 16c-47.2 0-90.4 9.5-128.2 25.8L6.1 53.1L38.2 95.2l595.6 459.6z" />
      </svg>
    ) : (
      // Eye Icon
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 576 512">
        <path fill="currentColor"
          d="M572.52 241.4C518.29 135.6 407.4 64 288 64S57.68 135.6 3.48 241.4a32.35 32.35 0 0 0 0 29.2C57.71 376.4 168.6 448 288 448s230.32-71.6 284.52-177.4a32.35 32.35 0 0 0 0-29.2zM288 400a112 112 0 1 1 112-112a112 112 0 0 1-112 112z" />
      </svg>
    )}
  </button>
</div>


            {error && !isRegisterMode && (
              <div className={`mt-3 text-red-400 text-sm text-center transition-transform duration-700 delay-[1400ms]
                ${isRegisterMode ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'}`}>
                {error}
              </div>
            )}

            <div className={`relative w-full h-[45px] mt-6 transition-transform duration-700 delay-[1400ms]
               ${isRegisterMode ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'}
               max-md:delay-400 max-md:opacity-0 max-md:animate-[slideInUp_0.5s_ease_forwards_0.4s]`}>
              <button className="group relative w-full h-full bg-transparent rounded-full border-2 border-fuchsia-500 font-semibold text-white overflow-hidden z-10 cursor-pointer" type="submit" disabled={loading}>
                <span className="absolute top-full left-0 w-full h-[300%] bg-gradient-to-b from-[#1a1a2e] via-fuchsia-500 to-fuchsia-500 -z-10 transition-all duration-500 group-hover:top-0"></span>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>

            <div className={`mt-5 mb-2 text-center text-sm text-white transition-transform duration-700 delay-[1500ms]
               ${isRegisterMode ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'}
               max-md:delay-500 max-md:opacity-0 max-md:animate-[slideInUp_0.5s_ease_forwards_0.5s]`}>
              <p>Don&apos;t have an account? <br /> 
                <button type="button" className="text-fuchsia-400 font-semibold hover:underline bg-transparent border-none cursor-pointer" 
                  onClick={() => { setIsRegisterMode(true); setError(null); }}>
                  Sign Up
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* ===== Welcome Section - Sign In (Right Side) ===== */}
        <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col justify-center text-right pr-10 pl-[150px] pointer-events-none transition-all duration-700
          max-md:hidden
          ${isRegisterMode ? 'opacity-0 translate-x-[120%] blur-[10px]' : 'opacity-100 translate-x-0 blur-0'}`}>
          <h2 className={`text-4xl text-white uppercase leading-tight mb-2 transition-all duration-700 delay-[1000ms]
             ${isRegisterMode ? 'translate-x-[120%]' : 'translate-x-0'}`}>
            WELCOME BACK!
          </h2>
       
        </div>

        {/* ===== Sign Up Panel (Right Side) ===== */}
        <div className={`absolute top-0 -right-5 w-1/2 h-full flex flex-col justify-center px-[60px] transition-all duration-700
          max-md:relative max-md:w-full max-md:p-8 max-md:left-0
          ${isRegisterMode 
            ? 'opacity-100 translate-x-0 z-10 max-md:flex max-md:animate-[fadeInUp_0.6s_ease_forwards]' 
            : 'opacity-0 translate-x-[120%] z-0 max-md:hidden max-md:animate-[fadeOutDown_0.6s_ease_forwards]'}`}
        >
          <h2 className={`text-4xl text-center text-white mb-5 transition-transform duration-700 delay-0
             ${isRegisterMode ? 'opacity-100 translate-x-0 delay-[700ms]' : 'opacity-0 translate-x-[120%] blur-[10px]'}
             max-md:delay-100 max-md:opacity-0 max-md:animate-[slideInUp_0.5s_ease_forwards_0.1s]`}>
             Register
          </h2>
          <form onSubmit={(e) => submit(e, 'register')}>
            
            {/* Name Field */}
            <div className={`relative w-full h-[50px] mt-6 transition-transform duration-700
               ${isRegisterMode ? 'opacity-100 translate-x-0 delay-[800ms]' : 'opacity-0 translate-x-[120%] blur-[10px] delay-[100ms]'}
               max-md:delay-200 max-md:opacity-0 max-md:animate-[slideInUp_0.5s_ease_forwards_0.2s]`}>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=" "
                className="peer w-full h-full bg-transparent border-none outline-none text-base text-white font-semibold border-b-2 border-white pr-6 transition-all duration-500 focus:border-fuchsia-400 valid:border-fuchsia-400 placeholder-shown:border-white"
              />
              <label className="absolute top-1/2 left-0 -translate-y-1/2 text-base text-white transition-all duration-500 pointer-events-none peer-focus:-top-[5px] peer-focus:text-fuchsia-400 peer-valid:-top-[5px] peer-valid:text-fuchsia-400 peer-[&:not(:placeholder-shown)]:-top-[5px] peer-[&:not(:placeholder-shown)]:text-fuchsia-400">
                Full Name
              </label>
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 448 512" 
                className="absolute top-1/2 right-0 -translate-y-1/2 text-lg text-white transition-colors duration-500 peer-focus:text-fuchsia-400 peer-valid:text-fuchsia-400 peer-[&:not(:placeholder-shown)]:text-fuchsia-400">
                <path fill="currentColor" d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0S96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"/>
              </svg>
            </div>

            {/* Email Field */}
            <div className={`relative w-full h-[50px] mt-6 transition-transform duration-700
               ${isRegisterMode ? 'opacity-100 translate-x-0 delay-[900ms]' : 'opacity-0 translate-x-[120%] blur-[10px] delay-[200ms]'}
               max-md:delay-300 max-md:opacity-0 max-md:animate-[slideInUp_0.5s_ease_forwards_0.3s]`}>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="peer w-full h-full bg-transparent border-none outline-none text-base text-white font-semibold border-b-2 border-white pr-6 transition-all duration-500 focus:border-fuchsia-400 valid:border-fuchsia-400 placeholder-shown:border-white"
              />
              <label className="absolute top-1/2 left-0 -translate-y-1/2 text-base text-white transition-all duration-500 pointer-events-none peer-focus:-top-[5px] peer-focus:text-fuchsia-400 peer-valid:-top-[5px] peer-valid:text-fuchsia-400 peer-[&:not(:placeholder-shown)]:-top-[5px] peer-[&:not(:placeholder-shown)]:text-fuchsia-400">
                Email Address
              </label>
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512" 
                className="absolute top-1/2 right-0 -translate-y-1/2 text-lg text-white transition-colors duration-500 peer-focus:text-fuchsia-400 peer-valid:text-fuchsia-400 peer-[&:not(:placeholder-shown)]:text-fuchsia-400">
                <path fill="currentColor" d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7c22.4 17.4 52.1 39.5 154.1 113.6c21.1 15.4 56.7 47.8 92.2 47.6c35.7.3 72-32.8 92.3-47.6c102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4c132.7-96.3 142.8-104.7 173.4-128.7c5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9c30.6 23.9 40.7 32.4 173.4 128.7c16.8 12.2 50.2 41.8 73.4 41.4z"/>
              </svg>
            </div>

            {/* Password Field */}
            <div className={`relative w-full h-[50px] mt-6 transition-transform duration-700
               ${isRegisterMode ? 'opacity-100 translate-x-0 delay-[1000ms]' : 'opacity-0 translate-x-[120%] blur-[10px] delay-[300ms]'}
               max-md:delay-400 max-md:opacity-0 max-md:animate-[slideInUp_0.5s_ease_forwards_0.4s]`}>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="peer w-full h-full bg-transparent border-none outline-none text-base text-white font-semibold border-b-2 border-white pr-6 transition-all duration-500 focus:border-fuchsia-400 valid:border-fuchsia-400 placeholder-shown:border-white"
              />
              <label className="absolute top-1/2 left-0 -translate-y-1/2 text-base text-white transition-all duration-500 pointer-events-none peer-focus:-top-[5px] peer-focus:text-fuchsia-400 peer-valid:-top-[5px] peer-valid:text-fuchsia-400 peer-[&:not(:placeholder-shown)]:-top-[5px] peer-[&:not(:placeholder-shown)]:text-fuchsia-400">
                Password
              </label>
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 448 512" 
                className="absolute top-1/2 right-0 -translate-y-1/2 text-lg text-white transition-colors duration-500 peer-focus:text-fuchsia-400 peer-valid:text-fuchsia-400 peer-[&:not(:placeholder-shown)]:text-fuchsia-400">
                <path fill="currentColor" d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"/>
              </svg>
            </div>
            
            {error && isRegisterMode && (
              <div className={`mt-3 text-red-400 text-sm text-center transition-transform duration-700 delay-[1100ms]
                ${isRegisterMode ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[120%]'}`}>
                {error}
              </div>
            )}

            <div className={`relative w-full h-[45px] mt-6 transition-transform duration-700
               ${isRegisterMode ? 'opacity-100 translate-x-0 delay-[1100ms]' : 'opacity-0 translate-x-[120%] blur-[10px] delay-[400ms]'}
               max-md:delay-[500ms] max-md:opacity-0 max-md:animate-[slideInUp_0.5s_ease_forwards_0.5s]`}>
              <button className="group relative w-full h-full bg-transparent rounded-full border-2 border-fuchsia-500 font-semibold text-white overflow-hidden z-10 cursor-pointer" type="submit" disabled={loading}>
                <span className="absolute top-full left-0 w-full h-[300%] bg-gradient-to-b from-[#1a1a2e] via-fuchsia-500 to-fuchsia-500 -z-10 transition-all duration-500 group-hover:top-0"></span>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>

            <div className={`mt-5 mb-2 text-center text-sm text-white transition-transform duration-700 delay-[1200ms]
               ${isRegisterMode ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[120%]'}
               max-md:delay-[600ms] max-md:opacity-0 max-md:animate-[slideInUp_0.5s_ease_forwards_0.6s]`}>
              <p>Already have an account? <br /> 
                <button type="button" className="text-fuchsia-400 font-semibold hover:underline bg-transparent border-none cursor-pointer" 
                  onClick={() => { setIsRegisterMode(false); setError(null); }}>
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* ===== Welcome Section - Sign Up (Left Side) ===== */}
        <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center text-left pl-[38px] pr-[150px] pointer-events-none transition-all duration-700
          max-md:hidden
          ${isRegisterMode ? 'opacity-100 translate-x-0 blur-0' : 'opacity-0 translate-x-[-120%] blur-[10px]'}`}>
          <h2 className={`text-4xl text-white uppercase leading-tight mb-2 transition-all duration-700 delay-0
             ${isRegisterMode ? 'translate-x-0 delay-[200ms]' : 'translate-x-[120%]'}`}>
            WELCOME!
          </h2>
          <p className={`text-base text-white transition-all duration-700 delay-[800ms]
             ${isRegisterMode ? 'translate-x-0' : 'translate-x-[-120%]'}`}>
            Enter your personal details to use all of site features
          </p>
        </div>

      </div>
      <div className="mt-8 text-center text-sm text-white">
        <p>Made with ❤️ by <a href="#" target="_blank" className="text-fuchsia-400 font-bold hover:underline hover:text-[#00b8d4] transition-colors">Gamesta</a></p>
      </div>
    </div>
  );
}
