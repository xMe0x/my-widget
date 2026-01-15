import { renderWidget } from "./renderer.js";


window.test = function () {
  console.log("Test triggered manually");
  document.dispatchEvent(
    new CustomEvent("manual-test", {
      detail: {
        donate_by: "ทดสอบโดเนท",
        amount: "5,000 THB",
        donate_details: "สวัสดีครับ! โค้ดใหม่นี้ต้องใหญ่และอยู่กลางจอแน่นอนครับ",
        soundUrl: "",
      },
    })
  );
};

function getToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}


document.addEventListener("DOMContentLoaded", () => {
  const widgetEl = document.getElementById("widget");
  const soundEl = document.getElementById("sound");
  if (!widgetEl) return;

  const queue = [];
  let playing = false;

  document.addEventListener("manual-test", (e) => {
    queue.push(e.detail);
    if (!playing) playNext();
  });

  function playNext() {
    if (!queue.length) {
      playing = false;
      return;
    }

    playing = true;
    const raw = queue.shift();

    const { html, className } = renderWidget(raw.widgetType ?? 0, {
      name: raw.donate_by,
      amount: raw.amount,
      message: raw.donate_details,
    });

    widgetEl.className = `widget ${className}`;
    widgetEl.innerHTML = html;

    requestAnimationFrame(() => {
      widgetEl.classList.add("show");
    });

    if (raw.soundUrl && soundEl) {
      soundEl.src = raw.soundUrl;
      soundEl.volume = 0.8;

      soundEl
        .play()
        .then(() => console.log("Playing sound..."))
        .catch((err) => console.error("Audio playback failed:", err));
    }

    setTimeout(() => {
      widgetEl.classList.remove("show");
      widgetEl.classList.add("hide");

      setTimeout(() => {
        widgetEl.classList.remove("hide");
        if (soundEl) soundEl.src = "";
        playNext();
      }, 500);
    }, 8000);
  }

  try {
    const token = getToken();

    if (!token) {
      console.warn("No widget token found in URL");
      return;
    }
    const BACKEND_URL = "https://setsuko-knotless-boyishly.ngrok-free.dev"; // ลิงก์ ngrok ของคุณ

    const socket = io(BACKEND_URL, {
      auth: { token: token },
      extraHeaders: {
        "ngrok-skip-browser-warning": "true" // ใส่ตรงนี้เพื่อให้ Socket คุยกับ ngrok ได้
      },
      transportOptions: {
        polling: {
          extraHeaders: {
            "ngrok-skip-browser-warning": "true" // กันเหนียวสำหรับโหมด polling
          }
        }
      },
      transports: ['polling', 'websocket']
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.warn("Socket disconnected");
    });

    socket.on("donationUpdate", (data) => {
      console.log("Received donation:", data);
      queue.push(data);
      if (!playing) playNext();
    });
  } catch (e) {
    console.warn("⚠️ Socket not connected (Test Mode Only)", e);
  }
});

