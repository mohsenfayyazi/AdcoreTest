import { Routes } from '@angular/router';
import { CourseListComponent } from './course-list/course-list.component';
import { CourseFormComponent } from './course-form/course-form.component';

export const routes: Routes = [
  { path: 'course', component: CourseListComponent },
  { path: '', redirectTo: '/course', pathMatch: 'full' },
  { path: 'form-course/:id', component: CourseFormComponent }
];