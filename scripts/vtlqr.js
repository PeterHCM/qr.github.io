const scanButton = document.getElementById('scanButton');
const saveButton = document.getElementById('saveButton');
const video = document.getElementById('video');
const serialInput = document.getElementById('serialNumber');
const poInput = document.getElementById('poNumber');
const modelInput = document.getElementById('modelNumber');
const historyTable = document.getElementById('historyTable');

const codeReader = new ZXing.BrowserMultiFormatReader();
let currentDeviceId;
let sttCounter = 1;

// ✅ Lấy ngày giờ hệ thống
function getCurrentDateTime() {
	const now = new Date();
	const date = now.toLocaleDateString('vi-VN');
	const time = now.toLocaleTimeString('vi-VN');
	return { date, time };
}

// ✅ Bắt đầu quét QR
async function startScanning() {
	scanButton.disabled = true;

	try {
		const devices = await codeReader.listVideoInputDevices();
		if (!devices || devices.length === 0) {
			alert("Không tìm thấy thiết bị camera.");
			scanButton.disabled = false;
			return;
		}

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
	} catch (error) {
		console.error("Lỗi khi truy cập camera:", error);
		scanButton.disabled = false;
	}
}

// ✅ Dừng camera
function stopScanning() {
	codeReader.reset();
	video.srcObject = null;
	scanButton.disabled = false;
}

// ✅ Lưu dữ liệu vào bảng và gửi lên Google Form
function saveData() {
	const po = poInput.value.trim();
	const model = modelInput.value.trim();
	const serial = serialInput.value.trim();

	if (!po || !model || !serial) {
		alert("Vui lòng nhập đầy đủ thông tin trước khi lưu.");
		return;
	}

	const { date, time } = getCurrentDateTime();

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

// ✅ Gửi dữ liệu lên Google Form
function sendToGoogleForm(po, model, date, time, serial) {
	const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfv2eU5P0e8qFU42ORx9FFshzqIC-_XVzViDnhw4fqV6bOGzg/formResponse";
	const formData = new FormData();
	formData.append("entry.2005620554", po);		 // Số PO
	formData.append("entry.1045781291", model);	// Model
	formData.append("entry.1166974658", date);	 // Ngày
	formData.append("entry.1065046570", time);	 // Giờ
	formData.append("entry.839337160", serial);	// Serial Number

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

// ✅ Sự kiện nút
scanButton.addEventListener('click', startScanning);
saveButton.addEventListener('click', saveData);

// ✅ Tự động dừng camera khi chuyển tab
document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		stopScanning();
	}
});

// ✅ Đảm bảo nút Quét luôn sẵn sàng khi tải lại
window.addEventListener("load", () => {
	scanButton.disabled = false;
});
