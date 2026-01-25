"use client"

import { Mail, MapPin, Phone, Send, Clock, Sparkles, ArrowRight, Globe } from "lucide-react"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function ContactPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[#e8e6e1] selection:bg-rose-100 font-serif">
      <PublicHeader />

      <main className="pt-32 pb-24 md:pt-40 md:pb-32 px-4 overflow-hidden">
        {/* Ambient Background Elements */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-200/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-200/20 rounded-full blur-[120px]"></div>
        </div>

        {/* 3D Magazine Container */}
        <div className="max-w-6xl mx-auto perspective-[2000px]">
          <div className="relative flex flex-col md:flex-row shadow-2xl shadow-slate-900/20 group animate-in fade-in zoom-in duration-700">

            {/* LEFT PAGE (Editorial/Info) */}
            <div className="relative md:w-1/2 bg-[#1a1a1a] text-[#e8e6e1] min-h-[600px] md:min-h-[750px] p-8 md:p-12 lg:p-16 flex flex-col justify-between overflow-hidden md:rounded-l-lg origin-right transform-style-3d">
              {/* Paper Grain Texture Overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

              {/* Left Page Shadow/Bind Effect */}
              <div className="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-10 hidden md:block"></div>

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-12">
                  <div className="h-px bg-white/20 w-12"></div>
                  <span className="text-[10px] uppercase tracking-[0.4em] font-sans text-rose-200">Issue 01 — Contact</span>
                </div>

                <h1 className="text-6xl md:text-8xl font-black font-sans tracking-tight leading-[0.9] mb-8">
                  SAY<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-rose-200 to-orange-200">HELLO.</span>
                </h1>

                <p className="font-sans text-white/60 text-lg max-w-sm leading-relaxed font-light border-l border-white/10 pl-6">
                  Yeni projeler, iş birlikleri veya sadece bir kahve için. Kapımız her zaman açık.
                </p>
              </div>

              <div className="relative z-10 grid gap-8 mt-12">
                {[
                  { icon: Mail, title: "Email", value: "hello@fogcatalog.com", desc: "Digital inquiries" },
                  { icon: Phone, title: "Studio", value: "+90 (212) 000 00 00", desc: "Mon-Fri, 09:00-18:00" },
                  { icon: MapPin, title: "Visit", value: "Levent, Istanbul", desc: "Kolektif House HQ" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group/item cursor-pointer">
                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center shrink-0 group-hover/item:bg-rose-500 group-hover/item:border-rose-500 group-hover/item:text-white transition-all duration-300">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="font-sans">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{item.title}</p>
                      <p className="text-lg font-medium text-white group-hover/item:text-rose-200 transition-colors">{item.value}</p>
                      <p className="text-xs text-white/30">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-6 font-sans">
                <div className="text-[10px] uppercase tracking-widest text-white/20">Page 01</div>
                <div className="flex gap-4">
                  <Globe className="w-4 h-4 text-white/20" />
                  <Sparkles className="w-4 h-4 text-white/20" />
                </div>
              </div>
            </div>

            {/* SPINE (Center Fold) */}
            <div className="hidden md:block w-px h-full relative z-20">
              <div className="absolute inset-y-0 -left-4 w-8 bg-gradient-to-r from-black/10 via-black/5 to-black/10 blur-sm pointer-events-none"></div>
            </div>

            {/* RIGHT PAGE (Form) */}
            <div className="relative md:w-1/2 bg-[#fdfaf5] text-slate-800 min-h-[600px] md:min-h-[750px] p-8 md:p-12 lg:p-16 md:rounded-r-lg origin-left transform-style-3d">
              {/* Paper Grain */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

              {/* Right Page Shadow/Bind Effect */}
              <div className="absolute top-0 left-0 w-12 h-full bg-gradient-to-r from-black/5 to-transparent pointer-events-none z-10 hidden md:block"></div>

              <div className="relative z-10 h-full flex flex-col">
                <div className="mb-10 text-center">
                  <h2 className="font-serif text-3xl md:text-4xl italic text-slate-900 mb-2">Bize Yazın</h2>
                  <div className="w-16 h-1 bg-rose-500 mx-auto rounded-full"></div>
                </div>

                <form className="flex-1 space-y-8 font-sans" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="relative group">
                      <Input
                        className="bg-transparent border-0 border-b border-slate-300 rounded-none px-0 h-10 focus:ring-0 focus:border-rose-500 transition-colors placeholder:text-transparent peer"
                        placeholder="Adınız"
                        id="name"
                      />
                      <Label htmlFor="name" className="absolute left-0 top-2 text-slate-400 text-base transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-rose-500 peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs cursor-text">
                        Adınız Soyadınız
                      </Label>
                    </div>
                    <div className="relative group">
                      <Input
                        className="bg-transparent border-0 border-b border-slate-300 rounded-none px-0 h-10 focus:ring-0 focus:border-rose-500 transition-colors placeholder:text-transparent peer"
                        placeholder="Email"
                        id="email"
                        type="email"
                      />
                      <Label htmlFor="email" className="absolute left-0 top-2 text-slate-400 text-base transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-rose-500 peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs cursor-text">
                        E-Posta Adresi
                      </Label>
                    </div>
                  </div>

                  <div className="relative group pt-4">
                    <select className="w-full bg-transparent border-0 border-b border-slate-300 rounded-none px-0 h-10 focus:ring-0 focus:border-rose-500 transition-colors text-slate-700 font-medium">
                      <option>Konu Seçiniz: Genel Bilgi</option>
                      <option>Katalog Tasarımı</option>
                      <option>Teknik Destek</option>
                      <option>Kurumsal İşbirliği</option>
                    </select>
                  </div>

                  <div className="relative group">
                    <Textarea
                      className="bg-transparent border-0 border-b border-slate-300 rounded-none px-0 min-h-[120px] focus:ring-0 focus:border-rose-500 transition-colors placeholder:text-transparent peer resize-none"
                      placeholder="Mesaj"
                      id="message"
                    />
                    <Label htmlFor="message" className="absolute left-0 top-0 text-slate-400 text-base transition-all peer-focus:-top-6 peer-focus:text-xs peer-focus:text-rose-500 peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-xs cursor-text">
                      Mesajınız
                    </Label>
                  </div>

                  <div className="pt-8 flex justify-center">
                    <Button className="h-16 px-12 rounded-full bg-slate-900 text-white hover:bg-rose-600 hover:scale-105 transition-all duration-300 shadow-xl shadow-slate-900/10 group">
                      <span className="mr-2 uppercase tracking-widest text-xs font-bold">GÖNDER</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-sans">
                    or Email us directly at <a href="mailto:hello@fogcatalog.com" className="text-slate-900 border-b border-slate-900 hover:text-rose-600 hover:border-rose-600 transition-colors">hello@fogcatalog.com</a>
                  </p>
                </div>

                <div className="mt-auto flex justify-end border-t border-slate-200 pt-6 font-sans">
                  <div className="text-[10px] uppercase tracking-widest text-slate-300">Page 02</div>
                </div>
              </div>
            </div>

            {/* Stacked Pages Effect (for depth) */}
            <div className="hidden md:block absolute top-[10px] left-[10px] w-full h-full bg-white rounded-lg -z-10 shadow-lg border border-slate-200"></div>
            <div className="hidden md:block absolute top-[20px] left-[20px] w-full h-full bg-white rounded-lg -z-20 shadow-lg border border-slate-200"></div>

          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
