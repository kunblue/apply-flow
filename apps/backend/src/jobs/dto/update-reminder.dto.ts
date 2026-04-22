export class UpdateReminderDto {
  action!: 'read' | 'ignore' | 'snooze';
  snoozeUntil?: string;
}
