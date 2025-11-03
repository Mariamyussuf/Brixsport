import React from 'react';
import Link from 'next/link';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glassmorphic-card rounded-2xl p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white mb-8 text-center">
            BrixSports Privacy Policy
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                1. Information We Collect
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                We collect information to provide better services to our users:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Basic Profile Data:</strong> Name, email address, and optional profile information</li>
                <li><strong>Device Information:</strong> Device type, operating system, browser type, and IP address</li>
                <li><strong>Usage Data:</strong> How you interact with our platform, pages visited, and features used</li>
                <li><strong>Athlete Statistics:</strong> Optional performance data for sports tracking features</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                2. How We Use Data
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mt-3">
                <li>Personalize your content and user experience</li>
                <li>Display real-time sports results and updates</li>
                <li>Improve our platform and develop new features</li>
                <li>Communicate with you about important updates</li>
                <li>Prevent fraud and ensure platform security</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                3. Cookies
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We use cookies and similar tracking technologies to store login sessions, preferences, and to understand how users interact with our platform. You can control cookie preferences through your browser settings.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                4. Data Sharing
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We do not sell your personal data. We may share information with:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mt-3">
                <li><strong>Trusted Service Providers:</strong> Third parties who assist us in operating our platform</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger or acquisition</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                5. Data Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mt-3">
                <li>Encrypted storage of sensitive data</li>
                <li>Secure HTTPS connections</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication measures</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                6. Your Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mt-3">
                <li>Request access to your personal data</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Export your data in a portable format</li>
                <li>Object to certain processing of your data</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                To exercise these rights, contact us at{' '}
                <Link 
                  href="mailto:privacy@brixsports.com" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  privacy@brixsports.com
                </Link>
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                7. Changes to Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update this Privacy Policy periodically. We will notify users of significant changes through our platform and update the "Last updated" date below.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-800 dark:text-navy-100 mb-4">
                8. Contact Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                For questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mt-2">
                <Link 
                  href="mailto:privacy@brixsports.com" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  privacy@brixsports.com
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

export default PrivacyPage;