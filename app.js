// الرابط الأساسي لجلب أسعار العملات المباشرة
const API_URL = "https://open.er-api.com/v6/latest/";

// ربط عناصر المدخلات واختيار العملات من واجهة الـ HTML
const amountInput = document.getElementById("amount");
const fromSelect = document.getElementById("from");
const toSelect = document.getElementById("to");
const searchFrom = document.getElementById("searchFrom");
const searchTo = document.getElementById("searchTo");

// ربط عناصر الأعلام والصور التفاعلية
const flagFrom = document.getElementById("flagFrom");
const flagTo = document.getElementById("flagTo");

// ربط عناصر عرض النتيجة والتحديث
const result = document.getElementById("result");
const updated = document.getElementById("updated");
const swapBtn = document.getElementById("swapBtn");

// متغيرات لتخزين قائمة العملات محلياً لتشغيل الفلترة والبحث
let rates = {};
let currencies = [];

// دالة تحميل البيانات عند فتح التطبيق لأول مرة
async function loadCurrencies() {
    try {
        const response = await fetch(API_URL + "USD");
        const data = await response.json();

        rates = data.rates;
        currencies = Object.keys(rates).sort(); // ترتيب العملات أبجدياً

        // بناء القوائم المنسدلة للعملات بالبيانات المستلمة
        renderOptions(fromSelect, currencies);
        renderOptions(toSelect, currencies);

        // وضع خيارات افتراضية تناسب واجهتنا (السعودية ومصر)
        fromSelect.value = "SAR";
        toSelect.value = "EGP";

        // تحديث أعلام الدول الافتراضية
        updateFlag(fromSelect.value, flagFrom);
        updateFlag(toSelect.value, flagTo);

        // تشغيل التحويل الفوري
        convert();

    } catch (error) {
        result.textContent = "تعذر تحميل العملات.. تحقق من الاتصال";
        console.error("Error loading currencies:", error);
    }
}

// دالة بناء خيارات الـ Select وإعادة ملئها عند البحث والفلترة
function renderOptions(selectElement, list) {
    const currentValue = selectElement.value; // حفظ القيمة الحالية قبل مسح القائمة
    selectElement.innerHTML = ""; // تنظيف الخيارات القديمة

    list.forEach(code => {
        const info = currencyInfo[code];
        // إذا كانت العملة معرفة باللغة العربية في ملف currencies.js نضع اسمها، وإلا نكتفي بالرمز
        const label = info ? `${info.name} (${code})` : code;
        selectElement.innerHTML += `<option value="${code}">${label}</option>`;
    });

    // إعادة تثبيت العملة المحددة مسبقاً إذا كانت متوفرة بعد التصفية
    if (list.includes(currentValue)) {
        selectElement.value = currentValue;
    } else if (list.length > 0) {
        selectElement.value = list[0]; // اختيار أول عملة في نتائج البحث لتفادي الفراغ
    }
}

// دالة تحديث صور الأعلام تلقائياً بناءً على العملة
function updateFlag(currencyCode, flagImgElement) {
    const info = currencyInfo[currencyCode];
    if (info && info.code) {
        // نستخدم خدمة flagsapi المجانية والمستقرة لجلب الأعلام بصيغة فلات واضحة
        flagImgElement.src = `https://flagsapi.com/${info.code}/flat/64.png`;
        flagImgElement.style.display = "block";
    } else {
        // إخفاء عنصر الصورة في حال عدم توفر علم للعملة المحددة
        flagImgElement.style.display = "none";
    }
}

// دالة فلترة وتصفية القائمة أثناء كتابة المستخدم في مربع البحث
function filterCurrencies(e, selectElement, flagImgElement) {
    const term = e.target.value.toUpperCase().trim();
    
    const filtered = currencies.filter(code => {
        const info = currencyInfo[code];
        const arabicName = info ? info.name : "";
        return code.includes(term) || arabicName.includes(term);
    });

    renderOptions(selectElement, filtered);
    updateFlag(selectElement.value, flagImgElement);
    convert(); // إعادة الحساب المباشر بناءً على العملة المصفاة المحددة
}

// دالة حساب المبالغ والتحويل الفعلي عبر الـ API
async function convert() {
    const amount = parseFloat(amountInput.value);

    // التحقق من أن المبلغ المدخل رقم صحيح وأكبر من الصفر
    if (!amount || amount <= 0) {
        result.textContent = "--";
        return;
    }

    const from = fromSelect.value;
    const to = toSelect.value;

    if (!from || !to) return;

    try {
        const response = await fetch(API_URL + from);
        const data = await response.json();

        const rate = data.rates[to];
        const total = (amount * rate).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // عرض النتيجة بالتنسيق الاحترافي
        result.innerHTML = `
            <div>${amount.toLocaleString("ar-EG")} ${from}</div>
            <div style="font-size:18px;margin:10px 0;">⬇️</div>
            <div>${total} ${to}</div>
        `;

        document.getElementById("rate").textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
        updated.textContent = "آخر تحديث: " + new Date(data.time_last_update_utc).toLocaleString("ar-EG");
    } catch (error) {
        result.textContent = "خطأ في الاتصال بالشبكة";
        console.error("Error during conversion:", error);
    }
}

// تفعيل زر التبديل (Swap) لعكس العملات المحول منها وإليها وحساب النتيجة فوراً
swapBtn.onclick = () => {
    const tempValue = fromSelect.value;
    
    // للتأكد من أن العملة المراد التبديل إليها موجودة في قائمة الخيارات الحالية (خاصة عند استخدام الفلترة)
    renderOptions(fromSelect, currencies);
    renderOptions(toSelect, currencies);

    fromSelect.value = toSelect.value;
    toSelect.value = tempValue;

    // تحديث الأعلام لتطابق التبديل الجديد
    updateFlag(fromSelect.value, flagFrom);
    updateFlag(toSelect.value, flagTo);

    // تفريغ خانات البحث بعد التبديل لتسهيل التصفح من جديد
    searchFrom.value = "";
    searchTo.value = "";

    convert();
};

// ربط جميع أحداث التغيير في الواجهة لتحديث البيانات تلقائياً وفورياً
amountInput.addEventListener("input", convert);

fromSelect.addEventListener("change", () => {
    updateFlag(fromSelect.value, flagFrom);
    convert();
});

toSelect.addEventListener("change", () => {
    updateFlag(toSelect.value, flagTo);
    convert();
});

// ربط خانات البحث بأحداث الكتابة (Input Events) للفلترة الفورية
searchFrom.addEventListener("input", (e) => filterCurrencies(e, fromSelect, flagFrom));
searchTo.addEventListener("input", (e) => filterCurrencies(e, toSelect, flagTo));

// بدء تشغيل التطبيق وجلب البيانات لأول مرة عند تحميل الصفحة
loadCurrencies();

// تفعيل ميزة تشغيل التطبيق في وضع عدم الاتصال بالإنترنت (Offline Mode) عبر الـ Service Worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then(() => console.log("Service Worker Registered Successfully"))
            .catch(err => console.error("Service Worker Registration Failed:", err));
    });
}

// إعدادات لوجيك تشغيل وحفظ وضع المظهر (الوضع الليلي / الفاتح) في المتصفح محلياً
const themeBtn = document.getElementById("themeBtn");

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeBtn.textContent = "☀️ الوضع الفاتح";
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    if (document.body.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
        themeBtn.textContent = "☀️ الوضع الفاتح";
    } else {
        localStorage.setItem("theme", "light");
        themeBtn.textContent = "🌙 الوضع الليلي";
    }
});
