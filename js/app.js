/* ==========================================
   GOOGLE APPS SCRIPT API
========================================== */

const API =
"https://script.google.com/macros/s/AKfycbwGD7yYHOXw7GFvIzb9qXz--O6OATQcnXVlxW0Z72HmROQYoc4a47zO8EmX1hbwr_oFXA/exec";

const DEFAULT_BANNER =
"images/banner cuộc thi.png";

/* ==========================================
   BIẾN TOÀN CỤC
========================================== */
let contestData = null;
let contestStart = "";
let contestEnd = "";
let isLoading = false;

/* ==========================================
   DOM READY
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadContest();

        initButtons();

    }
);

/* ==========================================
   FORMAT DATETIME
========================================== */

function formatDate(date) {

    if (!date)
        return "--";

    const d = new Date(date);

    if (isNaN(d.getTime()))
        return "--";

    return new Intl.DateTimeFormat(
        "vi-VN",
        {

            timeZone:
                "Asia/Ho_Chi_Minh",

            year:
                "numeric",

            month:
                "2-digit",

            day:
                "2-digit",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }

    ).format(d);

}

/* ==========================================
   SAFE SET TEXT
========================================== */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (!element)
        return;

    element.textContent =
        value || "--";

}

/* ==========================================
   TRẠNG THÁI CUỘC THI
========================================== */

function getContestStatus(
    start,
    end
) {

    if (!start || !end)
        return "invalid";

    const now =
        new Date();

    const startDate =
        new Date(start);

    const endDate =
        new Date(end);

    if (
        now < startDate
    ) {

        return "before";

    }

    if (
        now > endDate
    ) {

        return "after";

    }

    return "open";

}
/* ==========================================
   LOAD THÔNG TIN CUỘC THI
========================================== */

async function loadContest(forceReload = false) {

    if (isLoading) return;

    isLoading = true;

    let cacheData = null;

    try {

        /* ==========================
           CACHE
        ========================== */

        if (!forceReload) {

            const cache =
                localStorage.getItem("contest_data");

            if (cache) {

                try {

                    cacheData = JSON.parse(cache);

                } catch {

                    localStorage.removeItem("contest_data");

                }

            }

        }

        /* ==========================
           API
        ========================== */

        const response =
            await fetch(

                API +
                "?action=contest&t=" +
                Date.now(),

                {
                    method: "GET",
                    cache: "no-store"
                }

            );

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
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

        const server =
            result.data || {};

        /* ==========================
           Chuẩn hóa dữ liệu
        ========================== */

        const data = {

            title:
                server.title || "",

            headerSubtitle:
                server.headerSubtitle ||
                server.header_subtitle ||
                "",

            headerPlace:
                server.headerPlace ||
                server.header_place ||
                "",

            headerOrg:
                server.headerOrg ||
                server.header_org ||
                "",

            headerTitle:
                server.headerTitle ||
                server.header_title ||
                "",

            startDate:
                server.startDate ||
                server.start_date ||
                "",

            endDate:
                server.endDate ||
                server.end_date ||
                "",

            examTime:
                Number(
                    server.examTime ??
                    server.exam_duration ??
                    30
                ),

            autoSubmit:
                server.autoSubmit ??
                server.auto_submit ??
                true,

            showCountdown:
                server.showCountdown ??
                server.show_countdown ??
                true,

            allowEarlySubmit:
                server.allowEarlySubmit ??
                server.allow_early_submit ??
                true,

            banner:
                server.banner ||
                DEFAULT_BANNER,

            certificateTemplate:
                server.certificateTemplate ||
                server.certificate_template ||
                "",

            content:
                server.content || "",

            prize:
                server.prize || "",

            target:
                server.target || ""

        };

        contestData = data;

        localStorage.setItem(
            "contest_data",
            JSON.stringify(data)
        );

        applyContestData(data);

        return data;

    }

    catch (err) {

        console.error(err);

        if (cacheData) {

            applyContestData(cacheData);

            return cacheData;

        }

        defaultUI();

        return null;

    }

    finally {

        isLoading = false;

    }

}
/* ==========================================
   HIỂN THỊ DỮ LIỆU CUỘC THI
========================================== */

function applyContestData(data = {}) {

    /* ==========================
       Chuẩn hóa dữ liệu
    ========================== */

    data = {

        title:
            data.title || "",

        headerSubtitle:
            data.headerSubtitle ||
            data.header_subtitle ||
            "",

        headerPlace:
            data.headerPlace ||
            data.header_place ||
            "",

        headerOrg:
            data.headerOrg ||
            data.header_org ||
            "",

        headerTitle:
            data.headerTitle ||
            data.header_title ||
            "",

        startDate:
            data.startDate ||
            data.start_date ||
            "",

        endDate:
            data.endDate ||
            data.end_date ||
            "",

        banner:
            data.banner ||
            DEFAULT_BANNER,

        certificateTemplate:
            data.certificateTemplate ||
            data.certificate_template ||
            "",

        content:
            data.content || "",

        prize:
            data.prize || "",

        target:
            data.target || "",

        examTime:
            Number(
                data.examTime ??
                data.exam_duration ??
                30
            ),

        autoSubmit:
            data.autoSubmit ??
            data.auto_submit ??
            true,

        showCountdown:
            data.showCountdown ??
            data.show_countdown ??
            true,

        allowEarlySubmit:
            data.allowEarlySubmit ??
            data.allow_early_submit ??
            true

    };

    contestData = data;

    contestStart =
        data.startDate;

    contestEnd =
        data.endDate;

    /* HEADER */

    setText(
        "headerSubtitle",
        data.headerSubtitle
    );

    setText(
        "headerPlace",
        data.headerPlace
    );

    setText(
        "headerOrg",
        data.headerOrg
    );

    setText(
        "headerTitle",
        data.headerTitle
    );

    /* THÔNG TIN */

    setText(
        "contestTitle",
        data.title
    );

    setText(
        "timeStart",
        formatDate(data.startDate)
    );

    setText(
        "timeEnd",
        formatDate(data.endDate)
    );

    setText(
        "content",
        data.content
    );

    setText(
        "prize",
        data.prize
    );

    setText(
        "target",
        data.target
    );

    /* Banner */

    const banner =
        document.getElementById(
            "bannerImage"
        );

    if (banner) {

        if (data.banner) {

            banner.src =
                data.banner;
            banner.style.display =
                "block";

        } else {
            banner.removeAttribute("src");
            banner.style.display =
                "none";
        }

        banner.onerror = function () {
            this.removeAttribute("src");
            this.style.display =
                "none";
        };

    }

    resetButtons();

}
/* ==========================================
   SỰ KIỆN NÚT
========================================== */

function initButtons() {

    const joinBtn =
        document.getElementById(
            "joinBtn"
        );

    const startBtn =
        document.getElementById(
            "startBtn"
        );

    if (!joinBtn)
        return;

    /* ==========================
       THAM GIA CUỘC THI
    ========================== */

    joinBtn.onclick = function () {

        if (!contestData) {

            alert(
                "Hiện chưa có cuộc thi."
            );

            return;

        }

        const status =
            getContestStatus(
                contestStart,
                contestEnd
            );

        if (status === "invalid") {
            alert(
                "Ban tổ chức chưa cấu hình thời gian."
            );
            return;

        }

        if (status === "before") {

            alert(
                "Chưa đến thời gian diễn ra cuộc thi."
            );
            return;
        }

        if (status === "after") {
            alert(
                "Cuộc thi đã kết thúc."
            );
            return;

        }
        window.location.href =
            "participant.html";
    };
    if (startBtn) {
        startBtn.onclick =
            function () {

                window.location.href =
                    "exam.html";
            };

    }

}
/* ==========================================
   RESET BUTTON
========================================== */

function resetButtons() {

    const joinBtn =
        document.getElementById(
            "joinBtn"
        );

    const startBtn =
        document.getElementById(
            "startBtn"
        );

    if (joinBtn) {

        joinBtn.style.display =
            "inline-block";

        joinBtn.disabled =
            !contestData;

        joinBtn.innerText =
            "THAM GIA CUỘC THI";

    }

    if (startBtn) {

        startBtn.style.display =
            "none";

        startBtn.disabled =
            false;

    }

}

/* ==========================================
   GIAO DIỆN MẶC ĐỊNH
========================================== */

function defaultUI() {

    contestData = null;

    contestStart = "";

    contestEnd = "";

    /* ==========================
       HEADER
    ========================== */

    setText(
        "headerSubtitle",
        "HỘI ĐỒNG PHỐI HỢP PHỔ BIẾN, GIÁO DỤC PHÁP LUẬT"
    );

    setText(
        "headerPlace",
        "XÃ ĐĂK HÀ"
    );

    setText(
        "headerOrg",
        "BAN TỔ CHỨC CUỘC THI"
    );

    setText(
        "headerTitle",
        "CUỘC THI TÌM HIỂU PHÁP LUẬT"
    );

    /* ==========================
       THÔNG TIN CUỘC THI
    ========================== */

    setText(
        "contestTitle",
        "Hiện chưa có cuộc thi."
    );

    setText(
        "timeStart",
        "--"
    );

    setText(
        "timeEnd",
        "--"
    );

    setText(
        "content",
        "--"
    );

    setText(
        "prize",
        "--"
    );

    setText(
        "target",
        "--"
    );

    /* ==========================
       BANNER
    ========================== */

    const banner =
        document.getElementById(
            "bannerImage"
        );

    if (banner) {

        banner.src =
            DEFAULT_BANNER;

    }

    /* ==========================
       RESET BUTTON
    ========================== */

    resetButtons();

    const joinBtn =
        document.getElementById(
            "joinBtn"
        );

    if (joinBtn) {

        joinBtn.disabled =
            true;

        joinBtn.innerText =
            "CHƯA CÓ CUỘC THI";
    }
}
/* ==========================================
   KHI QUAY LẠI TRANG
========================================== */

window.addEventListener(

    "pageshow",

    function () {

        if (contestData) {

            resetButtons();

        }

    }

);

/* ==========================================
   TẢI LẠI DỮ LIỆU CUỘC THI
========================================== */

function reloadContest() {

    if (isLoading)
        return;

    loadContest(true);

}

/* ==========================================
   KIỂM TRA KẾT NỐI API
========================================== */

async function checkApi() {

    try {

        const response =
            await fetch(

                API +
                "?action=contest",

                {
                    cache: "no-store"
                }

            );

        if (!response.ok) {

            return false;

        }

        const result =
            await response.json();

        return result.success === true;

    }

    catch (err) {

        console.error(
            "API ERROR:",
            err
        );

        return false;

    }

}

/* ==========================================
   IN THÔNG TIN CUỘC THI
========================================== */

function printContestStatus() {

    console.group(
        "Contest Information"
    );

    console.log(
        "Tên cuộc thi:",
        contestData?.title || "-"
    );

    console.log(
        "Tên cơ quan:",
        contestData?.header_subtitle || "-"
    );

    console.log(
        "Địa phương:",
        contestData?.header_place || "-"
    );

    console.log(
        "Ban tổ chức:",
        contestData?.header_org || "-"
    );

    console.log(
        "Tiêu đề:",
        contestData?.header_title || "-"
    );

    console.log(
        "Bắt đầu:",
        contestStart
    );

    console.log(
        "Kết thúc:",
        contestEnd
    );

    console.log(
        "Trạng thái:",
        getContestStatus(
            contestStart,
            contestEnd
        )
    );

    console.groupEnd();

}

/* ==========================================
   TEST API
========================================== */

async function testApi() {

    console.log(
        "===== TEST API ====="
    );

    console.log(
        "API:",
        API
    );

    const ok =
        await checkApi();

    console.log(
        "API Ready:",
        ok
    );

    if (contestData) {
        printContestStatus();
    }
}
/* ==========================================
   DEBUG
========================================== */
// testApi();