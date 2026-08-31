import {DataSource} from 'typeorm';
import {HallBooking, HallBookingStatus} from '../../domain/entities/hall-booking.entity';
import {Flat} from '../../domain/entities/flat.entity';
import {Society, SocietyStatus} from '../../domain/entities/society.entity';
import {ApiError} from '../../utils/api-response';
import {PaginationQuery} from '../../utils/pagination';
import {logger} from '../../infrastructure/logging/logger';
import {NotificationService} from '../notifications/notification.service';
import {NotificationChannelType} from '../../domain/entities/notification.entity';

export interface CreateHallBookingInput {
  flatId: number;
  hallName: string;
  startDateTime: string | Date;
  endDateTime: string | Date;
  purpose?: string | null;
  amount?: number;
  deposit?: number;
}

export interface UpdateHallBookingInput {
  hallName?: string;
  startDateTime?: string | Date;
  endDateTime?: string | Date;
  purpose?: string | null;
  amount?: number;
  deposit?: number;
}

/**
 * Valid status transitions. Anything not listed here (including any
 * self-transition) is rejected. Kept as an explicit table rather than
 * scattered if/else so the full state machine is visible at a glance and
 * easy to audit against the spec.
 */
const VALID_TRANSITIONS: Record<HallBookingStatus, HallBookingStatus[]> = {
  [HallBookingStatus.PENDING]: [HallBookingStatus.APPROVED, HallBookingStatus.REJECTED, HallBookingStatus.CANCELLED],
  [HallBookingStatus.APPROVED]: [HallBookingStatus.CANCELLED],
  [HallBookingStatus.REJECTED]: [],
  [HallBookingStatus.CANCELLED]: [],
};

/** Statuses that "hold" a hall/date/time-slot combination against new bookings. */
const BLOCKING_STATUSES = [HallBookingStatus.PENDING, HallBookingStatus.APPROVED];

export class HallBookingsService {
  constructor(
    private dataSource: DataSource,
    private notificationService: NotificationService,
  ) {}

  /**
   * Implements the exact create sequence from the spec:
   * 1-2. auth + permission are enforced by middleware upstream.
   * 3. societyId is always the caller's own (never from the body).
   * 4. society must be active.
   * 5. flat must belong to the same society.
   * 6-8. hall/start/end are Joi-validated upstream (end > start); re-checked
   *      for shape here defensively.
   * 9. conflict check — an overlap check (not just an exact-match check),
   *    done inside a transaction with a row lock on any existing
   *    pending/approved booking whose [start, end) range intersects the
   *    requested one, so two concurrent requests can't both slip through a
   *    race and double-book a hall (a plain SELECT-then-INSERT has a TOCTOU
   *    gap; FOR UPDATE closes it).
   * 10. create the booking.
   */
  async create(societyId: number, actorUserId: number, input: CreateHallBookingInput): Promise<HallBooking> {
    return this.dataSource.transaction(async (manager) => {
      const society = await manager.getRepository(Society).findOne({where: {id: societyId}});
      if (!society) throw ApiError.notFound('Society not found');
      if (society.status !== SocietyStatus.ACTIVE) {
        throw ApiError.forbidden('This society is not active', 'SOCIETY_INACTIVE');
      }

      const flat = await manager.getRepository(Flat).findOne({where: {id: input.flatId}});
      if (!flat) throw ApiError.badRequest('Flat not found', 'FLAT_NOT_FOUND');
      if (flat.society_id !== societyId) {
        throw ApiError.forbidden('Flat belongs to a different society', 'FLAT_SOCIETY_MISMATCH');
      }

      const startDateTime = this.toDate(input.startDateTime);
      const endDateTime = this.toDate(input.endDateTime);
      if (endDateTime.getTime() <= startDateTime.getTime()) {
        throw ApiError.badRequest('endDateTime must be after startDateTime', 'INVALID_DATETIME_RANGE');
      }

      const bookingRepo = manager.getRepository(HallBooking);

      // Row-lock any existing blocking booking whose range overlaps the
      // requested one so a concurrent request racing us has to wait, not
      // double-book. Two half-open ranges [aStart, aEnd) and [bStart, bEnd)
      // overlap iff aStart < bEnd AND aEnd > bStart.
      const conflict = await bookingRepo
        .createQueryBuilder('booking')
        .setLock('pessimistic_write')
        .where('booking.society_id = :societyId', {societyId})
        .andWhere('booking.hall_name = :hallName', {hallName: input.hallName})
        .andWhere('booking.start_datetime < :endDateTime', {endDateTime})
        .andWhere('booking.end_datetime > :startDateTime', {startDateTime})
        .andWhere('booking.status IN (:...statuses)', {statuses: BLOCKING_STATUSES})
        .getOne();

      if (conflict) {
        throw ApiError.conflict(
          'This hall is already booked (pending or approved) for an overlapping date/time range',
          'HALL_SLOT_TAKEN',
        );
      }

      const booking = bookingRepo.create({
        society_id: societyId,
        flat_id: input.flatId,
        hall_name: input.hallName,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        purpose: input.purpose ?? null,
        amount: String(input.amount ?? 0),
        deposit: String(input.deposit ?? 0),
        status: HallBookingStatus.PENDING,
      });
      const saved = await bookingRepo.save(booking);

      logger.info('Hall booking created', {actorUserId, societyId, bookingId: saved.id, hallName: saved.hall_name});
      return saved;
    });
  }

  async findById(societyId: number, id: number): Promise<HallBooking> {
    const repo = this.dataSource.getRepository(HallBooking);
    const booking = await repo.findOne({where: {id, society_id: societyId}});
    if (!booking) throw ApiError.notFound('Hall booking not found');
    return booking;
  }

  async list(
    societyId: number,
    pagination: PaginationQuery,
    filters: {
      search?: string;
      fromDate?: string | Date;
      toDate?: string | Date;
      status?: string;
      hallName?: string;
      flatId?: number;
      sort: string;
    },
  ): Promise<{data: HallBooking[]; total: number}> {
    const repo = this.dataSource.getRepository(HallBooking);
    const qb = repo.createQueryBuilder('booking').where('booking.society_id = :societyId', {societyId});

    if (filters.search) {
      qb.andWhere('(booking.hall_name LIKE :search OR booking.purpose LIKE :search)', {search: `%${filters.search}%`});
    }
    // fromDate/toDate bound the booking's start_datetime — this is a
    // "starts within this window" filter, not a range-overlap filter.
    if (filters.fromDate) {
      qb.andWhere('booking.start_datetime >= :fromDate', {fromDate: this.toDate(filters.fromDate)});
    }
    if (filters.toDate) {
      qb.andWhere('booking.start_datetime <= :toDate', {toDate: this.toDate(filters.toDate)});
    }
    if (filters.status) qb.andWhere('booking.status = :status', {status: filters.status});
    if (filters.hallName) qb.andWhere('booking.hall_name = :hallName', {hallName: filters.hallName});
    if (filters.flatId) qb.andWhere('booking.flat_id = :flatId', {flatId: filters.flatId});

    const [sortField, sortDir] = filters.sort.startsWith('-')
      ? [filters.sort.slice(1), 'DESC' as const]
      : [filters.sort, 'ASC' as const];
    qb.orderBy(`booking.${sortField}`, sortDir);
    qb.skip(pagination.skip).take(pagination.limit);

    const [data, total] = await qb.getManyAndCount();
    return {data, total};
  }

  /**
   * Plain field edits — does NOT touch status; use transitionStatus for
   * that. If the hall or either end of the range changes, the slot-overlap
   * check runs again (same row-locked logic as create()) so an edit can't
   * be used to sneak a booking into an already-taken range.
   */
  async update(societyId: number, id: number, input: UpdateHallBookingInput): Promise<HallBooking> {
    return this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(HallBooking);
      const booking = await bookingRepo.findOne({where: {id, society_id: societyId}});
      if (!booking) throw ApiError.notFound('Hall booking not found');
      if (booking.status !== HallBookingStatus.PENDING) {
        throw ApiError.conflict('Only pending bookings can be edited', 'BOOKING_NOT_EDITABLE');
      }

      const nextHallName = input.hallName ?? booking.hall_name;
      const nextStart = input.startDateTime !== undefined ? this.toDate(input.startDateTime) : booking.start_datetime;
      const nextEnd = input.endDateTime !== undefined ? this.toDate(input.endDateTime) : booking.end_datetime;

      if (nextEnd.getTime() <= nextStart.getTime()) {
        throw ApiError.badRequest('endDateTime must be after startDateTime', 'INVALID_DATETIME_RANGE');
      }

      const rangeOrHallChanged =
        input.hallName !== undefined || input.startDateTime !== undefined || input.endDateTime !== undefined;

      if (rangeOrHallChanged) {
        const conflict = await bookingRepo
          .createQueryBuilder('b')
          .setLock('pessimistic_write')
          .where('b.society_id = :societyId', {societyId})
          .andWhere('b.id != :id', {id})
          .andWhere('b.hall_name = :hallName', {hallName: nextHallName})
          .andWhere('b.start_datetime < :nextEnd', {nextEnd})
          .andWhere('b.end_datetime > :nextStart', {nextStart})
          .andWhere('b.status IN (:...statuses)', {statuses: BLOCKING_STATUSES})
          .getOne();

        if (conflict) {
          throw ApiError.conflict(
            'This hall is already booked (pending or approved) for an overlapping date/time range',
            'HALL_SLOT_TAKEN',
          );
        }
      }

      booking.hall_name = nextHallName;
      booking.start_datetime = nextStart;
      booking.end_datetime = nextEnd;
      if (input.purpose !== undefined) booking.purpose = input.purpose;
      if (input.amount !== undefined) booking.amount = String(input.amount);
      if (input.deposit !== undefined) booking.deposit = String(input.deposit);

      return bookingRepo.save(booking);
    });
  }

  async softDelete(societyId: number, id: number): Promise<void> {
    const booking = await this.findById(societyId, id);
    await this.dataSource.getRepository(HallBooking).softDelete(booking.id);
  }

  /**
   * The single choke point for every status change (approve/reject/cancel
   * all funnel through here) so VALID_TRANSITIONS is enforced uniformly —
   * controllers never set `status` via the generic update() path.
   */
  async transitionStatus(
    societyId: number,
    id: number,
    actorUserId: number,
    toStatus: HallBookingStatus,
  ): Promise<HallBooking> {
    return this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(HallBooking);
      const booking = await bookingRepo.findOne({where: {id, society_id: societyId}});
      if (!booking) throw ApiError.notFound('Hall booking not found');

      const fromStatus = booking.status;
      const allowed = VALID_TRANSITIONS[fromStatus] ?? [];
      if (!allowed.includes(toStatus)) {
        throw ApiError.conflict(
          `Cannot transition a booking from "${fromStatus}" to "${toStatus}"`,
          'INVALID_STATUS_TRANSITION',
        );
      }

      booking.status = toStatus;
      const saved = await bookingRepo.save(booking);

      logger.info('Hall booking status changed', {actorUserId, societyId, bookingId: id, from: fromStatus, to: toStatus});

      if (toStatus === HallBookingStatus.APPROVED) {
        // Notify the flat's residents that their booking was approved.
        // Runs inside the same transaction — if notification creation
        // fails, the approval itself rolls back too, per spec section 33
        // ("Approve booking -> Update booking -> Create notification
        // should be transactional where appropriate").
        const flat = await manager.getRepository(Flat).findOne({where: {id: booking.flat_id}});
        if (flat) {
          const residentUserIds = await manager
            .createQueryBuilder()
            .select('u.id', 'id')
            .from('users', 'u')
            .where('u.flat_id = :flatId', {flatId: flat.id})
            .andWhere('u.deleted_at IS NULL')
            .getRawMany<{id: number}>();

          for (const {id: residentId} of residentUserIds) {
            await this.notificationService.create(
              {
                societyId,
                userId: residentId,
                type: 'hall_booking.approved',
                title: 'Hall booking approved',
                body: `Your booking for ${booking.hall_name} from ${booking.start_datetime.toISOString()} to ${booking.end_datetime.toISOString()} has been approved.`,
                channel: NotificationChannelType.IN_APP,
              },
              manager,
            );
          }
        }
      }

      return saved;
    });
  }

  private toDate(value: string | Date): Date {
    return value instanceof Date ? value : new Date(value);
  }
}
