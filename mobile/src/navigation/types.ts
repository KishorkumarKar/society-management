export type PublicStackParamList = {
  Landing: undefined;
  Login: undefined;
  About: undefined;
  Contact: undefined;
  Terms: undefined;
  LogViewer: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Maintenance: undefined;
  Announcements: undefined;
  HallBookings: undefined;
  More: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;

  UserDetail: { id: number };
  UserCreate: undefined;
  UserEdit: { id: number };

  MaintenanceDetail: { id: number };
  MaintenanceCreate: undefined;
  MaintenanceEdit: { id: number };

  AnnouncementDetail: { id: number };
  AnnouncementCreate: undefined;
  AnnouncementEdit: { id: number };

  HallBookingDetail: { id: number };

  Roles: undefined;
  RoleDetail: { id: number };
  RoleCreate: undefined;
  RoleEdit: { id: number };

  Permissions: undefined;
  Societies: undefined;

  Flats: undefined;
  FlatDetail: { id: number };
  FlatCreate: undefined;
  FlatEdit: { id: number };

  Expenses: undefined;
  ExpenseDetail: { id: number };
  ExpenseCreate: undefined;
  ExpenseEdit: { id: number };

  Notifications: undefined;
  Profile: undefined;
  About: undefined;
  Contact: undefined;
  Terms: undefined;
  LogViewer: undefined;
};
