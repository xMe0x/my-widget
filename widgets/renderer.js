import MAIN from "./presets/main.js";
import ROW from "./presets/row.js";
import NOTIFICATION from "./presets/notification.js";

const PRESETS = { MAIN, ROW, NOTIFICATION };
const TYPE_MAP = { 0: "MAIN", 1: "ROW", 2: "NOTIFICATION" };

export function renderWidget(type, data) {
  const presetType = TYPE_MAP[type] || "MAIN";

  const preset = PRESETS[presetType]; 

  return {
    html: preset.render(data),
    width: preset.width,
    className: preset.className,
  };
}
