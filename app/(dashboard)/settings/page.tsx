'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Shield, LogOut, CreditCard, Save, ExternalLink, CheckCircle, Lock } from 'lucide-react'

const inputCls =
  'w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition'

export default function SettingsPage() {
  const router = useRouter()
  const [signOutLoading, setSignOutLoading] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? '')
        const name = typeof data.user.user_metadata?.full_name === 'string'
          ? data.user.user_metadata.full_name
          : ''
        setDisplayName(name)
        setNameInput(name)
      }
      setProfileLoaded(true)
    })
  }, [])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setProfileError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { full_name: nameInput.trim() },
      })
      if (error) throw error
      setDisplayName(nameInput.trim())
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    setSavingPassword(true)
    setPasswordError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPasswordSaved(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSaved(false), 3000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSignOut = async () => {
    setSignOutLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      router.push('/login')
    }
  }

  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your account</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <User className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800 text-sm">Profile</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-medium text-slate-900">{displayName || 'No name set'}</p>
              <p className="text-sm text-slate-500">{email}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Display Name</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your full name"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className={`${inputCls} bg-slate-50 text-slate-400 cursor-not-allowed`}
            />
            <p className="mt-1 text-xs text-slate-400">Email cannot be changed here</p>
          </div>

          {profileError && (
            <p className="text-sm text-red-600">{profileError}</p>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile || !profileLoaded || nameInput.trim() === displayName}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
          >
            {profileSaved ? (
              <><CheckCircle className="w-4 h-4" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" />{savingProfile ? 'Saving...' : 'Save Changes'}</>
            )}
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Shield className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800 text-sm">Security</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Authentication</p>
              <p className="text-sm text-slate-500">Managed via Supabase Auth — your session is secure</p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Active</span>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleSignOut}
              disabled={signOutLoading}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium transition disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {signOutLoading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Lock className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800 text-sm">Change Password</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null) }}
              placeholder="Minimum 6 characters"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null) }}
              placeholder="Repeat new password"
              className={inputCls}
            />
          </div>

          {passwordError && (
            <p className="text-sm text-red-600">{passwordError}</p>
          )}

          <button
            onClick={handleChangePassword}
            disabled={savingPassword || !newPassword || !confirmPassword}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
          >
            {passwordSaved ? (
              <><CheckCircle className="w-4 h-4" /> Password updated!</>
            ) : (
              <><Lock className="w-4 h-4" />{savingPassword ? 'Updating...' : 'Update Password'}</>
            )}
          </button>
        </div>
      </div>

      {/* Billing */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <CreditCard className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800 text-sm">API & Billing</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Current Plan</p>
              <p className="text-sm text-slate-500">Pay-as-you-go via Anthropic API</p>
            </div>
            <span className="text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-medium">API Key</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-amber-800 mb-0.5">How billing works</p>
            <p className="text-sm text-amber-700">
              Content is generated using your Anthropic API key. Costs are billed directly by Anthropic based on tokens used.
            </p>
          </div>

          <div className="space-y-2">
            <a
              href="https://console.anthropic.com/settings/billing"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between w-full px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition group"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">Add Credits</p>
                <p className="text-xs text-slate-500">Top up your Anthropic account balance</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
            </a>
            <a
              href="https://console.anthropic.com/settings/usage"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between w-full px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition group"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">View Usage</p>
                <p className="text-xs text-slate-500">See your API usage and spending</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
            </a>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between w-full px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition group"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">Manage API Keys</p>
                <p className="text-xs text-slate-500">Create or rotate your Anthropic API keys</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
