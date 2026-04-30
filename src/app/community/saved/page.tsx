"use client";

import Navbar from "#/components/Navbar";
import { Home, Mail, Bookmark, Ban, Grid } from "lucide-react";
import Link from "next/link";

export default function SavedPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-200">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] right-[-5%] w-[45%] h-[45%] bg-blue-600/10 blur-[130px] rounded-full" />
      </div>
      <Navbar />
      <main className="flex pt-16">
        <aside className="w-[260px] border-r border-white/10 bg-white/[0.02] backdrop-blur-2xl fixed h-screen left-0 top-16 px-4 pt-8">
           <SidebarLink icon={Home} label="Home" href="/community" />
           <SidebarLink icon={Mail} label="Messages" href="/community/messages" />
           <div className="mt-4 pt-4 border-t border-white/10">
              <SidebarLink icon={Bookmark} label="Saved" href="/community/saved" active />
              <SidebarLink icon={Ban} label="Blocked" href="/community/blocked" />
           </div>
        </aside>

        <section className="flex-1 ml-[260px] flex flex-col items-center pt-12 min-h-screen pb-20 relative z-10">
          <div className="w-full max-w-[935px] px-6">
            <header className="flex flex-col items-center mb-12">
               <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
                  <Bookmark className="w-8 h-8 text-purple-400" />
               </div>
               <h1 className="text-4xl font-black text-white tracking-tighter">Saved</h1>
            </header>
            <div className="grid grid-cols-3 gap-2">
               {[1, 2, 3, 4].map((i) => (
                 <div key={i} className="aspect-square bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/[0.05] transition-all cursor-pointer group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
               ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active, href }: any) {
  return (
    <Link href={href} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${active ? "text-white font-black bg-white/10" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
      <Icon className={`w-7 h-7 ${active ? "text-purple-400" : "group-hover:scale-110 transition-transform"}`} />
      <span className="text-[17px] tracking-tight">{label}</span>
    </Link>
  );
}