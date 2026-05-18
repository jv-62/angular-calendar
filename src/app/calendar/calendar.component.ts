import {CommonModule} from '@angular/common';
import {
  Component,
  InputSignal,
  OnInit,
  Signal,
  WritableSignal,
  computed,
  input,
  signal,
} from '@angular/core';
import {DateTime,Info,Interval} from 'luxon';
import {Meetings} from './meetings.interface';

@Component({
  selector: 'calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
})
export class CalendarComponent implements OnInit {
  meetings: InputSignal<Meetings> = input.required();
  storageKey = 'angular-calendar-meetings';

  today: Signal<DateTime> = signal(DateTime.local());
  firstDayOfActiveMonth: WritableSignal<DateTime> = signal(
    this.today().startOf('month'),
  );
  activeDay: WritableSignal<DateTime | null> = signal(null);
  weekDays: Signal<string[]> = signal(Info.weekdays('short'));
  storedMeetings: WritableSignal<Meetings> = signal({});
  newMeeting: WritableSignal<string> = signal('');

  daysOfMonth: Signal<DateTime[]> = computed(() => {
    return Interval.fromDateTimes(
      this.firstDayOfActiveMonth().startOf('week'),
      this.firstDayOfActiveMonth().endOf('month').endOf('week'),
    )
      .splitBy({ day: 1 })
      .map((d) => {
        if (d.start === null) {
          throw new Error('Wrong dates');
        }
        return d.start;
      });
  });

  DATE_MED = DateTime.DATE_MED;

  activeDayMeetings: Signal<string[]> = computed(() => {
    const activeDay = this.activeDay();
    if (activeDay === null) {
      return [];
    }

    const activeDayISO = activeDay.toISODate();
    if (!activeDayISO) {
      return [];
    }

    return this.storedMeetings()[activeDayISO] ?? [];
  });

  ngOnInit(): void {
    this.storedMeetings.set(this.loadMeetings());
  }

  loadMeetings(): Meetings {
    if (typeof localStorage === 'undefined') {
      return this.meetings() ?? {};
    }

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Meetings;
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {
      // ignore malformed localstorage data
    }

    return this.meetings() ?? {};
  }

  saveMeetings(meetings: Meetings): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(meetings));
  }

  private getDayKey(day: DateTime): string {
    const iso = day.toISODate();
    if (!iso) {
      throw new Error('Invalid date key');
    }
    return iso;
  }

  dayHasEvents(day: DateTime): boolean {
    const dayKey = this.getDayKey(day);
    return !!this.storedMeetings()[dayKey]?.length;
  }

  addMeeting(): void {
    const activeDay = this.activeDay();
    const meetingTitle = this.newMeeting().trim();
    if (!activeDay || !meetingTitle) {
      return;
    }

    const dayKey = this.getDayKey(activeDay);
    const nextMeetingList = [
      ...(this.storedMeetings()[dayKey] ?? []),
      meetingTitle,
    ];

    const updatedMeetings: Meetings = {
      ...this.storedMeetings(),
      [dayKey]: nextMeetingList,
    };

    this.storedMeetings.set(updatedMeetings);
    this.saveMeetings(updatedMeetings);
    this.newMeeting.set('');
  }

  removeMeeting(index: number): void {
    const activeDay = this.activeDay();
    if (!activeDay) {
      return;
    }

    const dayKey = this.getDayKey(activeDay);
    const currentList = this.storedMeetings()[dayKey] ?? [];
    const nextList = currentList.filter((_: string, i: number) => i !== index);
    const updatedMeetings: Meetings = {
      ...this.storedMeetings(),
      [dayKey]: nextList,
    };

    if (nextList.length === 0) {
      delete updatedMeetings[dayKey];
    }

    this.storedMeetings.set(updatedMeetings);
    this.saveMeetings(updatedMeetings);
  }

  goToPreviousMonth(): void {
    this.firstDayOfActiveMonth.set(
      this.firstDayOfActiveMonth().minus({ month: 1 }),
    );
  }

  goToNextMonth(): void {
    this.firstDayOfActiveMonth.set(
      this.firstDayOfActiveMonth().plus({ month: 1 }),
    );
  }

  goToToday(): void {
    this.firstDayOfActiveMonth.set(this.today().startOf('month'));
  }
}
