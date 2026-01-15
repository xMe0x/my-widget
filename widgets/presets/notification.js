const NotificationPreset = {
  type: "NOTIFICATION",
  width: 0,
  className: "notification-mode", // ส่ง class นี้ไปบอก CSS ให้ปรับขนาดกล่อง

  render({ name, amount, message }) {
    return `
      <div class="layout-notification">
        <div class="avatar-box">
          <span class="pi pi-user">👤</span>
        </div>
        
        <div class="content">
          <div class="header-line">
             <div class="text-name truncate">${name || "—"}</div>
             <div class="text-amount">${amount || "—"} บาท</div>
          </div>
          <div class="text-message truncate">${message || "—"}</div>
        </div>
      </div>
    `;
  },
};
export default NotificationPreset;