// main.js
// โปรแกรมควบคุมการทำงานหลักของ index.html
// โดย lekgis

// รอให้ DOM โหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', function () {
    console.log("✅ main.js เริ่มทำงาน");

    // --- 1. ตั้งค่าการตรวจจับคลิกปุ่ม "1.1 เปิด ltaxOnline" ---
    // ใช้ Event Delegation เพราะปุ่มถูกสร้างโดย JavaScript
    document.addEventListener('click', function(e) {
        // ตรวจสอบว่าคลิกที่ปุ่มที่มี scriptName="open_ltaxOnline"
        if (e.target.matches('button[scriptName="open_ltaxOnline"]')) {
            console.log('ปุ่ม "1.1 เปิด ltaxOnline" ถูกคลิก');

            // ตั้งเวลา 5 วินาที ก่อนสลับแท็บ
            setTimeout(function() {
                const mapTabButton = document.getElementById('tab_map_program');
                if (mapTabButton) {
                    mapTabButton.click(); // จำลองการคลิกแท็บแผนที่
                    console.log('สลับไปยังแท็บ "แผนที่" เรียบร้อย');
                } else {
                    console.error('❌ ไม่พบแท็บแผนที่ (id: tab_map_program)');
                }
            }, 5000); // 5 วินาที
        }
    });

    // --- 2. ตั้งค่าการรับข้อมูลจาก Flask ผ่าน SSE (Server-Sent Events) ---
    try {
        const eventSource = new EventSource('/listen_parcel_id');
        console.log("✅ เปิดการเชื่อมต่อ SSE ไปยัง /listen_parcel_id");

        eventSource.onmessage = function(event) {
            console.log('🟢 ได้รับข้อมูลจาก Flask:', event.data);

            let data;
            try {
                data = JSON.parse(event.data);
            } catch (err) {
                console.error('❌ ไม่สามารถแปลงข้อมูลจาก Flask เป็น JSON:', err);
                return;
            }

            const parcel_id = data.parcel_id;
            if (parcel_id) {
                console.log(`🎉 พบรหัสแปลง: ${parcel_id}`);

                // ส่งไปยัง iframe ของแผนที่ผ่าน postMessage
                const mapFrame = document.getElementById('map-iframe');
                if (mapFrame && mapFrame.contentWindow) {
                    console.log('🟡 ส่งรหัสแปลงไปยัง map.html:', parcel_id);
                    mapFrame.contentWindow.postMessage({
                        type: 'ZOOM_TO_PARCEL',
                        parcel_id: parcel_id
                    }, 'http://localhost:3000'); // ต้องตรงกับ origin ของ Flask
                } else {
                    console.error('🔴 ไม่พบ iframe #map-iframe หรือ contentWindow');
                }

                // ล้าง parcel_id ที่เก็บใน Flask เพื่อป้องกันการส่งซ้ำ
                fetch('/clear_parcel_id', { method: 'POST' })
                    .then(res => {
                        if (!res.ok) console.warn('⚠️ ล้าง parcel_id ไม่สำเร็จ');
                    })
                    .catch(err => console.error('❌ ไม่สามารถล้าง parcel_id ได้:', err));
            }
        };

        eventSource.onerror = function(e) {
            console.error('🔴 เกิดข้อผิดพลาดกับ SSE:', e);
            // ไม่ต้องปิดด้วยตนเอง เบราว์เซอร์จะลอง reconnect อัตโนมัติ
        };
    } catch (err) {
        console.error('❌ ไม่สามารถเปิดการเชื่อมต่อ SSE ได้:', err);
    }

});