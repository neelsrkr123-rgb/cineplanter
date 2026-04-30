'use client'

import { useParams } from "next/navigation"
import { db } from "#/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useEffect, useState } from "react"

export default function PublicProfile(){

const { username } = useParams()

const [profile,setProfile] = useState<any>(null)

useEffect(()=>{

 const loadProfile = async ()=>{

  const q = query(
   collection(db,"users"),
   where("username","==",username)
  )

  const snap = await getDocs(q)

  if(!snap.empty){
   setProfile(snap.docs[0].data())
  }

 }

 loadProfile()

},[username])

if(!profile) return <p className="text-white">Loading...</p>

return(

<div className="max-w-4xl mx-auto p-6 text-white">

<div className="flex items-center gap-6">

<img
 src={profile.avatar}
 className="w-28 h-28 rounded-full"
/>

<div>

<h1 className="text-2xl font-bold">
{profile.name}
</h1>

<p className="text-gray-400">
@{profile.username}
</p>

<p className="mt-2">
{profile.bio}
</p>

</div>

</div>

</div>

)

}