import { renderWidget } from "./renderer.js";

// ฟังก์ชันทดสอบ (Test Function)
window.test = function () {
  console.log("Test triggered manually");
  document.dispatchEvent(
    new CustomEvent("manual-test", {
      detail: {
        donate_by: "ทดสอบโดเนท",
        amount: "5,000 THB",
        donate_details: "สวัสดีครับ! โค้ดใหม่นี้ต้องใหญ่และอยู่กลางจอแน่นอนครับ",
        soundUrl: "", // ใส่ URL เสียงพูดทดสอบที่นี่ถ้าต้องการ (ถ้าว่างไว้จะเล่นแค่กระดิ่ง)
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
  const soundEl = document.getElementById("sound"); // ใช้อ element นี้ตัวเดียวในการเล่นเสียง
  
  if (!widgetEl || !soundEl) return;

  const queue = [];
  let playing = false;
  
  // URL ของเสียงแจ้งเตือน (กระดิ่ง)
  // หมายเหตุ: ตรวจสอบให้แน่ใจว่าลิงก์นี้เข้าถึงได้ตลอด (ไม่ติดหน้า Warning ของ ngrok)
  const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

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

    // 1. สร้าง HTML Widget
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

    // 2. จัดการเรื่องเสียง (Sound Logic)
    
    // รีเซ็ต Event เก่าทิ้งก่อน เพื่อป้องกันการทำงานซ้ำซ้อน
    soundEl.onended = null;
    soundEl.onerror = null;

    // ฟังก์ชันย่อย: สำหรับเล่นเสียงพูด (TTS) หลังจากกระดิ่งจบ
    const playMainVoice = () => {
        // ล้าง onended ออก เพื่อไม่ให้วนลูป
        soundEl.onended = null;
        soundEl.onerror = null;

        if (raw.soundUrl) {
            console.log("🔔 Bell finished, playing voice...");
            soundEl.src = raw.soundUrl;
            soundEl.volume = 0.8;
            soundEl.play().catch(err => console.error("Voice playback failed:", err));
        } else {
            console.log("🔔 Bell finished, no voice URL provided.");
        }
    };

    // เริ่มต้น: ตั้งค่าให้เล่นเสียงกระดิ่งก่อน
    soundEl.src = NOTIFICATION_SOUND_URL;
    soundEl.volume = 0.8;

    // เมื่อกระดิ่งเล่นจบ -> ให้เรียก playMainVoice
    soundEl.onended = playMainVoice;

    // กรณีฉุกเฉิน: ถ้ากระดิ่ง Error (เช่น ลิงก์เสีย) -> ให้ข้ามไปเล่นเสียงพูดเลย อย่าเงียบ
    soundEl.onerror = () => {
        console.warn("⚠️ Bell sound failed to load, skipping to voice.");
        playMainVoice();
    };

    // สั่งเล่นเสียง (เริ่มที่กระดิ่ง)
    soundEl.play().catch((err) => {
        console.error("Audio playback error (Autoplay blocked?):", err);
        // ถ้าสั่งเล่นไม่ได้เลย ให้ลองข้ามไปสเต็ปเสียงพูดเผื่อฟลุ๊ค
        playMainVoice();
    });

    // 3. ตั้งเวลาปิด Widget
    setTimeout(() => {
      widgetEl.classList.remove("show");
      widgetEl.classList.add("hide");

      setTimeout(() => {
        widgetEl.classList.remove("hide");
        
        // เคลียร์เสียงเมื่อจบการทำงานรอบนี้
        soundEl.src = "";
        soundEl.onended = null;
        soundEl.onerror = null;
        
        playNext();
      }, 500);
    }, 8000); // แสดงผล 8 วินาที
  }

  // ส่วนของการเชื่อมต่อ Socket (Backend)
  try {
    const token = getToken();

    if (!token) {
      console.warn("No widget token found in URL");
      return;
    }
    const BACKEND_URL = "https://setsuko-knotless-boyishly.ngrok-free.dev"; 

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