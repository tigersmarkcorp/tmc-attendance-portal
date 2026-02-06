import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Settings, Loader2, Save, Clock, DollarSign } from 'lucide-react';

interface OvertimeSettings {
  id: string;
  regular_hours_per_day: number;
  overtime_multiplier: number;
  double_overtime_multiplier: number;
  double_overtime_threshold_hours: number;
}

export default function OvertimeSettingsPage() {
  const [settings, setSettings] = useState<OvertimeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('overtime_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      toast({ title: 'Error', description: 'Failed to fetch settings', variant: 'destructive' });
      return;
    }

    setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('overtime_settings')
        .update({
          regular_hours_per_day: settings.regular_hours_per_day,
          overtime_multiplier: settings.overtime_multiplier,
          double_overtime_multiplier: settings.double_overtime_multiplier,
          double_overtime_threshold_hours: settings.double_overtime_threshold_hours,
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Overtime settings saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Overtime Settings">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Overtime Settings">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <Settings className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>Overtime Configuration</CardTitle>
                <CardDescription>
                  Configure how overtime is calculated for payroll reports
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="regular_hours" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Regular Hours Per Day
                </Label>
                <Input
                  id="regular_hours"
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={settings?.regular_hours_per_day || 8}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev ? { ...prev, regular_hours_per_day: parseFloat(e.target.value) } : prev
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Hours before overtime kicks in (default: 8)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="overtime_multiplier" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  Overtime Multiplier
                </Label>
                <Input
                  id="overtime_multiplier"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={settings?.overtime_multiplier || 1.5}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev ? { ...prev, overtime_multiplier: parseFloat(e.target.value) } : prev
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Rate multiplier for overtime hours (default: 1.5x)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="double_threshold" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Double OT Threshold
                </Label>
                <Input
                  id="double_threshold"
                  type="number"
                  step="0.5"
                  min="8"
                  max="24"
                  value={settings?.double_overtime_threshold_hours || 12}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev
                        ? { ...prev, double_overtime_threshold_hours: parseFloat(e.target.value) }
                        : prev
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Hours after which double OT applies (default: 12)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="double_multiplier" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  Double OT Multiplier
                </Label>
                <Input
                  id="double_multiplier"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={settings?.double_overtime_multiplier || 2}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev
                        ? { ...prev, double_overtime_multiplier: parseFloat(e.target.value) }
                        : prev
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Rate multiplier for double OT hours (default: 2x)
                </p>
              </div>
            </div>

            {/* Example Calculation */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="font-medium mb-2">Example Calculation</p>
                <p className="text-sm text-muted-foreground">
                  For an employee working 14 hours at $20/hour:
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>
                    • Regular: {settings?.regular_hours_per_day || 8} hours × $20 = $
                    {(settings?.regular_hours_per_day || 8) * 20}
                  </li>
                  <li>
                    • Overtime:{' '}
                    {(settings?.double_overtime_threshold_hours || 12) -
                      (settings?.regular_hours_per_day || 8)}{' '}
                    hours × $20 × {settings?.overtime_multiplier || 1.5} = $
                    {((settings?.double_overtime_threshold_hours || 12) -
                      (settings?.regular_hours_per_day || 8)) *
                      20 *
                      (settings?.overtime_multiplier || 1.5)}
                  </li>
                  <li>
                    • Double OT: 2 hours × $20 × {settings?.double_overtime_multiplier || 2} = $
                    {2 * 20 * (settings?.double_overtime_multiplier || 2)}
                  </li>
                  <li className="font-medium pt-1 border-t border-border mt-2">
                    Total: $
                    {(settings?.regular_hours_per_day || 8) * 20 +
                      ((settings?.double_overtime_threshold_hours || 12) -
                        (settings?.regular_hours_per_day || 8)) *
                        20 *
                        (settings?.overtime_multiplier || 1.5) +
                      2 * 20 * (settings?.double_overtime_multiplier || 2)}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saving} className="gradient-primary">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}