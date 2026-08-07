/* Ultimate Joy Home - Application Logic & State Engine */

// Default Application State
const DEFAULT_COMPANY = {
    name: "Ultimate Joy Home",
    phone: "+233 24 000 0000 / +233 50 000 0000",
    email: "info@ultimatejoyhome.com",
    address: "Accra, Ghana - Solar & Electrical Center",
    bank: "Bank: GCB Bank | Acc Name: Ultimate Joy Home | Acc No: 1234567890\nMoMo Pay: +233 24 000 0000 (Ultimate Joy Home)"
};

const DEFAULT_CATALOG = [
    { id: 'cat-1', name: '550W Mono Solar Panel (Tier 1)', category: 'Solar Panels', price: 1650 },
    { id: 'cat-2', name: '5.0 kVA Hybrid Solar Inverter (48V)', category: 'Inverters', price: 8500 },
    { id: 'cat-3', name: '3.5 kVA Hybrid Solar Inverter (24V)', category: 'Inverters', price: 5800 },
    { id: 'cat-4', name: '1.5 kVA Pure Sine Inverter (12V)', category: 'Inverters', price: 3200 },
    { id: 'cat-5', name: '5.12 kWh Lithium LiFePO4 Wall Battery', category: 'Batteries', price: 16500 },
    { id: 'cat-6', name: '220Ah 12V Deep Cycle Solar Battery', category: 'Batteries', price: 2900 },
    { id: 'cat-7', name: '16mm Solar DC Cable (Red/Black per meter)', category: 'Wiring & Accessories', price: 45 },
    { id: 'cat-8', name: '4mm AC Copper Cable (100m Roll)', category: 'Wiring & Accessories', price: 950 },
    { id: 'cat-9', name: '63A AC/DC Distribution & Protection Box', category: 'Wiring & Accessories', price: 650 },
    { id: 'cat-10', name: 'Solar Panel Roof Mounting Racks & Clamps', category: 'Wiring & Accessories', price: 180 },
    { id: 'cat-11', name: 'Automatic Changeover Switch 100A', category: 'Wiring & Accessories', price: 1200 },
    { id: 'cat-12', name: 'Solar Installation & System Commissioning Labor', category: 'Installation & Labor', price: 2500 }
];

const DEFAULT_APPLIANCES = [
    { name: 'LED Light Bulbs', watts: 10, qty: 10, hours: 8 },
    { name: 'Ceiling / Standing Fans', watts: 75, qty: 3, hours: 10 },
    { name: 'Smart TV (55 inch)', watts: 120, qty: 1, hours: 6 },
    { name: 'Double Door Refrigerator', watts: 250, qty: 1, hours: 24 },
    { name: '1.5 HP Inverter AC', watts: 1200, qty: 1, hours: 6 }
];

// Local Data Store Initializers
let appSettings = JSON.parse(localStorage.getItem('ujh_settings')) || DEFAULT_COMPANY;
let appCatalog = JSON.parse(localStorage.getItem('ujh_catalog')) || DEFAULT_CATALOG;
let savedEstimates = JSON.parse(localStorage.getItem('ujh_estimates')) || [];
let currentAppliances = JSON.parse(localStorage.getItem('ujh_calc_appliances')) || [...DEFAULT_APPLIANCES];
let currentInvoiceItems = [];

// Initialize App on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initDateInputs();
    populateCompanySettingsForm();
    renderCatalogDropdown();
    renderCatalogGrid();
    renderApplianceTable();
    renderSavedEstimatesList();

    // Set default invoice number
    const nextNum = savedEstimates.length + 1;
    document.getElementById('inv-number').value = `UJH-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;

    // Add initial line item to invoice
    addInvoiceLineItem('5.0 kVA Hybrid Solar Inverter (48V)', 1, 8500);
    addInvoiceLineItem('550W Mono Solar Panel (Tier 1)', 6, 1650);
    addInvoiceLineItem('5.12 kWh Lithium LiFePO4 Wall Battery', 1, 16500);
    addInvoiceLineItem('Solar Installation & System Commissioning Labor', 1, 2500);
});

// Navigation Tab Switcher
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-section').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    if (btnElement) {
        btnElement.classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initDateInputs() {
    const dateInput = document.getElementById('inv-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}

/* ==========================================================================
   1. SOLAR LOAD CALCULATOR LOGIC
   ========================================================================== */

function renderApplianceTable() {
    const tbody = document.getElementById('appliance-table-body');
    tbody.innerHTML = '';

    if (currentAppliances.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No appliances added yet. Tap "+ Add Appliance" below!</td></tr>`;
        recalculateSolarLoad();
        return;
    }

    currentAppliances.forEach((app, index) => {
        const dailyWh = app.watts * app.qty * app.hours;
        const tr = document.createElement('tr');
        tr.className = 'item-row-card';
        tr.innerHTML = `
      <td class="col-name" data-label="Appliance">
        <input type="text" value="${app.name}" placeholder="Appliance Name" oninput="updateAppliance(${index}, 'name', this.value)">
      </td>
      <td class="col-watts" data-label="Watts">
        <div class="stepper-group">
          <button type="button" class="stepper-btn" onclick="stepAppliance(${index}, 'watts', -25)">-</button>
          <input type="number" value="${app.watts}" min="1" oninput="updateAppliance(${index}, 'watts', this.value)">
          <button type="button" class="stepper-btn" onclick="stepAppliance(${index}, 'watts', 25)">+</button>
        </div>
      </td>
      <td class="col-qty" data-label="Qty">
        <div class="stepper-group">
          <button type="button" class="stepper-btn" onclick="stepAppliance(${index}, 'qty', -1)">-</button>
          <input type="number" value="${app.qty}" min="1" oninput="updateAppliance(${index}, 'qty', this.value)">
          <button type="button" class="stepper-btn" onclick="stepAppliance(${index}, 'qty', 1)">+</button>
        </div>
      </td>
      <td class="col-hours" data-label="Hours/Day">
        <div class="stepper-group">
          <button type="button" class="stepper-btn" onclick="stepAppliance(${index}, 'hours', -1)">-</button>
          <input type="number" value="${app.hours}" min="1" max="24" oninput="updateAppliance(${index}, 'hours', this.value)">
          <button type="button" class="stepper-btn" onclick="stepAppliance(${index}, 'hours', 1)">+</button>
        </div>
      </td>
      <td class="col-wh" data-label="Daily Wh">
        <span class="wh-badge">${dailyWh.toLocaleString()} Wh</span>
      </td>
      <td class="col-action">
        <button type="button" class="btn btn-sm btn-danger btn-del" onclick="removeAppliance(${index})" title="Remove appliance">✕ Delete</button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    recalculateSolarLoad();
}

function stepAppliance(index, field, delta) {
    if (!currentAppliances[index]) return;
    const currentVal = parseFloat(currentAppliances[index][field]) || 0;
    let newVal = currentVal + delta;
    if (field === 'hours') newVal = Math.min(24, Math.max(1, newVal));
    else if (field === 'qty') newVal = Math.max(1, newVal);
    else if (field === 'watts') newVal = Math.max(1, newVal);
    currentAppliances[index][field] = newVal;
    saveAppliancesState();
    renderApplianceTable();
}

function loadPresetKitPrompt() {
    const presetCardContainer = document.querySelector('.preset-grid');
    if (presetCardContainer) {
        presetCardContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function addApplianceRow() {
    currentAppliances.push({ name: 'New Appliance', watts: 100, qty: 1, hours: 5 });
    saveAppliancesState();
    renderApplianceTable();
}

function removeAppliance(index) {
    currentAppliances.splice(index, 1);
    saveAppliancesState();
    renderApplianceTable();
}

function updateAppliance(index, field, value) {
    if (field === 'name') {
        currentAppliances[index][field] = value;
    } else {
        currentAppliances[index][field] = parseFloat(value) || 0;
    }
    saveAppliancesState();
    recalculateSolarLoad();
}


function saveAppliancesState() {
    localStorage.setItem('ujh_calc_appliances', JSON.stringify(currentAppliances));
}

function recalculateSolarLoad() {
    let totalMaxWatts = 0;
    let totalDailyWh = 0;

    currentAppliances.forEach(app => {
        totalMaxWatts += (app.watts * app.qty);
        totalDailyWh += (app.watts * app.qty * app.hours);
    });

    const totalDailyKwh = (totalDailyWh / 1000).toFixed(2);

    // Inverter Recommendation (Watts * 1.25 safety factor, min 1 kVA)
    const inverterWatts = totalMaxWatts * 1.25;
    let recInverterKva = (inverterWatts / 800).toFixed(1); // pf 0.8
    if (recInverterKva < 1) recInverterKva = 1.5;

    // Solar Panel Recommendation (Daily Wh / 4.5 peak sun hours * 1.3 loss factor)
    const solarWattageReq = Math.ceil((totalDailyWh / 4.5) * 1.3);
    const panelCount = Math.ceil(solarWattageReq / 550);

    // Battery Bank Ah Requirements
    // 48V Bank (80% DOD): Daily Wh / (48 * 0.8)
    const batteryAh48V = Math.ceil(totalDailyWh / (48 * 0.8));
    // 24V Bank: Daily Wh / (24 * 0.8)
    const batteryAh24V = Math.ceil(totalDailyWh / (24 * 0.8));

    // Lithium Energy Equivalent (kWh)
    const lithiumKwh = (totalDailyWh / 1000 * 1.2).toFixed(1);
    const tubularCount = Math.ceil(batteryAh24V / 220);

    // DOM Updates
    document.getElementById('calc-total-watts').innerText = `${totalMaxWatts.toLocaleString()} W`;
    document.getElementById('calc-daily-kwh').innerText = `${totalDailyKwh} kWh`;
    document.getElementById('calc-inverter').innerText = `Rec. Inverter: ${recInverterKva} kVA`;
    document.getElementById('calc-panels').innerText = `Rec. Solar: ${solarWattageReq} W (${panelCount} x 550W Panels)`;
    document.getElementById('calc-battery-48v').innerText = `${batteryAh48V} Ah`;
    document.getElementById('calc-lithium').innerText = `Lithium: ${lithiumKwh} kWh`;
    document.getElementById('calc-battery-24v').innerText = `${batteryAh24V} Ah`;
}

// Select Predefined System Kits
function selectPreset(kitType) {
    document.querySelectorAll('.preset-card').forEach(card => card.classList.remove('active'));

    const selectedCard = event ? event.currentTarget : null;
    if (selectedCard && selectedCard.classList) {
        selectedCard.classList.add('active');
    }

    if (kitType === '1.5kva') {
        currentAppliances = [
            { name: 'LED Bulbs', watts: 10, qty: 6, hours: 8 },
            { name: 'Standing Fan', watts: 75, qty: 2, hours: 8 },
            { name: 'Smart TV', watts: 100, qty: 1, hours: 6 }
        ];
    } else if (kitType === '3kva') {
        currentAppliances = [
            { name: 'LED Bulbs', watts: 10, qty: 10, hours: 10 },
            { name: 'Ceiling Fans', watts: 75, qty: 3, hours: 10 },
            { name: 'Smart TV', watts: 120, qty: 1, hours: 8 },
            { name: 'Single Door Fridge', watts: 180, qty: 1, hours: 24 }
        ];
    } else if (kitType === '5kva') {
        currentAppliances = [
            { name: 'LED Bulbs', watts: 10, qty: 15, hours: 10 },
            { name: 'Ceiling Fans', watts: 75, qty: 4, hours: 12 },
            { name: 'Smart TV 65"', watts: 150, qty: 2, hours: 8 },
            { name: 'Double Door Fridge', watts: 250, qty: 1, hours: 24 },
            { name: '1.5 HP Inverter AC', watts: 1200, qty: 1, hours: 6 },
            { name: 'Water Pump', watts: 750, qty: 1, hours: 1 }
        ];
    } else if (kitType === '10kva') {
        currentAppliances = [
            { name: 'LED Bulbs', watts: 10, qty: 25, hours: 12 },
            { name: 'Ceiling Fans', watts: 75, qty: 6, hours: 12 },
            { name: 'Smart TVs', watts: 150, qty: 3, hours: 8 },
            { name: 'Large Double Door Fridges', watts: 300, qty: 2, hours: 24 },
            { name: '1.5 HP Inverter ACs', watts: 1200, qty: 3, hours: 8 },
            { name: 'Water Pump 1.5HP', watts: 1100, qty: 1, hours: 2 }
        ];
    }

    saveAppliancesState();
    renderApplianceTable();
}

function convertLoadToInvoice() {
    let totalDailyWh = 0;
    let totalMaxWatts = 0;
    currentAppliances.forEach(app => {
        totalMaxWatts += (app.watts * app.qty);
        totalDailyWh += (app.watts * app.qty * app.hours);
    });

    // Calculate System Components
    const panelCount = Math.max(2, Math.ceil(((totalDailyWh / 4.5) * 1.3) / 550));

    let inverterName = '3.5 kVA Hybrid Solar Inverter (24V)';
    let inverterPrice = 5800;
    let batteryName = '220Ah 12V Deep Cycle Solar Battery';
    let batteryQty = 2;
    let batteryPrice = 2900;

    if (totalMaxWatts > 3000) {
        inverterName = '5.0 kVA Hybrid Solar Inverter (48V)';
        inverterPrice = 8500;
        batteryName = '5.12 kWh Lithium LiFePO4 Wall Battery';
        batteryQty = 1;
        batteryPrice = 16500;
    } else if (totalMaxWatts <= 1200) {
        inverterName = '1.5 kVA Pure Sine Inverter (12V)';
        inverterPrice = 3200;
        batteryName = '220Ah 12V Deep Cycle Solar Battery';
        batteryQty = 1;
        batteryPrice = 2900;
    }

    // Clear & Replace Invoice Items
    currentInvoiceItems = [];
    currentInvoiceItems.push({ name: inverterName, qty: 1, unitPrice: inverterPrice });
    currentInvoiceItems.push({ name: '550W Mono Solar Panel (Tier 1)', qty: panelCount, unitPrice: 1650 });
    currentInvoiceItems.push({ name: batteryName, qty: batteryQty, unitPrice: batteryPrice });
    currentInvoiceItems.push({ name: '16mm Solar DC Cable (Red/Black per meter)', qty: 30, unitPrice: 45 });
    currentInvoiceItems.push({ name: 'Solar Panel Roof Mounting Racks & Clamps', qty: panelCount, unitPrice: 180 });
    currentInvoiceItems.push({ name: '63A AC/DC Distribution & Protection Box', qty: 1, unitPrice: 650 });
    currentInvoiceItems.push({ name: 'Solar Installation & System Commissioning Labor', qty: 1, unitPrice: 2500 });

    renderInvoiceItemsTable();

    // Switch to Invoice Tab
    switchTab('invoice', document.querySelectorAll('.nav-btn')[1]);
}


/* ==========================================================================
   2. INVOICE & ESTIMATE BUILDER LOGIC
   ========================================================================== */

function updateDocTypeLabel() {
    const docType = document.getElementById('inv-type').value;
    const numInput = document.getElementById('inv-number');
    const year = new Date().getFullYear();
    const seq = String(savedEstimates.length + 1).padStart(3, '0');

    if (docType === 'INVOICE') {
        numInput.value = `UJH-INV-${year}-${seq}`;
    } else if (docType === 'RECEIPT') {
        numInput.value = `UJH-REC-${year}-${seq}`;
    } else {
        numInput.value = `UJH-${year}-${seq}`;
    }
}

function renderInvoiceItemsTable() {
    const tbody = document.getElementById('invoice-items-body');
    tbody.innerHTML = '';

    if (currentInvoiceItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No items added to invoice yet. Tap "+ Custom Line" or add from catalog above!</td></tr>`;
        calculateInvoiceTotals();
        return;
    }

    currentInvoiceItems.forEach((item, index) => {
        const itemTotal = item.qty * item.unitPrice;
        const tr = document.createElement('tr');
        tr.className = 'item-row-card';
        tr.innerHTML = `
      <td class="col-name" data-label="Item Description">
        <input type="text" value="${item.name}" placeholder="Item Description" oninput="updateInvoiceItem(${index}, 'name', this.value)">
      </td>
      <td class="col-qty" data-label="Qty">
        <div class="stepper-group">
          <button type="button" class="stepper-btn" onclick="stepInvoiceItem(${index}, 'qty', -1)">-</button>
          <input type="number" value="${item.qty}" min="1" oninput="updateInvoiceItem(${index}, 'qty', this.value)">
          <button type="button" class="stepper-btn" onclick="stepInvoiceItem(${index}, 'qty', 1)">+</button>
        </div>
      </td>
      <td class="col-price" data-label="Unit Price (GH₵)">
        <input type="number" value="${item.unitPrice}" min="0" step="0.01" oninput="updateInvoiceItem(${index}, 'unitPrice', this.value)">
      </td>
      <td class="col-wh" data-label="Total (GH₵)">
        <span class="wh-badge" style="color: var(--accent-emerald);">GH₵ ${itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </td>
      <td class="col-action">
        <button type="button" class="btn btn-sm btn-danger btn-del" onclick="removeInvoiceItem(${index})" title="Remove line item">✕ Delete</button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    calculateInvoiceTotals();
}

function stepInvoiceItem(index, field, delta) {
    if (!currentInvoiceItems[index]) return;
    const currentVal = parseFloat(currentInvoiceItems[index][field]) || 0;
    const newVal = Math.max(1, currentVal + delta);
    currentInvoiceItems[index][field] = newVal;
    renderInvoiceItemsTable();
}

function addInvoiceLineItem(name = 'Custom Equipment / Service', qty = 1, unitPrice = 0) {
    currentInvoiceItems.push({ name, qty: parseFloat(qty), unitPrice: parseFloat(unitPrice) });
    renderInvoiceItemsTable();
}

function removeInvoiceItem(index) {
    currentInvoiceItems.splice(index, 1);
    renderInvoiceItemsTable();
}

function updateInvoiceItem(index, field, value) {
    if (field === 'name') {
        currentInvoiceItems[index][field] = value;
    } else {
        currentInvoiceItems[index][field] = parseFloat(value) || 0;
    }
    calculateInvoiceTotals();
}


function quickAddFromCatalog(catalogId) {
    if (!catalogId) return;
    const item = appCatalog.find(c => c.id === catalogId);
    if (item) {
        addInvoiceLineItem(item.name, 1, item.price);
    }
    document.getElementById('quick-add-catalog').value = '';
}

function calculateInvoiceTotals() {
    let subtotal = 0;
    currentInvoiceItems.forEach(item => {
        subtotal += (item.qty * item.unitPrice);
    });

    const discount = parseFloat(document.getElementById('inv-discount').value) || 0;
    const taxRate = parseFloat(document.getElementById('inv-tax-rate').value) || 0;
    const deposit = parseFloat(document.getElementById('inv-deposit').value) || 0;

    const taxableAmount = Math.max(0, subtotal - discount);
    const taxAmount = (taxableAmount * (taxRate / 100));
    const grandTotal = taxableAmount + taxAmount;
    const balanceDue = Math.max(0, grandTotal - deposit);

    document.getElementById('sum-subtotal').innerText = `GH₵ ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('sum-grand-total').innerText = `GH₵ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('sum-balance-due').innerText = `GH₵ ${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function resetInvoiceForm() {
    currentInvoiceItems = [];
    document.getElementById('inv-client-name').value = '';
    document.getElementById('inv-client-phone').value = '';
    document.getElementById('inv-client-email').value = '';
    document.getElementById('inv-client-address').value = '';
    document.getElementById('inv-discount').value = 0;
    document.getElementById('inv-tax-rate').value = 0;
    document.getElementById('inv-deposit').value = 0;
    document.getElementById('inv-notes').value = '';

    const nextNum = savedEstimates.length + 1;
    document.getElementById('inv-number').value = `UJH-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;

    addInvoiceLineItem('5.0 kVA Hybrid Solar Inverter (48V)', 1, 8500);
    addInvoiceLineItem('550W Mono Solar Panel (Tier 1)', 6, 1650);
}

function saveInvoiceOffline() {
    const clientName = document.getElementById('inv-client-name').value.trim();
    if (!clientName) {
        alert('Please enter Client Name before saving.');
        return;
    }

    let subtotal = 0;
    currentInvoiceItems.forEach(i => subtotal += (i.qty * i.unitPrice));
    const discount = parseFloat(document.getElementById('inv-discount').value) || 0;
    const taxRate = parseFloat(document.getElementById('inv-tax-rate').value) || 0;
    const grandTotal = (subtotal - discount) * (1 + taxRate / 100);

    const estimateRecord = {
        id: 'est-' + Date.now(),
        number: document.getElementById('inv-number').value,
        type: document.getElementById('inv-type').value,
        date: document.getElementById('inv-date').value,
        clientName: clientName,
        clientPhone: document.getElementById('inv-client-phone').value,
        clientEmail: document.getElementById('inv-client-email').value,
        clientAddress: document.getElementById('inv-client-address').value,
        items: [...currentInvoiceItems],
        discount: discount,
        taxRate: taxRate,
        deposit: parseFloat(document.getElementById('inv-deposit').value) || 0,
        grandTotal: grandTotal,
        notes: document.getElementById('inv-notes').value,
        status: 'Draft',
        timestamp: new Date().toISOString()
    };

    savedEstimates.unshift(estimateRecord);
    localStorage.setItem('ujh_estimates', JSON.stringify(savedEstimates));
    alert(`Estimate ${estimateRecord.number} saved offline successfully!`);
    renderSavedEstimatesList();
}


/* ==========================================================================
   3. PRINT & PDF PREVIEW GENERATOR
   ========================================================================== */

function generateInvoiceHTML() {
    const docType = document.getElementById('inv-type').value;
    const docNum = document.getElementById('inv-number').value;
    const docDate = document.getElementById('inv-date').value;
    const clientName = document.getElementById('inv-client-name').value || 'Valued Client';
    const clientPhone = document.getElementById('inv-client-phone').value;
    const clientAddress = document.getElementById('inv-client-address').value;
    const notes = document.getElementById('inv-notes').value;

    let subtotal = 0;
    let itemsHtml = '';
    currentInvoiceItems.forEach((item, index) => {
        const total = item.qty * item.unitPrice;
        subtotal += total;
        itemsHtml += `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${item.name}</strong></td>
        <td style="text-align: center;">${item.qty}</td>
        <td style="text-align: right;">GH₵ ${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right; font-weight: 600;">GH₵ ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
    });

    const discount = parseFloat(document.getElementById('inv-discount').value) || 0;
    const taxRate = parseFloat(document.getElementById('inv-tax-rate').value) || 0;
    const deposit = parseFloat(document.getElementById('inv-deposit').value) || 0;
    const grandTotal = (subtotal - discount) * (1 + taxRate / 100);
    const balanceDue = Math.max(0, grandTotal - deposit);

    return `
    <div class="inv-header">
      <div class="inv-brand">
        <img src="assets/logo.png" alt="Ultimate Joy Home Logo">
        <div class="inv-brand-info">
          <h2>${appSettings.name}</h2>
          <p>SOLAR • ELECTRONICS • ELECTRICAL</p>
          <div style="font-size: 0.75rem; color: #475569; margin-top: 4px;">
            ${appSettings.address}<br>
            Tel: ${appSettings.phone} | Email: ${appSettings.email}
          </div>
        </div>
      </div>
      <div class="inv-meta">
        <h3>${docType}</h3>
        <p><strong>Ref #:</strong> ${docNum}</p>
        <p><strong>Date:</strong> ${docDate}</p>
      </div>
    </div>

    <div class="inv-addresses">
      <div class="inv-address-box">
        <h4>Prepared For (Client):</h4>
        <p>${clientName}</p>
        ${clientPhone ? `<div>Tel: ${clientPhone}</div>` : ''}
        ${clientAddress ? `<div>Site: ${clientAddress}</div>` : ''}
      </div>
      <div class="inv-address-box">
        <h4>Issued By:</h4>
        <p>${appSettings.name}</p>
        <div>Authorized Solar & Electrical Engineering Dept.</div>
      </div>
    </div>

    <table class="inv-table">
      <thead>
        <tr>
          <th style="width: 30px;">#</th>
          <th>Description & Specifications</th>
          <th style="text-align: center; width: 60px;">Qty</th>
          <th style="text-align: right; width: 110px;">Unit Price</th>
          <th style="text-align: right; width: 120px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
      <div style="flex: 1; font-size: 0.78rem; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
        <h4 style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">Payment Info & Banking:</h4>
        <pre style="font-family: inherit; white-space: pre-wrap; color: #475569;">${appSettings.bank}</pre>
        ${notes ? `<h4 style="font-weight: 700; color: #0f172a; margin-top: 8px; margin-bottom: 2px;">Terms & Notes:</h4><p style="color: #475569;">${notes}</p>` : ''}
      </div>

      <div class="inv-totals">
        <table>
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right;">GH₵ ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          </tr>
          ${discount > 0 ? `<tr><td>Discount:</td><td style="text-align: right;">- GH₵ ${discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>` : ''}
          ${taxRate > 0 ? `<tr><td>Tax (${taxRate}%):</td><td style="text-align: right;">+ GH₵ ${(subtotal * taxRate / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>` : ''}
          <tr class="grand-total">
            <td>Grand Total:</td>
            <td style="text-align: right;">GH₵ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          </tr>
          ${deposit > 0 ? `<tr><td>Deposit Paid:</td><td style="text-align: right;">GH₵ ${deposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>` : ''}
          ${deposit > 0 ? `<tr style="font-weight: 700; color: #d97706;"><td>Balance Due:</td><td style="text-align: right;">GH₵ ${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>` : ''}
        </table>
      </div>
    </div>

    <div class="inv-footer" style="margin-top: 30px;">
      <div>Thank you for choosing <strong>Ultimate Joy Home</strong> for your Solar & Electrical Needs!</div>
      <div class="signature-box">
        Authorized Signature / Stamp
      </div>
    </div>
  `;
}

function previewAndPrintInvoice() {
    const html = generateInvoiceHTML();
    document.getElementById('invoice-print-area').innerHTML = html;
    document.getElementById('invoice-preview-modal').classList.add('active');
}

function closeInvoicePreviewModal() {
    document.getElementById('invoice-preview-modal').classList.remove('active');
}

function shareInvoiceWhatsApp() {
    const clientName = document.getElementById('inv-client-name').value || 'Client';
    const docNum = document.getElementById('inv-number').value;
    let subtotal = 0;
    currentInvoiceItems.forEach(i => subtotal += (i.qty * i.unitPrice));
    const discount = parseFloat(document.getElementById('inv-discount').value) || 0;
    const grandTotal = subtotal - discount;

    let msg = `*ULTIMATE JOY HOME - SOLAR & ELECTRICAL QUOTE*\n`;
    msg += `Ref #: ${docNum}\n`;
    msg += `Client: ${clientName}\n`;
    msg += `------------------------------------\n`;
    currentInvoiceItems.forEach(item => {
        msg += `• ${item.name} (${item.qty}x) = GH₵ ${(item.qty * item.unitPrice).toLocaleString()}\n`;
    });
    msg += `------------------------------------\n`;
    msg += `*GRAND TOTAL: GH₵ ${grandTotal.toLocaleString()}*\n\n`;
    msg += `Payment Info:\n${appSettings.bank}\n\n`;
    msg += `Call / WhatsApp: ${appSettings.phone}`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
}


/* ==========================================================================
   4. SAVED ESTIMATES MANAGER
   ========================================================================== */

function renderSavedEstimatesList() {
    const container = document.getElementById('saved-estimates-list');
    const query = document.getElementById('saved-search-input').value.toLowerCase();

    if (savedEstimates.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">No saved estimates yet. Create your first quote in the Invoice tab!</p>`;
        return;
    }

    const filtered = savedEstimates.filter(e =>
        e.clientName.toLowerCase().includes(query) ||
        e.number.toLowerCase().includes(query)
    );

    container.innerHTML = '';
    filtered.forEach(est => {
        const badgeClass = `badge-${est.status.toLowerCase()}`;
        const card = document.createElement('div');
        card.className = 'quote-card';
        card.innerHTML = `
      <div class="quote-info">
        <h3>${est.clientName} <span class="quote-badge ${badgeClass}">${est.status}</span></h3>
        <p>${est.number} • ${est.type} • ${est.date}</p>
        <p style="font-weight: 700; color: var(--accent-emerald); margin-top: 4px;">
          GH₵ ${est.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div class="quote-actions">
        <button class="btn btn-sm btn-secondary" onclick="loadSavedEstimate('${est.id}')" title="Load & Edit">✏️ Edit</button>
        <button class="btn btn-sm btn-gold" onclick="duplicateSavedEstimate('${est.id}')" title="Duplicate Quote">📋 Copy</button>
        <button class="btn btn-sm btn-danger" onclick="deleteSavedEstimate('${est.id}')" title="Delete">🗑️</button>
      </div>
    `;
        container.appendChild(card);
    });
}

function loadSavedEstimate(estId) {
    const est = savedEstimates.find(e => e.id === estId);
    if (!est) return;

    document.getElementById('inv-type').value = est.type;
    document.getElementById('inv-number').value = est.number;
    document.getElementById('inv-date').value = est.date;
    document.getElementById('inv-client-name').value = est.clientName;
    document.getElementById('inv-client-phone').value = est.clientPhone || '';
    document.getElementById('inv-client-email').value = est.clientEmail || '';
    document.getElementById('inv-client-address').value = est.clientAddress || '';
    document.getElementById('inv-discount').value = est.discount || 0;
    document.getElementById('inv-tax-rate').value = est.taxRate || 0;
    document.getElementById('inv-deposit').value = est.deposit || 0;
    document.getElementById('inv-notes').value = est.notes || '';

    currentInvoiceItems = [...est.items];
    renderInvoiceItemsTable();
    switchTab('invoice', document.querySelectorAll('.nav-btn')[1]);
}

function duplicateSavedEstimate(estId) {
    const est = savedEstimates.find(e => e.id === estId);
    if (!est) return;

    const copy = {
        ...est,
        id: 'est-' + Date.now(),
        number: `UJH-${new Date().getFullYear()}-${String(savedEstimates.length + 1).padStart(3, '0')}`,
        clientName: `${est.clientName} (Copy)`,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
    };

    savedEstimates.unshift(copy);
    localStorage.setItem('ujh_estimates', JSON.stringify(savedEstimates));
    renderSavedEstimatesList();
    alert(`Duplicated as quote ${copy.number}!`);
}

function deleteSavedEstimate(estId) {
    if (confirm('Are you sure you want to delete this saved estimate?')) {
        savedEstimates = savedEstimates.filter(e => e.id !== estId);
        localStorage.setItem('ujh_estimates', JSON.stringify(savedEstimates));
        renderSavedEstimatesList();
    }
}


/* ==========================================================================
   5. CATALOG & COMPANY SETTINGS
   ========================================================================== */

function renderCatalogDropdown() {
    const select = document.getElementById('quick-add-catalog');
    select.innerHTML = `<option value="">+ Quick Add Catalog Item...</option>`;
    appCatalog.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = `${item.name} - GH₵ ${item.price.toLocaleString()}`;
        select.appendChild(opt);
    });
}

function renderCatalogGrid() {
    const container = document.getElementById('catalog-grid-container');
    container.innerHTML = '';

    appCatalog.forEach(item => {
        const card = document.createElement('div');
        card.className = 'catalog-item-card';
        card.innerHTML = `
      <div>
        <div class="item-category">${item.category}</div>
        <h4>${item.name}</h4>
      </div>
      <div class="item-price">GH₵ ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div style="display: flex; gap: 6px; margin-top: 10px;">
        <button class="btn btn-sm btn-primary" onclick="addCatalogItemToInvoice('${item.id}')" style="flex: 1; padding: 4px 8px; font-size: 0.72rem;">+ Add to Quote</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCatalogItem('${item.id}')" style="padding: 4px 8px;" title="Delete Catalog Item">🗑️</button>
      </div>
    `;
        container.appendChild(card);
    });
}

function addCatalogItemToInvoice(itemId) {
    const item = appCatalog.find(c => c.id === itemId);
    if (item) {
        addInvoiceLineItem(item.name, 1, item.price);
        switchTab('invoice', document.querySelectorAll('.nav-btn')[1]);
    }
}

function deleteCatalogItem(itemId) {
    if (confirm('Are you sure you want to delete this item from the product catalog?')) {
        appCatalog = appCatalog.filter(c => c.id !== itemId);
        localStorage.setItem('ujh_catalog', JSON.stringify(appCatalog));
        renderCatalogDropdown();
        renderCatalogGrid();
    }
}

function openAddCatalogItemModal() {
    document.getElementById('add-catalog-modal').classList.add('active');
}

function closeAddCatalogModal() {
    document.getElementById('add-catalog-modal').classList.remove('active');
}

function saveNewCatalogItem() {
    const name = document.getElementById('cat-item-name').value.trim();
    const category = document.getElementById('cat-item-category').value;
    const price = parseFloat(document.getElementById('cat-item-price').value) || 0;

    if (!name) return;

    const newItem = {
        id: 'cat-' + Date.now(),
        name,
        category,
        price
    };

    appCatalog.unshift(newItem);
    localStorage.setItem('ujh_catalog', JSON.stringify(appCatalog));

    renderCatalogDropdown();
    renderCatalogGrid();
    closeAddCatalogModal();
    document.getElementById('add-catalog-form').reset();
}

function populateCompanySettingsForm() {
    document.getElementById('set-company-name').value = appSettings.name;
    document.getElementById('set-company-phone').value = appSettings.phone;
    document.getElementById('set-company-email').value = appSettings.email;
    document.getElementById('set-company-address').value = appSettings.address;
    document.getElementById('set-company-bank').value = appSettings.bank;
}

function saveCompanySettings() {
    appSettings = {
        name: document.getElementById('set-company-name').value.trim(),
        phone: document.getElementById('set-company-phone').value.trim(),
        email: document.getElementById('set-company-email').value.trim(),
        address: document.getElementById('set-company-address').value.trim(),
        bank: document.getElementById('set-company-bank').value.trim()
    };

    localStorage.setItem('ujh_settings', JSON.stringify(appSettings));
    alert('Company Profile & Invoice settings saved successfully!');
}

function openAndroidGuideModal() {
    document.getElementById('android-guide-modal').classList.add('active');
}

function closeAndroidGuideModal() {
    document.getElementById('android-guide-modal').classList.remove('active');
}

// Modal Backdrop Click & Escape Key Listeners
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('active'));
    }
});

