import { renderWidget } from "./renderer.js";

window.test = function () {
  console.log("Test triggered manually");
  document.dispatchEvent(
    new CustomEvent("manual-test", {
      detail: {
        donate_by: "ทดสอบโดเนท",
        amount: "5,000 THB",
        donate_details: "สวัสดีครับ! โค้ดใหม่นี้ต้องใหญ่และอยู่กลางจอแน่นอนครับ",
        soundUrl: "", // ใส่ URL เสียงพูดทดสอบที่นี่ถ้าต้องการ
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
  
  // URL ของเสียงแจ้งเตือน (กระดิ่ง)
  const NOTIFICATION_SOUND_URL = "https://setsuko-knotless-boyishly.ngrok-free.dev/sounds/notification-bell-sound-1-376885.mp3";

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

    // --- ส่วนที่แก้ไข: เล่นเสียงกระดิ่งก่อน แล้วค่อยเล่นเสียงพูด ---
    
    const bellAudio = new Audio(NOTIFICATION_SOUND_URL);
    bellAudio.volume = 0.8; // ปรับความดังเสียงกระดิ่ง (0.0 - 1.0)

    // ฟังก์ชันสำหรับเล่นเสียงพูดหลัก (แยกออกมาเพื่อเรียกใช้ต่อจากกระดิ่ง)
    const playMainSound = () => {
        if (raw.soundUrl && soundEl) {
            soundEl.src = raw.soundUrl;
            soundEl.volume = 0.8;
      
            soundEl
              .play()
              .then(() => console.log("Playing main voice sound..."))
              .catch((err) => console.error("Audio playback failed:", err));
          }
    };

    // สั่งเล่นเสียงกระดิ่ง
    bellAudio.play()
        .then(() => {
            console.log("Playing notification bell...");
        })
        .catch((err) => {
            console.error("Bell playback failed:", err);
            // ถ้ากระดิ่ง error ให้ข้ามไปเล่นเสียงพูดเลย
            playMainSound(); 
        });

    // เมื่อเสียงกระดิ่งจบ ให้เล่นเสียงพูดต่อทันที
    bellAudio.onended = () => {
        playMainSound();
    };

    // -------------------------------------------------------

    setTimeout(() => {
      widgetEl.classList.remove("show");
      widgetEl.classList.add("hide");

      setTimeout(() => {
        widgetEl.classList.remove("hide");
        if (soundEl) soundEl.src = "";
        playNext();
      }, 500);
    }, 8000); // 8 วินาที (ระวัง: ถ้าเสียงพูดยาวกว่า 8 วิ อาจจะถูกตัดจบก่อน)
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
      transports: ['websocket'],
      upgrade: false,
      extraHeaders: {
        "ngrok-skip-browser-warning": "true"
      }
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