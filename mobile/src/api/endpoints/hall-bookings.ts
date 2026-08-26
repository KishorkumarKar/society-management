import { apiClient } from '../client';
import { ApiPaginated, ApiSuccess, HallBooking } from '../types';

// backend/src/modules/hall-bookings/hall-bookings.controller.ts:
//   POST   /hall-bookings            (hall_bookings.create)
//   GET    /hall-bookings            (hall_bookings.view)
//   GET    /hall-bookings/:id        (hall_bookings.view)
//   PATCH  /hall-bookings/:id        (hall_bookings.update)
//   DELETE /hall-bookings/:id        (hall_bookings.delete)
//   PATCH  /hall-bookings/:id/approve(hall_bookings.approve)
//   PATCH  /hall-bookings/:id/reject (hall_bookings.reject)
//   PATCH  /hall-bookings/:id/cancel (hall_bookings.cancel)

export async function listHallBookings(params: { page?: number; limit?: number; status?: string } = {}) {
  const res = await apiClient.get<ApiPaginated<HallBooking>>('/hall-bookings', { params });
  return res.data;
}

export async function getHallBooking(id: number) {
  const res = await apiClient.get<ApiSuccess<HallBooking>>(`/hall-bookings/${id}`);
  return res.data.data;
}

export interface CreateHallBookingPayload {
  flat_id: number;
  purpose: string;
  start_time: string;
  end_time: string;
}

export async function createHallBooking(payload: CreateHallBookingPayload) {
  const res = await apiClient.post<ApiSuccess<HallBooking>>('/hall-bookings', payload);
  return res.data.data;
}

export async function approveHallBooking(id: number) {
  const res = await apiClient.patch<ApiSuccess<HallBooking>>(`/hall-bookings/${id}/approve`);
  return res.data.data;
}

export async function rejectHallBooking(id: number) {
  const res = await apiClient.patch<ApiSuccess<HallBooking>>(`/hall-bookings/${id}/reject`);
  return res.data.data;
}

export async function cancelHallBooking(id: number) {
  const res = await apiClient.patch<ApiSuccess<HallBooking>>(`/hall-bookings/${id}/cancel`);
  return res.data.data;
}
