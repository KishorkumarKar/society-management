import {DataSource} from 'typeorm';
import {initTestDataSource, clearAllTables, closeTestDataSource} from '../test-utils/db';
import {createSociety, createFlat} from '../test-utils/fixtures';
import {HallBookingsService} from '../../src/modules/hall-bookings/hall-bookings.service';
import {NotificationService} from '../../src/modules/notifications/notification.service';
import {HallBookingStatus} from '../../src/domain/entities/hall-booking.entity';
import {SocietyStatus} from '../../src/domain/entities/society.entity';

describe('HallBookingsService', () => {
  let dataSource: DataSource;
  let hallBookingsService: HallBookingsService;

  beforeAll(async () => {
    dataSource = await initTestDataSource();
    hallBookingsService = new HallBookingsService(dataSource, new NotificationService(dataSource));
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(dataSource);
  });

  it('creates a pending booking for a flat in the caller society', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const flat = await createFlat(dataSource, society.id);

    const booking = await hallBookingsService.create(society.id, 1, {
      flatId: flat.id,
      hallName: 'Community Hall',
      bookingDate: '2026-09-01',
      timeSlot: '10:00-13:00',
    });

    expect(booking.status).toBe(HallBookingStatus.PENDING);
    expect(booking.society_id).toBe(society.id);
  });

  it('rejects booking a flat that belongs to a different society', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
    const flatInB = await createFlat(dataSource, societyB.id);

    await expect(
      hallBookingsService.create(societyA.id, 1, {
        flatId: flatInB.id,
        hallName: 'Community Hall',
        bookingDate: '2026-09-01',
        timeSlot: '10:00-13:00',
      }),
    ).rejects.toMatchObject({code: 'FLAT_SOCIETY_MISMATCH'});
  });

  it('rejects booking when the society is inactive', async () => {
    const society = await createSociety(dataSource, {name: 'Inactive', slug: 'inactive', status: SocietyStatus.INACTIVE});
    const flat = await createFlat(dataSource, society.id);

    await expect(
      hallBookingsService.create(society.id, 1, {
        flatId: flat.id,
        hallName: 'Community Hall',
        bookingDate: '2026-09-01',
        timeSlot: '10:00-13:00',
      }),
    ).rejects.toMatchObject({code: 'SOCIETY_INACTIVE'});
  });

  it('prevents a second pending/approved booking for the same hall+date+time-slot', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const flat = await createFlat(dataSource, society.id);

    await hallBookingsService.create(society.id, 1, {
      flatId: flat.id,
      hallName: 'Community Hall',
      bookingDate: '2026-09-01',
      timeSlot: '10:00-13:00',
    });

    await expect(
      hallBookingsService.create(society.id, 2, {
        flatId: flat.id,
        hallName: 'Community Hall',
        bookingDate: '2026-09-01',
        timeSlot: '10:00-13:00',
      }),
    ).rejects.toMatchObject({code: 'HALL_SLOT_TAKEN'});
  });

  it('allows a new booking for the same slot once the earlier one is rejected/cancelled', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const flat = await createFlat(dataSource, society.id);

    const first = await hallBookingsService.create(society.id, 1, {
      flatId: flat.id,
      hallName: 'Community Hall',
      bookingDate: '2026-09-01',
      timeSlot: '10:00-13:00',
    });
    await hallBookingsService.transitionStatus(society.id, first.id, 1, HallBookingStatus.REJECTED);

    const second = await hallBookingsService.create(society.id, 2, {
      flatId: flat.id,
      hallName: 'Community Hall',
      bookingDate: '2026-09-01',
      timeSlot: '10:00-13:00',
    });

    expect(second.id).not.toBe(first.id);
  });

  it('allows pending -> approved, pending -> rejected, pending -> cancelled', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const flat = await createFlat(dataSource, society.id);

    for (const [toStatus, slot] of [
      [HallBookingStatus.APPROVED, '08:00-09:00'],
      [HallBookingStatus.REJECTED, '09:00-10:00'],
      [HallBookingStatus.CANCELLED, '10:00-11:00'],
    ] as const) {
      const booking = await hallBookingsService.create(society.id, 1, {
        flatId: flat.id,
        hallName: 'Community Hall',
        bookingDate: '2026-09-02',
        timeSlot: slot,
      });
      const updated = await hallBookingsService.transitionStatus(society.id, booking.id, 1, toStatus);
      expect(updated.status).toBe(toStatus);
    }
  });

  it('allows approved -> cancelled', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const flat = await createFlat(dataSource, society.id);
    const booking = await hallBookingsService.create(society.id, 1, {
      flatId: flat.id,
      hallName: 'Community Hall',
      bookingDate: '2026-09-03',
      timeSlot: '10:00-13:00',
    });
    await hallBookingsService.transitionStatus(society.id, booking.id, 1, HallBookingStatus.APPROVED);
    const cancelled = await hallBookingsService.transitionStatus(society.id, booking.id, 1, HallBookingStatus.CANCELLED);
    expect(cancelled.status).toBe(HallBookingStatus.CANCELLED);
  });

  it.each([
    [HallBookingStatus.APPROVED, HallBookingStatus.REJECTED],
    [HallBookingStatus.REJECTED, HallBookingStatus.APPROVED],
    [HallBookingStatus.CANCELLED, HallBookingStatus.APPROVED],
    [HallBookingStatus.CANCELLED, HallBookingStatus.PENDING],
  ])('rejects invalid transition %s -> %s', async (fromStatus, toStatus) => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const flat = await createFlat(dataSource, society.id);
    const booking = await hallBookingsService.create(society.id, 1, {
      flatId: flat.id,
      hallName: 'Community Hall',
      bookingDate: '2026-09-04',
      timeSlot: '10:00-13:00',
    });
    if (fromStatus === HallBookingStatus.APPROVED) {
      await hallBookingsService.transitionStatus(society.id, booking.id, 1, HallBookingStatus.APPROVED);
    } else if (fromStatus === HallBookingStatus.REJECTED) {
      await hallBookingsService.transitionStatus(society.id, booking.id, 1, HallBookingStatus.REJECTED);
    } else if (fromStatus === HallBookingStatus.CANCELLED) {
      await hallBookingsService.transitionStatus(society.id, booking.id, 1, HallBookingStatus.CANCELLED);
    }

    await expect(hallBookingsService.transitionStatus(society.id, booking.id, 1, toStatus)).rejects.toMatchObject({
      code: 'INVALID_STATUS_TRANSITION',
    });
  });

  it('a booking fetched by id must belong to the querying society', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
    const flatInA = await createFlat(dataSource, societyA.id);
    const booking = await hallBookingsService.create(societyA.id, 1, {
      flatId: flatInA.id,
      hallName: 'Community Hall',
      bookingDate: '2026-09-05',
      timeSlot: '10:00-13:00',
    });

    await expect(hallBookingsService.findById(societyB.id, booking.id)).rejects.toMatchObject({statusCode: 404});
  });
});
