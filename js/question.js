/* ==========================================
   GOOGLE APPS SCRIPT API
========================================== */

const API =
"https://script.google.com/macros/s/AKfycbwGD7yYHOXw7GFvIzb9qXz--O6OATQcnXVlxW0Z72HmROQYoc4a47zO8EmX1hbwr_oFXA/exec";

/* ==========================================
   GLOBAL
========================================== */

let questions = [];

let currentId = "";

/* ==========================================
   DOM READY
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* Tải danh sách câu hỏi */
    loadQuestions();

    /* Nút thêm câu hỏi */
    const saveBtn =
        document.getElementById("saveQuestion");

    if (saveBtn) {

        saveBtn.addEventListener(
            "click",
            addQuestion
        );

    }

    /* Nút cập nhật */
    const updateBtn =
        document.getElementById("updateQuestion");

    if (updateBtn) {

        updateBtn.addEventListener(
            "click",
            updateQuestion
        );

    }

    /* Nút làm mới */
    const resetBtn =
        document.getElementById("resetForm");

    if (resetBtn) {

        resetBtn.addEventListener(
            "click",
            resetForm
        );

    }

    /* Đổi loại câu hỏi */
    const type =
        document.getElementById("questionType");

    if (type) {

        type.addEventListener(
            "change",
            changeQuestionType
        );

    }

    /* Import Excel */
    const excelFile =
        document.getElementById("excelFile");

    if (excelFile) {

        excelFile.addEventListener(
            "change",
            importQuestions
        );

    }

    /* Khởi tạo giao diện ban đầu */
    changeQuestionType();
    
    /* ==========================
       TÌM KIẾM
    ========================== */
    const searchBox =
        document.getElementById(
            "searchQuestion"
        );

    const searchButton = document.getElementById(
            "searchButton"
        );

    if(searchBox){

        /* Gõ tự tìm */

        searchBox.addEventListener(
            "input",
            searchQuestions
        );

        /* Enter */

        searchBox.addEventListener(
            "keydown",
            function(e){

                if(e.key==="Enter"){

                    e.preventDefault();

                    searchQuestions();

                }

            }
        );

    }

    if(searchButton){

        searchButton.addEventListener(
            "click",
            searchQuestions
        );

    }
});

/* ==========================================
   LOAD QUESTIONS
========================================== */

async function loadQuestions(forceReload = false) {

    try {

        /* ==========================
           API URL
        ========================== */

        const url =
            API +
            "?action=questions&t=" +
            Date.now();

        console.log("Loading:", url);

        /* ==========================
           FETCH
        ========================== */

        const response =
            await fetch(url, {
                method: "GET",
                cache: "no-store"
            });

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );

        }

        const result =
            await response.json();

        console.log("Questions Response:", result);

        if (!result.success) {

            throw new Error(
                result.message ||
                "Không tải được danh sách câu hỏi."
            );

        }

        /* ==========================
           CẬP NHẬT DANH SÁCH
        ========================== */

        questions =
            Array.isArray(result.data)
                ? [...result.data]
                : [];

        console.log(
            "Tổng số câu hỏi:",
            questions.length
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
   HIỂN THỊ DANH SÁCH
========================================== */

function renderQuestions() {

    const tbody =
        document.getElementById("questionTable");

    if (!tbody) return;

    /* Xóa dữ liệu cũ */
    tbody.innerHTML = "";

    /* Không có câu hỏi */
    if (!questions || questions.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center">
                    Chưa có câu hỏi.
                </td>
            </tr>
        `;

        return;

    }

    /* Tạo HTML */
    let html = "";

    questions.forEach(function (q, index) {

        const typeText =
            q.type === "multiple"
                ? "Nhiều đáp án"
                : "Một đáp án";

        html += `
        <tr>

            <td style="text-align:center">
                ${index + 1}
            </td>

            <td style="text-align:center">
                <span class="type-badge">
                    ${typeText}
                </span>
            </td>

            <td>

                <strong>
                    ${q.question || ""}
                </strong>

                <br><br>

                <small>

                    <div>A. ${q.a || ""}</div>

                    <div>B. ${q.b || ""}</div>

                    <div>C. ${q.c || ""}</div>

                    <div>D. ${q.d || ""}</div>

                </small>

            </td>

            <td style="text-align:center">

                <strong>
                    ${q.correct || ""}
                </strong>

            </td>

            <td style="text-align:center">

                <button
                    class="save-btn"
                    onclick="editQuestion('${q.id}')">

                    ✏️ Sửa

                </button>

                <br><br>

                <button
                    class="reset-btn"
                    onclick="deleteQuestion('${q.id}')">

                    🗑 Xóa

                </button>

            </td>

        </tr>
        `;

    });

    /* Chỉ cập nhật DOM một lần */
    tbody.innerHTML = html;

}
/* ==========================================
   EDIT QUESTION
========================================== */

function editQuestion(id) {

    // Tìm câu hỏi theo ID
    const q = questions.find(
        item => String(item.id) === String(id)
    );
    console.log("ID truyền vào:", id);
    console.log("Question tìm được:", q);
    console.log("q.id =", q?.id);
    if (!q) {
        showMessage(
            "Không tìm thấy câu hỏi cần sửa.",
            "error"
        );
        return;
    }

    // Lưu ID đang chỉnh sửa
    currentId = q.id;

    document.getElementById(
        "questionId"
    ).value = q.id || "";

    console.log("EDIT currentId =", currentId);
    console.log(
        "Hidden =",
        document.getElementById("questionId").value
    );

    document.getElementById(
        "question"
    ).value = q.question || "";

    document.getElementById(
        "questionType"
    ).value = q.type || "single";

    document.getElementById(
        "answerA"
    ).value = q.a || "";

    document.getElementById(
        "answerB"
    ).value = q.b || "";

    document.getElementById(
        "answerC"
    ).value = q.c || "";

    document.getElementById(
        "answerD"
    ).value = q.d || "";

    // Dựng lại vùng chọn đáp án
    changeQuestionType();

    if ((q.type || "single") === "single") {

        const radio = document.querySelector(
            'input[name="correct"][value="' +
            String(q.correct || "")
                .trim()
                .toUpperCase() +
            '"]'
        );

        if (radio) {
            radio.checked = true;
        }

    } else {

        const answers = String(q.correct || "")
            .split(",");

        answers.forEach(function (item) {

            const checkbox = document.querySelector(
                'input[name="correct"][value="' +
                item.trim().toUpperCase() +
                '"]'
            );

            if (checkbox) {
                checkbox.checked = true;
            }

        });

    }

    document.getElementById(
        "saveQuestion"
    ).style.display = "none";

    document.getElementById(
        "updateQuestion"
    ).style.display = "inline-block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

/* ==========================================
   THÊM CÂU HỎI
========================================== */

async function addQuestion() {

    console.log("API =", API);

    const question =
        document.getElementById("question").value.trim();

    const type =
        document.getElementById("questionType").value;

    const a =
        document.getElementById("answerA").value.trim();

    const b =
        document.getElementById("answerB").value.trim();

    const c =
        document.getElementById("answerC").value.trim();

    const d =
        document.getElementById("answerD").value.trim();

    let correct = "";
    let answers = "";

    /* ==========================
       ĐÁP ÁN ĐÚNG
    ========================== */

    if (type === "single") {

        const checked =
            document.querySelector(
                "input[name='correct']:checked"
            );

        if (checked) {
            correct = checked.value;
        }

    } else {

        const checked =
            document.querySelectorAll(
                "#correctAnswerBox input[type='checkbox']:checked"
            );

        answers = Array.from(checked)
            .map(item => item.value)
            .join(",");

        correct = answers;

    }

    /* ==========================
       KIỂM TRA DỮ LIỆU
    ========================== */

    if (!question || !a || !b || !c || !d) {

        showMessage(
            "Vui lòng nhập đầy đủ thông tin.",
            "error"
        );

        return;

    }

    if (type === "single" && !correct) {

        showMessage(
            "Vui lòng chọn đáp án đúng.",
            "error"
        );

        return;

    }

    if (type === "multiple" && !answers) {

        showMessage(
            "Vui lòng chọn ít nhất một đáp án đúng.",
            "error"
        );

        return;

    }

    try {

        showLoading("Đang thêm câu hỏi...");

        const payload = {
            action: "addQuestion",
            question: question,
            type: type,
            a: a,
            b: b,
            c: c,
            d: d,
            correct: correct,
            answers: answers
        };

        console.log("Dữ liệu gửi đi:", JSON.stringify(payload));

        const response = await fetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            redirect: "follow", 
            body: JSON.stringify(payload)
        });

        console.log("HTTP Status:", response.status);

        const text = await response.text();

        console.log(text);

        if (!response.ok) {
            throw new Error(
                "HTTP " + response.status
            );
        }

        let result;

        try {
            result = JSON.parse(text);
        }
        catch (e) {
            throw new Error(
                "Server trả về dữ liệu không hợp lệ."
            );
        }

        if (!result.success) {
            throw new Error(
                result.message ||
                "Không thể thêm câu hỏi."
            );
        }   
        
        showMessage(
            "Đã thêm câu hỏi.",
            "success"
        );

        resetForm();
        await loadQuestions(true);

    } catch (err) {

        console.error(err);

        showMessage(
            err.message ||
            "Không thể kết nối tới máy chủ.",
            "error"
        );

    } finally {
        hideLoading();
    }

}

/* ==========================================
   RESET FORM (ĐẢM BẢO KHÔNG XÓA NHẦM BIẾN HIỆN TẠI KHI KHỞI CHẠY)
========================================== */

function resetForm() {

    currentId = "";

    const hiddenId = document.getElementById("questionId");
    if (hiddenId) hiddenId.value = "";

    document.getElementById("question").value = "";

    document.getElementById("questionType").value = "single";

    document.getElementById("answerA").value = "";

    document.getElementById("answerB").value = "";

    document.getElementById("answerC").value = "";

    document.getElementById("answerD").value = "";

    changeQuestionType();

    const radio =
        document.querySelector(
            "input[name='correct'][value='A']"
        );

    if (radio) {
        radio.checked = true;
    }

    document
        .querySelectorAll(
            "#correctAnswerBox input[type='checkbox']"
        )
        .forEach(item => {
            item.checked = false;
        });

    document.getElementById(
        "saveQuestion"
    ).style.display = "inline-block";

    document.getElementById(
        "updateQuestion"
    ).style.display = "none";

}

/* ==========================================
   CẬP NHẬT CÂU HỎI
========================================== */

async function updateQuestion() {

    console.log("API =", API);

    // Lấy lại ID nếu currentId bị mất
    if (!currentId) {
        currentId =
            document.getElementById("questionId").value.trim();
    }

    if (!currentId) {

        showMessage(
            "Không tìm thấy câu hỏi cần cập nhật.",
            "error"
        );

        return;
    }

    const question =
        document.getElementById("question").value.trim();

    const type =
        document.getElementById("questionType").value;

    const a =
        document.getElementById("answerA").value.trim();

    const b =
        document.getElementById("answerB").value.trim();

    const c =
        document.getElementById("answerC").value.trim();

    const d =
        document.getElementById("answerD").value.trim();

    let correct = "";
    let answers = "";

    /* ==========================
       ĐÁP ÁN ĐÚNG
    ========================== */

    if (type === "single") {

        const checked =
            document.querySelector(
                "input[name='correct']:checked"
            );

        if (checked) {
            correct = checked.value;
        }

    } else {

        const checked =
            document.querySelectorAll(
                "#correctAnswerBox input[type='checkbox']:checked"
            );

        answers = Array.from(checked)
            .map(item => item.value)
            .join(",");

        correct = answers;

    }

    /* ==========================
       KIỂM TRA DỮ LIỆU
    ========================== */

    if (!question || !a || !b || !c || !d) {

        showMessage(
            "Vui lòng nhập đầy đủ thông tin.",
            "error"
        );

        return;

    }

    if (type === "single" && !correct) {

        showMessage(
            "Vui lòng chọn đáp án đúng.",
            "error"
        );

        return;

    }

    if (type === "multiple" && !answers) {

        showMessage(
            "Vui lòng chọn ít nhất một đáp án đúng.",
            "error"
        );

        return;

    }

    try {

        showLoading("Đang cập nhật câu hỏi...");

        const payload = {
            action: "updateQuestion",
            id: currentId,
            question: question,
            type: type,
            a: a,
            b: b,
            c: c,
            d: d,
            correct: correct,
            answers: answers
        };

        console.log(
            "Dữ liệu cập nhật gửi đi:",
            JSON.stringify(payload)
        );

        const response = await fetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            redirect: "follow",
            body: JSON.stringify(payload)
        });

        console.log(
            "HTTP Status:",
            response.status
        );

        const text = await response.text();

        console.log(text);

        if (!response.ok) {
            throw new Error(
                "HTTP " + response.status
            );
        }

        let result;

        try {

            result = JSON.parse(text);

        } catch (e) {

            throw new Error(
                "Server trả về dữ liệu không hợp lệ."
            );

        }

        if (!result.success) {

            throw new Error(
                result.message ||
                "Không thể cập nhật câu hỏi."
            );

        }

        showMessage(
            "Cập nhật câu hỏi thành công.",
            "success"
        );

        resetForm();

        currentId = "";

       await loadQuestions(true);
    } catch (err) {

        console.error(err);

        showMessage(
            err.message ||
            "Không thể kết nối tới máy chủ.",
            "error"
        );

    } finally {

        hideLoading();

    }

}

/* ==========================================
   XÓA CÂU HỎI
========================================== */
async function deleteQuestion(id){
    console.log("API =", API);
    if(!confirm("Bạn có chắc muốn xóa câu hỏi này?")){
        return;
    }
    try{
        const formData=new URLSearchParams();
        formData.append("action","deleteQuestion");
        formData.append("id",id);
        const response=await fetch(API,{method:"POST",body:formData});
        const result=await response.json();
        if(!result.success){
            throw new Error(result.message);
        }
        showMessage("Đã xóa câu hỏi.");
        await loadQuestions(true);
    }
    catch(err){
        console.error(err);
        showMessage(err.message);
    }
}

/* ==========================================
   IMPORT EXCEL
========================================== */

async function importQuestions(event) {

    const file =
        event.target.files[0];

    if (!file) {

        showMessage("Chưa chọn file Excel.");

        return;

    }

    /* Kiểm tra định dạng file */

    const ext =
        file.name
            .split(".")
            .pop()
            .toLowerCase();

    if (ext !== "xlsx" && ext !== "xls") {

        showMessage("Chỉ hỗ trợ file Excel (.xlsx hoặc .xls).");

        event.target.value = "";

        return;

    }

    console.log("Đã chọn file:", file.name);

    const reader =
        new FileReader();

    reader.onload = async function (e) {

        try {

            const workbook =
                XLSX.read(
                    e.target.result,
                    {
                        type: "binary"
                    }
                );

            const sheet =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];

            const data =
                XLSX.utils.sheet_to_json(
                    sheet,
                    {
                        defval: ""
                    }
                );

            console.log(data);

            if (data.length === 0) {

                showMessage(
                    "File Excel không có dữ liệu."
                );

                return;

            }

            const formData =
                new URLSearchParams();

            formData.append(
                "action",
                "importQuestions"
            );

            formData.append(
                "questions",
                JSON.stringify(data)
            );

            const response =
                await fetch(API, {

                    method: "POST",

                    body: formData

                });

            const result =
                await response.json();

            if (!result.success) {

                throw new Error(
                    result.message
                );

            } 
            
            showMessage(
                "Đã import " +
                data.length +
                " câu hỏi."
            );

            loadQuestions();

        }

        catch (err) {

            console.error(err);

            showMessage(
                err.message ||
                "Import thất bại."
            );

        }

        finally {

            /* Cho phép chọn lại cùng một file */

            event.target.value = "";

        }

    };

    reader.onerror = function () {

        showMessage(
            "Không thể đọc file Excel."
        );

        event.target.value = "";

    };

    reader.readAsBinaryString(file);

}

/* ==========================================
   HIỂN THỊ THÔNG BÁO
========================================== */
function showMessage(text,type="success"){
    const box=document.getElementById("message");
    if(!box){
        alert(text);
        return;
    }
    box.textContent=text;
    box.className="message "+type;
    box.style.display="block";
    setTimeout(()=>{
        box.style.display="none";
        box.textContent="";
        box.className="message";
    },3000);
}

/* ==========================================
   LÀM MỚI DANH SÁCH
========================================== */
function refreshQuestions(){
    loadQuestions();
}

/* ==========================================
   ENTER ĐỂ LƯU
========================================== */
document.addEventListener("keydown",function(e){
    if(e.ctrlKey&&e.key==="Enter"){
        if(currentId){
            updateQuestion(e);
        }
        else{
            addQuestion();
        }
    }
});

/* ==========================================
   CHANGE QUESTION TYPE
========================================== */

function changeQuestionType(){

    const type =
        document.getElementById("questionType");

    const box =
        document.getElementById("correctAnswerBox");

    if(!type || !box){
        return;
    }

    /* ======================
       TRẮC NGHIỆM 1 ĐÁP ÁN
    ======================= */

    if(type.value==="single"){

        box.innerHTML=`
        <div class="correct-list">
            <label class="correct-item">
                <input type="radio" name="correct" value="A" checked>
                <span>A</span>
            </label>
            <label class="correct-item">
                <input type="radio" name="correct" value="B">
                <span>B</span>
            </label>
            <label class="correct-item">
                <input type="radio" name="correct" value="C">
                <span>C</span>
            </label>
            <label class="correct-item">
                <input type="radio" name="correct" value="D">
                <span>D</span>
            </label>
        </div>`;

    }

    /* ======================
       TRẮC NGHIỆM NHIỀU ĐÁP ÁN
    ======================= */

    else if(type.value==="multiple"){

        box.innerHTML=`
        <div class="correct-list">
            <label class="correct-item">
                <input type="checkbox" name="correct" value="A">
                <span>A</span>
            </label>
            <label class="correct-item">
                <input type="checkbox" name="correct" value="B">
                <span>B</span>
            </label>
            <label class="correct-item">
                <input type="checkbox" name="correct" value="C">
                <span>C</span>
            </label>
            <label class="correct-item">
                <input type="checkbox" name="correct" value="D">
                <span>D</span>
            </label>
        </div>`;

    }

}

/* ==========================================
   TÌM KIẾM
========================================== */

function searchQuestions(){

    const keyword =
        removeVietnamese(
            document
            .getElementById("searchQuestion")
            .value
            .trim()
        );

    const rows =
        document.querySelectorAll(
            "#questionTable tr"
        );

    let found = 0;

    rows.forEach(row=>{

        const text =
            removeVietnamese(
                row.innerText
            );

        if(
            keyword==="" ||
            text.includes(keyword)
        ){

            row.style.display="";

            found++;

        }

        else{

            row.style.display="none";

        }

    });

    if(
        found===0 &&
        keyword!==""
    ){

        showMessage(
            "Không tìm thấy câu hỏi."
        );

    }

}

/* ==========================================
   BỎ DẤU TIẾNG VIỆT
========================================== */

function removeVietnamese(str){

    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"")
        .replace(/đ/g,"d")
        .replace(/Đ/g,"d");

}

/* ==========================================
   HIỂN THỊ LOADING
========================================== */
function showLoading(message = "Đang xử lý...") {
    let loading = document.getElementById("loadingOverlay");
    if (!loading) {

        loading = document.createElement("div");

        loading.id = "loadingOverlay";

        loading.style.position = "fixed";
        loading.style.top = "0";
        loading.style.left = "0";
        loading.style.right = "0";
        loading.style.bottom = "0";

        loading.style.background = "rgba(0,0,0,.45)";
        loading.style.display = "flex";
        loading.style.alignItems = "center";
        loading.style.justifyContent = "center";
        loading.style.zIndex = "99999";

        loading.innerHTML = `
            <div style="
                background:#fff;
                padding:20px 35px;
                border-radius:10px;
                font-size:18px;
                font-weight:bold;
                box-shadow:0 5px 20px rgba(0,0,0,.2);
            ">
                ${message}
            </div>
        `;
        document.body.appendChild(loading);
    } else {
        loading.querySelector("div").innerHTML = message;
        loading.style.display = "flex";
    }
}

/* ==========================================
   ẨN LOADING
========================================== */
function hideLoading() {
    const loading = document.getElementById("loadingOverlay");
    if (loading) {
        loading.style.display = "none";
    }
}

/* ==========================================
   RỜI TRANG
========================================== */
window.addEventListener("beforeunload",function(){
    currentId="";
});