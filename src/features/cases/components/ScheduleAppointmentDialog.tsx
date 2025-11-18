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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
      toast.error(t('cases.scheduleAppointment.pleaseProvideValidDate'));
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
    } catch {
      // Error toast handled by mutation's onError callback.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('cases.scheduleAppointment.title')}</DialogTitle>
          <DialogDescription>
            {caseReference
              ? clientName
                ? t('cases.scheduleAppointment.arrangeForCaseWithClient', {
                    reference: caseReference,
                    clientName,
                  })
                : t('cases.scheduleAppointment.arrangeForCase', { reference: caseReference })
              : t('cases.scheduleAppointment.setAppointmentDetails')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-appointment-datetime">
              {t('cases.scheduleAppointment.dateTime')}
            </Label>
            <Input
              id="schedule-appointment-datetime"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-appointment-location">
              {t('cases.scheduleAppointment.location')}
            </Label>
            <Input
              id="schedule-appointment-location"
              placeholder={t('cases.scheduleAppointment.locationPlaceholder')}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-appointment-notes">
              {t('cases.scheduleAppointment.notesOptional')}
            </Label>
            <Textarea
              id="schedule-appointment-notes"
              placeholder={t('cases.scheduleAppointment.addInstructions')}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createAppointment.isPending}
            className="w-full sm:w-auto"
          >
            {t('cases.scheduleAppointment.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createAppointment.isPending || isSubmitDisabled}
            className="w-full sm:w-auto"
          >
            {createAppointment.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t('cases.scheduleAppointment.scheduling')}
              </>
            ) : (
              t('cases.scheduleAppointment.schedule')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
