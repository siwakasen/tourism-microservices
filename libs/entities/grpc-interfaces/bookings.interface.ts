import { Observable } from "rxjs";

export interface BookingsServiceClient {
    getCarIdsByBookingDateRange: (body: { start_date: string, end_date: string }) => Observable<{ car_ids: number[] }>;
    getEmployeesByBookingDateRange: (body: { start_date: string, end_date: string, booking_id: number }) => Observable<{ employee_ids: number[] }>;
}
