'use client'

export default function ProfileStats({profile}:{profile:any}){

return(

<div className="bg-[#0b0b1f] p-6 rounded-xl text-white flex gap-12">

<div>

<p className="text-2xl font-bold">
{profile.postsCount || 0}
</p>

<p className="text-gray-400 text-sm">
Posts
</p>

</div>

<div>

<p className="text-2xl font-bold">
{profile.followers?.length || 0}
</p>

<p className="text-gray-400 text-sm">
Followers
</p>

</div>

<div>

<p className="text-2xl font-bold">
{profile.following?.length || 0}
</p>

<p className="text-gray-400 text-sm">
Following
</p>

</div>

</div>

)

}