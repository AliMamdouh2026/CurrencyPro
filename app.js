const API_URL = "https://open.er-api.com/v6/latest/";

const amountInput = document.getElementById("amount");
const fromSelect = document.getElementById("from");
const toSelect = document.getElementById("to");
const result = document.getElementById("result");
const updated = document.getElementById("updated");
const swapBtn = document.getElementById("swapBtn");

let rates = {};

// تحميل العملات
async function loadCurrencies() {
    try {
        const response = await fetch(API_URL + "USD");
        const data = await response.json();

        rates = data.rates;

        const currencies = Object.keys(rates).sort();

        currencies.forEach(code => {
            fromSelect.innerHTML += `<option value="${code}">${code}</option>`;
            toSelect.innerHTML += `<option value="${code}">${code}</option>`;
        });

        fromSelect.value = "SAR";
        toSelect.value = "EGP";

        convert();

    } catch {
        result.textContent = "تعذر تحميل العملات";
    }
}

// التحويل
async function convert() {

    const amount = parseFloat(amountInput.value);

    if (!amount || amount <= 0) {
        result.textContent = "--";
        return;
    }

    const from = fromSelect.value;
    const to = toSelect.value;

    const response = await fetch(API_URL + from);
    const data = await response.json();

    const rate = data.rates[to];

    const total = (amount * rate).toFixed(2);

    result.innerHTML = `
<div>${amount} ${from}</div>
<div style="font-size:18px;margin:10px 0;">⬇️</div>
<div>${total} ${to}</div>
`;

document.getElementById("rate").textContent =
`1 ${from} = ${rate.toFixed(4)} ${to}`;

updated.textContent =
"آخر تحديث: " +
new Date(data.time_last_update_utc).toLocaleString("ar-EG");

}

// تبديل العملات
swapBtn.onclick = () => {

    [fromSelect.value, toSelect.value] =
    [toSelect.value, fromSelect.value];

    convert();

};

// الأحداث
amountInput.addEventListener("input", convert);
fromSelect.addEventListener("change", convert);
toSelect.addEventListener("change", convert);

// البداية
loadCurrencies();
// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => {
        console.log("Service Worker Registered");
      })
      .catch(err => {
        console.log("Service Worker Error:", err);
      });
  });
}
// الوضع الليلي
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
