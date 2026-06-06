import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DemoWidget from '@/components/landing/DemoWidget'
import { FileText, Mail, Package, Share2, ArrowRight, Zap } from 'lucide-react'

const FEATURES = [
  {
    icon: Package,
    title: 'Product Descriptions',
    description: 'Sales-ready copy for product pages, catalogues, and landing pages — with the right tone and length.',
  },
  {
    icon: FileText,
    title: 'Blog Blueprints',
    description: 'Structured outlines with sections, sub-points, and word targets. From overview to deep-dive.',
  },
  {
    icon: Mail,
    title: 'Email Campaigns',
    description: 'Complete business emails — pitches, announcements, support — in any style and length.',
  },
  {
    icon: Share2,
    title: 'Social Posts',
    description: 'Platform-native captions for Instagram, LinkedIn, Twitter/X and Facebook. Hook → story → CTA.',
  },
]

export default async function HomePage() {
  let isAuthenticated = false
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isAuthenticated = !!user
  } catch {
    // Supabase not available, treat as unauthenticated
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </span>
            <span className="font-bold text-slate-900">ContentAI</span>
          </div>
          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/generate"
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 transition px-3 py-2">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  Get started <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          Powered by Claude AI · No signup to try
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-4">
          Professional content,<br />
          <span className="text-teal-600">generated in seconds</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10">
          Product descriptions, blog outlines, emails, social posts — all crafted
          by Claude AI with markdown formatting, the right tone, and the right length.
        </p>

        {/* Demo */}
        <DemoWidget />

        <p className="mt-4 text-xs text-slate-400">
          3 free demo generations · No account required · Claude Haiku model
        </p>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <hr className="border-slate-100" />
      </div>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
          Four content types, one tool
        </h2>
        <p className="text-slate-500 text-center mb-10">
          Full access after signup — unlimited generations, saved history, version tracking.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition">
              <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center mb-3">
                <Icon className="w-4.5 h-4.5 text-teal-700" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="bg-teal-600 py-14">
          <div className="max-w-xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Ready for unlimited content?
            </h2>
            <p className="text-teal-100 mb-6 text-sm">
              Create a free account to unlock all content types, saved history,
              token tracking, and version navigation.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white hover:bg-teal-50 text-teal-700 font-semibold px-6 py-3 rounded-xl transition shadow-sm"
            >
              Create free account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        Built with{' '}
        <a href="https://www.anthropic.com" target="_blank" rel="noreferrer" className="hover:text-slate-600 transition">
          Anthropic Claude
        </a>{' '}
        ·{' '}
        <Link href="/login" className="hover:text-slate-600 transition">Sign in</Link>
      </footer>
    </div>
  )
}
