import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {CalendarComponent} from './calendar/calendar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CalendarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'angular-calendar';

  private todayIso = new Date().toISOString().slice(0, 10);
  private tomorrowIso = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  meetings = {
    [this.todayIso]: ['Drink Coffee', 'Learn React', 'Sleep'],
    [this.tomorrowIso]: ['Drink Coffee', 'Learn Angular', 'Sleep'],
  };
}
