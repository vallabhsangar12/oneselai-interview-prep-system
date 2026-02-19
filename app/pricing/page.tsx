'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, Zap, Crown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'Forever',
    description: 'Perfect for getting started',
    interviews_per_day: 1,
    interviews_per_month: 30,
    features: [
      '1 interview per day',
      '30 days history',
      'Basic analytics',
      'Email support',
      'Standard resume',
    ],
    cta: 'Get Started',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$2',
    period: '/month',
    description: 'For serious job seekers',
    interviews_per_day: 10,
    interviews_per_month: 300,
    features: [
      '10 interviews per day',
      'Unlimited history',
      'Advanced analytics',
      'Priority email support',
      'Multiple resumes',
      'Interview transcripts',
    ],
    cta: 'Subscribe Now',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$10',
    period: '/year',
    description: 'Complete interview mastery',
    interviews_per_day: 'Unlimited',
    interviews_per_month: 'Unlimited',
    features: [
      'Unlimited interviews',
      'Unlimited history',
      'Full analytics suite',
      '24/7 priority support',
      'Unlimited resumes',
      'Video recording',
      'AI feedback & coaching',
      'Career guidance',
    ],
    cta: 'Subscribe Now',
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [activePlan, setActivePlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingPlan, setIsFetchingPlan] = useState(true)

  // Fetch user's current plan on load
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const res = await fetch('/api/subscriptions/check', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.has_subscription && data.plan && data.plan !== 'none') {
            setActivePlan(data.plan)
            setSelectedPlan(data.plan)
          }
        }
      } catch {
        // User not logged in or no subscription
      } finally {
        setIsFetchingPlan(false)
      }
    }
    fetchCurrentPlan()
  }, [])

  const handleCardClick = useCallback((planId: string) => {
    setSelectedPlan(planId)
  }, [])

  const handleSelectPlan = useCallback(async (planId: string) => {
    if (activePlan === planId) {
      toast.info('This is already your active plan.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/subscriptions/select-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
        credentials: 'include',
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 401) {
          toast.error('Please sign in to select a plan.')
          router.push('/login?redirect=/pricing')
          return
        }
        toast.error(data.error || 'Failed to select plan')
        return
      }

      const planName = PLANS.find(p => p.id === planId)?.name || planId
      setActivePlan(planId)
      setSelectedPlan(planId)

      if (activePlan) {
        toast.success(`Plan upgraded to ${planName}!`, {
          description: `Your ${planName} plan is now active.`,
        })
      } else {
        toast.success(`${planName} Plan Activated`, {
          description: `Welcome! Your ${planName} plan is now active.`,
        })
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [activePlan, router])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-purple-900/10 to-blue-900/10 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold sm:text-5xl">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Simple, Transparent Pricing
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Choose the perfect plan for your interview preparation. All plans include access to our AI interview platform.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
              {PLANS.map((plan) => {
                const isActive = activePlan === plan.id
                const isSelected = selectedPlan === plan.id
                const isPopular = plan.popular

                return (
                  <Card
                    key={plan.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${plan.name} plan`}
                    aria-pressed={isSelected}
                    onClick={() => handleCardClick(plan.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleCardClick(plan.id)
                      }
                    }}
                    className={`relative flex flex-col p-8 cursor-pointer transition-all duration-300 ease-out outline-none
                      ${isSelected
                        ? 'border-2 border-purple-500 shadow-xl shadow-purple-500/15 bg-purple-500/5 -translate-y-1 ring-1 ring-purple-500/30'
                        : isPopular
                          ? 'border-2 border-purple-600/40 shadow-lg shadow-purple-500/10'
                          : 'border border-border'
                      }
                      ${!isSelected ? 'hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5' : ''}
                      focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    `}
                  >
                    {/* Badges */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {isPopular && !isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1 text-xs font-semibold text-white shadow-md">
                          <Zap className="h-3 w-3" /> Most Popular
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1 text-xs font-medium text-white shadow-md">
                          <Crown className="h-3 w-3" /> Current Plan
                        </span>
                      )}
                    </div>

                    {/* Selection indicator */}
                    {isSelected && !isActive && (
                      <div className="absolute top-4 right-4">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                        <span className="text-muted-foreground">{plan.period}</span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-purple-400">
                        {typeof plan.interviews_per_day === 'number'
                          ? `${plan.interviews_per_day} interviews/day`
                          : plan.interviews_per_day}
                      </p>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectPlan(plan.id)
                      }}
                      disabled={isLoading || isFetchingPlan}
                      className={`mb-8 w-full rounded-xl font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-muted text-muted-foreground cursor-default hover:bg-muted'
                          : isSelected
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02]'
                            : 'border border-purple-500/30 hover:bg-purple-500/10'
                      }`}
                      variant={isActive ? 'secondary' : isSelected ? 'default' : 'outline'}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : isActive ? (
                        'Current Plan'
                      ) : (
                        plan.cta
                      )}
                    </Button>

                    <div className="flex-1">
                      <ul className="space-y-4">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <Check className="h-5 w-5 flex-shrink-0 text-purple-600 mt-0.5" />
                            <span className="text-sm text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* FAQ */}
            <div className="mt-20 border-t border-border pt-20">
              <h2 className="text-2xl font-bold text-center mb-12">Frequently Asked Questions</h2>
              <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Can I change plans later?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
                  <p className="text-sm text-muted-foreground">
                    We currently support credit cards and PayPal. More options coming soon.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Is there a free trial?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes! Start with our free plan to experience the platform with 1 interview per day.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Can I cancel anytime?</h3>
                  <p className="text-sm text-muted-foreground">
                    Absolutely. Cancel your subscription anytime without penalties.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
