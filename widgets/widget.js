import { renderWidget } from "./renderer.js";

// ฟังก์ชันทดสอบ (Test Function)
window.test = function () {
  console.log("Test triggered manually");
  document.dispatchEvent(
    new CustomEvent("manual-test", {
      detail: {
        donate_by: "ทดสอบโดเนท",
        amount: "5,000 THB",
        donate_details: "สวัสดีครับ! โค้ดใหม่นี้จะแสดงผลจนกว่าเสียงพูดจะจบครับ ไม่ตัดก่อนแน่นอน",
        soundUrl: "", // ลองใส่ URL เสียงยาวๆ เพื่อทดสอบได้
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
  
  if (!widgetEl || !soundEl) return;

  const queue = [];
  let playing = false;
  
  const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/600/600-preview.mp3";

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

    // --- ฟังก์ชันสำหรับจบการทำงาน (ปิด Widget) ---
    const finishWidget = () => {
      // หน่วงเวลา 1 วินาทีหลังเสียงจบ เพื่อความนุ่มนวล ไม่ให้ภาพตัดทันทีที่เสียงเงียบ
      const delayBeforeClose = 1000; 

      setTimeout(() => {
        widgetEl.classList.remove("show");
        widgetEl.classList.add("hide");

        setTimeout(() => {
          widgetEl.classList.remove("hide");
          
          // เคลียร์เสียงและ Event
          soundEl.src = "";
          soundEl.onended = null;
          soundEl.onerror = null;
          
          playNext(); // เล่นคิวถัดไป
        }, 500); // รอ Animation ขาออก (fade out) 0.5s
      }, delayBeforeClose);
    };

    // --- จัดการเรื่องเสียง (Sound Logic) ---
    
    // รีเซ็ต Event เก่าทิ้ง
    soundEl.onended = null;
    soundEl.onerror = null;

    // ฟังก์ชันเล่นเสียงพูด (Main Voice)
    const playMainVoice = () => {
        soundEl.onended = null;
        soundEl.onerror = null;

        if (raw.soundUrl) {
            console.log("🔔 Bell finished, playing voice...");
            soundEl.src = raw.soundUrl;
            soundEl.volume = 0.8;
            
            // *** หัวใจสำคัญ: เมื่อเสียงพูดจบ -> เรียก finishWidget ***
            soundEl.onended = finishWidget;
            
            // ถ้าไฟล์เสียงพูดเสีย -> ให้ปิด Widget เลย (กันค้าง)
            soundEl.onerror = () => {
                console.warn("⚠️ Voice error, closing widget.");
                finishWidget();
            };

            soundEl.play().catch(err => {
                console.error("Voice playback failed:", err);
                finishWidget();
            });
        } else {
            console.log("🔔 No voice URL, showing for fixed duration.");
            // ถ้าไม่มีเสียงพูด ให้โชว์ค้างไว้ 5 วินาที แล้วค่อยปิด
            setTimeout(finishWidget, 5000);
        }
    };

    // เริ่มต้น: เล่นเสียงกระดิ่ง
    soundEl.src = NOTIFICATION_SOUND_URL;
    soundEl.volume = 0.8;

    // เมื่อกระดิ่งจบ -> ไปเล่นเสียงพูด
    soundEl.onended = playMainVoice;

    // ถ้ากระดิ่ง Error -> ข้ามไปเล่นเสียงพูดเลย
    soundEl.onerror = () => {
        console.warn("⚠️ Bell failed, skipping to voice.");
        playMainVoice();
    };

    // สั่งเล่นเสียง
    soundEl.play().catch((err) => {
        console.error("Audio autoplay blocked:", err);
        // ถ้าเล่นไม่ได้เลย ให้พยายามเล่นเสียงพูดต่อ (เผื่อ Browser ยอมใน step ถัดไป) หรือปิดไปเลย
        playMainVoice();
    });
  }

  // ส่วนของการเชื่อมต่อ Socket (Backend)
  try {
    const token = getToken();

    if (!token) {
      console.warn("No widget token found in URL");
      return;
    }
    const BACKEND_URL = "https://nery-unmedicated-juliet.ngrok-free.dev"; 

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