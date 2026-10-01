'use client'

import { useState } from "react"
import ProfileInfo from "./ProfileInfo"

export default function ProfileTabs({profile}:{profile:any}){

const [tab,setTab] = useState("info")

return(

<div className="bg-[#0b0b1f] rounded-xl text-white">

<div className="flex border-b border-white/10">

<button
onClick={()=>setTab("info")}
className={`px-6 py-3 ${tab==="info" && "border-b-2 border-purple-500"}`}
>
Profile Info
</button>

<button
onClick={()=>setTab("uploads")}
className="px-6 py-3"
>
My Uploads
</button>

<button
onClick={()=>setTab("watchlist")}
className="px-6 py-3"
>
Watchlist
</button>

<button
onClick={()=>setTab("saved")}
className="px-6 py-3"
>
Saved Projects
</button>

</div>

<div className="p-6">

{tab==="info" && <ProfileInfo profile={profile}/>}

{tab==="uploads" && <p>Uploads coming soon</p>}

{tab==="watchlist" && <p>Watchlist coming soon</p>}

{tab==="saved" && <p>Saved Projects coming soon</p>}

</div>

</div>

)

}