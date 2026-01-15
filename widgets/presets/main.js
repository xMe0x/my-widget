const MainPreset = {
  type: "MAIN",
  width: 0,
  className: "default-mode", 

  render({ name, amount, message }) {
    return `
      <div class="layout-main">
        <div class="avatar-box">
          <span class="pi pi-user">👤</span>
        </div>
        
        <div class="text-name">${name || "—"}</div>
        <div class="text-amount">${amount || "—"} บาท</div>
        <div class="text-message">${message || "—"}</div>
      </div>
    `;
  },
};
export default MainPreset;