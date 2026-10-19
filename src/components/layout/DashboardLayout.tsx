import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Clock,
  Users,
  Calendar,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Settings,
  Building2,
  CalendarDays,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  UserCircle,
  HelpCircle,
  Sun,
  Moon,
  ShieldCheck,
  MapPin,
  HardHat,
  KeyRound,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';

type PortalType = 'admin' | 'employee' | 'sao' | 'encoder' | 'worker';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
  superAdminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const adminNavGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Workforce',
    items: [
      { label: 'All Employees', href: '/admin/employees', icon: <Users className="w-5 h-5" /> },
      { label: 'Site Officers', href: '/admin/site-officers', icon: <ShieldCheck className="w-5 h-5" /> },
      { label: 'Workers', href: '/admin/workers', icon: <HardHat className="w-5 h-5" /> },
      { label: 'Departments', href: '/admin/departments', icon: <Building2 className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Time & Attendance',
    items: [
      { label: 'Live Attendance', href: '/admin/attendance', icon: <Clock className="w-5 h-5" /> },
      { label: 'Attendance Calendar', href: '/admin/calendar', icon: <Calendar className="w-5 h-5" /> },
      { label: 'Work Locations', href: '/admin/work-locations', icon: <MapPin className="w-5 h-5" /> },
      { label: 'Timesheets', href: '/admin/timesheets', icon: <FileText className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Leave Management',
    items: [
      { label: 'Leave Requests', href: '/admin/leave-requests', icon: <CalendarDays className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Payroll & Finance',
    items: [
      { label: 'Payroll Reports', href: '/admin/payroll', icon: <DollarSign className="w-5 h-5" /> },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Overtime Settings', href: '/admin/overtime-settings', icon: <TrendingUp className="w-5 h-5" /> },
      { label: 'Reset Password', href: '/admin/reset-password', icon: <KeyRound className="w-5 h-5" /> },
      { label: 'Companies', href: '/admin/companies', icon: <Building2 className="w-5 h-5" />, superAdminOnly: true },
      { label: 'My Profile', href: '/admin/profile', icon: <UserCircle className="w-5 h-5" /> },
      { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
    ],
  },
];

const employeeNavGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/employee', icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
  {
    title: 'My Records',
    items: [
      { label: 'My Timesheets', href: '/employee/timesheets', icon: <FileText className="w-5 h-5" /> },
      { label: 'View Payroll', href: '/employee/payroll', icon: <DollarSign className="w-5 h-5" /> },
      { label: 'Leave Requests', href: '/employee/leave', icon: <CalendarDays className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'My Profile', href: '/employee/profile', icon: <UserCircle className="w-5 h-5" /> },
    ],
  },
];

const saoNavGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/sao', icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Workers',
    items: [
      { label: 'My Workers', href: '/sao/workers', icon: <HardHat className="w-5 h-5" /> },
    ],
  },
  {
    title: 'My Records',
    items: [
      { label: 'My Timesheets', href: '/sao/timesheets', icon: <FileText className="w-5 h-5" /> },
      { label: 'View Payroll', href: '/sao/payroll', icon: <DollarSign className="w-5 h-5" /> },
      { label: 'Leave Requests', href: '/sao/leave', icon: <CalendarDays className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'My Profile', href: '/sao/profile', icon: <UserCircle className="w-5 h-5" /> },
    ],
  },
];

const encoderNavGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/encoder', icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Data Entry',
    items: [
      { label: 'Workers', href: '/encoder/workers', icon: <HardHat className="w-5 h-5" /> },
      { label: 'All Employees', href: '/encoder/employees', icon: <Users className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Change Password', href: '/encoder/profile', icon: <KeyRound className="w-5 h-5" /> },
    ],
  },
];

const workerNavGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/worker', icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
  {
    title: 'My Records',
    items: [
      { label: 'My Timesheets', href: '/worker/timesheets', icon: <FileText className="w-5 h-5" /> },
    ],
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  portalType?: PortalType;
}

export function DashboardLayout({ children, title, portalType }: DashboardLayoutProps) {
  const { user, role, isSuperAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  const currentPortal = portalType || (role === 'admin' ? 'admin' : role === 'site_admin_officer' ? 'sao' : role === 'encoder' ? 'encoder' : role === 'worker' ? 'worker' : 'employee');
  const navGroups = currentPortal === 'admin' ? adminNavGroups : currentPortal === 'sao' ? saoNavGroups : currentPortal === 'encoder' ? encoderNavGroups : currentPortal === 'worker' ? workerNavGroups : employeeNavGroups;

  useEffect(() => {
    const fetchPendingLeaves = async () => {
      if (role === 'admin') {
        const { count } = await supabase
          .from('leave_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        setPendingLeaveCount(count || 0);
      }
    };

    const fetchEmployeeName = async () => {
      if (user) {
        const { data } = await supabase
          .from('employees')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          setEmployeeName(`${data.first_name} ${data.last_name}`);
        }
      }
    };

    fetchPendingLeaves();
    fetchEmployeeName();
  }, [role, user]);

  const handleSignOut = async () => {
    await signOut();
    const loginPath = currentPortal === 'admin' ? '/admin/login' : currentPortal === 'sao' ? '/sao/login' : currentPortal === 'encoder' ? '/encoder/login' : currentPortal === 'worker' ? '/worker/login' : '/employee/login';
    navigate(loginPath);
  };

  const getInitials = (email: string) => {
    if (employeeName) {
      const names = employeeName.split(' ');
      return `${names[0][0]}${names[1]?.[0] || ''}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const isActiveRoute = (href: string) => {
    if (href === '/admin' || href === '/employee' || href === '/sao' || href === '/encoder' || href === '/worker') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  // Add badge to leave requests for admin
  const navGroupsWithBadges = navGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => !item.superAdminOnly || isSuperAdmin)
        .map((item) => {
          if (item.href === '/admin/leave-requests' && pendingLeaveCount > 0) {
            return { ...item, badge: pendingLeaveCount };
          }
          return item;
        }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background portal-zoom">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed top-0 left-0 z-50 h-full transform transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col',
            'bg-gradient-to-b from-[#071638] via-[#061230] to-[#040b20] border-r border-[#12244d] shadow-2xl',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            collapsed ? 'lg:w-20' : 'lg:w-64 w-64'
          )}
        >
          {/* Logo */}
          <div className="relative flex items-center justify-center h-20 px-4">
            <Link to="/" className="flex items-center justify-center gap-3">
              <img
                src="/tmclogos.png"
                alt="Tiger's Mark Corporation"
                className={cn(
                  'object-contain flex-shrink-0',
                  collapsed ? 'h-10 w-10' : 'h-14 w-auto max-w-[190px]'
                )}
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Badge */}
          {!collapsed && (
            <div className="px-4 pb-4 pt-1">
              <Badge
                variant="outline"
                className={cn(
                  'w-full justify-center gap-2 py-2.5 rounded-lg font-semibold uppercase tracking-wider text-xs',
                  'border-[#1f3d7a] bg-gradient-to-r from-[#0e2554] to-[#0a1c43] text-white shadow-[0_0_14px_rgba(30,64,140,0.35)]',
                  'hover:bg-gradient-to-r hover:from-[#0e2554] hover:to-[#0a1c43]'
                )}
              >
                {currentPortal === 'admin' ? (
                  <>
                    <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
                    Administrator
                  </>
                ) : currentPortal === 'sao' ? '🛡️ Site Admin Officer' : currentPortal === 'encoder' ? '⌨️ Encoder' : currentPortal === 'worker' ? '👷 Worker' : '👤 Employee'}
              </Badge>
            </div>
          )}

          {/* Navigation */}
          <ScrollArea className="flex-1 py-2">
            <nav className="px-3 space-y-6">
              {navGroupsWithBadges.map((group) => (
                <div key={group.title}>
                  {!collapsed && (
                    <h4 className="px-3 mb-2 text-[11px] font-semibold text-slate-300/80 uppercase tracking-wider">
                      {group.title}
                    </h4>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = isActiveRoute(item.href);
                      const content = (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                            isActive
                              ? 'border-l-[3px] border-orange-500 bg-gradient-to-r from-orange-600/60 via-orange-800/30 to-orange-950/10 text-white shadow-[0_0_18px_rgba(249,115,22,0.18)]'
                              : 'border-l-[3px] border-transparent text-slate-200 hover:text-white hover:bg-white/5',
                            collapsed && 'justify-center px-0'
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <span
                            className={cn(
                              'flex-shrink-0',
                              isActive ? 'text-orange-500' : 'text-slate-300 group-hover:text-white'
                            )}
                          >
                            {item.icon}
                          </span>
                          {!collapsed && (
                            <>
                              <span className="font-medium flex-1">{item.label}</span>
                              {item.badge && (
                                <Badge className="bg-destructive text-destructive-foreground text-xs h-5 min-w-5 flex items-center justify-center">
                                  {item.badge}
                                </Badge>
                              )}
                              {isActive && <ChevronRight className="w-4 h-4 text-slate-200/70" />}
                            </>
                          )}
                          {collapsed && item.badge && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );

                      if (collapsed) {
                        return (
                          <Tooltip key={item.href} delayDuration={0}>
                            <TooltipTrigger asChild>{content}</TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {item.label}
                              {item.badge && ` (${item.badge})`}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return content;
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Collapse Toggle - Desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center p-3 mx-3 mb-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>

          {/* User section */}
          <div className={cn(
            'p-4 border-t border-[#12244d]',
            collapsed && 'px-2'
          )}>
            <div className={cn(
              'flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5 border border-white/5',
              collapsed && 'justify-center px-0 py-2'
            )}>
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-700 text-white text-sm font-medium">
                  {user?.email ? getInitials(user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {employeeName || user?.email}
                  </p>
                  <p className="text-xs text-slate-400 capitalize">{role}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className={cn(
          'transition-all duration-300',
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}>
          {/* Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-card/70 backdrop-blur-2xl border-b border-border/60 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              {title && (
                <div>
                  <h1 className="text-xl font-semibold">{title}</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {currentPortal === 'admin' ? 'Admin Panel' : currentPortal === 'sao' ? 'SAO Portal' : currentPortal === 'encoder' ? 'Encoder Portal' : currentPortal === 'worker' ? 'Worker Portal' : 'Employee Portal'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hidden sm:flex"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {pendingLeaveCount > 0 && currentPortal === 'admin' && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse-soft" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {currentPortal === 'admin' && pendingLeaveCount > 0 ? (
                    <DropdownMenuItem onClick={() => navigate('/admin/leave-requests')} className="cursor-pointer">
                      <CalendarDays className="w-4 h-4 mr-2 text-warning" />
                      <div>
                        <p className="font-medium">{pendingLeaveCount} pending leave request(s)</p>
                        <p className="text-xs text-muted-foreground">Click to review</p>
                      </div>
                    </DropdownMenuItem>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No new notifications
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Help */}
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <HelpCircle className="w-5 h-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-medium">
                        {user?.email ? getInitials(user.email) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium truncate max-w-32">
                        {employeeName || user?.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{role}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{employeeName || 'User'}</p>
                      <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(currentPortal === 'admin' ? '/admin/profile' : currentPortal === 'sao' ? '/sao/profile' : '/employee/profile')}>
                    <UserCircle className="w-4 h-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  {currentPortal === 'admin' && (
                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/admin/settings')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    className="cursor-pointer sm:hidden"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 mr-2" />
                    ) : (
                      <Moon className="w-4 h-4 mr-2" />
                    )}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 lg:p-6 animate-fade-in">{children}</main>

          {/* Footer */}
          <footer className="border-t border-border/60 p-4 lg:p-6 mt-auto bg-card/45 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
              <p>Tiger's Mark Corporation Attendance System</p>
              <p>contact us: @tigersmark.com</p>
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}