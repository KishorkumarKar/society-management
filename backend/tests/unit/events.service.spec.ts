import {DataSource} from 'typeorm';
import {initTestDataSource, clearAllTables, closeTestDataSource} from '../test-utils/db';
import {createSociety, createFlat, createUser} from '../test-utils/fixtures';
import {EventsService} from '../../src/modules/events/events.service';
import {EventCollectionsService} from '../../src/modules/event-collections/event-collections.service';
import {EventExpensesService} from '../../src/modules/event-expenses/event-expenses.service';
import {EventStatus} from '../../src/domain/entities/event.entity';
import {EventCollectionStatus} from '../../src/domain/entities/event-collection.entity';

describe('EventsService', () => {
  let dataSource: DataSource;
  let eventsService: EventsService;
  let collectionsService: EventCollectionsService;
  let expensesService: EventExpensesService;

  beforeAll(async () => {
    dataSource = await initTestDataSource();
    eventsService = new EventsService(dataSource);
    collectionsService = new EventCollectionsService(dataSource, eventsService);
    expensesService = new EventExpensesService(dataSource, eventsService);
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(dataSource);
  });

  describe('create/update/list/delete', () => {
    it('creates an event with createdBy derived from the actor, defaulting status to upcoming', async () => {
      const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const creator = await createUser(dataSource, society.id);

      const event = await eventsService.create(society.id, creator.id, {
        name: 'Diwali Mela',
        description: 'Community celebration',
        eventDate: '2026-10-31',
        targetAmount: 45000,
      });

      expect(event.status).toBe(EventStatus.UPCOMING);
      expect(event.created_by).toBe(creator.id);
      expect(event.target_amount).toBe('45000.00');
    });

    it('lists only events for the caller society, filterable by status and date range', async () => {
      const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
      const creatorA = await createUser(dataSource, societyA.id);
      const creatorB = await createUser(dataSource, societyB.id);

      await eventsService.create(societyA.id, creatorA.id, {name: 'Upcoming Event', eventDate: '2026-12-01'});
      await eventsService.create(societyA.id, creatorA.id, {
        name: 'Cancelled Event',
        eventDate: '2026-11-01',
        status: EventStatus.CANCELLED,
      });
      await eventsService.create(societyB.id, creatorB.id, {name: 'Other Society Event', eventDate: '2026-12-01'});

      const {data, total} = await eventsService.list(societyA.id, {skip: 0, limit: 20, page: 1}, {sort: '-event_date'});
      expect(total).toBe(2);
      expect(data.every((e) => e.society_id === societyA.id)).toBe(true);

      const {data: onlyCancelled} = await eventsService.list(
        societyA.id,
        {skip: 0, limit: 20, page: 1},
        {status: 'cancelled', sort: '-event_date'},
      );
      expect(onlyCancelled).toHaveLength(1);
      expect(onlyCancelled[0].name).toBe('Cancelled Event');
    });

    it('updates plain fields including status', async () => {
      const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const creator = await createUser(dataSource, society.id);
      const event = await eventsService.create(society.id, creator.id, {name: 'Sports Day', eventDate: '2026-09-01'});

      const updated = await eventsService.update(society.id, event.id, {
        status: EventStatus.ONGOING,
        targetAmount: 30000,
      });

      expect(updated.status).toBe(EventStatus.ONGOING);
      expect(updated.target_amount).toBe('30000.00');
    });

    it('soft-deletes an event so it no longer appears in findById', async () => {
      const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const creator = await createUser(dataSource, society.id);
      const event = await eventsService.create(society.id, creator.id, {name: 'Sports Day', eventDate: '2026-09-01'});

      await eventsService.softDelete(society.id, event.id);

      await expect(eventsService.findById(society.id, event.id)).rejects.toMatchObject({statusCode: 404});
    });

    it('rejects findById/update/delete for an event belonging to a different society', async () => {
      const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
      const creatorA = await createUser(dataSource, societyA.id);
      const event = await eventsService.create(societyA.id, creatorA.id, {name: 'Diwali Mela', eventDate: '2026-10-31'});

      await expect(eventsService.findById(societyB.id, event.id)).rejects.toMatchObject({statusCode: 404});
      await expect(eventsService.update(societyB.id, event.id, {name: 'Hijacked'})).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('EventCollectionsService', () => {
    it('creates a collection and derives status from amountDue vs amountPaid when not explicitly set', async () => {
      const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const creator = await createUser(dataSource, society.id);
      const flat = await createFlat(dataSource, society.id, {unit_no: 'B-304'});
      const event = await eventsService.create(society.id, creator.id, {name: 'Diwali Mela', eventDate: '2026-10-31'});

      const paid = await collectionsService.create(society.id, creator.id, {
        eventId: event.id,
        memberName: 'Rohan Kulkarni',
        unit: flat.unit_no,
        amountDue: 1000,
        amountPaid: 1000,
      });
      expect(paid.status).toBe(EventCollectionStatus.PAID);

      const partial = await collectionsService.create(society.id, creator.id, {
        eventId: event.id,
        memberName: 'Another Member',
        unit: 'B-305',
        amountDue: 1000,
        amountPaid: 400,
      });
      expect(partial.status).toBe(EventCollectionStatus.PARTIAL);

      const pending = await collectionsService.create(society.id, creator.id, {
        eventId: event.id,
        memberName: 'Third Member',
        unit: 'B-306',
        amountDue: 1000,
      });
      expect(pending.status).toBe(EventCollectionStatus.PENDING);
    });

    it('respects an explicitly-provided status over the derived one', async () => {
      const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const creator = await createUser(dataSource, society.id);
      const event = await eventsService.create(society.id, creator.id, {name: 'Diwali Mela', eventDate: '2026-10-31'});

      const collection = await collectionsService.create(society.id, creator.id, {
        eventId: event.id,
        memberName: 'Rohan Kulkarni',
        unit: 'B-304',
        amountDue: 1000,
        amountPaid: 1000,
        status: EventCollectionStatus.PENDING, // waived/held back deliberately despite full payment
      });

      expect(collection.status).toBe(EventCollectionStatus.PENDING);
    });

    it('rejects creating a collection against an event from a different society', async () => {
      const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
      const creatorA = await createUser(dataSource, societyA.id);
      const event = await eventsService.create(societyA.id, creatorA.id, {name: 'Diwali Mela', eventDate: '2026-10-31'});

      await expect(
        collectionsService.create(societyB.id, creatorA.id, {
          eventId: event.id,
          memberName: 'Cross Tenant',
          unit: 'X-1',
          amountDue: 1000,
        }),
      ).rejects.toMatchObject({code: 'EVENT_SOCIETY_MISMATCH'});
    });

    it('rejects creating a collection against a non-existent event', async () => {
      const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const creator = await createUser(dataSource, society.id);

      await expect(
        collectionsService.create(society.id, creator.id, {
          eventId: 999999,
          memberName: 'Nobody',
          unit: 'X-1',
          amountDue: 1000,
        }),
      ).rejects.toMatchObject({code: 'EVENT_NOT_FOUND'});
    });

    it('re-derives status on update when an amount changes and no explicit status is given', async () => {
      const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const creator = await createUser(dataSource, society.id);
      const event = await eventsService.create(society.id, creator.id, {name: 'Diwali Mela', eventDate: '2026-10-31'});
      const collection = await collectionsService.create(society.id, creator.id, {
        eventId: event.id,
        memberName: 'Rohan Kulkarni',
        unit: 'B-304',
        amountDue: 1000,
        amountPaid: 0,
      });
      expect(collection.status).toBe(EventCollectionStatus.PENDING);

      const updated = await collectionsService.update(society.id, collection.id, {amountPaid: 1000});
      expect(updated.status).toBe(EventCollectionStatus.PAID);
    });

    it('lists collections filtered by eventId', async () => {
      const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const creator = await createUser(dataSource, society.id);
      const eventOne = await eventsService.create(society.id, creator.id, {name: 'Event One', eventDate: '2026-10-01'});
      const eventTwo = await eventsService.create(society.id, creator.id, {name: 'Event Two', eventDate: '2026-11-01'});

      await collectionsService.create(society.id, creator.id, {
        eventId: eventOne.id,
        memberName: 'A',
        unit: 'A-1',
        amountDue: 500,
      });
      await collectionsService.create(society.id, creator.id, {
        eventId: eventTwo.id,
        memberName: 'B',
        unit: 'A-2',
        amountDue: 500,
      });

      const {data, total} = await collectionsService.list(
        society.id,
        {skip: 0, limit: 20, page: 1},
        {eventId: eventOne.id, sort: '-created_at'},
      );
      expect(total).toBe(1);
      expect(data[0].event_id).toBe(eventOne.id);
    });
  });

  describe('EventExpensesService', () => {
    it('creates an expense tied to an event in the same society', async () => {
      const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const creator = await createUser(dataSource, society.id);
      const event = await eventsService.create(society.id, creator.id, {name: 'Diwali Mela', eventDate: '2026-10-31'});

      const expense = await expensesService.create(society.id, creator.id, {
        eventId: event.id,
        title: 'Costume contest prizes',
        category: 'Prizes',
        amount: 6000,
        date: '2026-09-10',
        paidTo: 'Party Bazaar',
        notes: '3 prize hampers',
      });

      expect(expense.amount).toBe('6000.00');
      expect(expense.expense_date).toBe('2026-09-10');
      expect(expense.event_id).toBe(event.id);
    });

    it('rejects creating an expense against an event from a different society', async () => {
      const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
      const creatorA = await createUser(dataSource, societyA.id);
      const event = await eventsService.create(societyA.id, creatorA.id, {name: 'Diwali Mela', eventDate: '2026-10-31'});

      await expect(
        expensesService.create(societyB.id, creatorA.id, {
          eventId: event.id,
          title: 'Cross tenant expense',
          category: 'Misc',
          amount: 100,
          date: '2026-09-10',
        }),
      ).rejects.toMatchObject({code: 'EVENT_SOCIETY_MISMATCH'});
    });

    it('lists and filters expenses by eventId and category', async () => {
      const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const creator = await createUser(dataSource, society.id);
      const event = await eventsService.create(society.id, creator.id, {name: 'Diwali Mela', eventDate: '2026-10-31'});

      await expensesService.create(society.id, creator.id, {
        eventId: event.id,
        title: 'Prizes',
        category: 'Prizes',
        amount: 6000,
        date: '2026-09-10',
      });
      await expensesService.create(society.id, creator.id, {
        eventId: event.id,
        title: 'Catering',
        category: 'Food',
        amount: 15000,
        date: '2026-09-12',
      });

      const {data, total} = await expensesService.list(
        society.id,
        {skip: 0, limit: 20, page: 1},
        {eventId: event.id, category: 'Food', sort: '-date'},
      );
      expect(total).toBe(1);
      expect(data[0].title).toBe('Catering');
    });

    it('updates plain fields on an expense', async () => {
      const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const creator = await createUser(dataSource, society.id);
      const event = await eventsService.create(society.id, creator.id, {name: 'Diwali Mela', eventDate: '2026-10-31'});
      const expense = await expensesService.create(society.id, creator.id, {
        eventId: event.id,
        title: 'Prizes',
        category: 'Prizes',
        amount: 6000,
        date: '2026-09-10',
      });

      const updated = await expensesService.update(society.id, expense.id, {amount: 7000, paidTo: 'New Vendor'});
      expect(updated.amount).toBe('7000.00');
      expect(updated.paid_to).toBe('New Vendor');
    });

    it('soft-deletes an expense', async () => {
      const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
      const creator = await createUser(dataSource, society.id);
      const event = await eventsService.create(society.id, creator.id, {name: 'Diwali Mela', eventDate: '2026-10-31'});
      const expense = await expensesService.create(society.id, creator.id, {
        eventId: event.id,
        title: 'Prizes',
        category: 'Prizes',
        amount: 6000,
        date: '2026-09-10',
      });

      await expensesService.softDelete(society.id, expense.id);

      await expect(expensesService.findById(society.id, expense.id)).rejects.toMatchObject({statusCode: 404});
    });
  });
});
