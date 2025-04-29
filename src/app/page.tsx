'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-900">Noteify</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">AI</span>
          </div>
          <div className="flex space-x-4">
            <Link 
              href="/record" 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Record
            </Link>
            <a 
              href="#features" 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Features
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative px-4 pt-16 pb-20 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                Transform your 
                <span className="block mt-1">lectures into</span>
                <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent block mt-1">
                  organized notes
                </span>
              </h1>
              
              <p className="mt-6 text-lg text-gray-600 max-w-lg">
                Real-time lecture transcription that lets you capture classroom content instantly as it&apos;s being taught. Perfect for students, researchers, and academic professionals.
              </p>
              
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/record"
                  className="px-6 py-3 text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  Start Recording
                </Link>
                
                <a
                  href="#features"
                  className="px-6 py-3 text-base font-medium rounded-lg text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm transition-all duration-200"
                >
                  Learn More
                </a>
              </div>
            </div>
            
            <div className="relative mx-auto max-w-md">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl transform rotate-3 opacity-10 blur-2xl"></div>
              <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6">
                  <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                    <svg className="h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-gray-200 rounded-full w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded-full"></div>
                    <div className="h-2 bg-gray-200 rounded-full w-5/6"></div>
                    <div className="h-2 bg-gray-200 rounded-full w-2/3"></div>
                    <div className="h-2 bg-gray-200 rounded-full"></div>
                    <div className="h-2 bg-gray-200 rounded-full w-4/5"></div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <div className="h-8 w-24 bg-indigo-100 rounded-md"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" className="text-white">
          <path fill="currentColor" fillOpacity="1" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-600 mb-3">FEATURES</span>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              A better way to capture your thoughts
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              Powered by AI to help you focus on what matters most.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-12">
              {/* Feature 1 */}
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Real-time Lecture Transcription</h3>
                  <p className="mt-2 text-base text-gray-600">
                    See your lectures transform into text instantly, enabling seamless note-taking during classes and academic presentations.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Browser-Based Technology</h3>
                  <p className="mt-2 text-base text-gray-600">
                    Works directly in your browser with no additional downloads or installations required.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">AI Note Generation</h3>
                  <p className="mt-2 text-base text-gray-600">
                    Automatically creates a structured outline and notes from your transcribed speech.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Persistent Storage</h3>
                  <p className="mt-2 text-base text-gray-600">
                    Your notes are saved securely in the cloud, linked to each recording session.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-100">
            Start recording and see how Noteify AI can transform your lecture notes.
          </p>
          <Link
            href="/record"
            className="mt-8 inline-block px-6 py-3 rounded-lg text-indigo-600 bg-white hover:bg-blue-50 font-medium shadow-md transition-all duration-200 transform hover:scale-105"
          >
            Start Recording
          </Link>
        </div>
      </div>
    </div>
  );
} 