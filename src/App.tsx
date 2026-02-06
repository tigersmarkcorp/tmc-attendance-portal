import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { EmployeeRoute } from "@/components/auth/EmployeeRoute";
import { SAORoute } from "@/components/auth/SAORoute";
import Index from "./pages/Index";
import AdminLogin from "./pages/admin/AdminLogin";
import EmployeeLogin from "./pages/employee/EmployeeLogin";
import SAOLogin from "./pages/sao/SAOLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Employees from "./pages/admin/Employees";
import Departments from "./pages/admin/Departments";
import Attendance from "./pages/admin/Attendance";
import AttendanceCalendar from "./pages/admin/AttendanceCalendar";
import Timesheets from "./pages/admin/Timesheets";
import LeaveRequests from "./pages/admin/LeaveRequests";
import PayrollReports from "./pages/admin/PayrollReports";
import OvertimeSettings from "./pages/admin/OvertimeSettings";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSettings from "./pages/admin/AdminSettings";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import MyTimesheets from "./pages/employee/MyTimesheets";
import LeaveRequest from "./pages/employee/LeaveRequest";
import SAODashboard from "./pages/sao/SAODashboard";
import SAOTimesheets from "./pages/sao/SAOTimesheets";
import SAOLeaveRequest from "./pages/sao/SAOLeaveRequest";
import SAOWorkers from "./pages/sao/SAOWorkers";
import SAOWorkerTimesheets from "./pages/sao/SAOWorkerTimesheets";
import Workers from "./pages/admin/Workers";
import WorkerPayroll from "./pages/admin/WorkerPayroll";
import WorkLocations from "./pages/admin/WorkLocations";
import SiteOfficers from "./pages/admin/SiteOfficers";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/install" element={<Install />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/employee/login" element={<EmployeeLogin />} />
              <Route path="/sao/login" element={<SAOLogin />} />
              
              {/* Admin Routes - Protected */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/employees" element={<AdminRoute><Employees /></AdminRoute>} />
              <Route path="/admin/site-officers" element={<AdminRoute><SiteOfficers /></AdminRoute>} />
              <Route path="/admin/workers" element={<AdminRoute><Workers /></AdminRoute>} />
              <Route path="/admin/workers/:workerId/payroll" element={<AdminRoute><WorkerPayroll /></AdminRoute>} />
              <Route path="/admin/departments" element={<AdminRoute><Departments /></AdminRoute>} />
              <Route path="/admin/attendance" element={<AdminRoute><Attendance /></AdminRoute>} />
              <Route path="/admin/calendar" element={<AdminRoute><AttendanceCalendar /></AdminRoute>} />
              <Route path="/admin/work-locations" element={<AdminRoute><WorkLocations /></AdminRoute>} />
              <Route path="/admin/timesheets" element={<AdminRoute><Timesheets /></AdminRoute>} />
              <Route path="/admin/leave-requests" element={<AdminRoute><LeaveRequests /></AdminRoute>} />
              <Route path="/admin/payroll" element={<AdminRoute><PayrollReports /></AdminRoute>} />
              <Route path="/admin/overtime-settings" element={<AdminRoute><OvertimeSettings /></AdminRoute>} />
              <Route path="/admin/profile" element={<AdminRoute><AdminProfile /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              
              {/* Employee Routes - Protected */}
              <Route path="/employee" element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>} />
              <Route path="/employee/timesheets" element={<EmployeeRoute><MyTimesheets /></EmployeeRoute>} />
              <Route path="/employee/leave" element={<EmployeeRoute><LeaveRequest /></EmployeeRoute>} />
              
              {/* SAO Routes - Protected */}
              <Route path="/sao" element={<SAORoute><SAODashboard /></SAORoute>} />
              <Route path="/sao/timesheets" element={<SAORoute><SAOTimesheets /></SAORoute>} />
              <Route path="/sao/leave" element={<SAORoute><SAOLeaveRequest /></SAORoute>} />
              <Route path="/sao/workers" element={<SAORoute><SAOWorkers /></SAORoute>} />
              <Route path="/sao/workers/:workerId/timesheets" element={<SAORoute><SAOWorkerTimesheets /></SAORoute>} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
