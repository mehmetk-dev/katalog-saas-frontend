"use client"

import { useState } from "react"
import { Mail, MapPin, Send, Sparkles, Globe, Instagram, Twitter, MessageSquare, HelpCircle, DollarSign, Handshake } from "lucide-react"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export default function ContactPage() {
  const [selectedSubject, setSelectedSubject] = useState<string>("")

  const subjects = [
    { id: 'genel', label: 'Genel', icon: MessageSquare },
    { id: 'destek', label: 'Destek', icon: HelpCircle },
    { id: 'fiyat', label: 'Fiyat', icon: DollarSign },
    { id: 'isbirligi', label: 'İş Birliği', icon: Handshake },
  ]

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-900 selection:bg-violet-100 font-sans">
      <PublicHeader />

      <main className="relative pt-24 pb-16 md:pt-32 md:pb-20 px-4 overflow-hidden">
        {/* Ambient background */}
        <div className="fixed inset-0 pointer-events-none -z-10 bg-[#FDFCFB]">
          <div className={cn(
            "absolute top-[-10%] right-[-10%] w-[60%] h-[60%]",
            "bg-violet-100/30 rounded-full blur-[120px]"
          )} />
          <div className={cn(
            "absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%]",
            "bg-fuchsia-100/20 rounded-full blur-[120px]"
          )} />
        </div>

        {/* Magazine Spread Container - Responsive */}
        <div className="max-w-6xl mx-auto">
          <div className={cn(
            "relative flex flex-col md:flex-row",
            "min-h-[auto] md:min-h-[70vh] md:max-h-[800px]",
            "shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)]",
            "md:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)]",
            "animate-in fade-in zoom-in duration-1000"
          )}>

            {/* LEFT PAGE: Editorial Contents */}
            <div className={cn(
              "relative md:w-1/2 bg-slate-900 text-slate-50",
              "p-6 sm:p-8 md:p-10 lg:p-16",
              "flex flex-col justify-between overflow-hidden",
              "rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
            )}>
              {/* Paper Grain */}
              <div className={cn(
                "absolute inset-0 opacity-[0.05] pointer-events-none",
                "mix-blend-overlay",
                "bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
              )} />

              {/* Inner shadow - Desktop only */}
              <div className={cn(
                "absolute top-0 right-0 w-24 h-full",
                "bg-gradient-to-l from-black/20 to-transparent",
                "pointer-events-none z-10 hidden md:block"
              )} />

              <div className="relative z-10">
                {/* Header badge */}
                <div className="flex items-center gap-3 mb-6 md:mb-10">
                  <span className={cn(
                    "text-[9px] sm:text-[10px] uppercase",
                    "tracking-[0.3em] sm:tracking-[0.4em]",
                    "font-bold text-violet-400"
                  )}>İletişim / Foglio №01</span>
                  <div className="h-px bg-slate-700 flex-1" />
                </div>

                {/* Title */}
                <div className="mb-6 md:mb-8">
                  <h1 className={cn(
                    "text-4xl sm:text-5xl md:text-6xl",
                    "lg:text-7xl xl:text-8xl font-black",
                    "tracking-tighter leading-[0.85] italic",
                    "mb-3 md:mb-4"
                  )}>
                    BAĞLANTI
                    <br />
                    <span className={cn(
                      "text-transparent bg-clip-text bg-gradient-to-br",
                      "from-violet-400 via-fuchsia-200 to-white"
                    )}>KURUN.</span>
                  </h1>
                  <p className={cn(
                    "text-slate-400 text-sm sm:text-base md:text-lg",
                    "font-light leading-relaxed max-w-sm"
                  )}>
                    Sorularınız mı var? Size yardımcı olmaktan mutluluk duyarız. 24 saat içinde yanıt veririz.
                  </p>
                </div>

                {/* Contact info */}
                <div className="space-y-5 md:space-y-8 mt-8 md:mt-12">
                  {[
                    { icon: Mail, label: "E-posta", value: "info@fogcatalog.com" },
                    { icon: MapPin, label: "Konum", value: "Levent, İstanbul" },
                    { icon: Globe, label: "Durum", value: "Çevrimiçi / 7-24" }
                  ].map((item, i) => (
                    <div key={i} className="group cursor-pointer">
                      <p className={cn(
                        "text-[9px] uppercase tracking-[0.25em] sm:tracking-[0.3em]",
                        "text-slate-500 mb-1.5 md:mb-2 font-bold"
                      )}>{item.label}</p>
                      <div className="flex items-center gap-2.5 md:gap-3">
                        <item.icon className={cn(
                          "w-3.5 h-3.5 md:w-4 md:h-4 text-violet-500",
                          "group-hover:scale-125 transition-transform"
                        )} />
                        <p className={cn(
                          "text-base sm:text-lg md:text-xl font-medium",
                          "tracking-tight group-hover:text-violet-400",
                          "transition-colors break-all sm:break-normal"
                        )}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className={cn(
                "relative z-10 pt-8 md:pt-12 mt-8 md:mt-0",
                "border-t border-slate-800 flex items-center justify-between"
              )}>
                <div className="flex gap-4 md:gap-6">
                  <Instagram className={cn(
                    "w-4 h-4 md:w-5 md:h-5 text-slate-500",
                    "hover:text-white transition-colors cursor-pointer"
                  )} />
                  <Twitter className={cn(
                    "w-4 h-4 md:w-5 md:h-5 text-slate-500",
                    "hover:text-white transition-colors cursor-pointer"
                  )} />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">FogCatalog</span>
              </div>
            </div>

            {/* SPINE - Desktop only */}
            <div className="hidden md:block w-0.5 h-full relative z-20 bg-black/10">
              <div className={cn(
                "absolute inset-y-0 -left-6 w-12 bg-gradient-to-r",
                "from-black/10 via-black/5 to-transparent pointer-events-none"
              )} />
              <div className={cn(
                "absolute inset-y-0 -right-6 w-12 bg-gradient-to-l",
                "from-black/10 via-black/5 to-transparent pointer-events-none"
              )} />
            </div>

            {/* RIGHT PAGE: Form */}
            <div className={cn(
              "relative md:w-1/2 bg-white text-slate-900",
              "p-6 sm:p-8 md:p-10 lg:p-16 flex flex-col",
              "rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none",
              "overflow-hidden"
            )}>
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

              <div className="relative z-10 flex flex-col h-full">
                {/* Form header */}
                <div className="mb-6 md:mb-10 text-right">
                  <h2 className={cn(
                    "text-[10px] sm:text-xs uppercase",
                    "tracking-[0.3em] sm:tracking-[0.4em]",
                    "font-black text-slate-300 mb-2 md:mb-3 font-montserrat"
                  )}>Mesaj Gönderin</h2>
                  <div className="h-0.5 bg-violet-600 w-12 ml-auto" />
                </div>

                <form className="flex-1 space-y-6 md:space-y-8" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-6 md:space-y-8">
                    {/* Name */}
                    <div className="relative group">
                      <Input
                        id="name"
                        placeholder=" "
                        suppressHydrationWarning
                        className={cn(
                          "peer bg-transparent border-0 border-b-2",
                          "border-slate-100 rounded-none h-10 sm:h-12 px-0",
                          "text-base sm:text-lg font-medium",
                          "focus:ring-0 focus:border-violet-600",
                          "transition-all placeholder:opacity-0"
                        )}
                      />
                      <label
                        htmlFor="name"
                        className={cn(
                          "absolute left-0 top-2 sm:top-3 text-slate-400",
                          "text-sm sm:text-base transition-all",
                          "peer-focus:-top-5 peer-focus:text-[10px]",
                          "peer-focus:text-violet-600 peer-focus:font-bold",
                          "peer-[:not(:placeholder-shown)]:-top-5",
                          "peer-[:not(:placeholder-shown)]:text-[10px]",
                          "cursor-text uppercase tracking-widest"
                        )}
                      >
                        Adınız
                      </label>
                    </div>

                    {/* Email */}
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder=" "
                        suppressHydrationWarning
                        className={cn(
                          "peer bg-transparent border-0 border-b-2",
                          "border-slate-100 rounded-none h-10 sm:h-12 px-0",
                          "text-base sm:text-lg font-medium",
                          "focus:ring-0 focus:border-violet-600",
                          "transition-all placeholder:opacity-0"
                        )}
                      />
                      <label
                        htmlFor="email"
                        className={cn(
                          "absolute left-0 top-2 sm:top-3 text-slate-400",
                          "text-sm sm:text-base transition-all",
                          "peer-focus:-top-5 peer-focus:text-[10px]",
                          "peer-focus:text-violet-600 peer-focus:font-bold",
                          "peer-[:not(:placeholder-shown)]:-top-5",
                          "peer-[:not(:placeholder-shown)]:text-[10px]",
                          "cursor-text uppercase tracking-widest"
                        )}
                      >
                        E-posta
                      </label>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2.5 md:space-y-3 pt-1 md:pt-2">
                      <label className="text-[9px] uppercase tracking-widest font-black text-slate-400">Konu Seçin</label>
                      <div className="grid grid-cols-2 gap-2">
                        {subjects.map((subj) => {
                          const Icon = subj.icon
                          return (
                            <button
                              key={subj.id}
                              type="button"
                              onClick={() => setSelectedSubject(subj.id)}
                              className={cn(
                                "flex items-center justify-center gap-1.5 sm:gap-2",
                                "text-[9px] sm:text-[10px] uppercase font-bold",
                                "py-2 sm:py-2.5 px-2 sm:px-3",
                                "border rounded-full transition-all min-h-[44px]",
                                selectedSubject === subj.id
                                  ? "border-violet-600 bg-violet-50 text-violet-600"
                                  : "border-slate-100 text-slate-500 hover:border-violet-300 hover:text-violet-600"
                              )}
                            >
                              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                              <span className="truncate">{subj.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="relative group pt-1 md:pt-2">
                      <Textarea
                        id="message"
                        placeholder=" "
                        suppressHydrationWarning
                        className={cn(
                          "peer bg-transparent border-0 border-b-2",
                          "border-slate-100 rounded-none",
                          "min-h-[80px] sm:min-h-[100px] px-0",
                          "text-base sm:text-lg font-medium",
                          "focus:ring-0 focus:border-violet-600",
                          "transition-all resize-none placeholder:opacity-0"
                        )}
                      />
                      <label
                        htmlFor="message"
                        className={cn(
                          "absolute left-0 top-3 sm:top-4 text-slate-400",
                          "text-sm sm:text-base transition-all",
                          "peer-focus:-top-4 peer-focus:text-[10px]",
                          "peer-focus:text-violet-600 peer-focus:font-bold",
                          "peer-[:not(:placeholder-shown)]:-top-4",
                          "peer-[:not(:placeholder-shown)]:text-[10px]",
                          "cursor-text uppercase tracking-widest"
                        )}
                      >
                        Mesajınız
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 md:pt-6">
                    <Button
                      className={cn(
                        "w-full h-12 sm:h-14 rounded-full",
                        "bg-slate-900 text-white font-bold",
                        "tracking-widest uppercase text-[10px] sm:text-xs",
                        "hover:bg-violet-600 hover:scale-[1.02]",
                        "shadow-2xl shadow-slate-900/10 transition-all group"
                      )}
                    >
                      Gönder
                      <Send className={cn(
                        "ml-2 sm:ml-3 w-3.5 h-3.5 sm:w-4 sm:h-4",
                        "group-hover:translate-x-1 group-hover:-translate-y-1",
                        "transition-transform"
                      )} />
                    </Button>
                  </div>
                </form>

                <div className="mt-8 md:mt-10 flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-widest text-slate-300 font-bold">v2.1</span>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600" />
                    <span className="text-[9px] uppercase tracking-widest text-slate-400">FogCatalog</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stacked pages effect */}
            <div className={cn(
              "hidden md:block absolute top-[10px] left-[10px]",
              "w-full h-full bg-white rounded-2xl -z-10",
              "shadow-lg border border-slate-100"
            )} />
            <div className={cn(
              "hidden md:block absolute top-[20px] left-[20px]",
              "w-full h-full bg-white rounded-2xl -z-20",
              "shadow-lg border border-slate-100"
            )} />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
