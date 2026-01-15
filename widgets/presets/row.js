const RowPreset = {
  type: "ROW",
  width: 0,
  className: "default-mode",

  render({ name, amount, message }) {
    return `
      <div class="layout-row">
        <div class="avatar-box">
          <span class="pi pi-user">👤</span>
        </div>
        
        <div class="content">
          <div class="text-name truncate">${name || "—"}</div>
          <div class="text-amount">${amount || "—"} บาท</div>
          <div class="text-message truncate">${message || "—"} </div>
        </div>
      </div>
    `;
  },
};
export default RowPreset;