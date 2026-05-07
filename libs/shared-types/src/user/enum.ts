export enum Gender {
  MALE,
  FEMALE,
}

export enum StaffStatus {
  ACTIVE,
  INACTIVE,
}

export enum WorkType {
  FULL_TIME,
  PART_TIME,
  CONTRACT,
}

export enum StaffPosition {
  /// Cấp quản trị cao nhất
  SUPER_ADMIN,

  /// Quản lý rạp phim
  CINEMA_MANAGER,

  /// Phó / trợ lý quản lý rạp
  ASSISTANT_MANAGER,

  /// Nhân viên bán vé
  TICKET_CLERK,

  /// Nhân viên quầy bắp nước / đồ ăn
  CONCESSION_STAFF,

  /// Nhân viên soát vé, hướng dẫn khách vào phòng chiếu
  USHER,

  /// Nhân viên vận hành máy chiếu
  PROJECTIONIST,

  /// Nhân viên vệ sinh
  CLEANER,

  /// Nhân viên bảo vệ
  SECURITY,
}

export enum ShiftType {
  MORNING,
  AFTERNOON,
  NIGHT,
}
