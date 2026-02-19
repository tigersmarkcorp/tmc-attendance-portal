export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_location_assignments: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          location_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          location_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_location_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_location_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          age: number | null
          application_date: string | null
          assigned_location_id: string | null
          children: Json | null
          citizenship: string | null
          city_address: string | null
          civil_status: string | null
          college_school: string | null
          college_year: string | null
          created_at: string
          date_of_birth: string | null
          degree_received: string | null
          department: string | null
          elementary_school: string | null
          elementary_year: string | null
          email: string
          emergency_contact_address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string
          employment_records: Json | null
          father_name: string | null
          first_name: string
          height: string | null
          highschool_school: string | null
          highschool_year: string | null
          hire_date: string
          hourly_rate: number
          id: string
          languages: string | null
          last_name: string
          mother_name: string | null
          parents_address: string | null
          parents_occupation: string | null
          phone: string | null
          photo_url: string | null
          position: string | null
          position_desired: string | null
          profile_id: string | null
          provincial_address: string | null
          religion: string | null
          sex: string | null
          special_skills: string | null
          spouse_name: string | null
          spouse_occupation: string | null
          status: Database["public"]["Enums"]["employee_status"]
          telephone: string | null
          updated_at: string
          user_id: string | null
          weight: string | null
        }
        Insert: {
          age?: number | null
          application_date?: string | null
          assigned_location_id?: string | null
          children?: Json | null
          citizenship?: string | null
          city_address?: string | null
          civil_status?: string | null
          college_school?: string | null
          college_year?: string | null
          created_at?: string
          date_of_birth?: string | null
          degree_received?: string | null
          department?: string | null
          elementary_school?: string | null
          elementary_year?: string | null
          email: string
          emergency_contact_address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id: string
          employment_records?: Json | null
          father_name?: string | null
          first_name: string
          height?: string | null
          highschool_school?: string | null
          highschool_year?: string | null
          hire_date?: string
          hourly_rate?: number
          id?: string
          languages?: string | null
          last_name: string
          mother_name?: string | null
          parents_address?: string | null
          parents_occupation?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          position_desired?: string | null
          profile_id?: string | null
          provincial_address?: string | null
          religion?: string | null
          sex?: string | null
          special_skills?: string | null
          spouse_name?: string | null
          spouse_occupation?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
          weight?: string | null
        }
        Update: {
          age?: number | null
          application_date?: string | null
          assigned_location_id?: string | null
          children?: Json | null
          citizenship?: string | null
          city_address?: string | null
          civil_status?: string | null
          college_school?: string | null
          college_year?: string | null
          created_at?: string
          date_of_birth?: string | null
          degree_received?: string | null
          department?: string | null
          elementary_school?: string | null
          elementary_year?: string | null
          email?: string
          emergency_contact_address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string
          employment_records?: Json | null
          father_name?: string | null
          first_name?: string
          height?: string | null
          highschool_school?: string | null
          highschool_year?: string | null
          hire_date?: string
          hourly_rate?: number
          id?: string
          languages?: string | null
          last_name?: string
          mother_name?: string | null
          parents_address?: string | null
          parents_occupation?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          position_desired?: string | null
          profile_id?: string | null
          provincial_address?: string | null
          religion?: string | null
          sex?: string | null
          special_skills?: string | null
          spouse_name?: string | null
          spouse_occupation?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_assigned_location_id_fkey"
            columns: ["assigned_location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      overtime_settings: {
        Row: {
          created_at: string
          double_overtime_multiplier: number
          double_overtime_threshold_hours: number
          id: string
          overtime_multiplier: number
          regular_hours_per_day: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          double_overtime_multiplier?: number
          double_overtime_threshold_hours?: number
          id?: string
          overtime_multiplier?: number
          regular_hours_per_day?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          double_overtime_multiplier?: number
          double_overtime_threshold_hours?: number
          id?: string
          overtime_multiplier?: number
          regular_hours_per_day?: number
          updated_at?: string
        }
        Relationships: []
      }
      payroll_report_items: {
        Row: {
          created_at: string
          days_worked: number
          double_overtime_hours: number
          double_overtime_pay: number
          employee_id: string
          gross_pay: number
          hourly_rate: number
          id: string
          overtime_hours: number
          overtime_pay: number
          regular_hours: number
          regular_pay: number
          report_id: string
        }
        Insert: {
          created_at?: string
          days_worked?: number
          double_overtime_hours?: number
          double_overtime_pay?: number
          employee_id: string
          gross_pay?: number
          hourly_rate: number
          id?: string
          overtime_hours?: number
          overtime_pay?: number
          regular_hours?: number
          regular_pay?: number
          report_id: string
        }
        Update: {
          created_at?: string
          days_worked?: number
          double_overtime_hours?: number
          double_overtime_pay?: number
          employee_id?: string
          gross_pay?: number
          hourly_rate?: number
          id?: string
          overtime_hours?: number
          overtime_pay?: number
          regular_hours?: number
          regular_pay?: number
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_report_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_report_items_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "payroll_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_reports: {
        Row: {
          created_at: string
          employee_count: number
          generated_by: string | null
          id: string
          notes: string | null
          report_period_end: string
          report_period_start: string
          status: string
          total_gross_pay: number
          total_overtime_hours: number
          total_overtime_pay: number
          total_regular_hours: number
          total_regular_pay: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_count?: number
          generated_by?: string | null
          id?: string
          notes?: string | null
          report_period_end: string
          report_period_start: string
          status?: string
          total_gross_pay?: number
          total_overtime_hours?: number
          total_overtime_pay?: number
          total_regular_hours?: number
          total_regular_pay?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_count?: number
          generated_by?: string | null
          id?: string
          notes?: string | null
          report_period_end?: string
          report_period_start?: string
          status?: string
          total_gross_pay?: number
          total_overtime_hours?: number
          total_overtime_pay?: number
          total_regular_hours?: number
          total_regular_pay?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string
          employee_id: string
          entry_type: Database["public"]["Enums"]["time_entry_type"]
          id: string
          location: string | null
          notes: string | null
          selfie_url: string | null
          timestamp: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          entry_type: Database["public"]["Enums"]["time_entry_type"]
          id?: string
          location?: string | null
          notes?: string | null
          selfie_url?: string | null
          timestamp?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          entry_type?: Database["public"]["Enums"]["time_entry_type"]
          id?: string
          location?: string | null
          notes?: string | null
          selfie_url?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          clock_in_time: string | null
          clock_out_time: string | null
          created_at: string
          date: string
          double_overtime_hours: number | null
          employee_id: string
          hourly_rate: number | null
          id: string
          overtime_hours: number | null
          overtime_pay: number | null
          regular_hours: number | null
          regular_pay: number | null
          status: string | null
          total_break_minutes: number | null
          total_pay: number | null
          total_work_minutes: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string
          date: string
          double_overtime_hours?: number | null
          employee_id: string
          hourly_rate?: number | null
          id?: string
          overtime_hours?: number | null
          overtime_pay?: number | null
          regular_hours?: number | null
          regular_pay?: number | null
          status?: string | null
          total_break_minutes?: number | null
          total_pay?: number | null
          total_work_minutes?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string
          date?: string
          double_overtime_hours?: number | null
          employee_id?: string
          hourly_rate?: number | null
          id?: string
          overtime_hours?: number | null
          overtime_pay?: number | null
          regular_hours?: number | null
          regular_pay?: number | null
          status?: string | null
          total_break_minutes?: number | null
          total_pay?: number | null
          total_work_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          notes: string | null
          radius_meters: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          notes?: string | null
          radius_meters?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          notes?: string | null
          radius_meters?: number
          updated_at?: string
        }
        Relationships: []
      }
      worker_location_assignments: {
        Row: {
          created_at: string
          id: string
          location_id: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_location_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_location_assignments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_time_entries: {
        Row: {
          created_at: string
          entry_type: string
          id: string
          location: string | null
          notes: string | null
          recorded_by: string
          selfie_url: string | null
          timestamp: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          entry_type: string
          id?: string
          location?: string | null
          notes?: string | null
          recorded_by: string
          selfie_url?: string | null
          timestamp?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          entry_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          recorded_by?: string
          selfie_url?: string | null
          timestamp?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_time_entries_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_time_entries_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          clock_in_time: string | null
          clock_out_time: string | null
          created_at: string
          date: string
          hourly_rate: number | null
          id: string
          overtime_hours: number | null
          overtime_pay: number | null
          regular_hours: number | null
          regular_pay: number | null
          status: string | null
          total_pay: number | null
          total_work_minutes: number | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string
          date: string
          hourly_rate?: number | null
          id?: string
          overtime_hours?: number | null
          overtime_pay?: number | null
          regular_hours?: number | null
          regular_pay?: number | null
          status?: string | null
          total_pay?: number | null
          total_work_minutes?: number | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string
          date?: string
          hourly_rate?: number | null
          id?: string
          overtime_hours?: number | null
          overtime_pay?: number | null
          regular_hours?: number | null
          regular_pay?: number | null
          status?: string | null
          total_pay?: number | null
          total_work_minutes?: number | null
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_timesheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_timesheets_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          assigned_location_id: string | null
          assigned_sao_id: string | null
          city_address: string | null
          civil_status: string | null
          created_at: string
          date_hired: string | null
          date_of_birth: string | null
          department: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_type: string | null
          first_name: string
          hourly_rate: number | null
          id: string
          last_name: string
          nbi_id: string | null
          notes: string | null
          pagibig_id: string | null
          philhealth_id: string | null
          phone: string | null
          photo_url: string | null
          position: string | null
          provincial_address: string | null
          sex: string | null
          sss_number: string | null
          status: string
          tin_id: string | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          assigned_location_id?: string | null
          assigned_sao_id?: string | null
          city_address?: string | null
          civil_status?: string | null
          created_at?: string
          date_hired?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_type?: string | null
          first_name: string
          hourly_rate?: number | null
          id?: string
          last_name: string
          nbi_id?: string | null
          notes?: string | null
          pagibig_id?: string | null
          philhealth_id?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          provincial_address?: string | null
          sex?: string | null
          sss_number?: string | null
          status?: string
          tin_id?: string | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          assigned_location_id?: string | null
          assigned_sao_id?: string | null
          city_address?: string | null
          civil_status?: string | null
          created_at?: string
          date_hired?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_type?: string | null
          first_name?: string
          hourly_rate?: number | null
          id?: string
          last_name?: string
          nbi_id?: string | null
          notes?: string | null
          pagibig_id?: string | null
          philhealth_id?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          provincial_address?: string | null
          sex?: string | null
          sss_number?: string | null
          status?: string
          tin_id?: string | null
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workers_assigned_location_id_fkey"
            columns: ["assigned_location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_assigned_sao_id_fkey"
            columns: ["assigned_sao_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_employee_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "employee" | "site_admin_officer"
      employee_status: "active" | "inactive" | "on_leave"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      leave_type:
        | "annual"
        | "sick"
        | "personal"
        | "unpaid"
        | "maternity"
        | "paternity"
      time_entry_type: "clock_in" | "break_start" | "break_end" | "clock_out"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "employee", "site_admin_officer"],
      employee_status: ["active", "inactive", "on_leave"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      leave_type: [
        "annual",
        "sick",
        "personal",
        "unpaid",
        "maternity",
        "paternity",
      ],
      time_entry_type: ["clock_in", "break_start", "break_end", "clock_out"],
    },
  },
} as const
