import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, CalendarDays, Users, BarChart3, Settings, 
  User, LogOut, Search, Clock, Save // <-- Agregamos Clock y Save
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
// <-- Agregamos getDoc y setDoc para la configuración
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  // 1. ESTADO PARA LA CONFIGURACIÓN DEL NEGOCIO
  const [businessSettings, setBusinessSettings] = useState({
    startTime: '09:00',
    endTime: '18:00',
    duration: 60
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // 2. CARGAR CITAS Y CONFIGURACIÓN AL ABRIR
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar citas
        const querySnapshot = await getDocs(collection(db, "appointments"));
        const appsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        appsData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setAppointments(appsData);

        // Cargar configuración de Firebase
        const settingsSnap = await getDoc(doc(db, "settings", "general"));
        if (settingsSnap.exists()) {
          setBusinessSettings(settingsSnap.data());
        }

        setLoading(false);
      } catch (error) {
        console.error("Error al obtener datos:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Cambiar estado de la cita
  const handleStatusChange = async (id, newStatus) => {
    try {
      const appointmentRef = doc(db, "appointments", id);
      await updateDoc(appointmentRef, { status: newStatus });
      setAppointments(appointments.map(appt => 
        appt.id === id ? { ...appt, status: newStatus } : appt
      ));
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      alert("No se pudo actualizar el estado.");
    }
  };

  // 3. FUNCIÓN PARA GUARDAR LOS AJUSTES
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      // Guardamos la configuración en un documento único llamado "general"
      await setDoc(doc(db, "settings", "general"), businessSettings);
      alert("¡Configuración guardada con éxito!");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar los ajustes.");
    }
    setSavingSettings(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("No se pudo cerrar sesión. Inténtalo de nuevo.");
    } finally {
      setLoggingOut(false);
    }
  };

  // Lógica de Clientes y Reportes (se mantiene intacta)
  const uniqueClients = [];
  const map = new Map();
  for (const item of appointments) {
    if(!map.has(item.whatsapp)){
        map.set(item.whatsapp, true);
        uniqueClients.push({
            id: item.id,
            name: item.clientName,
            company: item.company,
            whatsapp: item.whatsapp,
            initials: item.clientName ? item.clientName.substring(0,2).toUpperCase() : 'NN',
            totalAppointments: appointments.filter(a => a.whatsapp === item.whatsapp).length
        });
    }
  }

  const filteredClients = uniqueClients.filter(client => 
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalApps = appointments.length;
  const confirmedApps = appointments.filter(a => a.status === 'Confirmada').length;
  const cancelledApps = appointments.filter(a => a.status === 'Cancelada').length;
  
  const confirmRate = totalApps > 0 ? Math.round((confirmedApps / totalApps) * 100) : 0;
  const cancelRate = totalApps > 0 ? Math.round((cancelledApps / totalApps) * 100) : 0;


  const getHeaderTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'clientes': return 'Directorio de Clientes';
      case 'agenda': return 'Agenda Completa';
      case 'reportes': return 'Reportes y Métricas';
      case 'configuracion': return 'Configuración del Negocio';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-bgBase flex">
      
      {/* BARRA LATERAL */}
      <aside className="w-64 bg-surface border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-20 flex items-center px-8 border-b border-gray-100">
          <Link to="/" className="text-3xl font-bold tracking-tighter text-primary">
            QDS<span className="text-textMuted text-sm">.</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'agenda', icon: CalendarDays, label: 'Agenda' },
            { id: 'clientes', icon: Users, label: 'Clientes' },
            { id: 'reportes', icon: BarChart3, label: 'Reportes' },
            { id: 'configuracion', icon: Settings, label: 'Configuración' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === item.id ? 'bg-primary text-surface shadow-sm' : 'text-textMuted hover:text-textMain hover:bg-bgBase'
              }`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors w-full disabled:opacity-60"
          >
            <LogOut size={20} /> {loggingOut ? 'Cerrando...' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        <header className="h-20 bg-surface flex items-center justify-between px-8 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-primary">{getHeaderTitle()}</h1>
            {activeTab === 'dashboard' && <span className="text-textMuted font-medium text-lg hidden sm:inline">Admin</span>}
          </div>
          <button className="w-10 h-10 bg-bgBase rounded-full flex items-center justify-center text-textMain hover:bg-gray-200 transition-colors">
            <User size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* VISTAS: DASHBOARD Y AGENDA */}
            {(activeTab === 'dashboard' || activeTab === 'agenda') && (
              <div className="animate-in fade-in duration-300 space-y-8">
                {activeTab === 'dashboard' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
                      <p className="text-sm font-medium text-textMuted mb-2">Citas totales</p>
                      <p className="text-4xl font-bold text-primary">{totalApps}</p>
                    </div>
                    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
                      <p className="text-sm font-medium text-textMuted mb-2">Confirmadas</p>
                      <p className="text-4xl font-bold text-green-600">{confirmedApps}</p>
                    </div>
                    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
                      <p className="text-sm font-medium text-textMuted mb-2">Clientes Únicos</p>
                      <p className="text-4xl font-bold text-blue-600">{uniqueClients.length}</p>
                    </div>
                  </div>
                )}

                <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-primary">Todas las reservas</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-bgBase/50 text-textMuted text-sm border-b border-gray-100">
                          <th className="px-6 py-4 font-medium">Fecha</th>
                          <th className="px-6 py-4 font-medium">Hora</th>
                          <th className="px-6 py-4 font-medium">Cliente / Empresa</th>
                          <th className="px-6 py-4 font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan="4" className="text-center py-8 text-textMuted">Cargando...</td></tr>
                        ) : appointments.length === 0 ? (
                          <tr><td colSpan="4" className="text-center py-8 text-textMuted">No hay citas registradas.</td></tr>
                        ) : (
                          appointments.map((appt) => (
                            <tr key={appt.id} className="border-b border-gray-50 hover:bg-bgBase/50 transition-colors">
                              <td className="px-6 py-4 text-textMain">{appt.date}</td>
                              <td className="px-6 py-4 font-medium text-primary">{appt.time}</td>
                              <td className="px-6 py-4 text-textMain">
                                {appt.clientName} <br/><span className="text-xs text-textMuted">{appt.company}</span>
                              </td>
                              <td className="px-6 py-4">
                                <select 
                                  value={appt.status || 'Pendiente'}
                                  onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                                  className={`px-3 py-1 text-xs font-medium rounded-full outline-none cursor-pointer border-none appearance-none ${
                                    appt.status === 'Confirmada' ? 'bg-green-100 text-green-700' : 
                                    appt.status === 'Cancelada' ? 'bg-red-100 text-red-700' : 
                                    'bg-yellow-100 text-yellow-700'
                                  }`}
                                >
                                  <option value="Pendiente" className="bg-white text-black">Pendiente</option>
                                  <option value="Confirmada" className="bg-white text-black">Confirmada</option>
                                  <option value="Cancelada" className="bg-white text-black">Cancelada</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VISTA: CLIENTES */}
             {activeTab === 'clientes' && (
              <div className="animate-in fade-in duration-300">
                <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                      <input 
                        type="text" 
                        placeholder="Buscar por nombre..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-bgBase rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-bgBase/50 text-textMuted text-sm border-b border-gray-100">
                          <th className="px-6 py-4 font-medium">Cliente</th>
                          <th className="px-6 py-4 font-medium">Empresa</th>
                          <th className="px-6 py-4 font-medium">WhatsApp</th>
                          <th className="px-6 py-4 font-medium">Total de Citas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClients.length === 0 ? (
                           <tr><td colSpan="4" className="text-center py-8 text-textMuted">No se encontraron clientes.</td></tr>
                        ) : (
                          filteredClients.map((client) => (
                            <tr key={client.id} className="border-b border-gray-50 hover:bg-bgBase/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 text-primary flex items-center justify-center text-xs font-bold">
                                    {client.initials}
                                  </div>
                                  <span className="font-medium text-textMain">{client.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-textMuted">{client.company}</td>
                              <td className="px-6 py-4 text-textMain font-medium">{client.whatsapp}</td>
                              <td className="px-6 py-4 text-textMuted">{client.totalAppointments} cita(s)</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VISTA: REPORTES */}
             {activeTab === 'reportes' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center h-48">
                    <p className="text-textMuted font-medium mb-2">Tasa de Confirmación</p>
                    <p className="text-5xl font-bold text-green-600">{confirmRate}%</p>
                    <p className="text-sm text-textMuted mt-2">De {totalApps} citas agendadas</p>
                  </div>
                  <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center h-48">
                    <p className="text-textMuted font-medium mb-2">Citas Canceladas</p>
                    <p className="text-5xl font-bold text-red-500">{cancelRate}%</p>
                    <p className="text-sm text-textMuted mt-2">Representan {cancelledApps} cita(s)</p>
                  </div>
                </div>
              </div>
            )}

            {/* VISTA: CONFIGURACIÓN (YA ES TOTALMENTE FUNCIONAL) */}
             {activeTab === 'configuracion' && (
              <div className="animate-in fade-in duration-300">
                <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl mx-auto">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-primary">Ajustes del Sistema</h2>
                    <p className="text-sm text-textMuted">Configura los horarios disponibles para que tus clientes agenden en tu página web.</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2"><Clock size={16}/> Horarios de Atención</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-textMuted mb-1">Hora de Apertura</label>
                          <input 
                            type="time" 
                            value={businessSettings.startTime}
                            onChange={(e) => setBusinessSettings({...businessSettings, startTime: e.target.value})}
                            className="w-full bg-bgBase p-2.5 rounded-lg text-sm outline-none border border-transparent focus:border-primary/20" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-textMuted mb-1">Hora de Cierre</label>
                          <input 
                            type="time" 
                            value={businessSettings.endTime}
                            onChange={(e) => setBusinessSettings({...businessSettings, endTime: e.target.value})}
                            className="w-full bg-bgBase p-2.5 rounded-lg text-sm outline-none border border-transparent focus:border-primary/20" 
                          />
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div>
                      <h3 className="text-sm font-semibold text-primary mb-4">Detalles de la Cita</h3>
                      <div>
                        <label className="block text-xs text-textMuted mb-1">Duración por cita (minutos)</label>
                        <select 
                          value={businessSettings.duration}
                          onChange={(e) => setBusinessSettings({...businessSettings, duration: Number(e.target.value)})}
                          className="w-full bg-bgBase p-2.5 rounded-lg text-sm outline-none border border-transparent focus:border-primary/20"
                        >
                          <option value={30}>30 minutos</option>
                          <option value={60}>60 minutos</option>
                          <option value={90}>90 minutos</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-surface py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all mt-6 disabled:opacity-50"
                    >
                      <Save size={18} /> {savingSettings ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

    </div>
  )
}
