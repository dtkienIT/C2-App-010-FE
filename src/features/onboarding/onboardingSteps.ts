export type OnboardingStep = {
  beforeStep?: "openMobileMenu";
  id: string;
  message: string;
  mobileTarget?: string;
  mission?: string;
  optional?: boolean;
  placement?: "top" | "bottom" | "center";
  route?: string;
  target?: string;
  title: string;
};

export const HOME_ROUTE = "/dashboard";

export type OnboardingAudience = "authenticated" | "guest";

const authenticatedOnboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    message: "Chào bạn! Mình sẽ hướng dẫn vòng học chính: Quiz -> Pomodoro -> Xu -> Cửa hàng -> Buddy Room -> Mini quiz -> Thống kê.",
    placement: "center",
    route: HOME_ROUTE,
    title: "Chào mừng đến Buddy Study",
  },
  {
    id: "quiz",
    message: "Bắt đầu từ Dashboard bằng nút này. Đây là lối vào nhanh nhất để vào quiz và mở vòng học đầu tiên.",
    route: HOME_ROUTE,
    target: '[data-onboarding="home-start-quiz"]',
    title: "Ấn vào Làm quiz ngay",
  },
  {
    beforeStep: "openMobileMenu",
    id: "quiz-nav",
    message: "Đây là nút Quiz trong menu bên trái. Khi cần quay lại nhiệm vụ học chính, bạn có thể vào từ đây ở mọi trang.",
    mobileTarget: '[data-onboarding="nav-quiz"]',
    route: "/quiz",
    target: '[data-onboarding="nav-quiz"]',
    title: "Nút Quiz ở menu",
  },
  {
    id: "pomodoro",
    message: "Ngay trong trang Quiz, Pomodoro giúp bạn nghỉ ngắn đúng lúc với Buddy rồi quay lại đúng bài đang làm dở.",
    optional: true,
    route: "/quiz",
    target: '[data-onboarding="pomodoro-entry"]',
    title: "Giữ nhịp bằng Pomodoro",
  },
  {
    beforeStep: "openMobileMenu",
    id: "coins",
    message: "Sau khi học, bạn nhận xu. Xu là phần thưởng kiểu game để dùng cho Buddy và các vật phẩm mở khóa.",
    mobileTarget: '[data-onboarding="mobile-coins"]',
    route: HOME_ROUTE,
    target: '[data-onboarding="header-coins"]',
    title: "Nhận xu sau khi học",
  },
  {
    beforeStep: "openMobileMenu",
    id: "shop",
    message: "Cửa hàng là nơi dùng xu để mở khóa hoặc trang bị model, background và phần thưởng cho Buddy.",
    mobileTarget: '[data-onboarding="nav-shop"]',
    route: "/buddy-3d",
    target: '[data-onboarding="nav-shop"]',
    title: "Dùng xu ở Cửa hàng",
  },
  {
    beforeStep: "openMobileMenu",
    id: "buddy-room",
    message: "Buddy Room là nơi tương tác với companion, nghỉ ngắn và nhận phản hồi. Đây là không gian thưởng sau khi học.",
    mobileTarget: '[data-onboarding="nav-buddy-room"]',
    route: "/buddy-room",
    target: '[data-onboarding="nav-buddy-room"]',
    title: "Vào Buddy Room",
  },
  {
    id: "mini-quiz",
    message: "Mini quiz trong Buddy Room là thử thách nhanh. Khi hoàn thành, Buddy có thể tăng năng lượng, tập trung, niềm vui và nhận thưởng theo logic hiện có.",
    optional: true,
    route: "/buddy-room",
    target: '[data-onboarding="buddy-mini-quiz-action"]',
    title: "Thử mini quiz",
  },
  {
    beforeStep: "openMobileMenu",
    id: "progress",
    message: "Cuối vòng học, vào Thống kê để xem XP, streak, độ chính xác và gợi ý học tiếp theo.",
    mobileTarget: '[data-onboarding="nav-progress"]',
    route: "/progress",
    target: '[data-onboarding="nav-progress"]',
    title: "Xem tiến độ ở Thống kê",
  },
  {
    id: "profile-settings",
    message: "Trong hồ sơ, bạn có thể xem trạng thái tài khoản và bấm Xem lại hướng dẫn bất cứ lúc nào.",
    route: "/profile",
    target: '[data-onboarding="profile-settings"]',
    title: "Xem lại hướng dẫn khi cần",
  },
  {
    id: "mobile-menu",
    message: "Trên điện thoại, dùng nút menu này để mở điều hướng tới Quiz, Cửa hàng, Buddy Room và Thống kê.",
    optional: true,
    route: HOME_ROUTE,
    target: '[data-onboarding="mobile-menu"]',
    title: "Menu trên điện thoại",
  },
  {
    id: "mission",
    message: "Vòng đầu tiên của bạn đã rõ: Quiz -> Pomodoro -> Xu -> Cửa hàng -> Buddy Room -> Mini quiz -> Thống kê.",
    mission: "Hoàn thành quiz đầu tiên",
    placement: "center",
    route: HOME_ROUTE,
    title: "Nhiệm vụ đầu tiên",
  },
];

const guestOnboardingSteps: OnboardingStep[] = [
  {
    id: "guest-welcome",
    message:
      "Đây là Guest Pass. Bạn có thể xem trước giao diện, thử Buddy và vào Hồ sơ để nâng cấp khi sẵn sàng, nhưng Quiz, Nhiệm vụ và Thống kê thật sẽ bị khóa.",
    placement: "center",
    route: HOME_ROUTE,
    title: "Chào mừng Guest Pass",
  },
  {
    id: "guest-profile",
    message:
      "Bấm vào Hồ sơ để xem trạng thái Guest Pass và nâng cấp tài khoản. Từ đây bạn sẽ mở khóa Quiz, Nhiệm vụ và các dữ liệu học tập thật.",
    route: "/profile",
    target: '[data-onboarding="profile-settings"]',
    title: "Nâng cấp từ Hồ sơ",
  },
];

export function getOnboardingSteps(audience: OnboardingAudience) {
  return audience === "guest" ? guestOnboardingSteps : authenticatedOnboardingSteps;
}
