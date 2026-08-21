/* =====================================================
   STOCK BARANG APPLICATION
===================================================== */


/* =====================================================
   DATA
===================================================== */

let dataExcel = [];

let tanggalDipilih = "";

let transactions =
    JSON.parse(
        localStorage.getItem(
            "stock_transactions"
        ) || "[]"
    );


let selectedProduct = null;

let selectedTransactionType = "";


/* =====================================================
   IMPORT EXCEL
===================================================== */

document
.getElementById("excelFile")
.addEventListener(
    "change",
    async function(event) {

        const file =
            event.target.files[0];

        if (!file) return;


        const status =
            document.getElementById(
                "fileStatus"
            );


        status.textContent =
            "⏳ Membaca " +
            file.name +
            "...";


        try {

            const buffer =
                await file.arrayBuffer();


            const workbook =
                XLSX.read(
                    buffer,
                    {
                        type: "array"
                    }
                );


            const sheetName =
                workbook.SheetNames[0];


            const worksheet =
                workbook.Sheets[
                    sheetName
                ];


            const rows =
                XLSX.utils.sheet_to_json(
                    worksheet,
                    {
                        header: 1,
                        defval: null,
                        raw: true
                    }
                );


            if (
                !rows ||
                rows.length < 2
            ) {

                throw new Error(
                    "Data Excel tidak ditemukan."
                );

            }


            const header =
                rows[0];


            const kolomTanggal = {};


            /* Cari kolom tanggal 1-31 */

            for (
                let c = 0;
                c < header.length;
                c++
            ) {

                const value =
                    header[c];


                if (
                    value === null ||
                    value === undefined
                ) continue;


                const text =
                    String(value)
                    .trim();


                const num =
                    Number(text);


                if (
                    Number.isInteger(num) &&
                    num >= 1 &&
                    num <= 31
                ) {

                    kolomTanggal[
                        String(num)
                    ] = c;

                }

            }


            const jumlahTanggal =
                Object.keys(
                    kolomTanggal
                ).length;


            if (
                jumlahTanggal === 0
            ) {

                throw new Error(
                    "Kolom tanggal 1-31 tidak ditemukan."
                );

            }


            dataExcel = [];


            /* Baca semua barang */

            for (
                let r = 1;
                r < rows.length;
                r++
            ) {

                const row =
                    rows[r];


                const nama =
                    row[0];


                if (
                    nama === null ||
                    nama === undefined ||
                    String(nama).trim() === ""
                ) {

                    continue;

                }


                const barang = {

                    nama:
                        String(nama).trim(),

                    stok: {}

                };


                /* Baca stok tanggal 1-31 */

                for (
                    let tanggal = 1;
                    tanggal <= 31;
                    tanggal++
                ) {

                    const col =
                        kolomTanggal[
                            String(tanggal)
                        ];


                    if (
                        col === undefined
                    ) {

                        continue;

                    }


                    let value =
                        row[col];


                    if (
                        value === null ||
                        value === undefined ||
                        value === ""
                    ) {

                        value = 0;

                    }


                    if (
                        typeof value === "string"
                    ) {

                        value =
                            value
                            .replace(/,/g, "")
                            .trim();

                    }


                    const stok =
                        Number(value);


                    barang.stok[
                        String(tanggal)
                    ] =
                        Number.isFinite(stok)
                            ? stok
                            : 0;

                }


                dataExcel.push(
                    barang
                );

            }


            /* Isi dropdown tanggal */

            const select =
                document.getElementById(
                    "tanggal"
                );


            select.innerHTML =
                `
                <option value="">
                    -- Pilih tanggal --
                </option>
                `;


            for (
                let tanggal = 1;
                tanggal <= 31;
                tanggal++
            ) {

                if (
                    kolomTanggal[
                        String(tanggal)
                    ] !== undefined
                ) {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        String(tanggal);


                    option.textContent =
                        "Tanggal " +
                        tanggal;


                    select.appendChild(
                        option
                    );

                }

            }


            /* Pilih tanggal 1 */

            if (
                jumlahTanggal > 0
            ) {

                tanggalDipilih = "1";

                select.value = "1";

            }


            status.className =
                "status success";


            status.textContent =
                "✅ Berhasil membaca " +
                dataExcel.length +
                " barang.";


            updateTable();

        }


        catch(error) {

            console.error(error);


            status.className =
                "status error";


            status.textContent =
                "❌ " +
                error.message;

        }

    }
);


/* =====================================================
   PILIH TANGGAL
===================================================== */

document
.getElementById("tanggal")
.addEventListener(
    "change",
    function() {

        tanggalDipilih =
            this.value;

        updateTable();

    }
);


/* =====================================================
   SEARCH
===================================================== */

document
.getElementById("search")
.addEventListener(
    "input",
    updateTable
);


/* =====================================================
   HITUNG STOK DASAR
===================================================== */

function getBaseStock(barang) {

    if (
        !tanggalDipilih
    ) {

        return 0;

    }


    return Number(
        barang.stok[
            tanggalDipilih
        ] || 0
    );

}


/* =====================================================
   HITUNG STOK AKTUAL
===================================================== */

function getCurrentStock(barang) {

    let stok =
        getBaseStock(
            barang
        );


    transactions.forEach(
        function(transaction) {


            if (
                transaction.barang !==
                barang.nama
            ) {

                return;

            }


            if (
                transaction.tanggal !==
                tanggalDipilih
            ) {

                return;

            }


            if (
                transaction.type ===
                "masuk"
            ) {

                stok +=
                    transaction.qty;

            }


            if (
                transaction.type ===
                "laku"
            ) {

                stok -=
                    transaction.qty;

            }

        }
    );


    return stok;

}


/* =====================================================
   UPDATE TABLE
===================================================== */

function updateTable() {

    const tbody =
        document.getElementById(
            "stockTable"
        );


    const search =
        document.getElementById(
            "search"
        )
        .value
        .toLowerCase()
        .trim();


    if (
        dataExcel.length === 0
    ) {

        tbody.innerHTML =
            `
            <tr>

                <td
                    colspan="4"
                    class="empty"
                >
                    Import Excel terlebih dahulu
                </td>

            </tr>
            `;


        updateStats();

        return;

    }


    const filtered =
        dataExcel.filter(
            function(barang) {

                return barang.nama
                    .toLowerCase()
                    .includes(search);

            }
        );


    tbody.innerHTML = "";


    filtered.forEach(
        function(barang, index) {


            const stok =
                getCurrentStock(
                    barang
                );


            let statusClass =
                "stock-aman";


            if (
                stok <= 0
            ) {

                statusClass =
                    "stock-habis";

            }

            else if (
                stok <= 5
            ) {

                statusClass =
                    "stock-menipis";

            }


            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML =
                `
                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHTML(
                        barang.nama
                    )}
                </td>

                <td
                    class="${statusClass}"
                >
                    ${formatNumber(stok)}
                </td>

                <td>

                    <button
                        class="action-btn btn-masuk"
                        onclick="openTransaction(
                            '${escapeJS(
                                barang.nama
                            )}',
                            'masuk'
                        )"
                    >
                        ➕ Masuk
                    </button>


                    <button
                        class="action-btn btn-laku"
                        onclick="openTransaction(
                            '${escapeJS(
                                barang.nama
                            )}',
                            'laku'
                        )"
                    >
                        🛒 Laku
                    </button>

                </td>
                `;


            tbody.appendChild(
                tr
            );

        }
    );


    updateStats();

}


/* =====================================================
   STATISTIK
===================================================== */

function updateStats() {

    let total = 0;


    dataExcel.forEach(
        function(barang) {

            total +=
                getCurrentStock(
                    barang
                );

        }
    );


    const transaksiHariIni =
        transactions.filter(
            function(t) {

                return (
                    t.tanggal ===
                    tanggalDipilih
                );

            }
        ).length;


    document.getElementById(
        "totalBarang"
    ).textContent =
        formatNumber(
            dataExcel.length
        );


    document.getElementById(
        "totalStok"
    ).textContent =
        formatNumber(
            total
        );


    document.getElementById(
        "transaksiHariIni"
    ).textContent =
        formatNumber(
            transaksiHariIni
        );


    updateHistoryFilters();

    renderHistory();

}


/* =====================================================
   MODAL
===================================================== */

function openTransaction(
    nama,
    type
) {

    selectedProduct =
        nama;


    selectedTransactionType =
        type;


    const modal =
        document.getElementById(
            "transactionModal"
        );


    const title =
        document.getElementById(
            "modalTitle"
        );


    const product =
        document.getElementById(
            "modalProduct"
        );


    if (
        type === "masuk"
    ) {

        title.textContent =
            "➕ Barang Masuk";

    }

    else {

        title.textContent =
            "🛒 Barang Laku";

    }


    product.textContent =
        nama;


    document.getElementById(
        "transactionQty"
    ).value = 1;


    modal.style.display =
        "flex";

}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeModal() {

    document.getElementById(
        "transactionModal"
    ).style.display =
        "none";

}


/* =====================================================
   SIMPAN TRANSAKSI
===================================================== */

function confirmTransaction() {

    const input =
        document.getElementById(
            "transactionQty"
        );


    const qty =
        Number(
            input.value
        );


    if (
        !Number.isFinite(qty) ||
        qty <= 0
    ) {

        alert(
            "Jumlah harus lebih dari 0."
        );

        return;

    }


    /* Cek stok untuk barang laku */

    if (
        selectedTransactionType ===
        "laku"
    ) {

        const barang =
            dataExcel.find(
                function(item) {

                    return (
                        item.nama ===
                        selectedProduct
                    );

                }
            );


        if (!barang) {

            alert(
                "Barang tidak ditemukan."
            );

            return;

        }


        const stok =
            getCurrentStock(
                barang
            );


        if (
            qty > stok
        ) {

            alert(
                "Jumlah barang laku " +
                "melebihi stok saat ini.\n\n" +
                "Stok tersedia: " +
                stok
            );

            return;

        }

    }


    const transaction = {

        id:
            Date.now(),

        waktu:
            new Date()
            .toLocaleString(
                "id-ID"
            ),

        tanggal:
            tanggalDipilih,

        barang:
            selectedProduct,

        type:
            selectedTransactionType,

        qty:
            qty

    };


    transactions.push(
        transaction
    );


    saveTransactions();


    closeModal();


    updateTable();

}


/* =====================================================
   SIMPAN LOCAL STORAGE
===================================================== */

function saveTransactions() {

    localStorage.setItem(

        "stock_transactions",

        JSON.stringify(
            transactions
        )

    );

}


/* =====================================================
   FILTER RIWAYAT
===================================================== */

function updateHistoryFilters() {

    const dateSelect =
        document.getElementById(
            "historyDateFilter"
        );


    const productSelect =
        document.getElementById(
            "historyProductFilter"
        );


    if (
        !dateSelect ||
        !productSelect
    ) {

        return;

    }


    const oldDate =
        dateSelect.value;


    const oldProduct =
        productSelect.value;


    /* =========================
       TANGGAL
    ========================== */

    dateSelect.innerHTML =
        `
        <option value="">
            Semua tanggal
        </option>
        `;


    const dates =
        [
            ...new Set(
                transactions.map(
                    function(t) {

                        return t.tanggal;

                    }
                )
            )
        ];


    dates.sort(
        function(a, b) {

            return (
                Number(a) -
                Number(b)
            );

        }
    );


    dates.forEach(
        function(tanggal) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                tanggal;


            option.textContent =
                "Tanggal " +
                tanggal;


            dateSelect.appendChild(
                option
            );

        }
    );


    /* =========================
       BARANG
    ========================== */

    productSelect.innerHTML =
        `
        <option value="">
            Semua barang
        </option>
        `;


    const products =
        [
            ...new Set(
                transactions.map(
                    function(t) {

                        return t.barang;

                    }
                )
            )
        ];


    products.sort();


    products.forEach(
        function(product) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                product;


            option.textContent =
                product;


            productSelect.appendChild(
                option
            );

        }
    );


    /* Kembalikan pilihan */

    if (
        dates.includes(
            oldDate
        )
    ) {

        dateSelect.value =
            oldDate;

    }


    if (
        products.includes(
            oldProduct
        )
    ) {

        productSelect.value =
            oldProduct;

    }

}


/* =====================================================
   RENDER HISTORY
===================================================== */

function renderHistory() {

    const tbody =
        document.getElementById(
            "historyTable"
        );


    const dateFilter =
        document.getElementById(
            "historyDateFilter"
        ).value;


    const productFilter =
        document.getElementById(
            "historyProductFilter"
        ).value;


    const typeFilter =
        document.getElementById(
            "historyTypeFilter"
        ).value;


    const filtered =
        transactions.filter(
            function(transaction) {


                if (
                    dateFilter !== "" &&
                    transaction.tanggal !==
                    dateFilter
                ) {

                    return false;

                }


                if (
                    productFilter !== "" &&
                    transaction.barang !==
                    productFilter
                ) {

                    return false;

                }


                if (
             
