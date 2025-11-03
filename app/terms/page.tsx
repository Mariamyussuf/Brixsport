import React from 'react';
import Link from 'next/link';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glassmorphic-card rounded-2xl p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white mb-8 text-center">
            BrixSports Terms of Service
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                By accessing or using BrixSports, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you must not use our services.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                2. User Accounts
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                When creating an account with BrixSports, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account and password. BrixSports reserves the right to suspend or terminate accounts that violate these terms or are used for unauthorized purposes.
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>You must be at least 13 years old to use our services</li>
                <li>You agree to provide accurate information during registration</li>
                <li>You are responsible for all activities under your account</li>
                <li>BrixSports may suspend or terminate accounts for violations</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                3. Use of Platform
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                BrixSports is intended for sports tracking, live score updates, and athlete engagement. You agree not to misuse the platform by:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mt-3">
                <li>Attempting to reverse engineer or access our systems without authorization</li>
                <li>Using automated tools to scrape or extract data without permission</li>
                <li>Distributing false or misleading information</li>
                <li>Interfering with the proper functioning of our services</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                4. Content Ownership
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                All logos, match data, content, and intellectual property displayed on BrixSports belong to BrixSports or its partners. You may not reproduce, distribute, or create derivative works from our content without explicit permission.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                5. Disclaimers
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                BrixSports provides match data and information "as is" without warranties of any kind. We do not guarantee the accuracy, timeliness, or completeness of information. BrixSports is not liable for any delays, inaccuracies, or interruptions in service.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                6. Modifications
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                BrixSports reserves the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the revised terms. We will notify users of significant changes through our platform.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                7. Contact Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                For questions about these Terms of Service, please contact us at:
              </p>
              <p className="mt-2">
                <Link 
                  href="mailto:support@brixsports.com" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  support@brixsports.com
                </Link>
              </p>
            </section>
            
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;