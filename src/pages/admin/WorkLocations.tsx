import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { MapPin, Plus, Pencil, Trash2, Navigation, Search } from 'lucide-react';

interface WorkLocation {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface LocationForm {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  radius_meters: string;
  is_active: boolean;
  notes: string;
}

const defaultForm: LocationForm = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  radius_meters: '100',
  is_active: true,
  notes: '',
};

export default function WorkLocations() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WorkLocation | null>(null);
  const [deleteLocation, setDeleteLocation] = useState<WorkLocation | null>(null);
  const [form, setForm] = useState<LocationForm>(defaultForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['work-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_locations')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as WorkLocation[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (locationData: Omit<WorkLocation, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('work_locations').insert(locationData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-locations'] });
      toast.success('Work location created successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Failed to create location: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<WorkLocation> & { id: string }) => {
      const { error } = await supabase.from('work_locations').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-locations'] });
      toast.success('Work location updated successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Failed to update location: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('work_locations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-locations'] });
      toast.success('Work location deleted successfully');
      setDeleteLocation(null);
    },
    onError: (error) => {
      toast.error('Failed to delete location: ' + error.message);
    },
  });

  const handleOpenDialog = (location?: WorkLocation) => {
    if (location) {
      setEditingLocation(location);
      setForm({
        name: location.name,
        address: location.address || '',
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        radius_meters: String(location.radius_meters),
        is_active: location.is_active,
        notes: location.notes || '',
      });
    } else {
      setEditingLocation(null);
      setForm(defaultForm);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLocation(null);
    setForm(defaultForm);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setIsGettingLocation(false);
        toast.success('Current location captured');
      },
      (error) => {
        setIsGettingLocation(false);
        toast.error('Failed to get location: ' + error.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Location name is required');
      return;
    }
    if (!form.latitude || !form.longitude) {
      toast.error('Latitude and longitude are required');
      return;
    }

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    const radius = parseInt(form.radius_meters, 10);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error('Invalid latitude (must be between -90 and 90)');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error('Invalid longitude (must be between -180 and 180)');
      return;
    }
    if (isNaN(radius) || radius < 10) {
      toast.error('Radius must be at least 10 meters');
      return;
    }

    const locationData = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      latitude: lat,
      longitude: lng,
      radius_meters: radius,
      is_active: form.is_active,
      notes: form.notes.trim() || null,
    };

    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, ...locationData });
    } else {
      createMutation.mutate(locationData);
    }
  };

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.address && loc.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout title="Work Locations" portalType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Work Locations</h2>
            <p className="text-muted-foreground">
              Manage geofenced locations for employee & SAO clock in/out
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Location
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Locations</CardDescription>
              <CardTitle className="text-3xl">{locations.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Locations</CardDescription>
              <CardTitle className="text-3xl text-success">
                {locations.filter((l) => l.is_active).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Inactive Locations</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">
                {locations.filter((l) => !l.is_active).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Locations Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>All Locations</CardTitle>
                <CardDescription>
                  Employees and SAOs can only clock in/out within these geofenced areas
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading locations...</div>
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No locations match your search' : 'No work locations yet. Add one to get started.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Coordinates</TableHead>
                      <TableHead>Radius</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLocations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            {location.name}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {location.address || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {Number(location.latitude).toFixed(4)}, {Number(location.longitude).toFixed(4)}
                        </TableCell>
                        <TableCell>{location.radius_meters}m</TableCell>
                        <TableCell>
                          <Badge variant={location.is_active ? 'default' : 'secondary'}>
                            {location.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(location)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteLocation(location)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
            <DialogDescription>
              {editingLocation
                ? 'Update the work location details'
                : 'Set up a new geofenced area for clock in/out'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Main Office, Site A"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="e.g., 123 Main St, Manila"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  placeholder="e.g., 14.5995"
                  value={form.latitude}
                  onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  placeholder="e.g., 120.9842"
                  value={form.longitude}
                  onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
            >
              <Navigation className="w-4 h-4" />
              {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
            </Button>

            <div className="space-y-2">
              <Label htmlFor="radius">Radius (meters) *</Label>
              <Input
                id="radius"
                type="number"
                min="10"
                placeholder="100"
                value={form.radius_meters}
                onChange={(e) => setForm((prev) => ({ ...prev, radius_meters: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Employees must be within this distance to clock in/out
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional information about this location"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active Location</Label>
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingLocation
                ? 'Update'
                : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLocation} onOpenChange={() => setDeleteLocation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteLocation?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLocation && deleteMutation.mutate(deleteLocation.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
