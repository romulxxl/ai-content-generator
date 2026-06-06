import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DemoWidget from '@/components/landing/DemoWidget'
import { ArrowRight } from 'lucide-react'

const FEATURES = [
  {
    num: '01',
    title: 'Product Descriptions',
    description: 'Sales-ready copy for product pages, catalogues, and landing pages. Tone, length, and emphasis — all dialled in.',
  },
  {
    num: '02',
    title: 'Blog Blueprints',
    description: 'Structured outlines with sections, sub-points, and word targets. From a quick overview to a comprehensive deep-dive.',
  },
  {
    num: '03',
    title: 'Email Campaigns',
    description: 'Complete business emails for any goal — pitches, announcements, support replies — in five distinct styles.',
  },
  {
    num: '04',
    title: 'Social Posts',
    description: 'Platform-native captions for Instagram, LinkedIn, Twitter/X and Facebook. Hook → story → CTA, every time.',
  },
]

export default async function HomePage() {
  let isAuthenticated = false
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isAuthenticated = !!user
  } catch { /* treat as unauthenticated */ }

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#1c1c17]">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-[#faf8f3]/[0.97] backdrop-blur-md border-b border-[#e8e4db]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-display font-bold text-lg tracking-tight text-[#1c1c17]">ContentAI</span>
            <span className="hidden sm:inline text-xs text-[#a09890] border border-[#e8e4db] px-2 py-0.5 rounded-full">
              Powered by Claude
            </span>
          </div>
          <nav className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link href="/generate"
                className="flex items-center gap-1.5 bg-[#1b3f2d] hover:bg-[#152e24] text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-[#6b6660] hover:text-[#1c1c17] transition px-3 py-2">
                  Log in
                </Link>
                <Link href="/signup"
                  className="flex items-center gap-1.5 bg-[#1b3f2d] hover:bg-[#152e24] text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                  Get started <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero + Demo (two-column above the fold) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 scroll-mt-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">

          {/* Left: text + CTA */}
          <div className="pt-4 pb-8 lg:pb-20 lg:pt-6">
            <p className="text-xs font-medium tracking-widest uppercase text-[#a09890] mb-5">
              AI content generation
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight text-[#1c1c17] mb-5">
              Generate content<br />
              <span className="italic text-[#1b3f2d]">that converts.</span>
            </h1>
            <p className="text-base text-[#3d3d35] max-w-sm leading-relaxed mb-8">
              Product descriptions, blog outlines, emails, social posts —
              crafted by Claude AI with the right tone, structure, and length.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a href="#demo"
                className="flex items-center gap-2 bg-[#1b3f2d] hover:bg-[#152e24] text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm">
                Try it free <ArrowRight className="w-4 h-4" />
              </a>
              {!isAuthenticated && (
                <Link href="/signup" className="text-sm text-[#6b6660] hover:text-[#1c1c17] transition font-medium">
                  Sign up free →
                </Link>
              )}
            </div>
            <p className="mt-5 text-xs text-[#b0a89e]">
              3 free demo generations · no account required
            </p>
          </div>

          {/* Right: live demo */}
          <div id="demo" className="pb-8 lg:pb-20 scroll-mt-14">
            <DemoWidget />
          </div>

        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-14 border-t border-[#e8e4db]">
        <p className="text-xs font-medium tracking-widest uppercase text-[#a09890] mb-12">
          What you can generate
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-10">
          {FEATURES.map(({ num, title, description }) => (
            <div key={num} className="border-t border-[#e8e4db] pt-6">
              <span className="font-display text-3xl font-bold text-[#d4cfbf] leading-none block mb-3">
                {num}
              </span>
              <h3 className="font-semibold text-[#1c1c17] mb-2 text-base">{title}</h3>
              <p className="text-sm text-[#4a4a40] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      {!isAuthenticated && (
        <section className="bg-[#1b3f2d]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <p className="text-xs font-medium tracking-widest uppercase text-[#6faa84] mb-4">
              Full access
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight mb-3 max-w-xl">
              Unlimited generations,<br />
              <span className="italic">saved history, version tracking.</span>
            </h2>
            <p className="text-[#9ec4aa] mb-8 max-w-md text-sm leading-relaxed">
              Sign up to unlock all content types, longer outputs, generation history,
              token tracking, and full regeneration control.
            </p>
            <Link href="/signup"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#f5f5f0] text-[#1b3f2d] font-semibold px-6 py-3 rounded-lg transition text-sm">
              Create free account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-[#e8e4db] py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-[#a09890]">
          <span className="font-display font-bold text-[#1c1c17]">ContentAI</span>
          <div className="flex items-center gap-4">
            <a href="https://www.anthropic.com" target="_blank" rel="noreferrer" className="hover:text-[#1c1c17] transition">
              Built with Claude
            </a>
            <Link href="/login" className="hover:text-[#1c1c17] transition">Sign in</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
