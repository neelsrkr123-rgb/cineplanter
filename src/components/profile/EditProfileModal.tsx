// src/components/profile/EditProfileModal.tsx
'use client'

import { useState } from "react"
import { X, Loader2, Camera } from "lucide-react"
import { useAuth } from "#/context/AuthContext"

interface EditProfileModalProps {
  profile: any
  onClose: () => void
}

export default function EditProfileModal({ profile, onClose }: EditProfileModalProps) {
  const { updateUserData, updateAvatar } = useAuth()

  const [username, setUsername] = useState(profile?.username || "")
  const [name, setName] = useState(profile?.name || "")
  const [bio, setBio] = useState(profile?.bio || "")
  const [tagline, setTagline] = useState(profile?.tagline || "")
  const [role, setRole] = useState(profile?.role || "")
  const [facebook, setFacebook] = useState(profile?.socials?.facebook || "")
  const [instagram, setInstagram] = useState(profile?.socials?.instagram || "")
  const [youtube, setYoutube] = useState(profile?.socials?.youtube || "")
  const [twitter, setTwitter] = useState(profile?.socials?.twitter || "")

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError("")
  }

  const handleSave = async () => {
    setError("")
    setIsSaving(true)

    try {
      // Upload avatar first if changed
      if (avatarFile) {
        await updateAvatar(avatarFile)
      }

      // Update user data
      await updateUserData({
        name,
        username,
        bio,
        tagline,
        role,
        socials: {
          instagram,
          youtube,
          twitter,
          facebook,
        },
      })

      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* AVATAR */}
          <div>
            <label className="text-sm text-slate-400">Avatar</label>
            <div className="flex items-center gap-4 mt-2">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 bg-zinc-900 flex items-center justify-center">
                {avatarPreview || profile?.avatar ? (
                  <img
                    src={avatarPreview || profile.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera size={24} className="text-gray-500" />
                )}
              </div>
              <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-md px-3 py-2 text-sm transition-colors text-white">
                Choose File
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              {avatarFile && (
                <span className="text-xs text-slate-500 truncate max-w-[150px]">
                  {avatarFile.name}
                </span>
              )}
            </div>
          </div>

          {/* NAME */}
          <div>
            <label className="text-sm text-slate-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-purple-500"
              placeholder="Your display name"
            />
          </div>

          {/* USERNAME */}
          <div>
            <label className="text-sm text-slate-400">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-purple-500"
              placeholder="username"
            />
          </div>

          {/* ROLE */}
          <div>
            <label className="text-sm text-slate-400">Title / Role</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Editor / Cinematographer"
              className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* TAGLINE */}
          <div>
            <label className="text-sm text-slate-400">Tagline</label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-purple-500"
              placeholder="A short tagline"
            />
          </div>

          {/* BIO */}
          <div>
            <label className="text-sm text-slate-400">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Tell others about yourself"
            />
          </div>

          {/* SOCIALS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Facebook</label>
              <input
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Instagram</label>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">YouTube</label>
              <input
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="https://youtube.com/@..."
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Twitter / X</label>
              <input
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="https://twitter.com/..."
              />
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full mt-3 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-md text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}