'use client'

export default function ProfileInfo({profile}:{profile:any}){

return(

<div className="space-y-4 text-sm">

<div>
<p className="text-gray-400">Bio</p>
<p>{profile.bio || "No bio yet"}</p>
</div>

<div>
<p className="text-gray-400">Location</p>
<p>{profile.location || "Unknown"}</p>
</div>

<div>
<p className="text-gray-400">Role</p>
<p>{profile.role || "Filmmaker"}</p>
</div>

{profile.profileType === "freelancer" && (

<>

<div>
<p className="text-gray-400">Skills</p>
<p>{profile.skills || "No skills added"}</p>
</div>

<div>
<p className="text-gray-400">Services</p>
<p>{profile.services || "No services listed"}</p>
</div>

<div>
<p className="text-gray-400">Hourly Rate</p>
<p>{profile.hourlyRate || "Not specified"}</p>
</div>

</>

)}

</div>

)

}