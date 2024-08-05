import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    MatSelectModule
  ],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.css']
})
export class CourseFormComponent implements OnInit {
  courseForm: FormGroup;
  isEditMode: boolean = false;
  courseId: string | null = null;
  universities: string[] = [];
  countries: string[] = [];
  cities: string[] = [];
  filteredUniversities: string[] = [];
  filteredCountries: string[] = [];
  filteredCities: string[] = [];
  errorMessage: string | null = null;
  cachedCities: { [key: string]: string[] } = {};
currencies: string[] = [
    'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'AFN', 'ALL', 'DZD', 'AOA', 'ARS', 'AMD', 'AWG', 'AZN', 'BSD', 'BHD', 
    'BDT', 'BBD', 'BYN', 'BZD', 'XOF', 'BMD', 'BTN', 'BOB', 'BAM', 'BWP', 'NOK', 'BRL', 'BND', 'BGN', 'BIF', 'CVE', 
    'KHR', 'XAF', 'KYD', 'CLP', 'CNY', 'COP', 'KMF', 'CDF', 'CRC', 'HRK', 'CUP', 'CZK', 'DJF', 'DOP', 'EGP', 'SVC', 
    'ERN', 'SZL', 'ETB', 'FKP', 'FJD', 'GMD', 'GEL', 'GHS', 'GIP', 'GTQ', 'GNF', 'GYD', 'HTG', 'HNL', 'HKD', 'HUF', 
    'ISK', 'INR', 'IDR', 'IRR', 'IQD', 'ILS', 'JMD', 'JOD', 'KZT', 'KES', 'KPW', 'KRW', 'KWD', 'KGS', 'LAK', 'LBP', 
    'LSL', 'LRD', 'LYD', 'MOP', 'MKD', 'MGA', 'MWK', 'MYR', 'MVR', 'MRO', 'MUR', 'MXN', 'MDL', 'MNT', 'MAD', 'MZN', 
    'MMK', 'NAD', 'NPR', 'NZD', 'NIO', 'NGN', 'OMR', 'PKR', 'PAB', 'PGK', 'PYG', 'PEN', 'PHP', 'PLN', 'QAR', 'RON', 
    'RUB', 'RWF', 'SHP', 'WST', 'STN', 'SAR', 'RSD', 'SCR', 'SLL', 'SGD', 'SBD', 'SOS', 'ZAR', 'SSP', 'LKR', 'SDG', 
    'SRD', 'SZL', 'SEK', 'CHF', 'SYP', 'TWD', 'TJS', 'TZS', 'THB', 'TOP', 'TTD', 'TND', 'TRY', 'TMT', 'UGX', 'UAH', 
    'AED', 'UYU', 'UZS', 'VUV', 'VEF', 'VND', 'XPF', 'YER', 'ZMW'
  ]; 
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    this.courseForm = this.fb.group({
      CourseName: [{ value: '', disabled: false }, Validators.required],
      University: ['', Validators.required],
      Country: ['', Validators.required],
      City: ['', Validators.required],
      Price: ['', Validators.required],
      StartDate: ['', Validators.required],
      EndDate: ['', Validators.required],
      CourseDescription: ['', Validators.required],
      Currency: ['USD', Validators.required],
    });
  }

  ngOnInit(): void {
    this.fetchCountries();
    this.fetchUniversities();

    this.route.paramMap.subscribe(params => {
      this.courseId = params.get('id');
      this.isEditMode = !!this.courseId;
      if (this.isEditMode) {
        this.loadCourseData();
      }
    });
    this.courseForm.get('Country')!.valueChanges.subscribe(value => {
      this.filteredCountries = this._filter(value, this.countries);
      if (value) {

        if (this.cachedCities[value]) {
          this.filteredCities = this.cachedCities[value];
        } else {
          this.fetchCities(value);
        }
      } else {
        this.filteredCities = [];
      }
    });
    this.courseForm.get('City')!.valueChanges.subscribe(value => {
      this.filteredCities = this._filter(value, this.cities);
    });
    this.courseForm.get('University')!.valueChanges.subscribe(value => {
      this.filteredUniversities = this._filter(value, this.universities);
    });
  }

  loadCourseData(): void {
    if (this.courseId) {
      this.http.get<any>(`http://127.0.0.1:5000/course/${this.courseId}`).subscribe(course => {
        if (course) {
          this.courseForm.patchValue({
            CourseName: course.CourseName,
            University: course.University,
            country: course.Country,
            City: course.City,
            Price: course.Price,
            StartDate: course.StartDate,
            EndDate: course.EndDate,
            CourseDescription: course.CourseDescription
          });
          this.disableFormControls();
        } else {
          console.error('Course data is null or undefined');
        }
      }, error => {
        console.error('Error loading course data', error);
      });
    }
  }

  disableFormControls(): void {
    if (this.isEditMode) {
      this.courseForm.get('CourseName')?.disable();
      this.courseForm.get('University')?.disable();
      this.courseForm.get('Country')?.disable();
      this.courseForm.get('City')?.disable();
    }
  }

  onSubmit(): void {
    console.log("valid",this.courseForm.valid);
    if (this.courseForm.valid) {
      const courseData = this.courseForm.value;
      if (this.isEditMode && this.courseId) {
        this.http.put(`http://127.0.0.1:5000/courses/${this.courseId}`, courseData).subscribe(response => {
          console.log('Course updated successfully', response);
          this.router.navigate(['/course']);
        }, error => {
          console.error('Error updating course', error);
        });
      } else {
        this.http.post('http://127.0.0.1:5000/courses', courseData).subscribe(response => {
          console.log('Course added successfully', response);
          this.router.navigate(['/course']);
        }, error => {
          console.error('Error adding course', error);
        });
      }
    }
  }

  onCancel(): void {
    this.courseForm.reset();
    this.router.navigate(['/course']);
  }

  private fetchCountries() {
    this.http.get<any[]>('https://restcountries.com/v3.1/all').subscribe(data => {
      this.countries = data.map((country: any) => country.name.common).sort();
      this.filteredCountries = this.countries;
    });
  }
  private fetchCities(country: string) {
    const url = `https://countriesnow.space/api/v0.1/countries/cities/q?country=${country}`;

    this.http.get<any>(url).subscribe(
      data => {
        this.cities = data.data.sort();
        this.filteredCities = this.cities;
        this.cachedCities[country] = this.cities;  // Cache the result
        this.errorMessage = null;
      },
      error => {
        this.errorMessage = 'Error fetching cities. Please try again.';
        console.error('Error fetching cities', error);
      }
    );
  }

  private _filter(value: string, options: string[]): string[] {
    const filterValue = value.toLowerCase();
    return options.filter(option => option.toLowerCase().includes(filterValue));
  }

  private fetchUniversities() {
    const url = `http://universities.hipolabs.com/search`;
    this.http.get<any[]>(url).subscribe(
      data => {
        this.universities = data.map((uni: any) => uni.name).sort();
        this.filteredUniversities = this.universities;
        this.errorMessage = null;
      },
      error => {
        this.errorMessage = 'Error fetching universities. Please try again.';
        console.error('Error fetching universities', error);
      }
    );
  }

}
