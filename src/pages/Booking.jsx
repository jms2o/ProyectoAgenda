import { useState, useEffect, useMemo } from 'react';
import { Check, CheckCircle2, ArrowLeft, Calendar, ArrowRight, Sparkles, Bot, BarChart3, PlayCircle, Mail, Phone, MessageCircle, MapPin } from 'lucide-react';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
// 1. Importamos las herramientas de animación
import { motion, AnimatePresence } from 'framer-motion';

const CONTACT_PHONE_RAW = '526691596984';
const CONTACT_PHONE_DISPLAY = '+52 669 159 6984';
const CONTACT_EMAIL = 'joelmartinezs11.jm@gmail.com';

export default function Booking() {
  const MotionDiv = motion.div;
  const [step, setStep] = useState(1);
  const [selectedDayId, setSelectedDayId] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedTime, setSelectedTime] = useState(null);
  const [activeNavItem, setActiveNavItem] = useState('servicios');
  
  const [times, setTimes] = useState([]);
  const [loadingHours, setLoadingHours] = useState(true);
  const [slotDuration, setSlotDuration] = useState(60);
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '18:00' });

  const [formData, setFormData] = useState({
    name: '', email: '', company: '', whatsapp: '', businessType: '', notes: ''
  });
  const heroBenefits = ['CRM', 'Agenda digital', 'Panel administrativo', 'Recordatorios automáticos'];
  const navItems = [
    { id: 'servicios', label: 'Servicios' },
    { id: 'demo', label: 'Demo' },
    { id: 'contacto', label: 'Contacto' }
  ];

  const bookingDays = useMemo(() => {
    const weekdayFormatter = new Intl.DateTimeFormat('es-MX', { weekday: 'long' });
    const shortDateFormatter = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' });
    const relativeLabels = ['Hoy', 'Mañana', 'Pasado mañana'];

    return Array.from({ length: 3 }, (_, offset) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + offset);

      const weekday = weekdayFormatter.format(date);
      const normalizedWeekday = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateId = `${year}-${month}-${day}`;

      return {
        id: dateId,
        isoDate: dateId,
        shortDate: shortDateFormatter.format(date),
        weekday: normalizedWeekday,
        relativeLabel: relativeLabels[offset] ?? `Día +${offset}`,
        label: `${normalizedWeekday} ${shortDateFormatter.format(date)}`
      };
    });
  }, []);

  const selectedDay = bookingDays.find((day) => day.id === selectedDayId) ?? bookingDays[0] ?? null;

  const services = [
    {
      title: 'Automatización de agenda',
      description: 'Reservas en línea, recordatorios y confirmaciones sin intervención manual.',
      icon: Calendar
    },
    {
      title: 'CRM para clientes',
      description: 'Historial de citas, contactos y seguimiento comercial desde un solo panel.',
      icon: Bot
    },
    {
      title: 'Reportes de negocio',
      description: 'Métricas claras para identificar tus horarios con mayor demanda y mejorar ventas.',
      icon: BarChart3
    }
  ];

  const demoSteps = [
    {
      title: 'Mapeamos tu proceso actual',
      detail: 'Detectamos dónde pierdes tiempo en agenda, seguimiento y atención a clientes.'
    },
    {
      title: 'Configuramos un prototipo',
      detail: 'Preparamos una demo funcional adaptada a tu tipo de negocio y horarios reales.'
    },
    {
      title: 'Lanzamos tu sistema',
      detail: 'Implementamos, capacitamos y dejamos todo listo para operar desde el primer día.'
    }
  ];

  const contactChannels = [
    {
      title: 'WhatsApp',
      value: CONTACT_PHONE_DISPLAY,
      href: `https://wa.me/${CONTACT_PHONE_RAW}`,
      icon: MessageCircle
    },
    {
      title: 'Correo',
      value: CONTACT_EMAIL,
      href: `mailto:${CONTACT_EMAIL}`,
      icon: Mail
    },
    {
      title: 'Teléfono',
      value: CONTACT_PHONE_DISPLAY,
      href: `tel:+${CONTACT_PHONE_RAW}`,
      icon: Phone
    }
  ];

  const buildTimeSlots = (startTime, endTime, durationMinutes) => {
    const slots = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let currentMins = (startH * 60) + startM;
    const endMins = (endH * 60) + endM;

    while (currentMins + durationMinutes <= endMins) {
      const h = Math.floor(currentMins / 60).toString().padStart(2, '0');
      const m = (currentMins % 60).toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
      currentMins += durationMinutes;
    }

    return slots;
  };

  useEffect(() => {
    const loadAvailableTimes = async () => {
      const defaultStart = "09:00";
      const defaultEnd = "18:00";
      const defaultDuration = 60;

      try {
        const settingsSnap = await getDoc(doc(db, "settings", "general"));
        let start = defaultStart;
        let end = defaultEnd;
        let duration = defaultDuration;

        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          start = typeof data.startTime === 'string' ? data.startTime : defaultStart;
          end = typeof data.endTime === 'string' ? data.endTime : defaultEnd;

          const parsedDuration = Number(data.duration);
          duration = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : defaultDuration;
        }

        let slots = buildTimeSlots(start, end, duration);

        if (slots.length === 0) {
          start = defaultStart;
          end = defaultEnd;
          duration = defaultDuration;
          slots = buildTimeSlots(start, end, duration);
        }

        setTimes(slots);
        setSlotDuration(duration);
        setWorkingHours({ start, end });
        setLoadingHours(false);
      } catch (error) {
        console.error("Error al cargar horarios:", error);
        setTimes(buildTimeSlots(defaultStart, defaultEnd, defaultDuration));
        setSlotDuration(defaultDuration);
        setWorkingHours({ start: defaultStart, end: defaultEnd });
        setLoadingHours(false);
      }
    };

    loadAvailableTimes();
  }, []);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!selectedDay || !selectedTime) {
      return;
    }

    const payload = {
      clientName: formData.name.trim(),
      clientEmail: formData.email.trim().toLowerCase(),
      company: formData.company.trim(),
      whatsapp: formData.whatsapp.trim(),
      businessType: formData.businessType.trim(),
      notes: formData.notes.trim(),
      date: selectedDay.label,
      dateISO: selectedDay.id,
      time: selectedTime,
      status: 'Pendiente',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "appointments"), payload);
      setStep(3); 
    } catch (error) {
      console.error("Error al guardar la cita:", error);
      if (error?.code === 'permission-denied') {
        alert("No hay permisos para guardar citas. Revisa las reglas de Firestore.");
      } else {
        alert("Hubo un problema al agendar. Intenta de nuevo.");
      }
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleNavClick = (event, sectionId) => {
    event.preventDefault();
    setActiveNavItem(sectionId);

    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 2. Definimos cómo queremos que se muevan las tarjetas
  const formVariants = {
    hidden: { opacity: 0, x: 20 },  // Empieza invisible y un poco a la derecha
    visible: { opacity: 1, x: 0 },  // Termina visible y en el centro
    exit: { opacity: 0, x: -20 }    // Sale hacia la izquierda desvaneciéndose
  };

  return (
    <div className="min-h-screen bg-bgBase flex flex-col items-center p-6">
      <div className="max-w-6xl w-full">
        
        <header className="flex justify-between items-center py-6 mb-12 md:mb-20">
          <div className="text-4xl font-bold tracking-tighter text-primary">QDS<span className="text-textMuted text-lg">.</span></div>
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full border border-gray-200 bg-surface/90 shadow-sm">
            {navItems.map((item) => {
              const isActive = activeNavItem === item.id;
              return (
                <motion.a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(event) => handleNavClick(event, item.id)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-textMuted hover:text-textMain'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-bgBase border border-gray-200"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </motion.a>
              );
            })}
          </nav>
        </header>

        <main className="relative grid lg:grid-cols-[1.05fr_0.95fr] gap-12 xl:gap-20 items-start">
          <div className="pointer-events-none absolute -left-20 top-6 h-60 w-60 rounded-full bg-primary/[0.06] blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-44 h-48 w-48 rounded-full bg-gray-300/40 blur-3xl" />

          <div className="relative space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-textMuted shadow-sm">
              <Sparkles size={14} />
              Asesoría sin costo
            </div>

            <h1 className="text-5xl lg:text-6xl font-medium text-primary leading-[1.05] tracking-tight">
              Digitaliza tu negocio
              <br className="hidden lg:block" />
              con <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-gray-500">software a medida</span>
            </h1>

            <p className="text-textMuted text-lg max-w-xl leading-relaxed">
              Agenda una asesoría gratuita y descubre cómo automatizar citas, clientes y ventas en una plataforma simple y lista para crecer contigo.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a href="#demo" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-surface text-sm font-medium hover:bg-opacity-90 transition-all shadow-sm">
                Ver demo <ArrowRight size={16} />
              </a>
              <a href="#contacto" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-textMain hover:bg-surface transition-all">
                Contactar <MessageCircle size={16} />
              </a>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 max-w-xl">
              {heroBenefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2.5 bg-surface border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-medium text-textMain shadow-sm">
                  <Check size={16} className="text-primary shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-xl">
              <div className="bg-surface border border-gray-100 rounded-xl px-3 py-3">
                <p className="text-xs uppercase tracking-wide text-textMuted mb-1">Respuesta</p>
                <p className="text-sm font-semibold text-primary">24 horas</p>
              </div>
              <div className="bg-surface border border-gray-100 rounded-xl px-3 py-3">
                <p className="text-xs uppercase tracking-wide text-textMuted mb-1">Implementación</p>
                <p className="text-sm font-semibold text-primary">Desde 7 días</p>
              </div>
              <div className="bg-surface border border-gray-100 rounded-xl px-3 py-3">
                <p className="text-xs uppercase tracking-wide text-textMuted mb-1">Demo</p>
                <p className="text-sm font-semibold text-primary">{slotDuration} min</p>
              </div>
            </div>
          </div>

          <div id="agenda" className="relative bg-surface p-6 sm:p-8 rounded-[28px] shadow-[0_16px_45px_-22px_rgba(26,26,26,0.35)] border border-gray-200/70 w-full max-w-xl mx-auto md:mx-0 min-h-[470px] overflow-hidden scroll-mt-24">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-gray-500 to-primary/70" />

             {/* 3. Envolvemos los pasos en AnimatePresence */}
             <AnimatePresence mode="wait">
               
               {/* PASO 1 */}
               {step === 1 && (
                 <MotionDiv 
                    key="step1"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="pt-2"
                 >
                   <div className="flex items-start justify-between gap-4 mb-5">
                     <div>
                       <p className="text-[11px] uppercase tracking-[0.14em] text-textMuted mb-1">Paso 1 de 2</p>
                       <h3 className="text-xl font-medium text-primary">Selecciona fecha y horario</h3>
                     </div>
                     <span className="text-xs font-medium text-textMuted bg-bgBase rounded-full px-2.5 py-1">
                       {times.length} horarios
                     </span>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                     {bookingDays.map((day) => {
                       const isActive = selectedDay?.id === day.id;

                       return (
                         <button
                           key={day.id}
                           onClick={() => setSelectedDayId(day.id)}
                           className={`rounded-xl border px-3 py-3 text-left transition-all ${
                             isActive
                               ? 'bg-primary text-surface border-primary shadow-sm -translate-y-px'
                               : 'bg-bgBase/70 border-gray-200 text-textMain hover:border-primary/40 hover:bg-surface'
                           }`}
                         >
                           <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                             isActive ? 'bg-white/20 text-surface' : 'bg-surface text-textMuted'
                           }`}>
                             {day.relativeLabel}
                           </span>
                           <p className="text-sm font-semibold mt-2">{day.weekday}</p>
                           <p className={`text-xs mt-0.5 ${isActive ? 'text-surface/80' : 'text-textMuted'}`}>{day.shortDate}</p>
                         </button>
                       );
                     })}
                   </div>

                   <div className="rounded-xl border border-gray-100 bg-bgBase/60 px-3 py-2.5 mb-6 flex items-center justify-between gap-3 text-xs text-textMuted">
                     <span className="inline-flex items-center gap-1.5">
                       <Calendar size={14} />
                       {selectedDay ? selectedDay.label : 'Cargando fecha'}
                     </span>
                     <span>{workingHours.start} - {workingHours.end} · {slotDuration} min</span>
                   </div>

                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-8">
                     {loadingHours ? (
                       <p className="col-span-3 text-center text-sm text-textMuted py-4">Calculando horarios...</p>
                     ) : times.map((time) => (
                       <button key={time} onClick={() => setSelectedTime(time)}
                         className={`py-3 text-sm font-medium rounded-lg border transition-all ${
                           selectedTime === time
                             ? 'border-primary bg-primary text-surface shadow-sm -translate-y-px'
                             : 'border-gray-200 text-textMain hover:border-primary/40 hover:bg-primary/[0.03]'
                         }`}>
                         {time}
                       </button>
                     ))}
                   </div>

                   <button 
                      disabled={!selectedTime || !selectedDay} onClick={() => setStep(2)}
                      className={`w-full py-3.5 rounded-lg font-medium transition-all ${
                        selectedTime && selectedDay
                          ? 'bg-primary text-surface hover:bg-opacity-90 shadow-sm'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}>
                     {selectedTime && selectedDay ? `Continuar con ${selectedDay.relativeLabel} · ${selectedTime}` : 'Selecciona una hora para continuar'}
                   </button>
                 </MotionDiv>
               )}

               {/* PASO 2 */}
               {step === 2 && (
                 <MotionDiv 
                    key="step2"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="flex flex-col h-full pt-2"
                 >
                   <div className="flex items-center gap-3 mb-4">
                     <button onClick={() => setStep(1)} className="text-textMuted hover:text-primary transition-colors">
                       <ArrowLeft size={20} />
                     </button>
                     <h3 className="text-xl font-medium text-primary">Completa tu reserva</h3>
                   </div>

                   <div className="mb-6 rounded-xl border border-gray-100 bg-bgBase/70 px-3 py-2.5 text-sm text-textMuted flex items-center gap-2">
                     <Calendar size={16} className="text-primary" />
                     {selectedDay ? selectedDay.label : 'Fecha por definir'} · {selectedTime}
                   </div>
                   
                   <form onSubmit={handleConfirm} className="space-y-4 flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nombre" required className="w-full bg-bgBase p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="w-full bg-bgBase p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="Empresa / negocio" required className="w-full bg-bgBase p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                        <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="WhatsApp" required className="w-full bg-bgBase p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                      </div>
                      <select name="businessType" value={formData.businessType} onChange={handleChange} className="w-full bg-bgBase p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-textMuted">
                        <option value="">Tipo de negocio</option>
                        <option value="Servicios">Servicios</option>
                        <option value="Venta de productos">Venta de productos</option>
                        <option value="Otro">Otro</option>
                      </select>
                      <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="¿Qué quieres mejorar en tu negocio?" rows="3" className="w-full bg-bgBase p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea>

                      <div className="pt-4">
                        <button type="submit" className="w-full bg-primary text-surface py-3.5 rounded-lg font-medium hover:bg-opacity-90 transition-all shadow-sm">
                          Confirmar cita
                        </button>
                      </div>
                   </form>
                 </MotionDiv>
               )}

               {/* PASO 3 */}
               {step === 3 && (
                 <MotionDiv 
                    key="step3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="flex flex-col items-center justify-center h-full py-8 text-center space-y-6"
                 >
                   <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center text-[#4CAF50] mb-2">
                     <CheckCircle2 size={32} />
                   </div>
                   <div>
                     <h3 className="text-2xl font-medium text-primary mb-2">Tu cita ha sido reservada</h3>
                     <p className="text-textMuted text-sm px-4">Recibirás un mensaje de confirmación por WhatsApp en unos minutos.</p>
                   </div>
                   <div className="w-full space-y-3 pt-6 border-t border-gray-100">
                     <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-200 text-sm font-medium text-textMain hover:bg-bgBase transition-colors">
                       <Calendar size={18} /> Agregar a Google Calendar
                     </button>
                     <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-200 text-sm font-medium text-textMain hover:bg-bgBase transition-colors">
                       <Calendar size={18} /> Agregar a Apple Calendar
                     </button>
                     <button onClick={() => { setStep(1); setFormData({name: '', email: '', company: '', whatsapp: '', businessType: '', notes: ''}); setSelectedTime(null); }} className="text-xs text-textMuted hover:text-primary mt-4 underline underline-offset-2">
                       Hacer otra reserva
                     </button>
                   </div>
                 </MotionDiv>
               )}

             </AnimatePresence>
          </div>
        </main>

        <section id="servicios" className="scroll-mt-24 pt-20">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-textMuted mb-3">
            <Sparkles size={14} />
            Servicios
          </div>
          <h2 className="text-3xl md:text-4xl font-medium text-primary mb-10">Lo que implementamos para tu negocio</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {services.map((service) => (
              <article key={service.title} className="bg-surface border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-bgBase text-primary flex items-center justify-center mb-4">
                  <service.icon size={20} />
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2">{service.title}</h3>
                <p className="text-sm text-textMuted leading-relaxed">{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="demo" className="scroll-mt-24 pt-20">
          <div className="bg-surface border border-gray-100 rounded-3xl p-8 md:p-10 shadow-sm">
            <div className="grid lg:grid-cols-2 gap-10 items-start">
              <div>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-textMuted mb-3">
                  <PlayCircle size={14} />
                  Demo
                </div>
                <h2 className="text-3xl md:text-4xl font-medium text-primary mb-4">Así trabajamos contigo, paso a paso</h2>
                <p className="text-textMuted leading-relaxed mb-8">
                  En una sesión rápida te mostramos una versión práctica del sistema para que veas cómo quedaría tu operación.
                </p>
                <a href="#agenda" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-surface text-sm font-medium hover:bg-opacity-90 transition-all">
                  Agendar demo <ArrowRight size={16} />
                </a>
              </div>

              <div className="space-y-4">
                {demoSteps.map((item, index) => (
                  <div key={item.title} className="bg-bgBase rounded-2xl p-5 border border-gray-100">
                    <p className="text-xs font-semibold text-textMuted tracking-wide mb-2">PASO {index + 1}</p>
                    <h3 className="text-base font-semibold text-primary mb-1">{item.title}</h3>
                    <p className="text-sm text-textMuted">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="contacto" className="scroll-mt-24 pt-20 pb-10">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8">
            <div className="bg-primary text-surface rounded-3xl p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-3">Contacto</p>
              <h2 className="text-3xl md:text-4xl font-medium leading-tight mb-4">¿Listo para digitalizar tu operación?</h2>
              <p className="text-white/80 leading-relaxed mb-8 max-w-xl">
                Escríbenos y te ayudamos a definir un sistema hecho a tu medida para citas, clientes y seguimiento.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface text-primary text-sm font-medium hover:bg-white/90 transition-all">
                  Enviar correo <Mail size={16} />
                </a>
                <a href={`https://wa.me/${CONTACT_PHONE_RAW}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/30 text-sm font-medium hover:bg-white/10 transition-all">
                  Escribir por WhatsApp <MessageCircle size={16} />
                </a>
              </div>
            </div>

            <aside className="bg-surface border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-primary mb-5">Canales de atención</h3>
              <div className="space-y-3">
                {contactChannels.map((channel) => (
                  <a key={channel.title} href={channel.href} target={channel.href.startsWith('http') ? '_blank' : undefined} rel={channel.href.startsWith('http') ? 'noreferrer' : undefined} className="flex items-center justify-between gap-4 border border-gray-100 rounded-xl px-4 py-3 hover:bg-bgBase transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-bgBase text-primary flex items-center justify-center">
                        <channel.icon size={17} />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-textMuted">{channel.title}</p>
                        <p className="text-sm font-medium text-textMain">{channel.value}</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-textMuted" />
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-6 text-sm text-textMuted">
                <MapPin size={16} />
                Chihuahua, México
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  )
}
