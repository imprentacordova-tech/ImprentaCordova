
import React, { useState, useEffect, useRef } from 'react';
import { Home, Users, CheckSquare, BarChart, Settings, Sun, Moon, BellRing, Brush, CalendarDays, LogOut, ShoppingCart } from 'lucide-react';
import { HomeScreen } from './screens/HomeScreen';
import { ClientsScreen } from './screens/ClientsScreen';
import { TasksScreen } from './screens/TasksScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { CobranzaScreen } from './screens/CobranzaScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { WebOrdersScreen } from './screens/WebOrdersScreen';
import { LandingPage } from './screens/LandingPage';
import { LoginScreen } from './screens/LoginScreen';
import { ServicesPage } from './screens/ServicesPage';
import { Clock } from './components/Clock';
import { NotificationBell } from './components/NotificationBell';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Client, Task, Screen, Theme, ClientFilter, TaskStatus, Declaration, DeclarationStatus, ServiceFeesConfig, ReminderConfig, WebOrder, PublicUser } from './types';
import { mockClients, mockTasks } from './constants';
import { differenceInCalendarDays } from 'date-fns';
import { getPeriod, getNextPeriod } from './services/sri';
import { Logo } from './components/Logo';

const initialServiceFees: ServiceFeesConfig = {
  ivaMensual: 5,
  ivaSemestral: 8,
  rentaNP: 10,
  rentaGeneral: 15,
  devolucionIva: 12,
  devolucionRenta: 15,
  anexoGastosPersonales: 15,
  customPunctualServices: [],
};

const defaultReminderConfig: ReminderConfig = {
  isEnabled: true,
  daysBefore: 3,
  onDueDate: true,
  overdueInterval: 7,
  template: `Estimado/a {clientName},

Le recordamos amablemente que su declaración de {period} por un valor de ${'$'}{amount} vence el {dueDate}.

Para evitar multas e intereses con el SRI, le agradecemos realizar el pago a la brevedad posible.

Saludos cordiales,
Soluciones Contables Pro`,
};

const App: React.FC = () => {
  // Navigation State
  const [appState, setAppState] = useState<'landing' | 'login' | 'dashboard' | 'services'>(() => {
      if (window.location.pathname === '/services') return 'services';
      return 'landing';
  });

  // Public User State (For Landing/Services)
  const [publicUser, setPublicUser] = useState<PublicUser | null>(null);

  // Dashboard State
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [showSplash, setShowSplash] = useState(true);
  const [clients, setClients] = useLocalStorage<Client[]>('clients', mockClients);
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', mockTasks);
  const [webOrders, setWebOrders] = useLocalStorage<WebOrder[]>('webOrders', []); // New State for Web Orders
  const [sriCredentials, setSriCredentials] = useLocalStorage<Record<string, string>>('sriCredentials', {}); // New Credentials Database
  
  const [clientFilter, setClientFilter] = useState<ClientFilter | null>(null);
  const [taskFilter, setTaskFilter] = useState<{ clientId?: string; taskId?: string } | null>(null);
  const [initialClientData, setInitialClientData] = useState<Partial<Client> | null>(null);
  const [initialTaskData, setInitialTaskData] = useState<Partial<Task> | null>(null);
  const [serviceFees, setServiceFees] = useLocalStorage<ServiceFeesConfig>('serviceFees', initialServiceFees);
  const [reminderConfig, setReminderConfig] = useLocalStorage<ReminderConfig>('reminderConfig', defaultReminderConfig);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [clientToView, setClientToView] = useState<Client | null>(null);
  const initCheckDone = useRef(false);

  // Effects
  useEffect(() => {
    const alertShownTasks = new Set(JSON.parse(sessionStorage.getItem('alertShownTasks') || '[]'));

    const upcoming = tasks.filter(task => {
        if (task.status === TaskStatus.Completada || task.status === TaskStatus.Pagada) return false;
        
        const dueDate = new Date(task.dueDate);
        const daysUntilDue = differenceInCalendarDays(dueDate, new Date());
        
        if (daysUntilDue === 1 && !alertShownTasks.has(task.id) && appState === 'dashboard') {
            // Only show alert if in dashboard
            alert(`Recordatorio: La tarea "${task.title}" vence mañana.`);
            alertShownTasks.add(task.id);
            sessionStorage.setItem('alertShownTasks', JSON.stringify(Array.from(alertShownTasks)));
        }
        
        return daysUntilDue >= 0 && daysUntilDue <= 3;
    });

    setUpcomingTasks(upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
  }, [tasks, appState]);

  useEffect(() => {
    if (!initCheckDone.current && appState === 'dashboard') {
        const ensureDeclarationsAreUpToDate = (clientsToUpdate: Client[]): [Client[], boolean] => {
            const now = new Date();
            let wasModified = false;
            const updatedClients = clientsToUpdate.map(client => {
                if (!(client.isActive ?? true)) {
                    return client;
                }

                const currentDeclarationPeriod = getPeriod(client, now); // The latest period that should exist.
                const sortedHistory = [...client.declarationHistory].sort((a, b) => a.period.localeCompare(b.period));
                const latestDeclaration = sortedHistory[sortedHistory.length - 1];

                if (!latestDeclaration) {
                    // No history at all, create the first one for the correct period.
                    wasModified = true;
                    const newDeclaration: Declaration = {
                        period: currentDeclarationPeriod,
                        status: DeclarationStatus.Pendiente,
                        updatedAt: now.toISOString(),
                    };
                    return { ...client, declarationHistory: [newDeclaration] };
                }
                
                let lastKnownPeriod = latestDeclaration.period;
                const newDeclarations: Declaration[] = [];
                
                // Loop to create missing declarations up to the current required one.
                while (lastKnownPeriod < currentDeclarationPeriod) {
                    const nextPeriod = getNextPeriod(lastKnownPeriod);
                    // Check if it already exists (unlikely with sorted but safe)
                    if (!client.declarationHistory.some(d => d.period === nextPeriod)) {
                        newDeclarations.push({
                            period: nextPeriod,
                            status: DeclarationStatus.Pendiente,
                            updatedAt: now.toISOString(),
                        });
                    }
                    lastKnownPeriod = nextPeriod;
                }

                if (newDeclarations.length > 0) {
                    wasModified = true;
                    return { ...client, declarationHistory: [...client.declarationHistory, ...newDeclarations] };
                }
                
                return client;
            });
            return [updatedClients, wasModified];
        };
        
        const [updatedClients, wasModified] = ensureDeclarationsAreUpToDate(clients);
        if (wasModified) {
            setClients(updatedClients);
        }
        initCheckDone.current = true;
    }
  }, [clients, setClients, appState]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'midnight');
    // Always add dark mode
    root.classList.add('dark');
    
    if (appState === 'dashboard') {
        root.classList.add(theme);
        if (theme === 'midnight') root.classList.add('dark');
    } 
  }, [theme, appState]);

  useEffect(() => {
      if (showSplash && appState === 'dashboard') {
        const timer = setTimeout(() => setShowSplash(false), 2000);
        return () => clearTimeout(timer);
      }
  }, [showSplash, appState]);

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'midnight'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };
  
  const navigate = (screen: Screen, options: { clientFilter?: ClientFilter, taskFilter?: { clientId?: string; taskId?: string }, initialClientData?: Partial<Client>, initialTaskData?: Partial<Task>, clientIdToView?: string } = {}) => {
    setActiveScreen(screen);
    setClientFilter(options.clientFilter || null);
    setTaskFilter(options.taskFilter || null);
    setInitialClientData(options.initialClientData || null);
    setInitialTaskData(options.initialTaskData || null);

    if (options.clientIdToView) {
        const client = clients.find(c => c.id === options.clientIdToView);
        setClientToView(client || null);
    } else {
        setClientToView(null);
    }
  };
  
  const clearTaskFilter = () => setTaskFilter(null);
  
  const handleWebOrderSubmit = (order: WebOrder) => {
      setWebOrders(prev => [...prev, order]);
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen navigate={navigate} serviceFees={serviceFees} />;
      case 'clients':
        return <ClientsScreen 
                  clients={clients} 
                  setClients={setClients} 
                  initialFilter={clientFilter} 
                  navigate={navigate}
                  serviceFees={serviceFees}
                  initialClientData={initialClientData}
                  clearInitialClientData={() => setInitialClientData(null)}
                  clientToView={clientToView}
                  clearClientToView={() => setClientToView(null)}
                  sriCredentials={sriCredentials}
               />;
      case 'tasks':
        return <TasksScreen 
                  tasks={tasks} 
                  setTasks={setTasks} 
                  clients={clients} 
                  setClients={setClients}
                  taskFilter={taskFilter}
                  clearTaskFilter={clearTaskFilter}
                  serviceFees={serviceFees}
                  initialTaskData={initialTaskData}
                  clearInitialTaskData={() => setInitialTaskData(null)}
                />;
      case 'calendar':
        return <CalendarScreen clients={clients} tasks={tasks} navigate={navigate} />;
      case 'reports':
        return <ReportsScreen clients={clients} tasks={tasks} serviceFees={serviceFees} navigate={navigate} />;
      case 'cobranza':
        return <CobranzaScreen
                  clients={clients}
                  setClients={setClients}
                  serviceFees={serviceFees}
                  reminderConfig={reminderConfig}
                />;
      case 'web_orders':
        return <WebOrdersScreen 
                  orders={webOrders} 
                  setOrders={setWebOrders} 
                  setTasks={setTasks}
                  navigate={navigate} 
               />;
      case 'settings':
        return <SettingsScreen 
                  clients={clients} 
                  setClients={setClients}
                  tasks={tasks}
                  setTasks={setTasks}
                  serviceFees={serviceFees}
                  setServiceFees={setServiceFees}
                  reminderConfig={reminderConfig}
                  setReminderConfig={setReminderConfig}
                  navigate={navigate}
                  setSriCredentials={setSriCredentials}
               />;
      default:
        return <HomeScreen navigate={navigate} serviceFees={serviceFees} />;
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
        case 'light': return <Moon className="w-5 h-5 text-gray-700" />;
        case 'dark': return <Sun className="w-5 h-5 text-yellow-400" />;
        case 'midnight': return <Brush className="w-5 h-5 text-indigo-400" />;
    }
  };
  
  const mainBgColor = theme === 'midnight' ? 'bg-slate-950' : 'bg-gray-950';

  // --- Routing ---
  if (appState === 'services') {
      return (
        <ServicesPage 
            onAdminAccess={() => setAppState('login')} 
            onSubmitOrder={handleWebOrderSubmit}
            onNavigateToHome={() => setAppState('landing')}
            currentUser={publicUser}
            onLogin={setPublicUser}
            onLogout={() => setPublicUser(null)}
        />
      );
  }

  if (appState === 'landing') {
      return (
        <LandingPage 
            onAdminAccess={() => setAppState('login')} 
            onNavigateToServices={() => setAppState('services')}
            currentUser={publicUser}
            onLogin={setPublicUser}
            onLogout={() => setPublicUser(null)}
        />
      );
  }

  if (appState === 'login') {
      return <LoginScreen onSuccess={() => { setAppState('dashboard'); setShowSplash(true); }} onBack={() => setAppState('landing')} />;
  }

  // --- Dashboard Render ---
  if (showSplash) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="animate-fade-in-scale text-center">
          <Logo className="w-32 h-32 inline-block" />
          <h1 className="mt-4 text-3xl font-display text-gold">Soluciones Contables Pro</h1>
        </div>
      </div>
    );
  }

  const pendingOrdersCount = webOrders.filter(o => o.status === 'pending').length;

  return (
    <div className={`font-body min-h-screen flex flex-col ${mainBgColor} text-gold-dark dark:text-gold-light border border-gold/30`}>
      <header className="flex items-center justify-between p-3 sm:p-4 bg-gray-900 midnight:bg-slate-900 shadow-md dark:border-b dark:border-gold/10">
        <div className="flex items-center space-x-2">
          <Logo className="w-10 h-10" />
          <h1 className="text-xl font-display text-gold tracking-wider">SC Pro</h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Clock />
          <NotificationBell tasks={upcomingTasks} clients={clients} navigate={navigate} />
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-800 midnight:hover:bg-slate-700 transition-colors duration-300">
            {getThemeIcon()}
          </button>
          <button onClick={() => setAppState('landing')} className="p-2 rounded-full text-red-400 hover:bg-red-500/10 transition-colors" title="Cerrar Sesión">
              <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <main className="flex-grow p-2 sm:p-6 overflow-y-auto mb-16">
        {renderScreen()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 grid grid-cols-8 p-2 bg-gray-900 midnight:bg-slate-900 border-t border-gold/10 shadow-lg z-20">
        {[
          { screen: 'home', icon: Home, label: 'Inicio' },
          { screen: 'clients', icon: Users, label: 'Clientes' },
          { screen: 'tasks', icon: CheckSquare, label: 'Tareas' },
          { screen: 'web_orders', icon: ShoppingCart, label: 'Solicitudes', count: pendingOrdersCount }, // New Item
          { screen: 'calendar', icon: CalendarDays, label: 'Calendario' },
          { screen: 'reports', icon: BarChart, label: 'Reportes' },
          { screen: 'cobranza', icon: BellRing, label: 'Cobranza' },
          { screen: 'settings', icon: Settings, label: 'Ajustes' },
        ].map(({ screen, icon: Icon, label, count }) => (
          <button 
            key={screen}
            onClick={() => navigate(screen as Screen)} 
            className={`flex flex-col items-center w-full transition-colors duration-300 relative ${activeScreen === screen ? 'text-gold' : 'text-gray-400 hover:text-gold'}`}
          >
            <div className="relative">
                <Icon className="w-6 h-6 mb-1" />
                {count !== undefined && count > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full animate-pulse">
                        {count}
                    </span>
                )}
            </div>
            <span className="text-[10px] sm:text-xs tracking-wide truncate w-full text-center">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
