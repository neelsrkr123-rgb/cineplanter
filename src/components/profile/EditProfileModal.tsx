'use client'

import { useState } from "react"
import { X } from "lucide-react"
import { useAuth } from "#/context/AuthContext"

export default function EditProfileModal({
  profile,
  onClose
}: {
  profile: any
  onClose: () => void
}) {

  const { updateUserData, updateAvatar } = useAuth()

  const [username, setUsername] = useState(profile?.username || "")
  const [bio, setBio] = useState(profile?.bio || "")
  const [tagline, setTagline] = useState(profile?.tagline || "")
  const [role, setRole] = useState(profile?.role || "")
  const [facebook, setFacebook] = useState(profile?.socials?.facebook || "")
  const [instagram, setInstagram] = useState(profile?.socials?.instagram || "")

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {

    setIsSaving(true)

    try {

      if (avatarFile) {
        await updateAvatar(avatarFile)
      }

      await updateUserData({
        username,
        bio,
        tagline,
        role,
        socials: {
          facebook,
          instagram
        }
      })

      onClose()

    } catch (err) {

      console.error(err)

    }

    setIsSaving(false)

  }

  return (

    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <div className="w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-xl p-6">

        {/* HEADER */}

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-lg font-semibold text-white">
            Edit Profile
          </h2>

          <button onClick={onClose}>
            <X size={20}/>
          </button>

        </div>


        <div className="space-y-4">

          {/* AVATAR */}

          <div>

            <label className="text-sm text-slate-400">
              Avatar
            </label>

            <input
              type="file"
              onChange={(e) =>
                setAvatarFile(e.target.files?.[0] || null)
              }
              className="mt-1 block w-full text-sm"
            />

          </div>


          {/* USERNAME */}

          <div>

            <label className="text-sm text-slate-400">
              Username
            </label>

            <input
              value={username}
              onChange={(e)=>setUsername(e.target.value)}
              className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm"
            />

          </div>


          {/* ROLE */}

          <div>

            <label className="text-sm text-slate-400">
              Title
            </label>

            <input
              value={role}
              onChange={(e)=>setRole(e.target.value)}
              placeholder="Editor / Cinematographer"
              className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm"
            />

          </div>


          {/* TAGLINE */}

          <div>

            <label className="text-sm text-slate-400">
              Tagline
            </label>

            <input
              value={tagline}
              onChange={(e)=>setTagline(e.target.value)}
              className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm"
            />

          </div>


          {/* BIO */}

          <div>

            <label className="text-sm text-slate-400">
              Bio
            </label>

            <textarea
              value={bio}
              onChange={(e)=>setBio(e.target.value)}
              rows={3}
              className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm"
            />

          </div>


          {/* FACEBOOK */}

          <div>

            <label className="text-sm text-slate-400">
              Facebook
            </label>

            <input
              value={facebook}
              onChange={(e)=>setFacebook(e.target.value)}
              className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm"
            />

          </div>


          {/* INSTAGRAM */}

          <div>

            <label className="text-sm text-slate-400">
              Instagram
            </label>

            <input
              value={instagram}
              onChange={(e)=>setInstagram(e.target.value)}
              className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-md p-2 text-sm"
            />

          </div>


          {/* SAVE BUTTON */}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full mt-3 bg-purple-700 hover:bg-purple-800 text-white py-2 rounded-md text-sm"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>

        </div>

      </div>

    </div>

  )

}