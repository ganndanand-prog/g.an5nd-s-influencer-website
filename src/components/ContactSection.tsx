import React, { useState } from 'react';
import { 
  Mail, 
  MapPin, 
  Send, 
  Check, 
  Copy, 
  ExternalLink, 
  MessageSquare, 
  Phone, 
  Instagram, 
  PhoneCall,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { saveSubmission } from '../utils/submissionsStorage';
import { sendEmailViaFormSubmit, createDirectGmailLink, RECIPIENT_EMAIL } from '../utils/emailSender';
import { saveSubmissionToFirestore, logContactActionToFirestore } from '../utils/firebaseService';

export const ContactSection: React.FC = () => {
  const { siteContent } = useFirebase();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);
  const [sentPayload, setSentPayload] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    message: '' 
  });

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(siteContent.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
    logContactActionToFirestore({
      actionType: 'email_copy',
      label: `Имэйл (${siteContent.email}) хуулсан`,
      section: 'contact',
    }).catch(() => {});
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(siteContent.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
    logContactActionToFirestore({
      actionType: 'phone_copy',
      label: `Утас (${siteContent.phone}) хуулсан`,
      section: 'contact',
    }).catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.message.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const emailPayload = {
      subject: `[Анандын Вэбсайт] Шууд зурвас: ${formData.name.trim()} (${formData.phone.trim()})`,
      typeTitle: 'Шууд зурвас (Холбоо барих)',
      senderName: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      message: formData.message.trim(),
    };

    try {
      // 1. Firebase Firestore өгөгдлийн санд хадгалах
      const docId = await saveSubmissionToFirestore({
        type: 'contact',
        senderName: emailPayload.senderName,
        email: emailPayload.email,
        phone: emailPayload.phone,
        message: emailPayload.message,
        emailDelivered: true,
        source: 'contact_form',
      });

      // 2. Save to local storage backup
      saveSubmission({
        type: 'contact',
        senderName: emailPayload.senderName,
        email: emailPayload.email,
        phone: emailPayload.phone,
        message: emailPayload.message,
        emailDelivered: true,
      });

      // 3. Send directly to anand75io@moes.edu.mn
      await sendEmailViaFormSubmit(emailPayload);

      setSavedDocId(docId);
      setSentPayload(emailPayload);
      setFormSent(true);

      setTimeout(() => {
        setFormData({ name: '', email: '', phone: '', message: '' });
      }, 1000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('Quota exceeded')) {
        setSubmitError('Firebase өдрийн үнэгүй хязгаар (Quota exceeded) дүүрсэн байна. Маргааш дахин оролдоно уу эсвэл 88712038 дугаарт холбогдоно уу.');
      } else {
        setSubmitError('Зурвасыг Firebase өгөгдлийн санд хадгалахад алдаа гарлаа. Утас: 88712038 дугаарт шууд холбогдоорой.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      <div className="rounded-[36px] bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
        
        {/* Glow decorative orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Contact info */}
          <div className="lg:col-span-6">
            <span className="px-3.5 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold uppercase tracking-wider inline-block mb-4">
              Холбоо барих
            </span>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Шууд холбогдох
            </h2>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Маркетинг хамтын ажиллагаа, Reels видео бүтээлт болон бусад ажил хэрэгч санал хүсэлтээр дараах сувгуудаар шууд холбогдоорой.
            </p>

            <div className="space-y-4">
              
              {/* Phone item (88712038) */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Утасны дугаар
                    </span>
                    <a
                      href={`tel:${siteContent.phone}`}
                      onClick={() => {
                        logContactActionToFirestore({
                          actionType: 'phone_click',
                          label: `${siteContent.phone} дугаар дарсан`,
                          section: 'contact',
                        }).catch(() => {});
                      }}
                      className="text-base sm:text-lg font-bold text-white hover:text-emerald-400 transition-colors tracking-wide"
                    >
                      {siteContent.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${siteContent.phone}`}
                    onClick={() => {
                      logContactActionToFirestore({
                        actionType: 'phone_click',
                        label: `${siteContent.phone} Залгах товч дарсан`,
                        section: 'contact',
                      }).catch(() => {});
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Залгах</span>
                  </a>
                  <button
                    onClick={handleCopyPhone}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Хуулах"
                  >
                    {copiedPhone ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Хуулагдлаа</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Хуулах</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Email item */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-sky-500/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Gmail / И-мэйл хаяг
                    </span>
                    <a
                      href={`mailto:${siteContent.email}`}
                      className="text-sm sm:text-base font-semibold text-white hover:text-sky-400 transition-colors break-all"
                    >
                      {siteContent.email}
                    </a>
                  </div>
                </div>

                <button
                  onClick={handleCopyEmail}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ml-2"
                  title="Хуулах"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Хуулагдлаа</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Хуулах</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instagram item */}
              <a
                href={siteContent.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  logContactActionToFirestore({
                    actionType: 'instagram_click',
                    label: `Contact хэсгээс Instagram ${siteContent.instagramHandle} дарсан`,
                    section: 'contact',
                  }).catch(() => {});
                }}
                className="group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent border border-pink-500/20 hover:border-pink-500/50 backdrop-blur-md transition-all text-decoration-none"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-pink-300 uppercase tracking-wider font-semibold block">
                      Instagram хаяг руу шууд орох
                    </span>
                    <span className="text-sm sm:text-base font-bold text-white group-hover:text-pink-300 transition-colors">
                      {siteContent.instagramHandle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-pink-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Нээх</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </a>

              {/* Location item */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Байршил
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-white">
                    {siteContent.location}
                  </span>
                </div>
              </div>

            </div>

            {/* Direct Instagram shortcut button */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <a
                href={siteContent.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-600/20 transition-all cursor-pointer"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram {siteContent.instagramHandle} руу үсрэх</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right: Message Form with "Таны дугаар" field right under Gmail/Email */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-xl">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-400" />
              <span>Шууд зурвас илгээх</span>
            </h3>
            <p className="text-xs text-slate-300 mb-6">
              Мэдээллээ үлдээгээрэй, бид тантай тун удахгүй утсаар болон и-мэйлээр эргэн холбогдоно.
            </p>

            {formSent ? (
              <div className="py-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-white mb-1">
                  Зурвас илгээгдлээ!
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed mb-4">
                  Таны зурвасыг Firebase мэдээллийн санд хадгалж, <span className="font-bold text-sky-300">{RECIPIENT_EMAIL}</span> хаяг руу амжилттай илгээлээ.
                </p>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 max-w-sm mx-auto mb-4 text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Хүлээн авагч:</span>
                    <span className="font-semibold text-white">{RECIPIENT_EMAIL}</span>
                  </div>
                  {savedDocId && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Firebase ID:</span>
                      <span className="font-mono text-[11px] text-sky-300">{savedDocId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Төлөв:</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <Database className="w-3 h-3" /> Firebase DB-д хадгалагдсан
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {sentPayload && (
                    <a
                      href={createDirectGmailLink(sentPayload)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Gmail дээр нээх</span>
                    </a>
                  )}
                  <button
                    onClick={() => setFormSent(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Дахин зурвас бичих
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Таны нэр */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Таны нэр <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Жишээ: Батболд"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                  />
                </div>

                {/* Gmail / И-мэйл хаяг */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    И-мэйл хаяг <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={160}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Жишээ: batbold@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                  />
                </div>

                {/* ХҮСЭЛТИЙН ДАГУУ: Gmail хаягийн доор "Таны дугаар" гэдэг шинэ цэс/талбар */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Таны дугаар (Утас) <span className="text-rose-400">*</span></span>
                    <span className="text-[11px] text-sky-400 font-normal">Холбогдох дугаар</span>
                  </label>
                  <input
                    type="tel"
                    required
                    minLength={4}
                    maxLength={40}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Жишээ: 88712038 эсвэл таны дугаар"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                  />
                </div>

                {/* Зурвас */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Зурвас / Тайлбар <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    maxLength={3000}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Хамтран ажиллах төсөл эсвэл санал хүсэлтийн талаар дэлгэрэнгүй бичнэ үү..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-75 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Илгээж байна...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Зурвас илгээх</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};
