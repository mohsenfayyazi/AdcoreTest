import { Component, OnInit } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatTableModule,
    MatIconModule,
    FormsModule,
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.css']
})
export class CourseListComponent implements OnInit {
  courses: any[] = [];
  displayedCourses: any[] = [];
  page = 0;
  perPage = 10;
  totalItems = 0;
  searchText = '';
  constructor(private http: HttpClient, private router: Router) {}


  ngOnInit(): void {
    this.getCourses();
  }

  getCourses(): void {
    this.http.get<any[]>('http://127.0.0.1:5000/courses')
      .subscribe(data => {
        this.courses = data.map(course => ({
          ...course,
          length: this.calculateCourseLength(course.StartDate, course.EndDate)
        }));        
        this.totalItems = data.length;
        this.updateDisplayedCourses();
      }, error => {
        console.error('Error fetching courses', error);
      });
  }

  calculateCourseLength(StartDate: string, EndDate: string): number {
    const start = new Date(StartDate);
    const end = new Date(EndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  }

  updateDisplayedCourses(): void {
    const filteredCourses = this.courses? this.courses.filter(course => 
      course.CourseName.toLowerCase().includes(this.searchText.toLowerCase()) ||
      course.City.toLowerCase().includes(this.searchText.toLowerCase()) ||
      course.Country.toLowerCase().includes(this.searchText.toLowerCase()) ||
      course.CourseDescription.toLowerCase().includes(this.searchText.toLowerCase()) ||
      course.University.toLowerCase().includes(this.searchText.toLowerCase())
    ): this.courses;
    this.totalItems = filteredCourses.length;
    this.displayedCourses = filteredCourses.slice(this.page * this.perPage, (this.page + 1) * this.perPage);
  }
  addNewCourse(): void {
    this.router.navigate(['/add-course']);
  }
  
  editCourse(courseId: string): void {
    this.router.navigate(['/form-course', courseId]);
  }

  deleteCourse(courseId: string): void {
    this.http.delete(`http://127.0.0.1:5000/courses/${courseId}`)
    .subscribe(() => {
      this.courses = this.courses.filter(course => course._id !== courseId);
      this.totalItems = this.courses.length;
      this.updateDisplayedCourses();
      console.log(`Deleted course with ID: ${courseId}`);
    }, error => {
      console.error('Error deleting course', error);
    });
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.perPage = event.pageSize;
    this.updateDisplayedCourses();
  }
}
