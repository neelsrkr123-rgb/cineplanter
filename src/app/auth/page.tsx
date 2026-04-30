'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '#/context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Film, Phone, LogIn, X } from 'lucide-react';

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
  }, [slides.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    const success = await login(formData.email, formData.password);
    if (success) {
      router.push('/profile');
    } else {
      setError('Invalid email or password');
    }
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

    if (success) {
      router.push('/profile');
    } else {
      setError('Registration failed. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const success = await loginWithGoogle();
    if (success) {
      router.push('/profile');
    } else {
      setError('Google login failed. Please try again.');
    }
  };

  const handlePhoneLogin = async () => {
    setError('');
    if (!formData.phone) {
      setError('Please enter your phone number');
      return;
    }

    const success = await loginWithPhone(formData.phone);
    if (success) {
      router.push('/profile');
    } else {
      setError('Phone authentication failed. Please try again.');
    }
  };

  const handleEmailClick = () => {
    setPhoneAuthMode(false);
  };

  const handleClose = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row min-h-[700px] rounded-2xl overflow-hidden shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors duration-200"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left Side - Info Slideshow (40%) */}
        <div className="w-full lg:w-3/5 bg-gradient-to-br from-purple-900/80 to-blue-900/80 p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(74,0,224,0.15)_0%,transparent_40%),radial-gradient(circle_at_40%_70%,rgba(43,126,226,0.1)_0%,transparent_40%)] opacity-70"></div>
          </div>
          
          <div className="relative z-10 h-full flex flex-col justify-center">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 flex flex-col justify-center p-4 transition-opacity duration-500 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="mb-6">
                  <Film className="w-12 h-12 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{slide.title}</h3>
                <p className="text-purple-200 leading-relaxed">{slide.text}</p>
              </div>
            ))}
            
            <div className="absolute bottom-6 left-6 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-purple-500 scale-110' 
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Auth Panel (50%) */}
        <div className="w-full lg:w-3/5 bg-gray-900/70 backdrop-blur-md p-6 lg:p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(74,0,224,0.1)_0%,transparent_40%),radial-gradient(circle_at_20%_80%,rgba(43,126,226,0.1)_0%,transparent_40%)]"></div>
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex-1 relative overflow-hidden">
              {/* Sign Up Form */}
              <div
                className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                  isLoginForm ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
                }`}
              >
                <form onSubmit={handleRegister} className="h-full flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white text-center mb-6">Create Account</h3>
                    
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
                        {error}
                      </div>
                    )}
                    
                    <div className="flex justify-center gap-6 mb-4">
                      {/* Google Button */}
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="group relative flex flex-col items-center justify-center gap-1 text-purple-200 transition-all duration-300"
                      >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-white/5 transition-colors">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 极.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 极 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <span className="text-xs mt-1">Google</span>
                      </button>

                      {/* Phone Button */}
                      <button
                        type="button"
                        onClick={() => setPhoneAuthMode(true)}
                        className="group relative flex flex-col items-center justify-center gap-1 text-purple-200 transition-all duration-300"
                      >
                        <div className="w-12极-12 rounded-full flex items-center justify-center group-hover:bg-white/5 transition-colors">
                          <Phone className="w-6 h-6" />
                        </div>
                        <span className="text-xs mt-1">Phone</span>
                      </button>

                      {/* Email Button */}
                      <button
                        type="button"
                        onClick={handleEmailClick}
                        className="group relative flex flex-col items-center justify-center gap-1 text-purple-200 transition-all duration-300"
                      >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center group极over:bg-white/5 transition-colors">
                          <Mail className="w-6 h-6" />
                        </div>
                        <span className="text-xs mt-1">Email</span>
                      </button>
                    </div>
                    
                    {phoneAuthMode ? (
                      <>
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-900 text-purple-300">Continue with phone</span>
                          </div>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Phone Number"
                              required
                            />
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={handlePhoneLogin}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                        >
                          {isLoading ? 'Sending code...' : 'Sign Up with Phone'}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-900极ext-purple-300">Continue with email</span>
                          </div>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/极0 rounded-full text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Full Name"
                              required
                            />
                          </div>
                          
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Email Address"
                              required
                            />
                          </div>
                          
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5 text-purple-400" />
                              ) : (
                                <Eye className="w-5 h-5 text-purple-400" />
                              )}
                            </button>
                          </div>
                          
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Confirm Password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-5 h-5 text-purple-400" />
                              ) : (
                                <Eye className="w-5 h-5 text-purple-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                        >
                          {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-white/10 flex items-center justify-center">
                    <span className="text-purple-300 text-sm mr-2">Already have an account?</span>
                    <button
                      type="button"
                      onClick={() => setIsLoginForm(true)}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors flex items-center"
                    >
                      <LogIn className="w-4 h-4 mr-1" />
                      Log In
                    </button>
                  </div>
                </form>
              </div>

              {/* Login Form */}
              <div
                className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                  isLoginForm ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
                }`}
              >
                <form onSubmit={handleLogin} className="h-full flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white text-center mb-6">Welcome Back</h3>
                    
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
                        {error}
                      </div>
                    )}
                    
                    <div className="flex justify-center gap-6 mb-4">
                      {/* Google Button */}
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="group relative flex flex-col items-center justify-center gap-1 text-purple-200 transition-all duration-300"
                      >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-white极5 transition-colors">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7极7H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <span className="text-xs mt-1">Google</span>
                      </button>

                      {/* Phone Button */}
                      <button
                        type="button"
                        onClick={() => setPhoneAuthMode(true)}
                        className="group relative flex flex-col items-center justify-center gap-1 text-purple-200 transition-all duration-300"
                      >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-white/5 transition-colors">
                          <Phone className="w-6 h-6" />
                        </div>
                        <span className="text-xs mt-1">Phone</span>
                      </button>

                      {/* Email Button */}
                      <button
                        type="button"
                        onClick={handleEmailClick}
                        className="group relative flex flex-col items-center justify-center gap-1 text-purple-200 transition-all duration-300"
                      >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-white/5 transition-colors">
                          <Mail className="w-6 h-6" />
                        </div>
                        <span className="text-xs mt-1">Email</span>
                      </button>
                    </div>
                    
                    {phoneAuthMode ? (
                      <>
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-900 text-purple-300">Continue with phone</span>
                          </div>
                        </div>
                        
                        <div className="space极-4 mb-4">
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}

                              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Phone Number"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end mb-6">
                          <a href="#" className="text-purple-400 hover:text-purple-300 text-sm">
                            Forgot Password?
                          </a>
                        </div>
                        
                        <button
                          type="button"
                          onClick={handlePhoneLogin}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                        >
                          {isLoading ? 'Sending code...' : 'Log In with Phone'}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-900 text-purple-300">Continue with email</span>
                          </div>
                        </div>
                        
                        <div className="space-y-4 mb-4">
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Email Address"
                              required
                            />
                          </div>
                          
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5 text-purple-400" />
                              ) : (
                                <Eye className="w-5 h-5 text-purple极400" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mb-6">
                          <a href="#" className="text-purple-400 hover:text-purple-300 text-sm">
                            Forgot Password?
                          </a>
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                        >
                          {isLoading ? 'Signing in...' : 'Log In'}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-white/10 flex items-center justify-center">
                    <span className="text-purple-300 text-sm mr-2">Don't have an account?</span>
                    <button
                      type="button"
                      onClick={() => setIsLoginForm(false)}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors flex items-center"
                    >
                      <User className="w-4 h-4 mr-1" />
                      Sign Up
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}