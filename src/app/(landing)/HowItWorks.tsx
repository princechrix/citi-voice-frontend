import React from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const HowItWorks = () => {
  const steps = [
    {
      title: 'Submit',
      description: 'Fill out a simple form with your complaint or feedback',
      details: 'Provide details about your concern, select the appropriate category, and submit your complaint.',
      cta: 'Submit a complaint',
      link: '/complaint'
    },
    {
      title: 'Assignment',
      description: 'Your complaint is assigned to the right department',
      details: 'Government agencies receive your complaint and assign it to the appropriate staff member for resolution.',
      link: '/track'
    },
    {
      title: 'Track',
      description: 'Monitor the status of your complaint',
      details: 'Use your complaint ID to check the status and receive updates as your issue is being resolved.',
      cta: 'Track your complaint',
      link: '/track'
    }
  ]

  return (
    <section className="py-16 min-h-[75vh] w-full flex flex-col items-center justify-center">
      <div className="container px-[8%] flex flex-col items-center justify-center">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A simple process to get your concerns addressed by the right authorities
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 relative">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-200 transition-colors duration-200 flex flex-col items-center text-center"
            >
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                </div>
                
                <div className="space-y-2">
                  <p className="text-gray-600">{step.description}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.details}</p>
                </div>
                
                {step.cta && (
                  <Link
                    href={step.link} 
                    className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 font-medium pt-1"
                  >
                    {step.cta}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}

          {/* Arrows between steps */}
          <div className="hidden md:block absolute top-1/2 left-1/3 -ml-2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-6 h-6 bg-primary border border-gray-200 rounded-full flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="hidden md:block absolute top-1/2 right-1/3 -mr-2 transform translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-6 h-6 bg-primary border border-gray-200 rounded-full flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks