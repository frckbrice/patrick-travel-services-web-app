import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateAppointment } from '../api';
import { RefreshCw } from 'lucide-react';
import type { Appointment } from '../types';
import { toast } from 'sonner';

interface ScheduleAppointmentDialogProps {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseReference?: string;
  clientName?: string;
  defaultLocation?: string;
  onAppointmentScheduled?: (appointment: Appointment) => void;
}

export function ScheduleAppointmentDialog({
  caseId,
  open,
  onOpenChange,
  caseReference,
  clientName,
  defaultLocation = '',
  onAppointmentScheduled,
}: ScheduleAppointmentDialogProps) {
  const createAppointment = useCreateAppointment(caseId);
  const [scheduledAt, setScheduledAt] = useState('');
  const [location, setLocation] = useState(defaultLocation);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setScheduledAt('');
      setLocation(defaultLocation);
      setNotes('');
    }
  }, [open, defaultLocation]);

  const isSubmitDisabled = useMemo(() => {
    if (!scheduledAt || !location.trim()) return true;
    const dateValue = new Date(scheduledAt);
    if (Number.isNaN(dateValue.getTime())) return true;
    return dateValue.getTime() <= Date.now();
  }, [scheduledAt, location]);

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      toast.error('Please provide a valid appointment date and time.');
      return;
    }

    try {
      await createAppointment.mutateAsync(
        {
          scheduledAt: scheduledDate.toISOString(),
          location: location.trim(),
          notes: notes.trim() ? notes.trim() : undefined,
        },
        {
          onSuccess: (data) => {
            onAppointmentScheduled?.(data);
            onOpenChange(false);
          },
        }
      );
    } catch (error) {
      // Error toast handled by mutation's onError callback.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            {caseReference
              ? `Arrange an appointment for case ${caseReference}${
                  clientName ? ` with ${clientName}` : ''
                }.`
              : 'Set the appointment details below.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-appointment-datetime">Date &amp; Time</Label>
            <Input
              id="schedule-appointment-datetime"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-appointment-location">Location</Label>
            <Input
              id="schedule-appointment-location"
              placeholder="Patrick Travel Services HQ, 123 Main Street"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-appointment-notes">Notes (optional)</Label>
            <Textarea
              id="schedule-appointment-notes"
              placeholder="Add any instructions or documents the client should bring..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createAppointment.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createAppointment.isPending || isSubmitDisabled}>
            {createAppointment.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              'Schedule'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
