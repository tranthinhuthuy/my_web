/* ==========================================
   GOOGLE APPS SCRIPT API
========================================== */

const API =
    "https://script.google.com/macros/s/AKfycbwGD7yYHOXw7GFvIzb9qXz--O6OATQcnXVlxW0Z72HmROQYoc4a47zO8EmX1hbwr_oFXA/exec";

const DEFAULT_BANNER ="";
const DEFAULT_CERTIFICATE = "";

/* ==========================================
   CACHE
========================================== */

let contestCache = null;
let isLoading = false;
let currentBannerPreview = null;
let currentCertificatePreview = null;

/* ==========================================
   DOM READY
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ==========================
       FORM
    ========================== */

    const form =
        document.getElementById(
            "contestForm"
        );

    if (form) {

        form.addEventListener(
            "submit",
            saveContest
        );

        form.addEventListener(
            "reset",
            resetPreview
        );

    }

    /* ==========================
       Banner
    ========================== */

    const bannerFile =
        document.getElementById(
            "bannerFile"
        );

    if (bannerFile) {

        bannerFile.addEventListener(
            "change",
            previewBanner
        );

    }

    /* ==========================
       Link giấy chứng nhận
    ========================== */

    const certificateInput =
        document.getElementById(
            "certificateTemplate"
        );

    const certificatePreview =
        document.getElementById(
            "certificatePreview"
        );

    const certificatePlaceholder =
        document.getElementById(
            "certificatePlaceholder"
        );

    if (certificateInput) {

        certificateInput.addEventListener(
            "input",
            previewCertificateLink
        );

    }

    // Hiển thị nếu đã có link lưu trước đó
    if (
        certificateInput &&
        certificateInput.value.trim()
    ) {

        previewCertificateLink();

    } else {

        if (certificatePreview) {

            certificatePreview.removeAttribute(
                "href"
            );

            certificatePreview.style.display =
                "none";

        }

        if (certificatePlaceholder) {

            certificatePlaceholder.style.display =
                "block";

        }

    }

    /* ==========================
       Import Excel
    ========================== */

    const excel =
        document.getElementById(
            "excelFile"
        );

    if (excel) {

        excel.addEventListener(
            "change",
            importQuestions
        );

    }

    /* ==========================
       Load dữ liệu cuộc thi
    ========================== */

    loadContest();

});

/* ==========================================
   XEM TRƯỚC LINK GIẤY CHỨNG NHẬN
========================================== */

function previewCertificateLink() {

    const input =
        document.getElementById(
            "certificateTemplate"
        );

    const preview =
        document.getElementById(
            "certificatePreview"
        );

    const placeholder =
        document.getElementById(
            "certificatePlaceholder"
        );

    if (!input || !preview) return;

    const url = input.value.trim();

    if (!url) {

        preview.style.display = "none";
        preview.removeAttribute("href");

        if (placeholder) {
            placeholder.style.display = "block";
        }

        return;

    }

    preview.href = url;
    preview.textContent = "📄 Mở mẫu giấy chứng nhận";
    preview.style.display = "inline-block";

    if (placeholder) {
        placeholder.style.display = "none";
    }

}

/* ==========================================
   FORMAT DATETIME
========================================== */

function toDatetimeLocal(date) {

    if (!date) return "";

    const d =
        new Date(date);

    if (isNaN(d)) {

        return "";

    }

    d.setMinutes(

        d.getMinutes() -

        d.getTimezoneOffset()

    );

    return d
        .toISOString()
        .slice(0, 16);

}

/* ==========================================
   FILE TO BASE64
========================================== */

function fileToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader =
            new FileReader();

        reader.onload =
            () => resolve(reader.result);

        reader.onerror =
            reject;

        reader.readAsDataURL(file);

    });

}

/* ==========================================
   RESET PREVIEW
========================================== */

function resetPreview() {

    const banner =
        document.getElementById(
            "previewImage"
        );

    if (banner) {

        banner.src =
            contestCache?.banner ||
            DEFAULT_BANNER;

    }

    const certificate =
        document.getElementById(
            "certificatePreview"
        );

    if (certificate) {

        certificate.src =
            contestCache?.certificate_template ||
            DEFAULT_CERTIFICATE;

    }

}

/* ==========================================
   PREVIEW BANNER
========================================== */

function previewBanner() {

    const input =
        document.getElementById(
            "bannerFile"
        );

    const preview =
        document.getElementById(
            "previewImage"
        );

    if (!input || !preview) return;

    const file =
        input.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

        alert("Vui lòng chọn file ảnh.");

        input.value = "";

        return;

    }

    if (currentBannerPreview) {

        URL.revokeObjectURL(
            currentBannerPreview
        );

    }

    currentBannerPreview =
        URL.createObjectURL(file);

    preview.src =
        currentBannerPreview;

    preview.style.display =
        "block";

}

/* ==========================================
   PREVIEW CERTIFICATE
========================================== */

function previewCertificate() {

    const input =
        document.getElementById(
            "certificateTemplate"
        );

    const preview =
        document.getElementById(
            "certificatePreview"
        );

    if (!input || !preview) return;

    const file =
        input.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Vui lòng chọn file ảnh.");
        input.value = "";
        return;

    }

    if (currentCertificatePreview) {

        URL.revokeObjectURL(
            currentCertificatePreview
        );

    }

    currentCertificatePreview =
        URL.createObjectURL(file);
    preview.src =
        currentCertificatePreview;

}

/* ==========================================
   UPLOAD IMAGE
========================================== */

async function uploadImage(file, action) {

    if (!file) {

        return "";

    }

    const base64 =
        await fileToBase64(file);

    const formData =
        new URLSearchParams();

    formData.append(
        "action",
        action
    );

    formData.append(
        "image",
        base64
    );

    formData.append(
        "fileName",
        file.name
    );

    const response =
        await fetch(API, {

            method: "POST",

            body: formData

        });

    if (!response.ok) {

        throw new Error(
            "Không thể upload ảnh."
        );

    }

    const result =
        await response.json();

    if (!result.success) {

        throw new Error(
            result.message
        );

    }

    return result.data.url;

}

/* ==========================================
   UPLOAD BANNER
========================================== */

async function uploadBanner() {

    const fileInput =
        document.getElementById(
            "bannerFile"
        );

    const hiddenInput =
        document.getElementById(
            "banner"
        );

    if (!fileInput || !hiddenInput) {

        return "";

    }

    const file =
        fileInput.files[0];

    if (!file) {

        return hiddenInput.value;

    }

    const url =
        await uploadImage(
            file,
            "uploadBanner"
        );

    hiddenInput.value =
        url;

    return url;

}
/* ==========================================
   FILL FORM
========================================== */

function fillForm(contest = {}) {

    contest = {

    title: "",

    headerSubtitle: "",

    headerPlace: "",

    headerOrg: "",

    headerTitle: "",

    startDate: "",

    endDate: "",

    examTime: 30,

    autoSubmit: true,

    showCountdown: true,

    allowEarlySubmit: true,

    banner: DEFAULT_BANNER,

    certificateTemplate: "",

    content: "",

    prize: "",

    target: "",

    ...contest

};

/* nếu nhận dữ liệu từ Apps Script */

contest.headerSubtitle =
    contest.headerSubtitle ||
    contest.header_subtitle ||
    "";

contest.headerPlace =
    contest.headerPlace ||
    contest.header_place ||
    "";

contest.headerOrg =
    contest.headerOrg ||
    contest.header_org ||
    "";

contest.headerTitle =
    contest.headerTitle ||
    contest.header_title ||
    "";

contest.startDate =
    contest.startDate ||
    contest.start_date ||
    "";

contest.endDate =
    contest.endDate ||
    contest.end_date ||
    "";

contest.examTime =
    contest.examTime ||
    contest.exam_duration ||
    30;

contest.autoSubmit =
    contest.autoSubmit ??
    contest.auto_submit ??
    true;

contest.showCountdown =
    contest.showCountdown ??
    contest.show_countdown ??
    true;

contest.allowEarlySubmit =
    contest.allowEarlySubmit ??
    contest.allow_early_submit ??
    true;

contest.certificateTemplate =
    contest.certificateTemplate ||
    contest.certificate_template ||
    "";

    const setValue = (id, value) => {

        const el =
            document.getElementById(id);

        if (el) {

            el.value = value ?? "";

        }

    };

    /* ==========================
       THÔNG TIN CUỘC THI
    ========================== */

    setValue(
        "title",
        contest.title
    );

    setValue(
        "headerSubtitle",
        contest.headerSubtitle
    );

    setValue(
        "headerPlace",
        contest.headerPlace
    );

    setValue(
        "headerOrg",
        contest.headerOrg
    );

    setValue(
        "headerTitle",
        contest.headerTitle
    );

    setValue(
        "content",
        contest.content
    );

    setValue(
        "prize",
        contest.prize
    );

    setValue(
        "target",
        contest.target
    );

    /* ==========================
       THỜI GIAN
    ========================== */

    setValue(
        "startDate",
        toDatetimeLocal(
            contest.startDate
        )
    );

    setValue(
        "endDate",
        toDatetimeLocal(
            contest.endDate
        )
    );

    /* ==========================
       THỜI GIAN LÀM BÀI
    ========================== */

    setValue(
        "examDuration",
        contest.examTime
    );

    /* ==========================
       CHECKBOX
    ========================== */

    const autoSubmit =
        document.getElementById(
            "autoSubmit"
        );

    if (autoSubmit) {

        autoSubmit.checked =
            Boolean(
                contest.autoSubmit
            );

    }

    const showCountdown =
        document.getElementById(
            "showCountdown"
        );

    if (showCountdown) {

        showCountdown.checked =
            Boolean(
                contest.showCountdown
            );

    }

    const allowEarlySubmit =
        document.getElementById(
            "allowEarlySubmit"
        );

    if (allowEarlySubmit) {

        allowEarlySubmit.checked =
            Boolean(
                contest.allowEarlySubmit
            );

    }

    /* ==========================
       BANNER
    ========================== */

    const bannerInput =
        document.getElementById(
            "banner"
        );

    if (bannerInput) {

        bannerInput.value =
            contest.banner || "";

    }

    const preview =
        document.getElementById(
            "previewImage"
        );

    if (preview) {

        if (contest.banner) {

            preview.src =
                contest.banner;

            preview.style.display =
                "block";

            const placeholder =
                document.getElementById(
                    "bannerPlaceholder"
                );

            if (placeholder) {

                placeholder.style.display =
                    "none";

            }

        } else {

            preview.removeAttribute("src");

            preview.style.display =
                "none";

        }

    }

   /* ==========================
   GIẤY CHỨNG NHẬN
========================== */

// Input lưu link Google Slides
setValue(
    "certificateTemplate",
    contest.certificateTemplate
);

const certificate =
    document.getElementById(
        "certificatePreview"
    );

const placeholder =
    document.getElementById(
        "certificatePlaceholder"
    );

if (certificate) {

    if (contest.certificateTemplate) {

        certificate.href =
            contest.certificateTemplate;

        certificate.textContent =
            "📄 Mở mẫu giấy chứng nhận";

        certificate.style.display =
            "inline-block";

        if (placeholder) {

            placeholder.style.display =
                "none";

        }

    } else {

        certificate.removeAttribute(
            "href"
        );

        certificate.style.display =
            "none";

        if (placeholder) {

            placeholder.style.display =
                "block";

        }

    }

}

}
/* ==========================================
   LOAD CONTEST
========================================== */

async function loadContest(forceReload = false) {

    try {

        /* ==========================
           LOAD TỪ CACHE
        ========================== */

        if (!forceReload) {

            const cache =
                localStorage.getItem(
                    "contestData"
                );

            if (cache) {

                const data =
                    JSON.parse(cache);

                contestCache = data;

                fillForm(contestCache);

                return;

            }

        }

        if (isLoading) {

            return;

        }

        isLoading = true;

        showMessage(
            "Đang tải dữ liệu...",
            "success"
        );

        /* ==========================
           GỌI APPS SCRIPT
        ========================== */

        const response =
            await fetch(

                API +
                "?action=contest&t=" +
                Date.now(),

                {
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
                "Không có dữ liệu."

            );

        }

        /* ==========================
           CHUẨN HÓA DỮ LIỆU
        ========================== */

        const server =
            result.data || {};

        const contest = {

            /* Thông tin cuộc thi */

            title:
                server.title || "",

            headerSubtitle:
                server.header_subtitle || "",

            headerPlace:
                server.header_place || "",

            headerOrg:
                server.header_org || "",

            headerTitle:
                server.header_title || "",

            startDate:
                server.start_date || "",

            endDate:
                server.end_date || "",

            /* Cấu hình bài thi */

            examTime:
                Number(
                    server.exam_duration
                ) || 30,

            autoSubmit:
                server.auto_submit === true ||
                String(
                    server.auto_submit
                ).toLowerCase() === "true" ||
                server.auto_submit == 1 ||
                server.auto_submit == "1",
            showCountdown:

                server.show_countdown === true ||

                String(
                    server.show_countdown
                ).toLowerCase() === "true" ||

                server.show_countdown == 1 ||

                server.show_countdown == "1",

            allowEarlySubmit:

                server.allow_early_submit === true ||

                String(
                    server.allow_early_submit
                ).toLowerCase() === "true" ||
                server.allow_early_submit == 1 ||
                server.allow_early_submit == "1",
            /* Banner */

            banner:

                server.banner ||
                DEFAULT_BANNER,

            /* Mẫu chứng nhận */

            certificateTemplate:
                server.certificate_template ||
                server.certificateTemplate ||
                "",

            /* Nội dung */

            content:
                server.content || "",

            prize:
                server.prize || "",

            target:
                server.target || ""
        };

        /* ==========================
           LƯU CACHE
        ========================== */

        contestCache = {
            ...contest
        };

        localStorage.setItem(
            "contestData",
            JSON.stringify(
                contestCache
            )

        );

        /* ==========================
           ĐỔ DỮ LIỆU LÊN FORM
        ========================== */

        fillForm(
            contestCache
        );

        /* ==========================
           ĐỒNG BỘ CHECKBOX
        ========================== */
        const autoSubmit =
            document.getElementById(
                "autoSubmit"
            );

        if (autoSubmit) {
            autoSubmit.checked =
                contest.autoSubmit;
        }

        const showCountdown =
            document.getElementById(
                "showCountdown"
            );

        if (showCountdown) {
            showCountdown.checked =
                contest.showCountdown;
        }

        const allowEarlySubmit =
            document.getElementById(
                "allowEarlySubmit"
            );

        if (allowEarlySubmit) {
            allowEarlySubmit.checked =
                contest.allowEarlySubmit;
        }

        showMessage(
            "Đã tải dữ liệu.",
            "success"
        );

    }

    catch (err) {
        console.error(err);
        showMessage(
            err.message ||
            "Không tải được dữ liệu.",
            "error"
        );

    }

    finally {
        isLoading = false;

    }

}

/* ==========================================
   VALIDATE CONTEST
========================================== */

function validateContest(data) {

    /* ==========================
       Chuẩn hóa dữ liệu
    ========================== */

    const title =
        String(data.title || "").trim();

    const startDate =
        String(
            data.start_date ??
            data.startDate ??
            ""
        ).trim();

    const endDate =
        String(
            data.end_date ??
            data.endDate ??
            ""
        ).trim();

    const examDuration =
        Number(
            data.exam_duration ??
            data.examTime ??
            30
        );

    const content =
        String(data.content || "").trim();

    const target =
        String(data.target || "").trim();

    /* ==========================
       Tên cuộc thi
    ========================== */

    if (!title) {

        showMessage(
            "Vui lòng nhập tên cuộc thi.",
            "error"
        );

        return false;

    }

    /* ==========================
       Ngày bắt đầu
    ========================== */

    if (startDate === "") {

        showMessage(
            "Vui lòng chọn ngày bắt đầu.",
            "error"
        );

        return false;

    }

    if (isNaN(new Date(startDate).getTime())) {

        showMessage(
            "Ngày bắt đầu không hợp lệ.",
            "error"
        );

        return false;

    }

    /* ==========================
       Ngày kết thúc
    ========================== */

    if (endDate === "") {

        showMessage(
            "Vui lòng chọn ngày kết thúc.",
            "error"
        );

        return false;

    }

    if (isNaN(new Date(endDate).getTime())) {

        showMessage(
            "Ngày kết thúc không hợp lệ.",
            "error"
        );

        return false;

    }

    /* ==========================
       So sánh thời gian
    ========================== */

    const start =
        new Date(startDate);

    const end =
        new Date(endDate);

    if (end <= start) {

        showMessage(
            "Ngày kết thúc phải sau ngày bắt đầu.",
            "error"
        );

        return false;

    }

    /* ==========================
       Thời gian làm bài
    ========================== */

    if (
        isNaN(examDuration) ||
        examDuration < 1 ||
        examDuration > 300
    ) {

        showMessage(
            "Thời gian làm bài phải từ 1 đến 300 phút.",
            "error"
        );

        return false;

    }

    /* ==========================
       Nội dung cuộc thi
    ========================== */

    if (!content) {

        showMessage(
            "Vui lòng nhập nội dung cuộc thi.",
            "error"
        );

        return false;

    }

    /* ==========================
       Đối tượng tham gia
    ========================== */

    if (!target) {

        showMessage(
            "Vui lòng nhập đối tượng tham gia.",
            "error"
        );

        return false;

    }

    return true;

}

/* ==========================================
   SAVE CONTEST
========================================== */

async function saveContest(e) {

    if (e) {
        e.preventDefault();
    }

    try {

        showMessage(
            "Đang lưu dữ liệu...",
            "success"
        );

        /* ==========================
           Upload Banner
        ========================== */

        const bannerUrl =
            await uploadBanner();

        /* ==========================
           Link mẫu giấy chứng nhận
        ========================== */

        const certificateUrl =
            document.getElementById(
                "certificateTemplate"
            ).value.trim();

        /* ==========================
           Đọc dữ liệu Form
        ========================== */

        const startDate =
            document.getElementById(
                "startDate"
            ).value.trim();

        const endDate =
            document.getElementById(
                "endDate"
            ).value.trim();

            const data = {

    title:
        document.getElementById(
            "title"
        ).value.trim(),

    header_subtitle:
        document.getElementById(
            "headerSubtitle"
        ).value.trim(),

    header_place:
        document.getElementById(
            "headerPlace"
        ).value.trim(),

    header_org:
        document.getElementById(
            "headerOrg"
        ).value.trim(),

    header_title:
        document.getElementById(
            "headerTitle"
        ).value.trim(),

    start_date:
        startDate,

    end_date:
        endDate,

    /* ==========================
       CẤU HÌNH BÀI THI
    ========================== */

    exam_duration:
        Number(
            document.getElementById(
                "examDuration"
            )?.value
        ) || 30,

    auto_submit:
        document.getElementById(
            "autoSubmit"
        )?.checked ?? true,

    show_countdown:
        document.getElementById(
            "showCountdown"
        )?.checked ?? true,

    allow_early_submit:
        document.getElementById(
            "allowEarlySubmit"
        )?.checked ?? true,

    /* ==========================
       THÔNG TIN KHÁC
    ========================== */

    banner:
        bannerUrl ||
        contestCache?.banner ||
        "",

    certificate_template:
        certificateUrl ||
        contestCache?.certificateTemplate ||
        contestCache?.certificate_template ||
        "",

    content:
        document.getElementById(
            "content"
        ).value.trim(),

    prize:
        document.getElementById(
            "prize"
        ).value.trim(),

    target:
        document.getElementById(
            "target"
        ).value.trim()

};

        console.log(
            "Contest data:",
            data
        );

        /* ==========================
           Kiểm tra dữ liệu
        ========================== */

        if (!validateContest(data)) {
            return;
        }

        /* ==========================
           Chuẩn bị FormData
        ========================== */

        const formData =
            new URLSearchParams();

        formData.append(
            "action",
            "saveContest"
        );

        Object.entries(data).forEach(
            ([key, value]) => {

                formData.append(
                    key,
                    value == null
                        ? ""
                        : String(value)
                );

            }
        );

        /* ==========================
           Gửi Apps Script
        ========================== */

        const response =
            await fetch(API, {

                method: "POST",

                body: formData

            });

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
                "Không thể lưu dữ liệu."
            );

        }

        /* ==========================
           Cập nhật Cache
        ========================== */

        contestCache = {

            title:
                data.title,

            headerSubtitle:
                data.header_subtitle,

            headerPlace:
                data.header_place,

            headerOrg:
                data.header_org,

            headerTitle:
                data.header_title,

            startDate:
                data.start_date,

            endDate:
                data.end_date,

            examTime:
                data.exam_duration,

            autoSubmit:
                data.auto_submit,

            showCountdown:
                data.show_countdown,

            allowEarlySubmit:
                data.allow_early_submit,

            banner:
                data.banner,

            certificateTemplate:
                data.certificate_template,

            content:
                data.content,

            prize:
                data.prize,

            target:
                data.target

        };

        saveContestCache(
            contestCache
        );

        localStorage.setItem(
            "contestData",
            JSON.stringify(
                contestCache
            )
        );

        fillForm(
            contestCache
        );

        showMessage(
            "Đã lưu thông tin cuộc thi thành công.",
            "success"
        );

    }

    catch (err) {

        console.error(err);

        showMessage(
            err.message ||
            "Không thể lưu dữ liệu.",
            "error"
        );

    }

    finally {

        const banner =
            document.getElementById(
                "bannerFile"
            );

        if (banner) {

            banner.value = "";

        }

    }

}
/* ==========================================
   SHOW MESSAGE
========================================== */

function showMessage(message, type = "success") {

    const box =
        document.getElementById("message");

    if (!box) {

        alert(message);

        return;

    }

    box.textContent = message;

    box.className = "";

    box.classList.add(type);

    box.style.display = "block";

    clearTimeout(box.timer);

    box.timer = setTimeout(() => {

        box.style.display = "none";

    }, 4000);

}

/* ==========================================
   IMPORT QUESTIONS
========================================== */

async function importQuestions(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    showLoading("Đang đọc file Excel...");

    try {

        const reader = new FileReader();

        reader.onload = async function (e) {

            try {

                const workbook = XLSX.read(
                    e.target.result,
                    {
                        type: "binary"
                    }
                );

                const sheet =
                    workbook.Sheets[
                        workbook.SheetNames[0]
                    ];

                const questions =
                    XLSX.utils.sheet_to_json(
                        sheet,
                        {
                            defval: ""
                        }
                    );

                console.log("Excel:", questions);

                if (!questions.length) {

                    throw new Error(
                        "File Excel không có dữ liệu."
                    );

                }

                const formData =
                    new URLSearchParams();

                formData.append(
                    "action",
                    "importQuestions"
                );

                formData.append(
                    "questions",
                    JSON.stringify(questions)
                );

                const response =
                    await fetch(API, {
                        method: "POST",
                        body: formData
                    });

                console.log(
                    "HTTP Status:",
                    response.status
                );

                if (!response.ok) {

                    throw new Error(
                        "HTTP " + response.status
                    );

                }

                const text =
                    await response.text();

                console.log(
                    "Server Response:",
                    text
                );

                let result;

                try {

                    result =
                        JSON.parse(text);

                }

                catch (err) {

                    throw new Error(
                        "Server trả về dữ liệu không hợp lệ:\n" +
                        text
                    );

                }

                if (!result.success) {

                    throw new Error(
                        result.message ||
                        "Import thất bại."
                    );

                }

                showMessage(
                    "Đã import " +
                    questions.length +
                    " câu hỏi.",
                    "success"
                );

                // Load lại danh sách
                await loadQuestions();

                // Cho phép chọn lại chính file vừa import
                event.target.value = "";

            }

            catch (err) {

                console.error(err);

                showMessage(
                    err.message ||
                    "Import thất bại.",
                    "error"
                );

            }

            finally {

                hideLoading();

            }

        };

        reader.readAsBinaryString(file);

    }

    catch (err) {

        hideLoading();

        console.error(err);

        showMessage(
            err.message ||
            "Không thể đọc file Excel.",
            "error"
        );

    }

}

/* ==========================================
   IMPORT BUTTON
========================================== */
document.addEventListener("DOMContentLoaded", () => {

    const importBtn =
        document.getElementById("importExcel");

    const excelFile =
        document.getElementById("excelFile");

    if (importBtn && excelFile) {

        importBtn.addEventListener(
            "click",
            () => excelFile.click()
        );

        excelFile.addEventListener(
            "change",
            importQuestions
        );

    }

});

/* ==========================================
   QUESTION MANAGER
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const manager =
        document.getElementById(
            "questionManager"
        );

    if (!manager) {

        return;

    }

    manager.addEventListener(
        "click",
        () => {

            window.location.href =
                "question.html";

        }
    );

});
/* ==========================================
   RESET PREVIEW
========================================== */

function resetPreview() {

    setTimeout(() => {

        /* ==========================
           Banner
        ========================== */

        const bannerPreview =
            document.getElementById("previewImage");

        const bannerPlaceholder =
            document.getElementById("bannerPlaceholder");

        if (bannerPreview) {

            bannerPreview.removeAttribute("src");
            bannerPreview.style.display = "none";

        }

        if (bannerPlaceholder) {

            bannerPlaceholder.style.display = "block";

        }

        /* ==========================
           Certificate
        ========================== */

        const certificate =
            document.getElementById("certificatePreview");

        if (certificate) {

            certificate.removeAttribute("src");
            certificate.style.display = "none";

        }

        /* ==========================
           Reset File Input
        ========================== */

        [
            "bannerFile",
            "certificateTemplate",
            "excelFile"

        ].forEach(id => {

            const input =
                document.getElementById(id);

            if (input) {

                input.value = "";

            }

        });

        /* ==========================
           Xóa cache khi Reset
        ========================== */

        contestCache = {};

        localStorage.removeItem("contestData");

    }, 100);

}

/* ==========================================
   IMAGE / LINK LOAD
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ==========================
       Banner
    ========================== */

    const banner =
        document.getElementById(
            "previewImage"
        );

    if (banner) {

        banner.onerror = function () {

            console.warn(
                "Không tìm thấy ảnh banner."
            );

            this.removeAttribute("src");

            this.style.display =
                "none";

            const placeholder =
                document.getElementById(
                    "bannerPlaceholder"
                );

            if (placeholder) {

                placeholder.style.display =
                    "block";

            }

        };

    }

    /* ==========================
       Certificate Link
    ========================== */

    const certificate =
        document.getElementById(
            "certificatePreview"
        );

    const placeholder =
        document.getElementById(
            "certificatePlaceholder"
        );

    if (certificate) {

        const href =
            certificate.getAttribute("href");

        if (
            href &&
            href !== "#" &&
            href.trim() !== ""
        ) {

            certificate.style.display =
                "inline-block";

            if (placeholder) {

                placeholder.style.display =
                    "none";

            }

        } else {

            certificate.removeAttribute(
                "href"
            );

            certificate.style.display =
                "none";

            if (placeholder) {

                placeholder.style.display =
                    "block";

            }

        }

    }

});

/* ==========================================
   SAVE CACHE
========================================== */

function saveContestCache(data = {}) {

    contestCache = {

        title: "",

        headerSubtitle: "",

        headerPlace: "",

        headerOrg: "",

        headerTitle: "",

        startDate: "",

        endDate: "",

        examTime: 30,

        autoSubmit: true,

        showCountdown: true,

        allowEarlySubmit: true,

        banner: "",

        certificateTemplate: "",

        content: "",

        prize: "",

        target: "",

        updatedAt: "",

        ...data

    };

    localStorage.setItem(

        "contestData",

        JSON.stringify(
            contestCache
        )

    );

}

/* ==========================================
   CLEAR CACHE
========================================== */

function clearContestCache() {
    contestCache = null;
    localStorage.removeItem(
        "contestData"
    );

}

/* ==========================================
   REFRESH FORM
========================================== */

async function refreshContest() {
    clearContestCache();
    await loadContest(true);
}

/* ==========================================
   FORMAT DATE
========================================== */

function formatDate(date) {
    if (!date) {

        return "";

    }

    return new Date(date)
        .toLocaleString(
            "vi-VN"
        );
}

/* ==========================================
   GET BOOLEAN
========================================== */

function getBoolean(value) {
    return value === true ||
        value === "true" ||
        value === 1 ||
        value === "1";
}
/* ==========================================
   WINDOW DEBUG
========================================== */

window.admin = {
    loadContest,
    saveContest,
    refreshContest,
    clearContestCache,
    validateContest,
    fillForm
};