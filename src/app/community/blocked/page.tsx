"use client";

import Navbar from "#/components/Navbar";
import { Home, Mail, Bookmark, Ban } from "lucide-react";
import Link from "next/link";

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-200">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>
      <Navbar />
      <main className="flex pt-16">
        <aside className="w-[260px] border-r border-white/10 bg-white/[0.02] backdrop-blur-2xl fixed h-screen left-0 top-16 px-4 pt-8">
           <SidebarLink icon={Home} label="Home" href="/community" />
           <SidebarLink icon={Mail} label="Messages" href="/community/messages" />
           <div className="mt-4 pt-4 border-t border-white/10">
              <SidebarLink icon={Bookmark} label="Saved" href="/community/saved" />
              <SidebarLink icon={Ban} label="Blocked" href="/community/blocked" active />
           </div>
        </aside>

        <section className="flex-1 ml-[260px] flex flex-col items-center pt-20 relative z-10">
          <div className="w-full max-w-[600px] bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <Ban className="text-red-500" /> Blocked Accounts
            </h2>
            <div className="space-y-4">
               {[1].map(i => (
                 <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10" />
                       <span className="font-bold text-white">restricted_creative</span>
                    </div>
                    <button className="text-xs font-black uppercase text-blue-400 hover:text-white transition-colors">Unblock</button>
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