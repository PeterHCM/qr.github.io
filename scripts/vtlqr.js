const video = document.getElementById('video');
const historyTable = document.getElementById('historyTable');
const codeReader = new ZXing.BrowserMultiFormatReader();
let sttCounter = 1;
let scanning = false;

const modelDescriptions = {
  "TP48-I-NDI": "Thiết bị chống sét MTL TP48-I-NDI",
  "SD32X": "Thiết bị chống sét MTL SD32X",
  "SD32T3": "Thiết bị chống sét MTL SD32T3",
  "SLP32D": "Thiết bị chống sét MTL SLP32D",
  "MTL7728+": "Module tín hiệu MTL7728+",
  "MTL5541": "Module tín hiệu MTL5541",
  "MTL5532": "Module tín hiệu MTL5532",
  "MTL5531": "Module tín hiệu MTL5531",
  "ZB24567": "Thiết bị chống sét MTL ZB24567"
};

function getCurrentDateTime() {
  const now = new Date();
  return {
    date: now.toLocaleDateString('vi-VN'),
    time: now.toLocaleTimeString('vi-VN')
  };
}

function stopScanning() {
  codeReader.reset();
  video.srcObject = null;
  scanning = false;
}

function sendToGoogleForm(po, model, date, time, serial) {
  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfv2eU5P0e8qFU42ORx9FFshzqIC-_XVzViDnhw4fqV6bOGzg/formResponse";
  const formData = new FormData();
  formData.append("entry.2005620554", po);
  formData.append("entry.1045781291", model);
  formData.append("entry.1166974658", date);
  formData.append("entry.1065046570", time);
  formData.append("entry.839337160", serial);

  fetch(formURL, {
    method: "POST",
    mode: "no-cors",
    body: formData
  }).then(() => {
    console.log("✅ Đã gửi dữ liệu lên Google Form");
  }).catch(err => {
    console.error("❌ Lỗi gửi dữ liệu:", err);
  });
}

function saveToTable(po, model, serial, date, time) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${sttCounter++}</td>
    <td>${po}</td>
    <td>${model}</td>
    <td>${serial}</td>
    <td>${date}</td>
    <td>${time}</td>
  `;
  historyTable.appendChild(row);
}

function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  oscillator.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.2);
}

function vibrateDevice() {
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
}

async function scanToInput(targetInput, button) {
  if (scanning) {
    stopScanning();
    button.textContent = "📷";
    return;
  }

  scanning = true;
  button.textContent = "⏹";

  try {
    codeReader.decodeFromVideoDevice(null, video, (result, err) => {
      if (result) {
        targetInput.value = result.getText();
        console.log("✅ Đã quét:", result.getText());

        playBeep();
        vibrateDevice();

        stopScanning();
        button.textContent = "📷";
      }
      if (err && !(err instanceof ZXing.NotFoundException)) {
        console.error("❌ Lỗi khi quét:", err);
      }
    });
  } catch (error) {
    console.error("❌ Lỗi truy cập camera:", error);
    alert("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
    scanning = false;
    button.textContent = "📷";
  }
}

window.addEventListener("load", () => {
  const poInput = document.querySelector(".poInput");
  const modelInput = document.querySelector(".modelInput");
  const descriptionInput = document.querySelector(".descriptionInput");
  const serialInput = document.querySelector(".serialInput");

  modelInput.addEventListener("input", () => {
    const model = modelInput.value.trim();
    descriptionInput.value = modelDescriptions[model] || "Vui lòng nhập mô tả";
  });

  document.querySelector(".scanPO").addEventListener("click", function () {
    scanToInput(poInput, this);
  });

  document.querySelector(".scanModel").addEventListener("click", function () {
    scanToInput(modelInput, this);
  });

  document.querySelector(".scanDescription").addEventListener("click", function () {
    scanToInput(descriptionInput, this);
  });

  document.querySelector(".scanSerial").addEventListener("click", function () {
    scanToInput(serialInput, this);
  });
 
  document.querySelector(".saveBtn").addEventListener("click", () => {
  const po = poInput.value.trim();
  const model = modelInput.value.trim();
  const serial = serialInput.value.trim();

  if (!po || !model || !serial) {
    alert("Vui lòng nhập đầy đủ thông tin trước khi lưu.");
    return;
  }

  const { date, time } = getCurrentDateTime();
  sendToGoogleForm(po, model, date, time, serial);
  saveToTable(po, model, serial, date, time);

  // ✅ Dừng camera sau khi lưu
  stopScanning();

  // ✅ Reset Serial để chuẩn bị quét tiếp
  serialInput.value = "";
});
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopScanning();
  }
});
