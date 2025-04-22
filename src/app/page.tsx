'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center">
            <div className="mb-8 inline-block p-3 bg-purple-100 rounded-full">
              <svg className="w-7 h-7 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 15.5q1.25 0 2.125-.875T15 12.5V7q0-1.25-.875-2.125T12 4q-1.25 0-2.125.875T9 7v5.5q0 1.25.875 2.125T12 15.5Zm0 6q-3.75 0-6.375-2.625T3 12.5v-1.25h2v1.25q0 2.9 2.05 4.95T12 19.5q2.9 0 4.95-2.05T19 12.5v-1.25h2v1.25q0 3.75-2.625 6.375T12 21.5Z"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-medium mb-4 text-gray-900">
              Your Voice, <span className="text-purple-600">Reimagined</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-lg mx-auto mb-10">
              Create a perfect digital twin of your voice with our AI technology. 
              Record, clone, and transform text into natural speech.
            </p>
            
            <div className="flex justify-center mb-12">
              <Link
                href="/create"
                className="px-6 py-3 bg-purple-600 text-white text-base font-medium rounded-full hover:bg-purple-700 transition-colors"
              >
                Start Creating
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path>
                </svg>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Record</h3>
              <p className="text-sm text-gray-500">Capture your voice with our high-quality recorder</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 7c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"></path>
                </svg>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Clone</h3>
              <p className="text-sm text-gray-500">Our AI creates a perfect digital twin of your voice</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
                </svg>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Speak</h3>
              <p className="text-sm text-gray-500">Transform any text into natural speech in your voice</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-medium text-center mb-10 text-gray-900">How It <span className="text-purple-600">Works</span></h2>
          
          <div className="flex items-center justify-center">
            <div className="flex items-center max-w-xl">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center text-base">1</div>
                <div className="h-16 w-px bg-gray-200 my-2"></div>
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-base">2</div>
                <div className="h-16 w-px bg-gray-200 my-2"></div>
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-base">3</div>
              </div>
              
              <div className="ml-6 space-y-16">
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Record your voice</h3>
                  <p className="text-sm text-gray-500">Provide a short sample of your voice by recording or uploading audio</p>
                </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">AI processing</h3>
                  <p className="text-sm text-gray-500">Our advanced AI analyzes your voice patterns and creates a model</p>
                </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Generate speech</h3>
                  <p className="text-sm text-gray-500">Type any text and hear it spoken in your voice instantly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-xl font-medium mb-3 text-gray-900">Ready to try it yourself?</h2>
          <p className="text-base text-gray-600 max-w-lg mx-auto mb-6">
            Create your own AI voice clone in minutes. No technical knowledge required.
          </p>
          
          <Link
            href="/create"
            className="inline-block px-6 py-3 bg-purple-600 text-white text-base font-medium rounded-full hover:bg-purple-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
