'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '#/context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Film, Phone, LogIn } from 'lucide-react';

export default function AuthPage() {
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState('');
  const [phoneAuthMode, setPhoneAuthMode] = useState(false);
  const { login, register, loginWithGoogle, loginWithPhone, isLoading } = useAuth();
  const router = useRouter();

  const slides = [
    {
      title: "Cinematic Experience",
      text: "Access thousands of high-quality films from independent filmmakers and major studios alike."
    },
    {
      title: "Join Our Community",
      text: "Connect with other film enthusiasts, share reviews, and discover hidden gems."
    },
    {
      title: "Create & Share",
      text: "Upload your own creations, get feedback, and build your audience."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    const success = await login(formData.email, formData.password);
    if (success) router.push('/profile');
    else setError('Invalid email or password');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const success = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      isFilmmaker: true,
      phone: formData.phone
    });
    if (success) router.push('/profile');
    else setError('Registration failed. Please try again.');
  };

  const handleGoogleLogin = async () => {
    setError('');
    const success = await loginWithGoogle();
    if (success) router.push('/profile');
    else setError('Google login failed. Please try again.');
  };

  const handlePhoneLogin = async () => {
    setError('');
    if (!formData.phone) {
      setError('Please enter your phone number');
      return;
    }
    const success = await loginWithPhone(formData.phone);
    if (success) router.push('/profile');
    else setError('Phone authentication failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row min-h-[700px] rounded-2xl overflow-hidden shadow-2xl">

        {/* Left - Slideshow */}
        <div className="hidden lg:block w-2/5 bg-gradient-to-br from-purple-900/80 to-blue-900/80 p-6 relative">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 flex flex-col justify-center p-8 transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Film className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">{slide.title}</h3>
              <p className="text-purple-200">{slide.text}</p>
            </div>
          ))}
          <div className="absolute bottom-6 left-6 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full ${
                  index === currentSlide ? 'bg-purple-500' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right - Auth */}
        <div className="w-full lg:w-3/5 bg-gray-900/70 backdrop-blur-md p-8 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {isLoginForm ? 'Sign In' : 'Create Account'}
            </h2>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {isLoginForm ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="Email Address"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-purple-400" /> : <Eye className="w-5 h-5 text-purple-400" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
              <p className="text-center text-sm text-purple-200 mt-4">
                Don’t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsLoginForm(false)}
                  className="text-purple-400 font-semibold"
                >
                  Sign Up
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="Full Name"
                  required
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="Email Address"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-purple-400" /> : <Eye className="w-5 h-5 text-purple-400" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="Confirm Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5 text-purple-400" /> : <Eye className="w-5 h-5 text-purple-400" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
              <p className="text-center text-sm text-purple-200 mt-4">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsLoginForm(true)}
                  className="text-purple-400 font-semibold"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* Google / Phone */}
          <div className="flex justify-center gap-6 mt-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10"
            >
              <Mail className="w-6 h-6 text-purple-400" />
            </button>
            <button
              type="button"
              onClick={handlePhoneLogin}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10"
            >
              <Phone className="w-6 h-6 text-purple-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
