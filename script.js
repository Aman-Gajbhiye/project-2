const ham = document.getElementById('ham');
const mobileMenu = document.getElementById('mobileMenu');

if (ham && mobileMenu) {
  ham.addEventListener('click', function () {
    mobileMenu.classList.toggle('open');
  });
}

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
  });
}


const eventOptions = document.querySelectorAll('.event-option');
let selectedPrice = 999;
let qty = 1;
let selectedEvent = 'Neon Nights Festival';
let selectedDate = 'Nov 12, 2025';
let selectedLocation = 'Mumbai';

function updateSummary() {
  const ticketSelect = document.getElementById('ticketType');
  const selectedOption = ticketSelect ? ticketSelect.options[ticketSelect.selectedIndex] : null;
  const mult = selectedOption ? parseFloat(selectedOption.getAttribute('data-mult')) : 1;
  const unitPrice = Math.round(selectedPrice * mult);
  const total = unitPrice * qty;

  document.getElementById('sumEvent') && (document.getElementById('sumEvent').textContent = selectedEvent);
  document.getElementById('sumDate') && (document.getElementById('sumDate').textContent = selectedDate);
  document.getElementById('sumLocation') && (document.getElementById('sumLocation').textContent = selectedLocation);
  document.getElementById('sumTicket') && (document.getElementById('sumTicket').textContent = selectedOption ? selectedOption.value : 'General');
  document.getElementById('sumQty') && (document.getElementById('sumQty').textContent = qty);
  document.getElementById('sumTotal') && (document.getElementById('sumTotal').textContent = selectedPrice === 0 ? 'Free' : '₹' + total.toLocaleString('en-IN'));
  document.getElementById('qtyDisplay') && (document.getElementById('qtyDisplay').textContent = qty);
}


eventOptions.forEach(function (option) {
  option.addEventListener('click', function () {
    eventOptions.forEach(function (o) { o.classList.remove('active-event'); });
    option.classList.add('active-event');
    selectedEvent = option.getAttribute('data-event');
    selectedPrice = parseInt(option.getAttribute('data-price'));
    selectedDate = option.getAttribute('data-date');
    selectedLocation = option.getAttribute('data-location');
    updateSummary();
  });
});

// Quantity controls
const qtyMinus = document.getElementById('qtyMinus');
const qtyPlus = document.getElementById('qtyPlus');

if (qtyMinus) {
  qtyMinus.addEventListener('click', function () {
    if (qty > 1) { qty--; updateSummary(); }
  });
}

if (qtyPlus) {
  qtyPlus.addEventListener('click', function () {
    if (qty < 10) { qty++; updateSummary(); }
  });
}

// Ticket type change
const ticketType = document.getElementById('ticketType');
if (ticketType) {
  ticketType.addEventListener('change', updateSummary);
}

// Booking form submit
const bookingForm = document.getElementById('bookingForm');
const bookingSuccess = document.getElementById('bookingSuccess');

if (bookingForm) {
  bookingForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!name || !email || !phone) {
      alert('Please fill in all your details.');
      return;
    }

    document.getElementById('successEmail').textContent = email;
    bookingForm.classList.add('hidden');
    bookingSuccess.classList.remove('hidden');
  });
}



const filterBtns = document.querySelectorAll('.filter-btn');
const bookingItems = document.querySelectorAll('.booking-item');

filterBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    filterBtns.forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');

    bookingItems.forEach(function (item) {
      const status = item.getAttribute('data-status');
      if (filter === 'all' || status === filter) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
  });
});



const cancelModal = document.getElementById('cancelModal');
const cancelBtns = document.querySelectorAll('.btn-cancel');
let cancelTarget = null;

cancelBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    if (btn.disabled) return;
    cancelTarget = btn;
    if (cancelModal) cancelModal.classList.remove('hidden');
  });
});

const confirmCancel = document.getElementById('confirmCancel');
if (confirmCancel) {
  confirmCancel.addEventListener('click', function () {
    if (cancelTarget) {
      const item = cancelTarget.closest('.booking-item');
      if (item) {
        item.style.opacity = '0.4';
        item.style.pointerEvents = 'none';
        const badge = item.querySelector('.status-badge');
        if (badge) {
          badge.textContent = 'Cancelled';
          badge.className = 'status-badge';
          badge.style.background = '#f8d7da';
          badge.style.color = '#721c24';
        }
        cancelTarget.disabled = true;
      }
    }
    cancelModal.classList.add('hidden');
    cancelTarget = null;
  });
}

const closeModal = document.getElementById('closeModal');
if (closeModal) {
  closeModal.addEventListener('click', function () {
    cancelModal.classList.add('hidden');
    cancelTarget = null;
  });
}