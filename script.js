// ============================================================
//  BookMyEvent — Client-Side JavaScript
// ============================================================
//
//  📚 WHAT THIS FILE DOES (explain this to your teacher!):
//
//  This is the FRONTEND LOGIC of the application.
//  While HTML defines STRUCTURE and CSS defines STYLE,
//  JavaScript makes the page INTERACTIVE and DYNAMIC.
//
//  KEY CONCEPTS USED:
//
//  1. FETCH API — Makes HTTP requests to our backend server
//     fetch('/api/events') → talks to Express routes in server.js
//
//  2. DOM MANIPULATION — Changes what users see on the page
//     document.getElementById() → finds elements
//     element.innerHTML = '...' → changes content
//
//  3. EVENT LISTENERS — Responds to user actions
//     element.addEventListener('click', ...) → runs code on click
//
//  4. ASYNC/AWAIT — Handles asynchronous operations
//     API calls take time (network request to server + database query)
//     async/await lets us "wait" for the response without freezing the page
//
//  5. URL PARAMETERS — Reads data from the URL
//     new URLSearchParams(window.location.search) → reads ?id=abc123
//
// ============================================================


// ─── UTILITY: API HELPER ────────────────────────────────────
// 📚 This is a WRAPPER around fetch() that adds the auth token
// automatically. Instead of writing the same code everywhere,
// we define it ONCE and reuse it. This is called DRY (Don't Repeat Yourself).

const API_BASE = '';  // Empty = same origin (our Express server)

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('bme_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': 'Bearer ' + token } : {})
  };

  try {
    const response = await fetch(API_BASE + endpoint, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'Network error. Is the server running?' };
  }
}


// ═══════════════════════════════════════════════════════════════
// HAMBURGER MENU (Mobile Navigation)
// ═══════════════════════════════════════════════════════════════

const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', function () {
    mobileMenu.classList.toggle('open');
  });
}


// ═══════════════════════════════════════════════════════════════
// CONTACT FORM
// ═══════════════════════════════════════════════════════════════

const contactForm = document.getElementById('contactForm');
const contactSuccess = document.getElementById('contactSuccess');

if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const msg = document.getElementById('contactMsg').value.trim();

    if (!name || !email || !msg) {
      alert('Please fill in all fields.');
      return;
    }

    contactForm.reset();
    contactSuccess.style.display = 'block';
    setTimeout(() => { contactSuccess.style.display = 'none'; }, 5000);
  });
}


// ═══════════════════════════════════════════════════════════════
// COUNTDOWN TIMER
// ═══════════════════════════════════════════════════════════════
//
// 📚 HOW COUNTDOWN WORKS:
// 1. Get the target date (event date)
// 2. Every second, calculate: target - now = remaining time
// 3. Convert milliseconds to days/hours/minutes/seconds
// 4. Update the HTML elements
// setInterval() runs a function repeatedly (every 1000ms = 1 second)

function startCountdown(targetDate, dayEl, hourEl, minEl, secEl) {
  function update() {
    const now = new Date().getTime();
    const distance = new Date(targetDate).getTime() - now;

    if (distance <= 0) {
      if (dayEl) dayEl.textContent = '0';
      if (hourEl) hourEl.textContent = '0';
      if (minEl) minEl.textContent = '0';
      if (secEl) secEl.textContent = '0';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((distance % (1000 * 60)) / 1000);

    if (dayEl) dayEl.textContent = days;
    if (hourEl) hourEl.textContent = hours;
    if (minEl) minEl.textContent = mins;
    if (secEl) secEl.textContent = secs;
  }

  update();
  setInterval(update, 1000);
}


// ═══════════════════════════════════════════════════════════════
// HOMEPAGE — Dynamic Event Loading
// ═══════════════════════════════════════════════════════════════
//
// 📚 HOW DYNAMIC CONTENT LOADING WORKS:
// Instead of hardcoding events in HTML, we:
// 1. Fetch events from the API: GET /api/events
// 2. Loop through the array of events
// 3. Generate HTML cards for each event using template literals
// 4. Insert them into the events grid container
// This is the core principle behind all modern web apps!

const eventsGrid = document.getElementById('eventsGrid');

// Category → CSS class mapping
const categoryClassMap = {
  music: 'music-img', tech: 'tech-img', workshop: 'workshop-img',
  business: 'business-img', food: 'food-img', art: 'art-img',
  sports: 'sports-img', other: 'other-img'
};

const categoryTagMap = {
  music: '', tech: 'tag-tech', workshop: 'tag-workshop', business: 'tag-business',
  food: 'tag-food', art: 'tag-art', sports: 'tag-sports', other: ''
};

const categoryEmoji = {
  music: '🎵', tech: '💻', workshop: '🎓', business: '💼',
  food: '🍕', art: '🎨', sports: '⚽', other: '📦'
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function getLowestPrice(ticketTypes) {
  if (!ticketTypes || ticketTypes.length === 0) return 0;
  const prices = ticketTypes.map(t => t.price);
  const min = Math.min(...prices);
  return min;
}

function renderEventCard(event) {
  const imgClass = categoryClassMap[event.category] || 'other-img';
  const tagClass = categoryTagMap[event.category] || '';
  const emoji = categoryEmoji[event.category] || '📦';
  const price = getLowestPrice(event.ticketTypes);
  const priceText = price === 0 ? 'Free' : '₹' + price.toLocaleString('en-IN');

  return `
    <div class="event-card animate-fade-in-up">
      <div class="event-img ${imgClass}">
        <span class="event-img-label">${emoji}</span>
      </div>
      <div class="event-info">
        <span class="event-tag ${tagClass}">${event.category}</span>
        <h3>${event.title}</h3>
        <p>📅 ${formatDate(event.date)}</p>
        <p>📍 ${event.location || 'TBA'}</p>
        <div class="event-footer">
          <span class="event-price">${priceText}</span>
          <a href="event-detail.html?id=${event._id}" class="btn-primary">View Details</a>
        </div>
      </div>
    </div>
  `;
}

async function loadEvents(searchQuery, category) {
  if (!eventsGrid) return;

  eventsGrid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  let endpoint = '/api/events?status=active';
  if (searchQuery) endpoint += '&search=' + encodeURIComponent(searchQuery);
  if (category) endpoint += '&category=' + category;

  const data = await apiCall(endpoint);

  if (data.success && data.events.length > 0) {
    eventsGrid.innerHTML = data.events.map(renderEventCard).join('');

    // Update event count stat
    const statEvents = document.getElementById('statEvents');
    if (statEvents) statEvents.textContent = data.events.length;

    // Start countdown for nearest event
    const nearestEvent = data.events[0];
    if (nearestEvent) {
      startCountdown(
        nearestEvent.date,
        document.getElementById('countDays'),
        document.getElementById('countHours'),
        document.getElementById('countMins'),
        document.getElementById('countSecs')
      );

      const label = document.getElementById('countdownLabel');
      if (label) label.textContent = '⏳ Until ' + nearestEvent.title;
    }
  } else {
    eventsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <span class="empty-state-icon">🔍</span>
        <p>No events found. Try a different search or category.</p>
      </div>
    `;
  }
}

// Search & filter handlers
const eventSearch = document.getElementById('eventSearch');
const categoryFilter = document.getElementById('categoryFilter');

if (eventSearch) {
  let searchTimeout;
  eventSearch.addEventListener('input', function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadEvents(eventSearch.value, categoryFilter ? categoryFilter.value : '');
    }, 300);  // Debounce: wait 300ms after typing stops
  });
}

if (categoryFilter) {
  categoryFilter.addEventListener('change', function () {
    loadEvents(eventSearch ? eventSearch.value : '', categoryFilter.value);
  });
}

// Load events on page load
if (eventsGrid) {
  loadEvents();
}


// ═══════════════════════════════════════════════════════════════
// BOOKING PAGE — Event Selection, Seats, Discounts, QR Codes
// ═══════════════════════════════════════════════════════════════

const eventOptionsContainer = document.getElementById('eventOptionsContainer');
const bookingForm = document.getElementById('bookingForm');
const bookingSuccess = document.getElementById('bookingSuccess');

// State for the booking page
let selectedEventId = null;
let selectedEvent = null;
let selectedPrice = 0;
let qty = 1;
let selectedSeats = [];
let appliedDiscount = null;
let allEvents = [];

// ── Load events for booking page ──
async function loadBookingEvents() {
  if (!eventOptionsContainer) return;

  const data = await apiCall('/api/events?status=active');

  if (data.success && data.events.length > 0) {
    allEvents = data.events;
    eventOptionsContainer.innerHTML = data.events.map((event, i) => {
      const imgClass = categoryClassMap[event.category] || 'other-img';
      const tagClass = categoryTagMap[event.category] || '';
      const price = getLowestPrice(event.ticketTypes);
      const priceText = price === 0 ? 'Free' : 'From ₹' + price.toLocaleString('en-IN');

      return `
        <div class="event-option ${i === 0 ? 'active-event' : ''}"
             data-event-index="${i}">
          <div class="event-opt-color ${imgClass}"></div>
          <div class="event-opt-info">
            <span class="event-tag ${tagClass}">${event.category}</span>
            <h4>${event.title}</h4>
            <p>📅 ${formatDate(event.date)} &nbsp; 📍 ${event.location || 'TBA'}</p>
            <p class="opt-price">${priceText}</p>
          </div>
        </div>
      `;
    }).join('');

    // Select first event by default
    selectEvent(0);

    // Add click listeners
    document.querySelectorAll('.event-option').forEach(opt => {
      opt.addEventListener('click', function () {
        document.querySelectorAll('.event-option').forEach(o => o.classList.remove('active-event'));
        opt.classList.add('active-event');
        selectEvent(parseInt(opt.getAttribute('data-event-index')));
      });
    });
  } else {
    eventOptionsContainer.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📅</span>
        <p>No events available. Check back soon!</p>
      </div>
    `;
  }
}

function selectEvent(index) {
  selectedEvent = allEvents[index];
  selectedEventId = selectedEvent._id;
  selectedSeats = [];
  appliedDiscount = null;

  // Update ticket type dropdown
  const ticketSelect = document.getElementById('ticketType');
  if (ticketSelect && selectedEvent.ticketTypes) {
    ticketSelect.innerHTML = selectedEvent.ticketTypes.map(t => {
      const avail = t.quantity - t.sold;
      const priceText = t.price === 0 ? 'Free' : '₹' + t.price.toLocaleString('en-IN');
      return `<option value="${t.name}" data-price="${t.price}">${t.name} — ${priceText} (${avail} left)</option>`;
    }).join('');
  }

  // Generate seating map
  generateSeatingMap();

  // Start countdown
  startCountdown(
    selectedEvent.date,
    document.getElementById('bCountDays'),
    document.getElementById('bCountHours'),
    document.getElementById('bCountMins'),
    document.getElementById('bCountSecs')
  );

  // Reset discount
  const discountMsg = document.getElementById('discountMsg');
  if (discountMsg) { discountMsg.textContent = ''; discountMsg.className = 'discount-msg'; }

  updateBookingSummary();
}

// ── SEATING MAP ──
// 📚 Generates a grid of clickable seats.
// Each seat is a button labeled with row+column (e.g., "A1", "B3").
// Randomly marks some seats as "occupied" (simulating sold seats).
// Users click to select/deselect seats.

function generateSeatingMap() {
  const grid = document.getElementById('seatingGrid');
  if (!grid || !selectedEvent) return;

  const rows = ['A', 'B', 'C', 'D', 'E'];
  const cols = 10;
  let html = '';

  for (let r = 0; r < rows.length; r++) {
    for (let c = 1; c <= cols; c++) {
      const seatId = rows[r] + c;
      // Randomly make ~20% seats occupied (simulated)
      const isOccupied = Math.random() < 0.2;
      const isVip = r === 0;  // First row = VIP
      const classes = ['seat'];
      if (isOccupied) classes.push('occupied');
      if (isVip) classes.push('vip');

      html += `<button type="button" class="${classes.join(' ')}" data-seat="${seatId}" ${isOccupied ? 'disabled' : ''}>${seatId}</button>`;
    }
  }

  grid.innerHTML = html;

  // Add click listeners for seat selection
  grid.querySelectorAll('.seat:not(.occupied)').forEach(seat => {
    seat.addEventListener('click', function () {
      const seatId = seat.getAttribute('data-seat');
      if (seat.classList.contains('selected')) {
        seat.classList.remove('selected');
        selectedSeats = selectedSeats.filter(s => s !== seatId);
      } else {
        if (selectedSeats.length < qty) {
          seat.classList.add('selected');
          selectedSeats.push(seatId);
        } else {
          // Deselect oldest, select new
          const oldSeat = selectedSeats.shift();
          const oldEl = grid.querySelector(`[data-seat="${oldSeat}"]`);
          if (oldEl) oldEl.classList.remove('selected');
          seat.classList.add('selected');
          selectedSeats.push(seatId);
        }
      }
      updateBookingSummary();
    });
  });
}

// ── UPDATE BOOKING SUMMARY ──
function updateBookingSummary() {
  if (!selectedEvent) return;

  const ticketSelect = document.getElementById('ticketType');
  const selectedOption = ticketSelect ? ticketSelect.options[ticketSelect.selectedIndex] : null;
  const unitPrice = selectedOption ? parseFloat(selectedOption.getAttribute('data-price')) : 0;
  let total = unitPrice * qty;

  // Apply discount
  let discountAmount = 0;
  if (appliedDiscount) {
    discountAmount = Math.round(total * (appliedDiscount.percentage / 100));
    total -= discountAmount;
  }

  const el = (id) => document.getElementById(id);

  if (el('sumEvent')) el('sumEvent').textContent = selectedEvent.title;
  if (el('sumDate')) el('sumDate').textContent = formatDate(selectedEvent.date);
  if (el('sumLocation')) el('sumLocation').textContent = selectedEvent.location || 'TBA';
  if (el('sumTicket')) el('sumTicket').textContent = selectedOption ? selectedOption.value : 'General';
  if (el('sumQty')) el('sumQty').textContent = qty;
  if (el('sumSeats')) el('sumSeats').textContent = selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Auto-assigned';
  if (el('sumDiscount')) el('sumDiscount').textContent = appliedDiscount ? `-₹${discountAmount} (${appliedDiscount.percentage}% off)` : 'None';
  if (el('sumTotal')) el('sumTotal').textContent = total === 0 ? 'Free' : '₹' + total.toLocaleString('en-IN');
  if (el('qtyDisplay')) el('qtyDisplay').textContent = qty;
}

// ── Quantity Controls ──
const qtyMinus = document.getElementById('qtyMinus');
const qtyPlus = document.getElementById('qtyPlus');

if (qtyMinus) {
  qtyMinus.addEventListener('click', () => { if (qty > 1) { qty--; updateBookingSummary(); } });
}
if (qtyPlus) {
  qtyPlus.addEventListener('click', () => { if (qty < 10) { qty++; updateBookingSummary(); } });
}

// Ticket type change
const ticketType = document.getElementById('ticketType');
if (ticketType) {
  ticketType.addEventListener('change', updateBookingSummary);
}

// ── DISCOUNT CODE ──
const applyDiscountBtn = document.getElementById('applyDiscount');
if (applyDiscountBtn) {
  applyDiscountBtn.addEventListener('click', async () => {
    const code = document.getElementById('discountInput').value.trim();
    const discountMsg = document.getElementById('discountMsg');

    if (!code) { discountMsg.textContent = 'Enter a code'; discountMsg.className = 'discount-msg error'; return; }
    if (!selectedEventId) { discountMsg.textContent = 'Select an event first'; discountMsg.className = 'discount-msg error'; return; }

    const data = await apiCall('/api/discount/validate', {
      method: 'POST',
      body: JSON.stringify({ eventId: selectedEventId, code })
    });

    if (data.success) {
      appliedDiscount = data.discount;
      discountMsg.textContent = `✅ ${data.discount.percentage}% discount applied!`;
      discountMsg.className = 'discount-msg success';
    } else {
      appliedDiscount = null;
      discountMsg.textContent = '❌ ' + data.message;
      discountMsg.className = 'discount-msg error';
    }
    updateBookingSummary();
  });
}

// ── GROUP BOOKING TOGGLE ──
const groupToggle = document.getElementById('groupToggle');
const groupContainer = document.getElementById('groupContainer');

if (groupToggle) {
  groupToggle.addEventListener('change', () => {
    groupContainer.classList.toggle('hidden', !groupToggle.checked);
  });
}

const addGroupMemberBtn = document.getElementById('addGroupMember');
if (addGroupMemberBtn) {
  addGroupMemberBtn.addEventListener('click', () => {
    const list = document.getElementById('groupMembersList');
    const div = document.createElement('div');
    div.className = 'group-member-input';
    div.innerHTML = `
      <input type="text" placeholder="Name" class="gm-name" />
      <input type="email" placeholder="Email" class="gm-email" />
      <button type="button" class="remove-ticket-btn" onclick="this.parentElement.remove()">✕</button>
    `;
    list.appendChild(div);
  });
}

// ── BOOKING FORM SUBMISSION ──
// 📚 When user clicks "Confirm Booking":
// 1. Validate inputs
// 2. Collect ticket info, seats, group members
// 3. POST to /api/bookings
// 4. On success → show QR code + booking code

if (bookingForm) {
  bookingForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!name || !email || !phone) { alert('Please fill in all your details.'); return; }
    if (!selectedEventId) { alert('Please select an event.'); return; }

    const ticketSelect = document.getElementById('ticketType');
    const ticketName = ticketSelect.value;

    // Collect group members
    let groupMembers = [];
    const isGroup = groupToggle && groupToggle.checked;
    if (isGroup) {
      document.querySelectorAll('.group-member-input').forEach(row => {
        const gName = row.querySelector('.gm-name').value.trim();
        const gEmail = row.querySelector('.gm-email').value.trim();
        if (gName) groupMembers.push({ name: gName, email: gEmail });
      });
    }

    // Submit booking
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    const data = await apiCall('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        eventId: selectedEventId,
        tickets: [{ type: ticketName, quantity: qty, seats: selectedSeats }],
        discountCode: appliedDiscount ? appliedDiscount.code : '',
        isGroupBooking: isGroup,
        groupMembers
      })
    });

    if (data.success) {
      // Show success
      bookingForm.classList.add('hidden');
      bookingSuccess.classList.remove('hidden');

      document.getElementById('successEmail').textContent = email;
      document.getElementById('successCode').textContent = data.booking.bookingCode;

      // Generate QR code
      const qrContainer = document.getElementById('qrContainer');
      if (qrContainer && typeof QRCode !== 'undefined') {
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
          text: data.booking.bookingCode,
          width: 180,
          height: 180,
          colorDark: '#1a1425',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      }

      // Setup calendar buttons
      setupCalendarButtons(data.booking);
    } else {
      alert(data.message || 'Booking failed. Please try again.');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = '🎟️ Confirm Booking';
  });
}

// ── CALENDAR INTEGRATION ──
// 📚 Google Calendar uses a special URL format to pre-fill event details.
// .ics files follow the iCalendar standard and work with all calendar apps.

function setupCalendarButtons(booking) {
  const event = selectedEvent;
  if (!event) return;

  const startDate = new Date(event.date);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const formatGCal = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Google Calendar URL
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGCal(startDate)}/${formatGCal(endDate)}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent((event.venue || '') + ', ' + (event.location || ''))}`;

  const googleBtn = document.getElementById('googleCalBtn');
  if (googleBtn) { googleBtn.href = googleUrl; googleBtn.target = '_blank'; }

  // .ics download
  const icsBtn = document.getElementById('icsDownloadBtn');
  if (icsBtn) { icsBtn.href = `/api/events/${event._id}/calendar`; }
}

// Load booking events on page load
if (eventOptionsContainer) {
  loadBookingEvents();

  // Reset form if user clicks "back" from the dashboard
  window.addEventListener('pageshow', function (event) {
    if (event.persisted && bookingForm && bookingSuccess) {
      bookingForm.classList.remove('hidden');
      bookingSuccess.classList.add('hidden');
      bookingForm.reset();
      selectedSeats = [];
      appliedDiscount = null;
      qty = 1;
      
      const qtyDisplay = document.getElementById('qtyDisplay');
      if (qtyDisplay) qtyDisplay.textContent = qty;
      
      const discountMsg = document.getElementById('discountMsg');
      if (discountMsg) { discountMsg.textContent = ''; discountMsg.className = 'discount-msg'; }
      
      if (selectedEvent) {
        generateSeatingMap();
        updateBookingSummary();
      }
    }
  });
}


// ═══════════════════════════════════════════════════════════════
// DASHBOARD — Bookings, Analytics, Feedback
// ═══════════════════════════════════════════════════════════════

// ── DASHBOARD TABS ──
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const tab = document.getElementById('tab-' + btn.getAttribute('data-tab'));
    if (tab) tab.classList.add('active');
  });
});

// ── LOAD DASHBOARD DATA ──
async function loadDashboard() {
  const bookingsList = document.getElementById('bookingsList');
  if (!bookingsList) return;

  // Load analytics
  const analytics = await apiCall('/api/analytics');
  if (analytics.success) {
    const a = analytics.attendee;
    const el = (id) => document.getElementById(id);

    if (el('statBookings')) el('statBookings').textContent = a.totalBookings;
    if (el('statUpcoming')) el('statUpcoming').textContent = a.upcomingBookings;
    if (el('statSpent')) el('statSpent').textContent = a.totalSpent === 0 ? '₹0' : '₹' + a.totalSpent.toLocaleString('en-IN');
    if (el('statAttended')) el('statAttended').textContent = a.eventsAttended;

    // Organizer stats
    const o = analytics.organizer;
    if (el('orgTotalEvents')) el('orgTotalEvents').textContent = o.totalEvents;
    if (el('orgTotalTickets')) el('orgTotalTickets').textContent = o.totalTicketsSold;
    if (el('orgTotalRevenue')) el('orgTotalRevenue').textContent = o.totalRevenue === 0 ? '₹0' : '₹' + o.totalRevenue.toLocaleString('en-IN');
    if (el('orgAttendanceRate')) el('orgAttendanceRate').textContent = o.attendanceRate + '%';

    // Draw charts
    renderBarChart('revenueChart', o.eventBreakdown, 'revenue', '₹');
    renderBarChart('bookingsChart', o.eventBreakdown, 'bookings', '');
  }

  // Load bookings
  const data = await apiCall('/api/bookings');
  if (data.success) {
    if (data.bookings.length === 0) {
      bookingsList.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">🎟️</span>
          <p>No bookings yet. <a href="booking.html" style="color: var(--primary-light);">Book your first event!</a></p>
        </div>
      `;
    } else {
      bookingsList.innerHTML = data.bookings.map(booking => {
        if (!booking.event) return '';
        const event = booking.event;
        const isUpcoming = new Date(event.date) > new Date() && booking.paymentStatus === 'paid';
        const isAttended = booking.checkedIn;
        const isCancelled = booking.paymentStatus === 'refunded';
        const status = isCancelled ? 'cancelled' : isAttended ? 'attended' : isUpcoming ? 'upcoming' : 'attended';
        const statusLabel = isCancelled ? 'Cancelled' : isAttended ? 'Attended' : 'Upcoming';
        const imgClass = categoryClassMap[event.category] || 'other-img';
        const tagClass = categoryTagMap[event.category] || '';
        const totalQty = booking.tickets.reduce((sum, t) => sum + t.quantity, 0);
        const ticketLabel = booking.tickets.map(t => `${t.quantity}x ${t.type}`).join(', ');
        const priceText = booking.totalAmount === 0 ? 'Free' : '₹' + booking.totalAmount.toLocaleString('en-IN');

        return `
          <div class="booking-item" data-status="${status}" data-booking-id="${booking._id}">
            <div class="booking-color ${imgClass}"></div>
            <div class="booking-details" style="display: flex; gap: 16px; align-items: center;">
              <div style="flex: 1;">
                <span class="event-tag ${tagClass}">${event.category}</span>
                <h4>${event.title}</h4>
                <p>📅 ${formatDate(event.date)} &nbsp; 📍 ${event.location || ''}</p>
                <p>🎟️ ${ticketLabel}</p>
                <p style="font-family: monospace; color: var(--text-primary); font-size: 14px; margin-top: 6px; font-weight: 700;">Code: ${booking.bookingCode}</p>
              </div>
              <div id="qr-dash-${booking._id}" style="width: 76px; height: 76px; background: white; padding: 2px; border-radius: 4px; display: ${isCancelled ? 'none' : 'block'}; flex-shrink: 0;"></div>
            </div>
            <div class="booking-meta">
              <span class="status-badge ${status}">${statusLabel}</span>
              <p class="booking-price">${priceText}</p>
              ${!isCancelled && !isAttended ? `<button class="btn-cancel" data-id="${booking._id}">Cancel</button>` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Generate mini QR codes
      if (typeof QRCode !== 'undefined') {
        data.bookings.forEach(booking => {
          if (booking.paymentStatus !== 'refunded') {
            const qrContainer = document.getElementById('qr-dash-' + booking._id);
            if (qrContainer) {
              new QRCode(qrContainer, {
                text: booking.bookingCode,
                width: 72,
                height: 72,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.L
              });
            }
          }
        });
      }

      // Add cancel listeners
      document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
          cancelTarget = btn;
          const modal = document.getElementById('cancelModal');
          if (modal) modal.classList.remove('hidden');
        });
      });
    }
  }

  // Load account info
  const user = JSON.parse(localStorage.getItem('bme_user') || '{}');
  const el = (id) => document.getElementById(id);
  if (el('accountName')) el('accountName').textContent = '👤 ' + (user.name || 'User');
  if (el('accountEmail')) el('accountEmail').textContent = '📧 ' + (user.email || '');
  if (el('accountRole')) el('accountRole').textContent = '🏷️ ' + (user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Attendee');
}

// ── ANALYTICS BAR CHART ──
// 📚 This creates a simple bar chart using CSS.
// Each bar's height is proportional to its value relative to the max value.
// No external charting library needed!

function renderBarChart(containerId, eventBreakdown, field, prefix) {
  const container = document.getElementById(containerId);
  if (!container || !eventBreakdown || eventBreakdown.length === 0) return;

  const maxVal = Math.max(...eventBreakdown.map(e => e[field]), 1);

  container.innerHTML = eventBreakdown.map(event => {
    const heightPct = (event[field] / maxVal) * 140;
    const shortTitle = event.title.length > 12 ? event.title.substring(0, 12) + '…' : event.title;

    return `
      <div class="bar-item">
        <span class="bar-value">${prefix}${event[field].toLocaleString('en-IN')}</span>
        <div class="bar" style="height: ${Math.max(heightPct, 4)}px;"></div>
        <span class="bar-label">${shortTitle}</span>
      </div>
    `;
  }).join('');
}

// ── BOOKING FILTER ──
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.getAttribute('data-filter');

    document.querySelectorAll('.booking-item').forEach(item => {
      const status = item.getAttribute('data-status');
      item.classList.toggle('hidden', filter !== 'all' && status !== filter);
    });
  });
});

// ── CANCEL BOOKING ──
let cancelTarget = null;
const cancelModal = document.getElementById('cancelModal');
const confirmCancel = document.getElementById('confirmCancel');
const closeModal = document.getElementById('closeModal');

if (confirmCancel) {
  confirmCancel.addEventListener('click', async () => {
    if (!cancelTarget) return;
    const bookingId = cancelTarget.getAttribute('data-id');

    const data = await apiCall('/api/bookings/' + bookingId, { method: 'DELETE' });

    if (data.success) {
      const item = cancelTarget.closest('.booking-item');
      if (item) {
        item.style.opacity = '0.4';
        item.style.pointerEvents = 'none';
        const badge = item.querySelector('.status-badge');
        if (badge) { badge.textContent = 'Cancelled'; badge.className = 'status-badge cancelled'; }
        cancelTarget.remove();
      }
    } else {
      alert(data.message || 'Failed to cancel.');
    }

    cancelModal.classList.add('hidden');
    cancelTarget = null;
  });
}

if (closeModal) {
  closeModal.addEventListener('click', () => {
    cancelModal.classList.add('hidden');
    cancelTarget = null;
  });
}

// Sidebar logout
const logoutSidebar = document.getElementById('logoutSidebar');
if (logoutSidebar) {
  logoutSidebar.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('bme_token');
    localStorage.removeItem('bme_user');
    window.location.href = 'login.html';
  });
}

// Load dashboard on page load
if (document.getElementById('bookingsList')) {
  loadDashboard();
}


// ═══════════════════════════════════════════════════════════════
// CREATE EVENT PAGE
// ═══════════════════════════════════════════════════════════════

const createEventForm = document.getElementById('createEventForm');

// Virtual event toggle
const isVirtualCheckbox = document.getElementById('isVirtual');
const streamUrlField = document.getElementById('streamUrlField');
if (isVirtualCheckbox) {
  isVirtualCheckbox.addEventListener('change', () => {
    streamUrlField.classList.toggle('hidden', !isVirtualCheckbox.checked);
  });
}

// Add ticket type row
const addTicketTypeBtn = document.getElementById('addTicketType');
if (addTicketTypeBtn) {
  addTicketTypeBtn.addEventListener('click', () => {
    const list = document.getElementById('ticketTypesList');
    const div = document.createElement('div');
    div.className = 'ticket-type-row';
    div.innerHTML = `
      <div class="form-field" style="margin:0">
        <label>Tier Name</label>
        <input type="text" class="tt-name" placeholder="e.g., VIP" />
      </div>
      <div class="form-field" style="margin:0">
        <label>Price (₹)</label>
        <input type="number" class="tt-price" value="0" min="0" />
      </div>
      <div class="form-field" style="margin:0">
        <label>Quantity</label>
        <input type="number" class="tt-qty" value="50" min="1" />
      </div>
      <button type="button" class="remove-ticket-btn" onclick="this.closest('.ticket-type-row').remove()">✕</button>
    `;
    list.appendChild(div);
  });
}

// Add discount code row
const addDiscountCodeBtn = document.getElementById('addDiscountCode');
if (addDiscountCodeBtn) {
  addDiscountCodeBtn.addEventListener('click', () => {
    const list = document.getElementById('discountCodesList');
    const div = document.createElement('div');
    div.className = 'ticket-type-row';
    div.innerHTML = `
      <div class="form-field" style="margin:0">
        <label>Code</label>
        <input type="text" class="dc-code" placeholder="e.g., SUMMER20" style="text-transform: uppercase;" />
      </div>
      <div class="form-field" style="margin:0">
        <label>Discount %</label>
        <input type="number" class="dc-pct" value="10" min="1" max="100" />
      </div>
      <div class="form-field" style="margin:0">
        <label>Max Uses</label>
        <input type="number" class="dc-max" value="50" min="1" />
      </div>
      <button type="button" class="remove-ticket-btn" onclick="this.closest('.ticket-type-row').remove()">✕</button>
    `;
    list.appendChild(div);
  });
}

// Add sponsor row
const addSponsorBtn = document.getElementById('addSponsor');
if (addSponsorBtn) {
  addSponsorBtn.addEventListener('click', () => {
    const list = document.getElementById('sponsorsList');
    const div = document.createElement('div');
    div.className = 'ticket-type-row';
    div.style.gridTemplateColumns = '2fr 2fr auto';
    div.innerHTML = `
      <div class="form-field" style="margin:0">
        <label>Sponsor Name</label>
        <input type="text" class="sp-name" placeholder="e.g., TechCorp" />
      </div>
      <div class="form-field" style="margin:0">
        <label>Website URL</label>
        <input type="url" class="sp-url" placeholder="https://..." />
      </div>
      <button type="button" class="remove-ticket-btn" onclick="this.closest('.ticket-type-row').remove()">✕</button>
    `;
    list.appendChild(div);
  });
}

// Submit create event form
if (createEventForm) {
  createEventForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const errorEl = document.getElementById('eventError');
    const successEl = document.getElementById('eventSuccess');
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    // Collect ticket types
    const ticketTypes = [];
    document.querySelectorAll('.ticket-type-row').forEach(row => {
      const nameInput = row.querySelector('.tt-name');
      if (nameInput) {
        ticketTypes.push({
          name: nameInput.value || 'General',
          price: parseFloat(row.querySelector('.tt-price').value) || 0,
          quantity: parseInt(row.querySelector('.tt-qty').value) || 100,
          sold: 0
        });
      }
    });

    // Collect discount codes
    const discountCodes = [];
    document.querySelectorAll('.dc-code').forEach((codeInput, i) => {
      if (codeInput.value.trim()) {
        const row = codeInput.closest('.ticket-type-row');
        discountCodes.push({
          code: codeInput.value.trim().toUpperCase(),
          percentage: parseFloat(row.querySelector('.dc-pct').value) || 10,
          maxUses: parseInt(row.querySelector('.dc-max').value) || 50,
          usedCount: 0
        });
      }
    });

    // Collect sponsors
    const sponsors = [];
    document.querySelectorAll('.sp-name').forEach(nameInput => {
      if (nameInput.value.trim()) {
        const row = nameInput.closest('.ticket-type-row');
        sponsors.push({
          name: nameInput.value.trim(),
          url: row.querySelector('.sp-url').value || '#',
          logo: ''
        });
      }
    });

    const eventData = {
      title: document.getElementById('eventTitle').value.trim(),
      description: document.getElementById('eventDesc').value.trim(),
      category: document.getElementById('eventCategory').value,
      date: document.getElementById('eventDate').value,
      time: document.getElementById('eventTime').value,
      venue: document.getElementById('eventVenue').value.trim(),
      location: document.getElementById('eventLocation').value.trim(),
      capacity: parseInt(document.getElementById('eventCapacity').value) || 100,
      isVirtual: document.getElementById('isVirtual').checked,
      streamUrl: document.getElementById('streamUrl').value.trim(),
      ticketTypes,
      discountCodes,
      sponsors
    };

    if (!eventData.title || !eventData.date) {
      errorEl.textContent = 'Title and date are required.';
      errorEl.style.display = 'block';
      return;
    }

    const submitBtn = createEventForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing...';

    const data = await apiCall('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });

    if (data.success) {
      successEl.textContent = '🎉 Event published! Redirecting to dashboard...';
      successEl.style.display = 'block';
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
    } else {
      errorEl.textContent = data.message || 'Failed to create event.';
      errorEl.style.display = 'block';
    }

    submitBtn.disabled = false;
    submitBtn.textContent = '🚀 Publish Event';
  });
}


// ═══════════════════════════════════════════════════════════════
// EVENT DETAIL PAGE
// ═══════════════════════════════════════════════════════════════

async function loadEventDetail() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');
  if (!eventId) return;

  const data = await apiCall('/api/events/' + eventId);
  if (!data.success) {
    document.getElementById('detailTitle').textContent = 'Event not found';
    return;
  }

  const event = data.event;

  // Update header
  document.getElementById('detailTag').textContent = event.category;
  document.getElementById('detailTag').className = 'event-tag ' + (categoryTagMap[event.category] || '');
  document.getElementById('detailTitle').textContent = event.title;
  document.getElementById('detailMeta').innerHTML = `📅 ${formatDate(event.date)} ${event.time ? '• ' + event.time : ''} &nbsp; 📍 ${event.venue || ''}, ${event.location || ''}`;

  // Countdown
  startCountdown(event.date,
    document.getElementById('dCountDays'),
    document.getElementById('dCountHours'),
    document.getElementById('dCountMins'),
    document.getElementById('dCountSecs')
  );

  // Description
  document.getElementById('detailDescription').textContent = event.description || 'No description available.';

  // Meta grid
  document.getElementById('metaDate').textContent = formatDate(event.date);
  document.getElementById('metaTime').textContent = event.time || 'TBA';
  document.getElementById('metaVenue').textContent = (event.venue || 'TBA') + (event.location ? ', ' + event.location : '');
  document.getElementById('metaCapacity').textContent = event.capacity + ' seats';

  // Organizer
  document.getElementById('organizerName').textContent = event.organizer ? event.organizer.name : 'Unknown';

  // Ticket cards
  const ticketCards = document.getElementById('ticketCards');
  if (ticketCards && event.ticketTypes) {
    ticketCards.innerHTML = event.ticketTypes.map(t => {
      const avail = t.quantity - t.sold;
      const soldOut = avail <= 0;
      return `
        <div class="ticket-card">
          <div class="ticket-card-info">
            <h4>${t.name}</h4>
            <p>${soldOut ? 'Sold Out' : avail + ' tickets remaining'}</p>
          </div>
          <div class="ticket-card-price">
            <span class="price">${t.price === 0 ? 'Free' : '₹' + t.price.toLocaleString('en-IN')}</span>
            <span class="availability" style="color: ${soldOut ? 'var(--danger)' : 'var(--success)'}">${soldOut ? 'Sold Out' : 'Available'}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Book now button
  document.getElementById('bookNowBtn').href = 'booking.html';

  // Live stream
  if (event.isVirtual && event.streamUrl) {
    document.getElementById('streamSection').classList.remove('hidden');
    document.getElementById('streamLink').href = event.streamUrl;
  }

  // Sponsors
  if (event.sponsors && event.sponsors.length > 0) {
    document.getElementById('sponsorsDetailSection').classList.remove('hidden');
    document.getElementById('sponsorsDetailGrid').innerHTML = event.sponsors.map(s => {
      return `<a href="${s.url || '#'}" class="sponsor-badge" target="_blank">${s.name}</a>`;
    }).join('');
  }

  // Calendar
  const startDate = new Date(event.date);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const formatGCal = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGCal(startDate)}/${formatGCal(endDate)}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent((event.venue || '') + ', ' + (event.location || ''))}`;

  document.getElementById('detailGoogleCal').href = googleUrl;
  document.getElementById('detailGoogleCal').target = '_blank';
  document.getElementById('detailIcsCal').href = `/api/events/${event._id}/calendar`;

  // Load feedback
  loadEventFeedback(eventId);
}

async function loadEventFeedback(eventId) {
  const data = await apiCall(`/api/events/${eventId}/feedback`);
  if (!data.success) return;

  const reviewsList = document.getElementById('reviewsList');
  if (!reviewsList) return;

  if (data.feedbacks.length > 0) {
    const avgStars = '★'.repeat(Math.round(data.avgRating)) + '☆'.repeat(5 - Math.round(data.avgRating));
    reviewsList.innerHTML = `
      <div style="margin-bottom: 20px; padding: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);">
        <span style="font-size: 24px; color: var(--accent);">${avgStars}</span>
        <span style="font-size: 16px; font-weight: 700; margin-left: 8px;">${data.avgRating}/5</span>
        <span style="color: var(--text-muted); font-size: 13px; margin-left: 8px;">(${data.totalReviews} reviews)</span>
      </div>
      ${data.feedbacks.map(f => `
        <div class="review-card">
          <div class="review-header">
            <span class="review-author">${f.user ? f.user.name : 'Anonymous'}</span>
            <span class="review-stars">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span>
          </div>
          ${f.comment ? `<p class="review-text">${f.comment}</p>` : ''}
        </div>
      `).join('')}
    `;
  }

  // Show review form if logged in
  const token = localStorage.getItem('bme_token');
  if (token) {
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) reviewForm.classList.remove('hidden');
  }
}

// Star rating widget
let selectedRating = 0;
const starRating = document.getElementById('starRating');
if (starRating) {
  starRating.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.getAttribute('data-rating'));
      starRating.querySelectorAll('button').forEach((b, i) => {
        b.textContent = i < selectedRating ? '★' : '☆';
        b.classList.toggle('active', i < selectedRating);
      });
    });
  });
}

// Submit review
const submitReview = document.getElementById('submitReview');
if (submitReview) {
  submitReview.addEventListener('click', async () => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    if (!eventId || selectedRating === 0) { alert('Please select a rating.'); return; }

    const comment = document.getElementById('reviewComment').value.trim();

    const data = await apiCall(`/api/events/${eventId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating: selectedRating, comment })
    });

    if (data.success) {
      alert('Thank you for your feedback!');
      loadEventFeedback(eventId);
    } else {
      alert(data.message || 'Failed to submit.');
    }
  });
}

// Load event detail if on that page
if (document.getElementById('detailTitle')) {
  loadEventDetail();
}


// ═══════════════════════════════════════════════════════════════
// CHECK-IN PAGE
// ═══════════════════════════════════════════════════════════════

let checkinSessionCount = 0;

const checkinBtn = document.getElementById('checkinBtn');
if (checkinBtn) {
  checkinBtn.addEventListener('click', async () => {
    const code = document.getElementById('checkinCode').value.trim().toUpperCase();
    const resultEl = document.getElementById('checkinResult');
    const titleEl = document.getElementById('checkinResultTitle');
    const msgEl = document.getElementById('checkinResultMsg');
    const detailsEl = document.getElementById('checkinResultDetails');

    if (!code) { alert('Enter a booking code.'); return; }

    checkinBtn.disabled = true;
    checkinBtn.textContent = 'Checking...';

    const data = await apiCall('/api/bookings/checkin/' + code, { method: 'POST' });

    resultEl.style.display = 'block';

    if (data.success) {
      resultEl.className = 'checkin-result success';
      titleEl.textContent = '✅ Check-in Successful!';
      msgEl.textContent = `Welcome, ${data.booking.attendee}!`;
      detailsEl.textContent = `Event: ${data.booking.event} • Tickets: ${data.booking.tickets.map(t => t.quantity + 'x ' + t.type).join(', ')}`;

      checkinSessionCount++;
      document.getElementById('checkinCount').textContent = checkinSessionCount;
      document.getElementById('checkinTotal').textContent = checkinSessionCount;
    } else {
      resultEl.className = 'checkin-result error';
      titleEl.textContent = '❌ Check-in Failed';
      msgEl.textContent = data.message || 'Invalid booking code.';
      detailsEl.textContent = '';
    }

    document.getElementById('checkinCode').value = '';
    checkinBtn.disabled = false;
    checkinBtn.textContent = '✅ Check In';
  });

  // Allow Enter key for check-in
  document.getElementById('checkinCode').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkinBtn.click();
  });
}


// ═══════════════════════════════════════════════════════════════
// SCROLL ANIMATIONS (Intersection Observer)
// ═══════════════════════════════════════════════════════════════
//
// 📚 INTERSECTION OBSERVER:
// This API watches elements and triggers when they become visible.
// We use it to add "fade in" animations when cards scroll into view.
// Much more performant than listening to the scroll event!

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-fade-in-up');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-box, .step, .stat-card').forEach(el => {
  observer.observe(el);
});