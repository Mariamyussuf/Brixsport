'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

// Types for FAQ items
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// Mock FAQ data
const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I create an account?',
    answer: 'To create an account, click on the "Sign Up" button on the login page and fill in your details. You\'ll receive a confirmation email to verify your account.',
    category: 'Account'
  },
  {
    id: '2',
    question: 'Can I use the app offline?',
    answer: 'Yes! Brixsports supports offline mode. Events you log while offline will be automatically synced when you reconnect to the internet.',
    category: 'Features'
  },
  {
    id: '3',
    question: 'Is my data secure?',
    answer: 'Absolutely. We use industry-standard encryption to protect your data both in transit and at rest. Your information is never shared with third parties without your consent.',
    category: 'Security'
  },
  {
    id: '4',
    question: 'How can I view team statistics?',
    answer: 'Go to the "Stats" section where you can view detailed performance metrics for teams and players, including goals, assists, clean sheets, and more.',
    category: 'Features'
  },
  {
    id: '5',
    question: 'Can I manage multiple teams?',
    answer: 'Yes, you can manage multiple teams from a single account. Simply switch between teams using the team selector in the main navigation.',
    category: 'Account'
  },
  {
    id: '6',
    question: 'How do I report a bug?',
    answer: 'You can report bugs through the "Help & Support" section in your profile, or email us directly at brixsports2025@gmail.com with details about the issue.',
    category: 'Support'
  },
  {
    id: '7',
    question: 'What devices are supported?',
    answer: 'Brixsports works on all modern smartphones, tablets, and desktop browsers. We also offer dedicated iOS and Android apps for mobile devices.',
    category: 'Technical'
  }
];

// Group FAQ items by category
const groupFAQsByCategory = (faqs: FAQItem[]) => {
  const grouped: Record<string, FAQItem[]> = {};
  
  faqs.forEach(faq => {
    if (!grouped[faq.category]) {
      grouped[faq.category] = [];
    }
    grouped[faq.category].push(faq);
  });
  
  return grouped;
};

const FAQItemComponent = ({ faq }: { faq: FAQItem }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader 
        className="pb-3 cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="text-lg flex justify-between items-center">
          <span>{faq.question}</span>
          {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
        </CardTitle>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0">
          <p className="text-gray-600 dark:text-gray-300">
            {faq.answer}
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default function FAQPage() {
  const router = useRouter();
  const groupedFAQs = groupFAQsByCategory(faqData);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.back()}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h1>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8 max-w-3xl">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Find answers to common questions about using Brixsports. If you can't find what you're looking for, 
            please contact our support team.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {Object.entries(groupedFAQs).map(([category, faqs]) => (
            <div key={category}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <HelpCircle className="h-6 w-6 mr-2 text-blue-500" />
                {category}
              </h2>
              
              <div className="grid gap-4">
                {faqs.map((faq) => (
                  <FAQItemComponent key={faq.id} faq={faq} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Still have questions?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            If you can't find the answer you're looking for, please contact our support team.
          </p>
          <Button 
            onClick={() => router.push('/profile')} 
            variant="default"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}