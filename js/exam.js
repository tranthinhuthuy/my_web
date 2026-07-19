/* ==========================================
   GOOGLE APPS SCRIPT API
========================================== */

const API =
    "https://script.google.com/macros/s/AKfycbwGD7yYHOXw7GFvIzb9qXz--O6OATQcnXVlxW0Z72HmROQYoc4a47zO8EmX1hbwr_oFXA/exec";
/* ==========================================
   GLOBAL
========================================== */
let contestData = {};
let questions = [];
let timer = null;
let remainSeconds = 0;
let duration = 30;
let submitted = false;
/* ==========================================
   DOM READY
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {
            await loadContest();
            await loadQuestions();
            /* ==========================
               Khôi phục thông tin người tham gia
            ========================== */

            if (typeof restoreCandidate === "function") {
                restoreCandidate();
            }

            /* ==========================
               Khởi tạo sự kiện
            ========================== */

            initSubmit();

        }

        catch (err) {
            console.error(err);
            showMessage(
                "Không thể tải dữ liệu cuộc thi.",
                "error"
            );

        }

    }
);

/* ==========================================
   FETCH JSON
========================================== */

async function apiGet(action) {

    const response =
        await fetch(

            API +
            "?action=" +
            action +
            "&t=" +
            Date.now(),

            {

                method: "GET",

                cache: "no-store"

            }

        );

    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );

    }

    const result =
        await response.json();

    if (!result.success) {

        throw new Error(

            result.message ||

            "Không lấy được dữ liệu."

        );

    }

    return result.data || {};

}

/* ==========================================
   LOAD THÔNG TIN CUỘC THI
========================================== */

async function loadContest() {

    contestData =
        await apiGet("contest");

    localStorage.setItem(

        "contestData",

        JSON.stringify(contestData)

    );

    /* ==========================
       TIÊU ĐỀ TRANG
    ========================== */

    document.title =
        contestData.title ||
        "Cuộc thi";

    setText(
        "contestTitle",
        contestData.title
    );

    setText(
        "contestSubtitle",
        contestData.header_subtitle
    );

    setText(
        "contestPlace",
        contestData.header_place
    );

    setText(
        "contestOrg",
        contestData.header_org
    );

    setText(
        "headerTitle",
        contestData.header_title
    );

    /* ==========================
       BANNER
    ========================== */

    const banner =
        document.getElementById(
            "contestBanner"
        );

    if (banner) {

        if (contestData.banner) {

            banner.src =
                contestData.banner;

            banner.style.display =
                "block";

        }

        else {

            banner.removeAttribute(
                "src"
            );

            banner.style.display =
                "none";

        }

    }

    /* ==========================
       CẤU HÌNH BÀI THI
    ========================== */

    duration =
        Number(
            contestData.exam_duration
        ) || 30;

    remainSeconds =
        duration * 60;

    contestData.auto_submit =

        contestData.auto_submit === true ||

        String(
            contestData.auto_submit
        ).toLowerCase() === "true" ||

        contestData.auto_submit == 1 ||

        contestData.auto_submit == "1";

    contestData.show_countdown =

        contestData.show_countdown === true ||

        String(
            contestData.show_countdown
        ).toLowerCase() === "true" ||

        contestData.show_countdown == 1 ||

        contestData.show_countdown == "1";

    contestData.allow_early_submit =

        contestData.allow_early_submit === true ||

        String(
            contestData.allow_early_submit
        ).toLowerCase() === "true" ||

        contestData.allow_early_submit == 1 ||

        contestData.allow_early_submit == "1";

    /* ==========================
       HIỂN THỊ ĐỒNG HỒ
    ========================== */

    const timerBox =
        document
            .getElementById(
                "countdown"
            )
            ?.closest(".info-box");

    if (timerBox) {

        timerBox.style.display =
            contestData.show_countdown
                ? "block"
                : "none";

    }

    /* ==========================
       NÚT NỘP BÀI
    ========================== */

    const submitBtn =
        document.getElementById(
            "submitExam"
        );

    if (submitBtn) {

        submitBtn.style.display =
            contestData.allow_early_submit
                ? "inline-flex"
                : "none";

    }

}
/* ==========================================
   HIỂN THỊ TEXT
========================================== */

function setText(id, value) {
    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }
    element.textContent =
        value || "";

}
/* ==========================================
   LOAD QUESTIONS
========================================== */

async function loadQuestions(forceReload = false) {

    try {

        console.log("Đang tải danh sách câu hỏi...");

        const data =
            await apiGet("questions");

        questions =
            Array.isArray(data)
                ? [...data]
                : [];

        console.log(
            "Đã tải",
            questions.length,
            "câu hỏi"
        );

        renderQuestions();

        return true;

    }

    catch (err) {

        console.error(err);

        questions = [];

        renderQuestions();

        showMessage(
            err.message ||
            "Không tải được danh sách câu hỏi.",
            "error"
        );

        return false;

    }

}

/* ==========================================
   HIỂN THỊ CÂU HỎI
========================================== */

function renderQuestions() {

    const box =
        document.getElementById(
            "questionContainer"
        );

    if (!box) return;

    box.innerHTML = "";

    if (!questions || questions.length === 0) {

        box.innerHTML = `
            <div class="info-box">
                <h3>📢 Thông báo</h3>
                <p>Hiện chưa có câu hỏi.</p>
            </div>
        `;

        return;

    }

    let html = "";

    questions.forEach((q, index) => {

        const inputType =
            String(q.type).trim() === "multiple"
                ? "checkbox"
                : "radio";

        html += `
            <div class="question-box">

                <h3 class="question-title">
                    Câu ${index + 1}. ${q.question || ""}
                </h3>

                <div class="answer-list">

                    <label class="answer-item">
                        <input
                            type="${inputType}"
                            name="q${index}"
                            value="A">
                        <span>A. ${q.a || ""}</span>
                    </label>

                    <label class="answer-item">
                        <input
                            type="${inputType}"
                            name="q${index}"
                            value="B">
                        <span>B. ${q.b || ""}</span>
                    </label>

                    <label class="answer-item">
                        <input
                            type="${inputType}"
                            name="q${index}"
                            value="C">
                        <span>C. ${q.c || ""}</span>
                    </label>

                    <label class="answer-item">
                        <input
                            type="${inputType}"
                            name="q${index}"
                            value="D">
                        <span>D. ${q.d || ""}</span>
                    </label>

                </div>

            </div>
        `;

    });

    box.innerHTML = html;

    console.log(
        "Đã hiển thị",
        questions.length,
        "câu hỏi."
    );

}
   
/* ==========================================
   KHỞI TẠO NÚT
========================================== */

function initSubmit() {

    const beginBtn =
        document.getElementById("beginExam");

    if (beginBtn) {

        beginBtn.addEventListener(
            "click",
            beginExam
        );

    }

    const submitBtn =
        document.getElementById("submitExam");

    if (submitBtn) {

        submitBtn.addEventListener(
            "click",
            submitExam
        );

    }

}
/* ==========================================
   KIỂM TRA NGƯỜI THAM GIA
========================================== */
function validateCandidate() {
    const fullNameEl = document.getElementById("fullName");
    const dobEl = document.getElementById("dob");
    const orgEl = document.getElementById("organization") || document.getElementById("unit");
    const phoneEl = document.getElementById("phone");
    const emailEl = document.getElementById("email");

    const fullName = fullNameEl ? fullNameEl.value.trim() : "";
    const dob = dobEl ? dobEl.value : "";
    const organization = orgEl ? orgEl.value.trim() : "";
    const phone = phoneEl ? phoneEl.value.trim() : "";
    const email = emailEl ? emailEl.value.trim() : "";

    if (!fullName) {
        showMessage(
            "Vui lòng nhập họ và tên.",
            "error"
        );
        return false;
    }

    if (!dob) {
        showMessage(
            "Vui lòng chọn ngày tháng năm sinh.",
            "error"
        );
        return false;
    }

    if (!organization) {
        showMessage(
            "Vui lòng nhập địa chỉ hoặc đơn vị.",
            "error"
        );
        return false;
    }

    // Số điện thoại nếu có thì kiểm tra
    if (
        phone &&
        !/^[0-9]{9,15}$/.test(phone)
    ) {
        showMessage(
            "Số điện thoại không hợp lệ.",
            "error"
        );
        return false;
    }

    // Email nếu có thì kiểm tra
    if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        showMessage(
            "Email không hợp lệ.",
            "error"
        );
        return false;
    }

    return true;
}
/* ==========================================
   HIỂN THỊ SECTION
========================================== */

function showSection(id) {

    const sections = [

        "participantSection",

        "examSection",

        "resultSection",

        "certificateSection"

    ];

    sections.forEach(function (sectionId) {

        const element = document.getElementById(sectionId);

        if (!element) {

            console.warn(
                "Không tìm thấy section:",
                sectionId
            );

            return;

        }

        if (sectionId === id) {

            element.style.display = "block";

            element.classList.remove("hidden");

        } else {

            element.style.display = "none";

            element.classList.add("hidden");

        }

    });

    /* ==========================
       Cuộn lên đầu section
    ========================== */

    const current = document.getElementById(id);

    if (current) {

        setTimeout(function () {

            current.scrollIntoView({

                behavior: "smooth",

                block: "start"

            });

        }, 50);

    } else {

        console.warn(
            "Section không tồn tại:",
            id
        );

    }

}
/* ==========================================
   BẮT ĐẦU LÀM BÀI
========================================== */
function beginExam() {

    if (!validateCandidate()) {

        return;

    }

    /* ==========================
       THÔNG TIN THÍ SINH
    ========================== */

    const rawDob =
        document.getElementById("dob")
            ? document.getElementById("dob").value.trim()
            : "";

    let formattedDob = "---";

    if (rawDob) {

        const parts =
            rawDob.split("-");

        if (parts.length === 3) {

            formattedDob =
                `${parts[2]}/${parts[1]}/${parts[0]}`;

        }

        else {

            formattedDob =
                rawDob;

        }

    }

    const participant = {

        fullName:
            document.getElementById("fullName").value.trim(),

        dob:
            formattedDob,

        phone:
            document.getElementById("phone").value.trim(),

        email:
            document.getElementById("email").value.trim(),

        organization:
            document.getElementById("organization").value.trim()

    };

    localStorage.setItem(

        "contestUser",

        JSON.stringify(participant)

    );

    /* ==========================
       KHỞI TẠO THỜI GIAN
    ========================== */

    remainSeconds =
        duration * 60;

    showSection(
        "examSection"
    );

    /* ==========================
       HIỆN / ẨN ĐỒNG HỒ
    ========================== */

    const timerBox =
        document
            .getElementById("countdown")
            ?.closest(".info-box");

    if (timerBox) {

        timerBox.style.display =
            contestData.show_countdown
                ? "block"
                : "none";

    }

    /* ==========================
       HIỆN / ẨN NÚT NỘP BÀI
    ========================== */

    const submitBtn =
        document.getElementById(
            "submitExam"
        );

    if (submitBtn) {

        submitBtn.style.display =
            contestData.allow_early_submit
                ? "inline-flex"
                : "none";

    }

    /* ==========================
       CHẠY ĐỒNG HỒ
    ========================== */
    if (contestData.show_countdown) {
        startCountdown();
    }

}


/* ==========================================
   ĐỒNG HỒ ĐẾM NGƯỢC
========================================== */

function startCountdown() {
    clearInterval(timer);
    updateCountdown();
    timer = setInterval(() => {
        remainSeconds--;
        updateCountdown();
        if (remainSeconds <= 0) {
            clearInterval(timer);
            remainSeconds = 0;
            updateCountdown();
            if (contestData.auto_submit) {
                autoSubmit();
            }

            else {

                showMessage(
                    "Đã hết thời gian làm bài.",
                    "warning"
                );

            }

        }

    }, 1000);

}


/* ==========================================
   CẬP NHẬT ĐỒNG HỒ
========================================== */

function updateCountdown() {

    const box =
        document.getElementById(
            "countdown"
        );

    if (!box) {
        return;

    }

    const minute =
        Math.floor(
            remainSeconds / 60
        );

    const second =
        remainSeconds % 60;

    box.textContent =
        String(minute).padStart(2, "0") +
        ":" +
        String(second).padStart(2, "0");
}
/* ==========================================
   NỘP BÀI (CHUẨN HÓA THÔNG TIN GỬI ĐI)
========================================== */
async function submitExam() {
    if (submitted) {
        return;
    }

    submitted = true;
    clearInterval(timer);

    let correct = 0;

    // CHUẨN HÓA THUẬT TOÁN CHẤM ĐIỂM (Hỗ trợ tuyệt đối cho cả Single & Multiple Choice)
    questions.forEach((q, index) => {
        // Lấy tất cả các đáp án được tích chọn của câu hỏi hiện tại
        const checkedInputs = document.querySelectorAll(
            `input[name="q${index}"]:checked`
        );

        // Chuyển đáp án người dùng chọn thành mảng chữ IN HOA, xóa khoảng trắng thừa và sắp xếp
        const userAnswerArray = Array.from(checkedInputs)
            .map(item => item.value.trim().toUpperCase())
            .filter(val => val !== "")
            .sort();

        // Chuyển đáp án đúng từ Google Sheet thành mảng chữ IN HOA, xóa khoảng trắng thừa và sắp xếp
        const correctAnswerArray = String(q.correct || "")
            .split(",")
            .map(item => item.trim().toUpperCase())
            .filter(val => val !== "")
            .sort();

        // Chuyển cả 2 mảng về dạng chuỗi không khoảng trắng để so sánh khớp tuyệt đối
        const userAnswerStr = userAnswerArray.join(",");
        const correctAnswerStr = correctAnswerArray.join(",");

        if (userAnswerStr !== "" && userAnswerStr === correctAnswerStr) {
            correct++;
        } else {
            // LOG trực quan ra Console (F12) để bạn dễ theo dõi nếu có câu bị lệch đáp án gốc
            console.log(`Câu ${index + 1} CHƯA KHỚP:`);
            console.log(`- Bạn chọn: [${userAnswerStr}]`);
            console.log(`- Đáp án đúng trên Sheet: [${correctAnswerStr}]`);
        }
    });

    const total = questions.length;
    const score = total === 0 ? 0 : Math.round(correct * 100 / total);

    // 1. Đọc dữ liệu thô từ Form đăng ký đã lưu trong trình duyệt
    const rawUser = JSON.parse(
        localStorage.getItem("contestUser") || "{}"
    );

    // LOG kiểm tra dữ liệu thực tế lưu từ Form đăng ký trên trình duyệt
    console.log("Dữ liệu Form đăng ký gốc đọc được từ localStorage:", rawUser);

    // 2. GIẢI QUYẾT LỖI KHỞI TẠO: Lấy an toàn tên cuộc thi trước khi gán vào object participant
    const currentContestTitle = String(
        rawUser.contestTitle || 
        (typeof contestData !== 'undefined' ? contestData.title : "") || 
        "Cuộc thi tìm hiểu pháp luật"
    ).trim();

    // Quét triệt để tất cả các key ngày sinh có thể được định nghĩa từ Form HTML của bạn
    const detectedDob = String(
        rawUser.dob || 
        rawUser.ngaysinh || 
        rawUser.ngaySinh || 
        rawUser.birthDate || 
        rawUser.birthday || 
        rawUser.birth_date || 
        "---"
    ).trim();

    // 3. CHUẨN HÓA ĐỒNG BỘ: Khởi tạo đối tượng gửi đi an toàn (Bảo toàn dob, organization,...)
    const participant = {
        fullName: String(rawUser.fullName || rawUser.fullname || rawUser.name || "Thí Sinh").trim(),
        dob: detectedDob, 
        organization: String(rawUser.organization || rawUser.donvi || rawUser.school || "Tự do").trim(),
        phone: String(rawUser.phone || rawUser.sdt || "").trim(),
        email: String(rawUser.email || "").trim(),
        contestTitle: currentContestTitle, 
        total: total,
        correct: correct,
        score: score,
        pass: score >= 60, // Đồng bộ 60% làm mốc đạt
        submitTime: new Date().toLocaleString("vi-VN")
    };

    // LOG kiểm tra dữ liệu chuẩn bị gửi lên Apps Script
    console.log("Dữ liệu chuẩn bị gửi lên Apps Script:", participant);

    showLoading("Đang lưu kết quả & tạo giấy chứng nhận...");

    try {
        // Gọi hàm gửi dữ liệu sang Google Sheets / Apps Script
        const result = await saveResult(participant);

        console.log("Submit Result:", result);

        // BÓC TÁCH DỮ LIỆU AN TOÀN: Ưu tiên bốc từ result.data trước, nếu không có mới dùng trực tiếp result
        const actualData = (result && result.data) ? result.data : result;

        // Trích xuất các thuộc tính chứng nhận từ kết quả đã bóc tách
        participant.certificateNo = actualData.certificateNo || actualData.certificateCode || "";
        participant.certificateCode = actualData.certificateCode || actualData.certificateNo || "";
        
        // Gán link ảnh chứng nhận và bẻ khóa Cache hoàn toàn bằng tham số thời gian thực (?v=...)
        let rawCertUrl = actualData.certificateUrl || "";
        if (rawCertUrl && !rawCertUrl.includes("&v=")) {
            rawCertUrl = rawCertUrl + (rawCertUrl.includes("?") ? "&" : "?") + "v=" + new Date().getTime();
        }
        participant.certificateUrl = rawCertUrl;
        
        participant.slideId = actualData.slideId || "";
        participant.slideUrl = actualData.slideUrl || "";
        participant.result = actualData.result || "";
        participant.pass = actualData.pass ?? participant.pass;
        participant.submitTime = actualData.submitTime || participant.submitTime;

        // Đồng bộ lưu trữ vào cả hai khóa lưu tạm để các hàm tải ảnh luôn đọc đúng thông tin mới nhất
        localStorage.setItem(
            "currentParticipant",
            JSON.stringify(participant)
        );
        localStorage.setItem(
            "contestUser",
            JSON.stringify(participant)
        );
        localStorage.setItem("certificateUrl", participant.certificateUrl);

        clearDraft();
        showResult(participant);

    } catch (err) {
        console.error("Submit Exam Error:", err);
        submitted = false;

        showMessage(
            err.message || "Không lưu được kết quả.",
            "error"
        );
    } finally {
        hideLoading();
    }
}
/* ==========================================
   HIỂN THỊ KẾT QUẢ
========================================== */

function showResult(data) {

    if (!data || typeof data !== "object") {

        console.error(
            "Dữ liệu kết quả không hợp lệ:",
            data
        );

        showMessage(
            "Không thể hiển thị kết quả.",
            "error"
        );

        return;

    }

    showSection(
        "resultSection"
    );

    const correct =
        Number(data.correct) || 0;

    const score =
        Number(data.score) || 0;

    const pass =
        Boolean(data.pass);

    setText(
        "correctCount",
        correct
    );

    setText(
        "score",
        score + "%"
    );

    let rank =
        "Không đạt";

    if (score >= 90) {

        rank = "Xuất sắc";

    }
    else if (score >= 80) {

        rank = "Giỏi";

    }
    else if (score >= 70) {

        rank = "Đạt";

    }

    setText(
        "rank",
        rank
    );

    /* ==========================
       LƯU KẾT QUẢ MỚI NHẤT
    ========================== */

    try {

        localStorage.setItem(
            "currentParticipant",
            JSON.stringify(data)
        );

    }

    catch (err) {

        console.error(
            "Không thể lưu kết quả:",
            err
        );

    }

    /* ==========================
       NÚT XEM GIẤY CHỨNG NHẬN
    ========================== */

    const viewBtn =
        document.getElementById(
            "viewCertificate"
        );

    if (viewBtn) {

        viewBtn.style.display =
            pass
                ? "inline-block"
                : "none";

        viewBtn.disabled =
            !pass;

    }

    /* ==========================
       NÚT TẢI GIẤY CHỨNG NHẬN
    ========================== */

    const downloadBtn =
        document.getElementById(
            "downloadCertificate"
        );

    if (downloadBtn) {

        downloadBtn.style.display =
            pass
                ? "inline-block"
                : "none";
        downloadBtn.disabled =
            !pass;

    }

}

/* ==========================================
   XEM GIẤY CHỨNG NHẬN
========================================== */
function showCertificate() {
    const participant = JSON.parse(
        localStorage.getItem("currentParticipant") ||
        localStorage.getItem("contestUser") ||
        "{}"
    );

    if (!participant.fullName) {
        showMessage(
            "Không tìm thấy thông tin người dự thi.",
            "error"
        );
        return;
    }

    let certificateUrl = String(
        participant.certificateUrl ||
        localStorage.getItem("certificateUrl") ||
        ""
    ).trim();

    if (!certificateUrl) {
        showMessage(
            "Giấy chứng nhận chưa được tạo.",
            "error"
        );
        return;
    }

    // Nếu dữ liệu trả về đã là Base64 (Ảnh vật lý trực tiếp), dựng ảnh xem nhanh
    if (certificateUrl.startsWith("data:image")) {
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(
                `<title>Giay chung nhan - ${participant.fullName}</title>` +
                `<body style="margin:0; display:flex; justify-content:center; align-items:center; background:#525659;">` +
                `<img src="${certificateUrl}" style="max-width:100%; max-height:100vh; box-shadow: 0 4px 8px rgba(0,0,0,0.3);" />` +
                `</body>`
            );
            newWindow.document.close();
        } else {
            showMessage("Vui lòng cho phép trình duyệt mở cửa sổ bật lên (popup) để xem.", "warning");
        }
        return;
    }

    /* ==========================
       LINK GOOGLE SLIDES
    ========================== */
    if (certificateUrl.includes("docs.google.com/presentation")) {
        const match = certificateUrl.match(/presentation\/d\/([^/]+)/);
        if (match) {
            // Thêm mã chống cache thời gian thực để hiển thị bản đã chèn chữ mới nhất
            certificateUrl = `https://docs.google.com/presentation/d/${match[1]}/preview?v=${new Date().getTime()}`;
        }
    }

    window.open(
        certificateUrl,
        "_blank",
        "noopener,noreferrer"
    );
}

/* ==========================================
   CHUYỂN LINK CHỨNG NHẬN -> ẢNH
========================================== */
function getCertificateImage(url) {
    if (!url) {
        return "";
    }

    url = String(url).trim();

    // Nếu đã là chuỗi ảnh Base64 hoặc đuôi mở rộng định dạng ảnh tiêu chuẩn
    if (
        /\.(png|jpg|jpeg|webp)$/i.test(url) ||
        url.startsWith("data:image")
    ) {
        return url;
    }

    // Link Google Drive vật lý
    if (url.includes("/file/d/")) {
        const id = url.match(/\/file\/d\/([^/]+)/);
        if (id) {
            return `https://drive.google.com/uc?export=download&id=${id[1]}&v=${new Date().getTime()}`;
        }
    }

    // Link Google Slides export
    if (url.includes("docs.google.com/presentation")) {
        const match = url.match(/presentation\/d\/([^/]+)/);
        if (match) {
            // Thêm dấu thời gian v=... để bắt Google Slides vẽ ảnh mới từ slide có chữ
            return `https://docs.google.com/presentation/d/${match[1]}/export/png?pageid=p&v=${new Date().getTime()}`;
        }
    }

    return url;
}

/* ==========================================
   TẢI GIẤY CHỨNG NHẬN
========================================== */

async function downloadCertificate() {

    const participant = JSON.parse(

        localStorage.getItem("currentParticipant") ||

        localStorage.getItem("contestUser") ||

        "{}"

    );

    const rawUrl =

        participant.certificateUrl ||

        localStorage.getItem("certificateUrl") ||

        "";

    const imageUrl =
        getCertificateImage(rawUrl);

    if (!imageUrl) {

        showMessage(
            "Không tìm thấy giấy chứng nhận.",
            "error"
        );

        return;

    }

    if (typeof showLoading === "function") {

        showLoading(
            "Đang chuẩn bị tải giấy chứng nhận..."
        );

    }

    try {

        let downloadUrl = imageUrl;

        let ext = "png";

        /* ==========================
           BASE64
        ========================== */

        if (imageUrl.startsWith("data:image")) {

            const type = imageUrl.match(
                /^data:image\/([^;]+)/
            );

            if (type && type[1]) {

                ext =
                    type[1] === "jpeg"
                        ? "jpg"
                        : type[1];

            }

        }

        /* ==========================
           URL THÔNG THƯỜNG
        ========================== */

        else {

            if (
                imageUrl.includes(
                    "docs.google.com/presentation"
                )
            ) {

                ext = "png";

            }

            else {

                try {

                    const response =
                        await fetch(imageUrl);

                    if (response.ok) {

                        const blob =
                            await response.blob();

                        ext =
                            blob.type.indexOf("jpeg") >= 0
                                ? "jpg"
                                : "png";

                        downloadUrl =
                            URL.createObjectURL(blob);

                    }

                }

                catch (e) {

                    console.warn(
                        "Fetch thất bại, dùng URL trực tiếp."
                    );

                    downloadUrl =
                        imageUrl;

                }

            }

        }

        /* ==========================
           TÊN FILE
        ========================== */
        const fileName =
            "GCN_" +
            (participant.fullName || "ThiSinh")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\w\s]/g, "")
                .trim()
                .replace(/\s+/g, "_")

            +

            "." +

            ext;

        const a =
            document.createElement("a");

        a.href =
            downloadUrl;

        a.download =
            fileName;
        a.target =
            "_blank";
        document.body.appendChild(a);
        a.click();
        a.remove();
        if (
            downloadUrl.startsWith("blob:")
        ) {

            setTimeout(function () {
                URL.revokeObjectURL(
                    downloadUrl
                );
            }, 3000);

        }

    }

    catch (err) {

        console.error(err);
        window.open(
            imageUrl,
            "_blank"
        );

        showMessage(
            "Đã mở giấy chứng nhận ở tab mới. Nếu trình duyệt không tự tải, hãy nhấp chuột phải vào ảnh và chọn 'Lưu hình ảnh'.",
            "warning"
        );

    }

    finally {

        if (
            typeof hideLoading ===
            "function"
        ) {
            hideLoading();
        }

    }

}

/* ==========================================
   TƯƠNG THÍCH (KHÔNG CÒN DÙNG CANVAS)
========================================== */
function generateCertificate() {
    showCertificate();
}

/* ==========================================
   LƯU KẾT QUẢ (BẢN CHUẨN TRÁNH PREFLIGHT CORS)
========================================== */
async function saveResult(participant) {

    // Đóng gói dữ liệu dạng JSON gửi đi (Đồng bộ bổ sung thuộc tính dob và contestTitle)
    const payload = {
        action: "submitExam",
        fullName: participant.fullName || "",
        dob: participant.dob || "", 
        organization: participant.organization || "",
        phone: participant.phone || "",
        email: participant.email || "",
        contestTitle: participant.contestTitle || (typeof contestData !== 'undefined' ? contestData.title : "") || "",
        total: participant.total || 0,
        correct: participant.correct || 0,
        score: participant.score || 0
    };

    // Gọi trực tiếp đến API gốc, KHÔNG THÊM tham số thời gian (?t=...) để tránh lỗi Preflight OPTIONS
    const response = await fetch(API, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8" // Bắt buộc để tránh CORS
        },
        redirect: "follow",
        body: JSON.stringify(payload)
    });

    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );

    }

    const text = await response.text();

    console.log("HTTP Status:", response.status);
    console.log("Raw Response:", text);

    let result;

    try {

        result = JSON.parse(text);

    } catch (err) {

        throw new Error(
            "Response không phải JSON:\n" + text
        );

    }

    console.log("Parsed Result:", result);

    if (!result.success) {

        throw new Error(
            result.message ||
            "Không lưu được kết quả."
        );

    }

    return result.data || {};

}
/* ==========================================
   AUTO SUBMIT
========================================== */

function autoSubmit() {

    if (submitted) {

        return;

    }

    showMessage(
        "Đã hết thời gian làm bài.",
        "warning"
    );

    submitExam();

}

/* ==========================================
   THÔNG BÁO
========================================== */

function showMessage(
    message,
    type = "success"
) {

    const box =
        document.getElementById("messageBox");

    const text =
        document.getElementById("messageText");

    if (!box || !text) {

        alert(message);

        return;

    }

    text.textContent = message;

    box.className =
        "info-box " + type;

    box.style.display = "block";

    clearTimeout(box.hideTimer);

    box.hideTimer = setTimeout(() => {

        box.style.display = "none";

    }, 3000);

}

/* ==========================================
   LOADING
========================================== */

function showLoading(
    message = "Đang xử lý..."
) {

    let loading =
        document.getElementById(
            "loadingOverlay"
        );

    if (!loading) {

        loading =
            document.createElement("div");

        loading.id =
            "loadingOverlay";

        loading.innerHTML =
            `<div class="loading-box">${message}</div>`;

        Object.assign(
            loading.style,
            {
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: "99999"
            }
        );

        document.body.appendChild(
            loading
        );

    }

    loading.firstElementChild.textContent =
        message;

    loading.style.display = "flex";

}

/* ==========================================
   ẨN LOADING
========================================== */

function hideLoading() {

    const loading =
        document.getElementById(
            "loadingOverlay"
        );

    if (loading) {

        loading.style.display =
            "none";

    }

}

/* ==========================================
   LƯU NHÁP
========================================== */

function saveDraft() {

    if (submitted) {
        return;
    }

    const draft = {

        remainSeconds: remainSeconds,

        answers: {}

    };

    questions.forEach((q, index) => {

        const checkedInputs = document.querySelectorAll(
            `input[name="q${index}"]:checked`
        );

        if (checkedInputs.length > 0) {

            draft.answers[index] = Array.from(checkedInputs).map(
                item => item.value
            );

        }

    });

    localStorage.setItem(
        "examDraft",
        JSON.stringify(draft)
    );

}

/* ==========================================
   KHÔI PHỤC NHÁP
========================================== */

function restoreDraft() {

    const cache = localStorage.getItem("examDraft");

    if (!cache) {
        return;
    }

    try {

        const draft = JSON.parse(cache);

        remainSeconds =

            Number(draft.remainSeconds) ||

            duration * 60;

        Object.entries(draft.answers || {}).forEach(

            ([index, values]) => {

                if (!Array.isArray(values)) {

                    values = [values];

                }

                values.forEach(value => {

                    const input = document.querySelector(

                        `input[name="q${index}"][value="${value}"]`

                    );

                    if (input) {

                        input.checked = true;

                    }

                });

            }

        );

        updateCountdown();

    }

    catch (err) {

        console.error(
            "Lỗi khôi phục bài làm:",
            err
        );

    }

}

/* ==========================================
   XÓA NHÁP
========================================== */

function clearDraft() {

    localStorage.removeItem(
        "examDraft"
    );

}

/* ==========================================
   KHÓA BÀI THI
========================================== */

function disableExam() {

    document
        .querySelectorAll(
            'input[type="radio"]'
        )
        .forEach(item => {

            item.disabled = true;

        });

    const btn =
        document.getElementById(
            "submitExam"
        );

    if (btn) {

        btn.disabled = true;

    }

}

/* ==========================================
   KẾT THÚC
========================================== */

function finishExam() {

    clearDraft();

    localStorage.removeItem(
        "contestUser"
    );

    localStorage.removeItem(
        "currentParticipant"
    );

    location.href =
        "index.html";

}

/* ==========================================
   TỰ ĐỘNG LƯU
========================================== */

setInterval(() => {

    const exam =
        document.getElementById(
            "examSection"
        );

    if (
        exam &&
        exam.style.display === "block"
    ) {

        saveDraft();

    }

}, 3000);

/* ==========================================
   SỰ KIỆN
========================================== */

window.addEventListener(
    "beforeunload",
    function (e) {

        clearInterval(timer);

        const exam =
            document.getElementById(
                "examSection"
            );

        if (
            exam &&
            exam.style.display === "block" &&
            !submitted
        ) {
            saveDraft();
            e.preventDefault();
            e.returnValue = "";
        }
    }
);

document.addEventListener(
    "keydown",
    function (e) {

        if (e.key === "Escape") {
            hideLoading();
        }
        if (e.key === "F5") {
            saveDraft();
        }
    }
);