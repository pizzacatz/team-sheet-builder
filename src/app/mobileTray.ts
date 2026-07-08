export const MOBILE_FLOATING_TRAY_CONTENT_GAP_PX = 14;

export const mobileFloatingTrayClearancePx = (
  trayHeight: number,
  trayBottomOffset: number,
  contentGap = MOBILE_FLOATING_TRAY_CONTENT_GAP_PX
): number => Math.ceil(trayHeight + trayBottomOffset + contentGap);
