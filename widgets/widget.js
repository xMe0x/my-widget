import { renderWidget } from "./renderer.js";

// --- CONFIG ---
const BACKEND_URL = "https://setsuko-knotless-boyishly.ngrok-free.dev"; 
const NOTIFY_SOUND_URL = `${BACKEND_URL}/sounds/notification-bell-sound-1-376885.mp3`;

window.test = function () {
  console.log("Test triggered manually");
  document.dispatchEvent(
    new CustomEvent("manual-test", {
      detail: {
        donate_by: "ทดสอบโดเนท",
        amount: "5,000 THB",
        donate_details: "สวัสดีครับ! โค้ดใหม่นี้มีเสียงกระดิ่งนำหน้าด้วยครับ",
        soundUrl: "", // ใส่ URL เสียงทดสอบถ้ามี
        widgetType: 0
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

  // ฟังก์ชันเล่นเสียงตามลำดับ
  function playSequence(notifyUrl, apiSoundUrl) {
    return new Promise((resolve) => {
      if (!soundEl) return resolve();

      // 1. เล่นเสียงแจ้งเตือน
      soundEl.src = notifyUrl;
      soundEl.volume = 0.6;
      
      soundEl.play()
        .then(() => {
          // เมื่อเสียงแจ้งเตือนจบ
          soundEl.onended = () => {
            if (apiSoundUrl) {
              // 2. เล่นเสียงจาก API ต่อ
              soundEl.src = apiSoundUrl;
              soundEl.volume = 1.0;
              soundEl.onended = () => resolve(); // จบเมื่อเสียงที่สองจบ
              soundEl.play().catch(e => {
                console.error("API Sound error:", e);
                resolve();
              });
            } else {
              resolve();
            }
          };
        })
        .catch(err => {
          console.error("Playback failed:", err);
          resolve();
        });
    });
  }

  async function playNext() {
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

    // เล่นเสียงแจ้งเตือน -> แล้วตามด้วยเสียงพูด
    if (soundEl) {
      await playSequence(NOTIFY_SOUND_URL, raw.soundUrl);
    }

    // รอเพิ่มอีกนิดหลังเสียงจบเพื่อให้คนอ่านข้อความทัน (เช่น 3 วินาที)
    setTimeout(() => {
      widgetEl.classList.remove("show");
      widgetEl.classList.add("hide");

      setTimeout(() => {
        widgetEl.classList.remove("hide");
        if (soundEl) {
          soundEl.src = "";
          soundEl.onended = null;
        }
        playNext();
      }, 500);
    }, 3000); 
  }

  // Socket Setup (websocket only ตามที่คุณแก้มา)
  try {
    const token = getToken();
    if (!token) return;

    const socket = io(BACKEND_URL, {
      auth: { token: token },
      transports: ['websocket'],
      upgrade: false,
      extraHeaders: { "ngrok-skip-browser-warning": "true" }
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("donationUpdate", (data) => {
      queue.push(data);
      if (!playing) playNext();
    });
  } catch (e) {
    console.warn("⚠️ Socket error", e);
  }
});