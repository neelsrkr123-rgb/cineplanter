'use client'

import {
User,
Film,
Bookmark,
Star,
Folder,
ShoppingBag,
GraduationCap,
CreditCard,
DollarSign,
Settings,
LogOut
} from "lucide-react"

export default function ProfileSidebar(){

const menu = [

{icon:User,label:"Profile Info"},
{icon:Film,label:"My Movies"},
{icon:Bookmark,label:"Watchlist"},
{icon:Star,label:"Public Reviews"},
{icon:Folder,label:"Saved Projects"},
{icon:ShoppingBag,label:"My Products"},
{icon:GraduationCap,label:"My Courses"}

]

const finance = [

{icon:CreditCard,label:"Payment Method"},
{icon:DollarSign,label:"Earnings"}

]

return(

<div className="flex flex-col text-sm">

<p className="text-white font-semibold text-lg mb-6">
Menu
</p>

{/* MAIN MENU */}

<div className="space-y-5">

{menu.map((item,index)=>{

const Icon = item.icon

return(

<div
key={index}
className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer transition"
>

<Icon size={20}/>

<span className="text-[15px] font-medium">
{item.label}
</span>

</div>

)

})}

</div>

<hr className="border-white/10 my-8"/>

{/* FINANCE */}

<div className="space-y-5">

{finance.map((item,index)=>{

const Icon = item.icon

return(

<div
key={index}
className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer transition"
>

<Icon size={20}/>

<span className="text-[15px] font-medium">
{item.label}
</span>

</div>

)

})}

</div>

<hr className="border-white/10 my-8"/>

{/* SETTINGS + LOGOUT */}

<div className="space-y-5">

<div className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer">

<Settings size={20}/>

<span className="text-[15px] font-medium">
Settings
</span>

</div>

<div className="flex items-center gap-3 text-red-400 hover:text-red-500 cursor-pointer">

<LogOut size={20}/>

<span className="text-[15px] font-medium">
Logout
</span>

</div>

</div>

</div>

)

}