const scanButton = document.getElementById('scanButton');
const saveButton = document.getElementById('saveButton');
const video = document.getElementById('video');
const serialInput = document.getElementById('serialNumber');
const poInput = document.getElementById('poNumber');
const modelInput = document.getElementById('modelNumber');
const dateInput = new Date();
const timeInput = new Date();
const historyTable = document.getElementById('historyTable');

const codeReader = new ZXing.BrowserMultiFormatReader();
let currentDeviceId;
let sttCounter = 1;

// Cập nhật ngày giờ hiện tại
function updateDateTime() {
  const now = new Date();
  dateInput.value = now.toLocaleDateString('vi-VN');
  timeInput.value = now.toLocaleTimeString('vi-VN');
}

// Hàm quét QR
async function startScanning() {
  updateDateTime();
  scanButton.disabled = true;

  const devices = await codeReader.listVideoInputDevices();
  const backCam = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0];
  currentDeviceId = backCam.deviceId;

  codeReader.decodeFromVideoDevice(currentDeviceId, video, (result, err) => {
    if (result) {
      serialInput.value = result.getText();
      stopScanning();
      saveData(); // Tự động lưu sau khi quét
    }
    if (err && !(err instanceof ZXing.NotFoundException)) {
      console.error(err);
    }
  });
}

// Dừng camera
function stopScanning() {
  codeReader.reset();
  video.srcObject = null;
  scanButton.disabled = false;
}

// Lưu dữ liệu vào bảng
function saveData() {
  const po = poInput.value.trim();
  const model = modelInput.value.trim();
  const serial  = serialNumber.value.trim();
  const date = dateInput.value;
  const time = timeInput.value;

  if (!po || !model || !serialInput.value) {
    alert("Vui lòng nhập đầy đủ thông tin trước khi lưu.");
    return;
  }
	sendToGoogleForm(po, model, date, time, serial);
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

// Sự kiện
scanButton.addEventListener('click', startScanning);
saveButton.addEventListener('click', () => {
  updateDateTime();
  saveData();
});
// Luu Google Form
function sendToGoogleForm(po, model, date, time, serial) {
  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfv2eU5P0e8qFU42ORx9FFshzqIC-_XVzViDnhw4fqV6bOGzg/formResponse";

  const formData = new FormData();
  formData.append("entry.2005620554", po);     // Số PO
  formData.append("entry.1045781291", model);  // Model
  formData.append("entry.1166974658", date);   // Ngày
  formData.append("entry.1065046570", time);   // Giờ
  formData.append("entry.839337160", serial);  // Serial Number

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
