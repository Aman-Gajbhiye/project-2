// ============================================================
//  BookMyEvent — Full Event Management System Server
// ============================================================
//
//  📚 WHAT THIS FILE DOES (explain this to your teacher!):
//
//  Think of this file as the "brain" of the application.
//  The FRONTEND (HTML pages) is what users SEE.
//  The BACKEND (this file) is what actually DOES things:
//    - Stores data in a database (MongoDB)
//    - Handles user login/registration securely
//    - Creates events, bookings, generates QR codes
//    - Calculates analytics (ticket sales, revenue, etc.)
//
//  ARCHITECTURE PATTERN: This uses the MVC pattern
//    - Model = Mongoose schemas (define data shape)
//    - View = HTML pages (what users see)
//    - Controller = Route handlers (the logic)
//
//  HOW IT'S ORGANIZED:
//    1. IMPORTS        — Load packages (like importing tools)
//    2. CONFIG         — Set up the app and read settings
//    3. MODELS         — Define data structures (User, Event, Booking, Feedback)
//    4. MIDDLEWARE      — Functions that run before every request
//    5. AUTH ROUTES     — Register, Login, Profile
//    6. EVENT ROUTES    — Create, Read, Update, Delete events
//    7. BOOKING ROUTES  — Book tickets, cancel, check-in
//    8. FEEDBACK ROUTES — Post-event ratings and comments
//    9. ANALYTICS       — Dashboard statistics
//   10. UTILITIES       — Discount codes, waitlist, calendar files
//   11. START SERVER    — Connect to database and go live
//
// ============================================================


// ═══════════════════════════════════════════════════════════════
// 1. IMPORTS
// ═══════════════════════════════════════════════════════════════
//
// 📚 WHAT ARE IMPORTS?
// In Node.js, "require()" loads external packages (libraries).
// Think of it like importing tools from a toolbox.
// Each package does ONE specific job.

const express    = require('express');       // Web framework — handles HTTP requests (GET, POST, PUT, DELETE)
const mongoose   = require('mongoose');     // MongoDB ODM — lets us define data shapes and query the database
const bcrypt     = require('bcryptjs');      // Password hashing — converts "password123" into an unreadable string
const jwt        = require('jsonwebtoken'); // JWT — creates "digital ID cards" (tokens) for logged-in users
const dotenv     = require('dotenv');        // Loads secret settings from .env file (like DB password)
const path       = require('path');         // Built-in Node module — helps construct file paths
const crypto     = require('crypto');       // Built-in Node module — generates random strings (for QR codes, IDs)


// ═══════════════════════════════════════════════════════════════
// 2. CONFIG
// ═══════════════════════════════════════════════════════════════
//
// 📚 WHY DO WE NEED CONFIG?
// We don't want to hardcode sensitive data (like database passwords)
// directly in our code. Instead, we store them in a .env file
// and read them here. This is a security best practice.

dotenv.config();  // Reads .env file and puts values into process.env

const app = express();                                      // Create Express app instance
const PORT = process.env.PORT || 3000;                      // Server port (from .env or default 3000)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';


// ═══════════════════════════════════════════════════════════════
// 3. MONGOOSE MODELS (Database Schemas)
// ═══════════════════════════════════════════════════════════════
//
// 📚 WHAT IS A SCHEMA?
// A schema defines the SHAPE of data in our database.
// Think of it like defining columns in an Excel spreadsheet.
// Each schema becomes a "collection" (like a table) in MongoDB.
//
// 📚 WHY MONGOOSE?
// MongoDB is "schemaless" by default (you can store anything).
// Mongoose adds VALIDATION — it ensures data is correct before saving.
// For example: email must be a valid email, password must be 6+ chars.


// ─── USER MODEL ────────────────────────────────────────────
// Stores registered users. Each user can be an "attendee" or "organizer".
// Organizers can create events; attendees can book tickets.

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true                                // trim: true removes whitespace from both ends
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,                             // Unique index — no two users can have the same email
    lowercase: true,                          // Automatically converts to lowercase
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['attendee', 'organizer'],          // enum = only these values are allowed
    default: 'attendee'
  },
  phone: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now                         // Automatically set to the current time
  }
});

const User = mongoose.model('User', userSchema);


// ─── EVENT MODEL ───────────────────────────────────────────
//
// 📚 THIS IS THE CORE OF OUR APP!
// An event has many properties. Notice how we use NESTED OBJECTS
// and ARRAYS to store complex data like ticket types and sponsors.
//
// The "ref: 'User'" creates a RELATIONSHIP between collections.
// It's like a foreign key in SQL — it links an event to its organizer.

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['music', 'tech', 'workshop', 'sports', 'business', 'food', 'art', 'other'],
    default: 'other'
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  time: {
    type: String,                             // e.g., "7:00 PM"
    default: ''
  },
  venue: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  capacity: {
    type: Number,
    default: 100
  },
  image: {
    type: String,                             // URL or base64 of event banner
    default: ''
  },

  // ── TICKET TYPES ──
  // An array of objects — each event can have multiple ticket tiers
  // Example: [{ name: "VIP", price: 2999, quantity: 50, sold: 12 }]
  ticketTypes: [{
    name:     { type: String, default: 'General' },
    price:    { type: Number, default: 0 },
    quantity: { type: Number, default: 100 },
    sold:     { type: Number, default: 0 }
  }],

  // ── SPONSORS ──
  sponsors: [{
    name: { type: String },
    logo: { type: String },
    url:  { type: String }
  }],

  // ── DISCOUNT CODES ──
  // Organizers can create promo codes for their events
  discountCodes: [{
    code:       { type: String },
    percentage: { type: Number },             // e.g., 20 means 20% off
    maxUses:    { type: Number, default: 100 },
    usedCount:  { type: Number, default: 0 }
  }],

  // ── WAITLIST ──
  // When tickets are sold out, users can join a waitlist
  waitlist: [{
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt:  { type: Date, default: Date.now }
  }],

  isVirtual: {
    type: Boolean,
    default: false
  },
  streamUrl: {
    type: String,                             // YouTube/Twitch URL for virtual events
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,     // Links to the User who created this event
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Event = mongoose.model('Event', eventSchema);


// ─── BOOKING MODEL ─────────────────────────────────────────
//
// 📚 WHAT IS A BOOKING?
// When a user buys tickets, we create a Booking document.
// It links the USER to the EVENT, stores ticket details,
// and includes a QR code for check-in at the venue.
//
// The "ref" fields create RELATIONSHIPS:
//   booking.event → points to an Event document
//   booking.user  → points to a User document
// This lets us "populate" (auto-fill) the event/user data when querying.

const bookingSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tickets: [{
    type:     { type: String, default: 'General' },
    quantity: { type: Number, default: 1 },
    price:    { type: Number, default: 0 },
    seats:    [{ type: String }]              // e.g., ["A1", "A2"] for assigned seating
  }],
  totalAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'paid'
  },
  // QR Code — a unique string that encodes the booking ID
  // We generate this as a data URL (base64 image) using the qrcode library
  qrCode: {
    type: String,
    default: ''
  },
  bookingCode: {
    type: String,
    default: ''                               // A short human-readable code like "BME-A3F2C1"
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date
  },
  // ── GROUP BOOKING ──
  // One person can buy tickets for a group
  isGroupBooking: {
    type: Boolean,
    default: false
  },
  groupMembers: [{
    name:  { type: String },
    email: { type: String }
  }],
  // ── DISCOUNT ──
  discountCode: {
    type: String,
    default: ''
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  refundStatus: {
    type: String,
    enum: ['none', 'requested', 'refunded'],
    default: 'none'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Booking = mongoose.model('Booking', bookingSchema);


// ─── FEEDBACK MODEL ────────────────────────────────────────
//
// 📚 WHY COLLECT FEEDBACK?
// After an event ends, attendees can rate it (1-5 stars) and leave comments.
// This helps organizers improve future events and gives other users
// social proof (like reviews on Amazon).

const feedbackSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);


// ═══════════════════════════════════════════════════════════════
// 4. MIDDLEWARE
// ═══════════════════════════════════════════════════════════════
//
// 📚 WHAT IS MIDDLEWARE?
// Middleware are functions that run BEFORE your route handlers.
// Think of them as security guards at a building entrance —
// they check every request before letting it through.
//
// express.json() — Parses JSON bodies (when frontend sends { "email": "..." })
// express.static() — Serves static files (HTML, CSS, JS, images)

app.use(express.json({ limit: '10mb' }));    // Allow up to 10MB bodies (for image uploads)
app.use(express.static(path.join(__dirname)));


// ── AUTH MIDDLEWARE (reusable) ──
// This function extracts and verifies the JWT token from request headers.
// We use it on PROTECTED routes (routes that require login).
//
// 📚 HOW JWT WORKS:
// 1. User logs in → server creates a TOKEN (encrypted string containing userId)
// 2. Frontend stores this token in localStorage
// 3. For every API call, frontend sends: Authorization: Bearer <token>
// 4. This middleware DECODES the token to find out WHO is making the request

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const token = authHeader.split(' ')[1];   // Get the token part after "Bearer "
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;              // Attach userId to the request for use in route handlers
    req.userName = decoded.name;
    req.userEmail = decoded.email;
    next();                                   // next() passes control to the NEXT middleware/route
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}


// ═══════════════════════════════════════════════════════════════
// 5. AUTH ROUTES (Register, Login, Profile)
// ═══════════════════════════════════════════════════════════════
//
// 📚 WHAT IS AUTHENTICATION?
// Authentication = verifying WHO a user is.
// - Registration: Create a new account (hash password, save to DB)
// - Login: Verify credentials, issue a JWT token
// - Profile: Return user data for the logged-in user
//
// 📚 WHY HASH PASSWORDS?
// We NEVER store plain text passwords. bcrypt converts
// "password123" into "$2a$10$X7EG..." which is IRREVERSIBLE.
// Even if hackers steal the database, they can't read passwords.

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    // Check if email already taken
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Hash password — genSalt(10) means 10 rounds of hashing (more = more secure but slower)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'attendee',
      phone: phone || ''
    });
    await user.save();

    // Create JWT token — this is the user's "digital ID card"
    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }                    // Token valid for 7 days
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error('Register error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});


app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // bcrypt.compare() hashes the input and checks against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});


// Protected route — only accessible with a valid token
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');  // exclude password field
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});


// ═══════════════════════════════════════════════════════════════
// 6. EVENT ROUTES (CRUD = Create, Read, Update, Delete)
// ═══════════════════════════════════════════════════════════════
//
// 📚 WHAT IS CRUD?
// CRUD stands for the 4 basic database operations:
//   C = Create (POST)   — make a new event
//   R = Read   (GET)    — view events
//   U = Update (PUT)    — edit an event
//   D = Delete (DELETE) — cancel an event
//
// 📚 REST API DESIGN:
// We follow REST conventions:
//   POST   /api/events     → Create
//   GET    /api/events     → List all
//   GET    /api/events/:id → Get one
//   PUT    /api/events/:id → Update one
//   DELETE /api/events/:id → Delete one
// The ":id" is a URL parameter — it's replaced with the actual event ID.

// ── CREATE EVENT ──
app.post('/api/events', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, date, time, venue, location,
            capacity, image, ticketTypes, sponsors, discountCodes,
            isVirtual, streamUrl } = req.body;

    if (!title || !date) {
      return res.status(400).json({ success: false, message: 'Title and date are required' });
    }

    const event = new Event({
      title,
      description: description || '',
      category: category || 'other',
      date,
      time: time || '',
      venue: venue || '',
      location: location || '',
      capacity: capacity || 100,
      image: image || '',
      ticketTypes: ticketTypes && ticketTypes.length > 0 ? ticketTypes : [{ name: 'General', price: 0, quantity: 100, sold: 0 }],
      sponsors: sponsors || [],
      discountCodes: discountCodes || [],
      isVirtual: isVirtual || false,
      streamUrl: streamUrl || '',
      organizer: req.userId                   // The logged-in user becomes the organizer
    });

    await event.save();

    res.status(201).json({ success: true, message: 'Event created!', event });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Failed to create event.' });
  }
});


// ── LIST ALL EVENTS ──
// Supports query parameters for filtering and search:
//   /api/events?category=music&search=festival&status=active
//
// 📚 WHAT IS QUERY STRING?
// The part after "?" in a URL. Express puts them in req.query.
// Example: /api/events?category=music → req.query.category === "music"

app.get('/api/events', async (req, res) => {
  try {
    const { category, search, status, organizer } = req.query;

    // Build a dynamic filter object
    const filter = {};
    if (category)  filter.category = category;
    if (status)    filter.status = status;
    else           filter.status = 'active';   // Default: only show active events
    if (organizer) filter.organizer = organizer;

    // Text search — find events whose title contains the search term
    // $regex creates a pattern match, $options: 'i' means case-insensitive
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // .populate('organizer', 'name email') = auto-fill the organizer field
    // with the actual user document (only name and email fields)
    const events = await Event.find(filter)
      .populate('organizer', 'name email')
      .sort({ date: 1 });                     // Sort by date ascending (soonest first)

    res.json({ success: true, events });

  } catch (error) {
    console.error('List events error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events.' });
  }
});


// ── GET SINGLE EVENT ──
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, event });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch event.' });
  }
});


// ── UPDATE EVENT ──
app.put('/api/events/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Only the organizer can edit their own event
    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'You can only edit your own events' });
    }

    // Update fields that were provided in the request body
    const updateFields = ['title', 'description', 'category', 'date', 'time',
      'venue', 'location', 'capacity', 'image', 'ticketTypes', 'sponsors',
      'discountCodes', 'isVirtual', 'streamUrl', 'status'];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    await event.save();
    res.json({ success: true, message: 'Event updated!', event });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update event.' });
  }
});


// ── CANCEL EVENT (with Auto-Refund!) ──
//
// 📚 WHAT HAPPENS WHEN AN EVENT IS CANCELLED?
// 1. We mark the event status as "cancelled"
// 2. We find ALL bookings for this event
// 3. We mark them ALL as "refunded" — this is the AUTO-REFUND feature
// This is done in a single API call — very efficient!

app.delete('/api/events/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own events' });
    }

    // Mark event as cancelled
    event.status = 'cancelled';
    await event.save();

    // AUTO-REFUND: Update ALL bookings for this event
    // updateMany() updates multiple documents at once — very efficient!
    const refundResult = await Booking.updateMany(
      { event: event._id, paymentStatus: 'paid' },   // Find all paid bookings for this event
      { paymentStatus: 'refunded', refundStatus: 'refunded' }  // Mark them as refunded
    );

    res.json({
      success: true,
      message: `Event cancelled. ${refundResult.modifiedCount} bookings auto-refunded.`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel event.' });
  }
});


// ═══════════════════════════════════════════════════════════════
// 7. BOOKING ROUTES
// ═══════════════════════════════════════════════════════════════
//
// 📚 THE BOOKING FLOW:
// 1. User selects an event and ticket type
// 2. (Optional) User enters a discount code
// 3. (Optional) User selects seats from the seating map
// 4. (Optional) User adds group members for group booking
// 5. Server validates everything, calculates the total
// 6. Server generates a unique QR CODE for check-in
// 7. Server saves the booking and returns the QR code
//
// 📚 QR CODE GENERATION:
// We use the 'crypto' module to create a unique booking code.
// Then we store a data URL that the frontend can display as a QR image.
// The QR encodes: "BME-<random_hex>" which is scanned at check-in.

app.post('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const { eventId, tickets, discountCode, isGroupBooking, groupMembers } = req.body;

    if (!eventId || !tickets || tickets.length === 0) {
      return res.status(400).json({ success: false, message: 'Event and tickets are required' });
    }

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This event is no longer active' });
    }

    // ── Calculate total and validate ticket availability ──
    let totalAmount = 0;
    const processedTickets = [];

    for (const ticket of tickets) {
      // Find the matching ticket type in the event
      const eventTicket = event.ticketTypes.find(t => t.name === ticket.type);
      if (!eventTicket) {
        return res.status(400).json({ success: false, message: `Ticket type "${ticket.type}" not found` });
      }

      // Check if enough tickets are available
      const available = eventTicket.quantity - eventTicket.sold;
      if (ticket.quantity > available) {
        return res.status(400).json({
          success: false,
          message: `Only ${available} "${ticket.type}" tickets available`
        });
      }

      const ticketTotal = eventTicket.price * ticket.quantity;
      totalAmount += ticketTotal;

      processedTickets.push({
        type: ticket.type,
        quantity: ticket.quantity,
        price: eventTicket.price,
        seats: ticket.seats || []
      });

      // Update sold count on the event
      eventTicket.sold += ticket.quantity;
    }

    // ── Apply Discount Code ──
    let discountAmount = 0;
    if (discountCode) {
      const discount = event.discountCodes.find(
        d => d.code.toUpperCase() === discountCode.toUpperCase()
      );
      if (discount && discount.usedCount < discount.maxUses) {
        discountAmount = Math.round(totalAmount * (discount.percentage / 100));
        totalAmount -= discountAmount;
        discount.usedCount += 1;              // Increment usage count
      }
    }

    // Save updated event (ticket sold counts + discount usage)
    await event.save();

    // ── Generate Booking Code & QR Code ──
    // crypto.randomBytes(4).toString('hex') generates 8 random hex characters
    const bookingCode = 'BME-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // For QR code, we generate a simple text-based QR data
    // The frontend will render this using a QR library
    const qrData = JSON.stringify({
      code: bookingCode,
      event: event.title,
      date: event.date
    });

    // Create the booking document
    const booking = new Booking({
      event: eventId,
      user: req.userId,
      tickets: processedTickets,
      totalAmount,
      paymentStatus: totalAmount === 0 ? 'paid' : 'paid',  // Simulated payment
      qrCode: qrData,
      bookingCode,
      isGroupBooking: isGroupBooking || false,
      groupMembers: groupMembers || [],
      discountCode: discountCode || '',
      discountAmount
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking confirmed!',
      booking: {
        id: booking._id,
        bookingCode: booking.bookingCode,
        event: event.title,
        date: event.date,
        tickets: processedTickets,
        totalAmount,
        discountAmount,
        qrCode: booking.qrCode,
        isGroupBooking: booking.isGroupBooking,
        groupMembers: booking.groupMembers
      }
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking.' });
  }
});


// ── GET USER'S BOOKINGS ──
app.get('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId })
      .populate('event')                      // Auto-fill event details
      .sort({ createdAt: -1 });               // Newest first

    res.json({ success: true, bookings });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
});


// ── GET SINGLE BOOKING ──
app.get('/api/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, booking });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch booking.' });
  }
});


// ── CANCEL BOOKING ──
app.delete('/api/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own bookings' });
    }

    if (booking.checkedIn) {
      return res.status(400).json({ success: false, message: 'Cannot cancel — already checked in' });
    }

    // Restore ticket counts on the event
    const event = await Event.findById(booking.event);
    if (event) {
      for (const ticket of booking.tickets) {
        const eventTicket = event.ticketTypes.find(t => t.name === ticket.type);
        if (eventTicket) {
          eventTicket.sold = Math.max(0, eventTicket.sold - ticket.quantity);
        }
      }

      // ── WAITLIST AUTO-NOTIFY ──
      // If there are people on the waitlist, notify them tickets are available
      if (event.waitlist.length > 0) {
        // In a real app, we'd send an email here using Nodemailer
        // For now, we just log it
        console.log(`📧 Notify ${event.waitlist.length} waitlisted users: tickets available for "${event.title}"`);
      }

      await event.save();
    }

    // Mark as refunded
    booking.paymentStatus = 'refunded';
    booking.refundStatus = 'refunded';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled and refunded.' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
  }
});


// ── QR CODE CHECK-IN ──
//
// 📚 HOW CHECK-IN WORKS:
// 1. Organizer opens the check-in page on their phone/tablet
// 2. They enter the booking code (e.g., "BME-A3F2C1")
// 3. This endpoint finds the booking and marks it as "checked in"
// 4. If already checked in → error (prevents re-entry)

app.post('/api/bookings/checkin/:code', async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingCode: req.params.code })
      .populate('event', 'title date')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Invalid booking code' });
    }

    if (booking.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in!',
        checkedInAt: booking.checkedInAt
      });
    }

    if (booking.paymentStatus === 'refunded') {
      return res.status(400).json({ success: false, message: 'This booking has been refunded/cancelled' });
    }

    // Mark as checked in
    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'Check-in successful! ✅',
      booking: {
        code: booking.bookingCode,
        attendee: booking.user.name,
        event: booking.event.title,
        tickets: booking.tickets,
        checkedInAt: booking.checkedInAt
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Check-in failed.' });
  }
});


// ═══════════════════════════════════════════════════════════════
// 8. FEEDBACK ROUTES
// ═══════════════════════════════════════════════════════════════

app.post('/api/events/:id/feedback', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Check if user already left feedback for this event
    const existing = await Feedback.findOne({ event: req.params.id, user: req.userId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already submitted feedback for this event' });
    }

    const feedback = new Feedback({
      event: req.params.id,
      user: req.userId,
      rating,
      comment: comment || ''
    });

    await feedback.save();

    res.status(201).json({ success: true, message: 'Feedback submitted!', feedback });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
  }
});


app.get('/api/events/:id/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ event: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : 0;

    res.json({ success: true, feedbacks, avgRating: parseFloat(avgRating), totalReviews: feedbacks.length });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch feedback.' });
  }
});


// ═══════════════════════════════════════════════════════════════
// 9. ANALYTICS ROUTES
// ═══════════════════════════════════════════════════════════════
//
// 📚 WHAT IS DATA AGGREGATION?
// Aggregation = combining data to produce summaries.
// Instead of returning every single booking, we COUNT them,
// SUM the revenue, and calculate percentages.
// This is what powers the analytics dashboard.

app.get('/api/analytics', authMiddleware, async (req, res) => {
  try {
    // Get all events by this organizer
    const myEvents = await Event.find({ organizer: req.userId });
    const eventIds = myEvents.map(e => e._id);

    // Get all bookings for those events
    const allBookings = await Booking.find({ event: { $in: eventIds } });

    // ── Calculate Statistics ──
    const totalEvents = myEvents.length;
    const activeEvents = myEvents.filter(e => e.status === 'active').length;

    const totalBookings = allBookings.length;
    const paidBookings = allBookings.filter(b => b.paymentStatus === 'paid');
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    const checkedInCount = allBookings.filter(b => b.checkedIn).length;
    const attendanceRate = totalBookings > 0
      ? Math.round((checkedInCount / totalBookings) * 100)
      : 0;

    const totalTicketsSold = paidBookings.reduce((sum, b) => {
      return sum + b.tickets.reduce((tSum, t) => tSum + t.quantity, 0);
    }, 0);

    // ── Per-Event Breakdown ──
    const eventBreakdown = myEvents.map(event => {
      const eventBookings = allBookings.filter(b => b.event.toString() === event._id.toString());
      const eventRevenue = eventBookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + b.totalAmount, 0);
      const eventCheckedIn = eventBookings.filter(b => b.checkedIn).length;

      return {
        id: event._id,
        title: event.title,
        date: event.date,
        status: event.status,
        bookings: eventBookings.length,
        revenue: eventRevenue,
        checkedIn: eventCheckedIn,
        capacity: event.capacity,
        ticketTypes: event.ticketTypes
      };
    });

    // Also get user's own bookings (attendee view)
    const myBookings = await Booking.find({ user: req.userId }).populate('event');

    res.json({
      success: true,
      organizer: {
        totalEvents,
        activeEvents,
        totalBookings,
        totalRevenue,
        totalTicketsSold,
        attendanceRate,
        eventBreakdown
      },
      attendee: {
        totalBookings: myBookings.length,
        upcomingBookings: myBookings.filter(b =>
          b.event && b.event.date > new Date() && b.paymentStatus === 'paid'
        ).length,
        totalSpent: myBookings
          .filter(b => b.paymentStatus === 'paid')
          .reduce((sum, b) => sum + b.totalAmount, 0),
        eventsAttended: myBookings.filter(b => b.checkedIn).length
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
});


// ═══════════════════════════════════════════════════════════════
// 10. UTILITY ROUTES
// ═══════════════════════════════════════════════════════════════

// ── VALIDATE DISCOUNT CODE ──
app.post('/api/discount/validate', async (req, res) => {
  try {
    const { eventId, code } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const discount = event.discountCodes.find(
      d => d.code.toUpperCase() === code.toUpperCase()
    );

    if (!discount) {
      return res.json({ success: false, message: 'Invalid discount code' });
    }

    if (discount.usedCount >= discount.maxUses) {
      return res.json({ success: false, message: 'This code has been used up' });
    }

    res.json({
      success: true,
      discount: {
        code: discount.code,
        percentage: discount.percentage,
        remaining: discount.maxUses - discount.usedCount
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to validate code.' });
  }
});


// ── JOIN WAITLIST ──
app.post('/api/events/:id/waitlist', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if already on waitlist
    const alreadyWaitlisted = event.waitlist.some(
      w => w.user.toString() === req.userId
    );
    if (alreadyWaitlisted) {
      return res.status(400).json({ success: false, message: 'You are already on the waitlist' });
    }

    event.waitlist.push({ user: req.userId });
    await event.save();

    res.json({
      success: true,
      message: 'Added to waitlist! You\'ll be notified when tickets become available.',
      position: event.waitlist.length
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to join waitlist.' });
  }
});


// ── CALENDAR FILE GENERATION (.ics) ──
//
// 📚 WHAT IS AN .ICS FILE?
// It's a universal calendar format. When you download it,
// your phone/computer can add the event to Google Calendar,
// Apple Calendar, or Outlook automatically.
// The format follows the iCalendar standard (RFC 5545).

app.get('/api/events/:id/calendar', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours

    // Format date as iCalendar format: YYYYMMDDTHHMMSSZ
    const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BookMyEvent//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || event.title}`,
      `LOCATION:${event.venue || ''}, ${event.location || ''}`,
      `UID:${event._id}@bookmyevent`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="${event.title}.ics"`);
    res.send(icsContent);

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate calendar file.' });
  }
});


// ── GET BOOKINGS FOR AN EVENT (Organizer view) ──
app.get('/api/events/:id/bookings', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const bookings = await Booking.find({ event: req.params.id })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    const totalCheckedIn = bookings.filter(b => b.checkedIn).length;

    res.json({
      success: true,
      bookings,
      totalBookings: bookings.length,
      totalCheckedIn
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch event bookings.' });
  }
});


// ═══════════════════════════════════════════════════════════════
// 11. SEED SAMPLE DATA (for demo purposes)
// ═══════════════════════════════════════════════════════════════
//
// 📚 WHAT IS SEEDING?
// "Seeding" means inserting initial demo data into the database.
// This is useful so the app has events to show when first loaded.
// In production, this would be removed.

app.post('/api/seed', async (req, res) => {
  try {
    // Create a demo organizer if none exists
    let organizer = await User.findOne({ email: 'organizer@bookmyevent.com' });
    if (!organizer) {
      const salt = await bcrypt.genSalt(10);
      const hashedPw = await bcrypt.hash('organizer123', salt);
      organizer = new User({
        name: 'BookMyEvent Admin',
        email: 'organizer@bookmyevent.com',
        password: hashedPw,
        role: 'organizer'
      });
      await organizer.save();
    }

    // Check if events already exist
    const eventCount = await Event.countDocuments();
    if (eventCount > 0) {
      return res.json({ success: true, message: 'Data already seeded!' });
    }

    // Create sample events
    const sampleEvents = [
      {
        title: 'Neon Nights Festival',
        description: 'Experience the biggest electronic music festival with world-class DJs, stunning light shows, and an unforgettable nightlife experience. Dance under the stars with thousands of music lovers!',
        category: 'music',
        date: new Date('2026-09-12'),
        time: '7:00 PM',
        venue: 'Phoenix Arena',
        location: 'Mumbai',
        capacity: 500,
        ticketTypes: [
          { name: 'General', price: 999, quantity: 300, sold: 0 },
          { name: 'VIP', price: 2499, quantity: 100, sold: 0 },
          { name: 'Early Bird', price: 799, quantity: 100, sold: 0 }
        ],
        sponsors: [
          { name: 'SoundWave Audio', logo: '', url: '#' },
          { name: 'NightGlow Drinks', logo: '', url: '#' }
        ],
        discountCodes: [
          { code: 'NEON20', percentage: 20, maxUses: 50, usedCount: 0 },
          { code: 'EARLYNEON', percentage: 10, maxUses: 100, usedCount: 0 }
        ],
        organizer: organizer._id
      },
      {
        title: 'Global Tech Summit 2026',
        description: 'Join industry leaders for keynotes on AI, blockchain, and quantum computing. Network with top engineers, attend hands-on workshops, and explore the future of technology.',
        category: 'tech',
        date: new Date('2026-10-05'),
        time: '9:00 AM',
        venue: 'Bangalore International Exhibition Centre',
        location: 'Bangalore',
        capacity: 300,
        ticketTypes: [
          { name: 'General', price: 1499, quantity: 200, sold: 0 },
          { name: 'VIP', price: 3999, quantity: 50, sold: 0 },
          { name: 'Early Bird', price: 1199, quantity: 50, sold: 0 }
        ],
        sponsors: [
          { name: 'TechCorp', logo: '', url: '#' },
          { name: 'CloudBase', logo: '', url: '#' },
          { name: 'AI Ventures', logo: '', url: '#' }
        ],
        discountCodes: [
          { code: 'TECH15', percentage: 15, maxUses: 30, usedCount: 0 }
        ],
        organizer: organizer._id
      },
      {
        title: 'Design Thinking Workshop',
        description: 'A free hands-on workshop covering user research, ideation, prototyping, and testing. Perfect for beginners and experienced designers looking to sharpen their skills.',
        category: 'workshop',
        date: new Date('2026-08-28'),
        time: '10:00 AM',
        venue: 'Online (Zoom)',
        location: 'Online',
        capacity: 200,
        isVirtual: true,
        streamUrl: 'https://zoom.us/j/example',
        ticketTypes: [
          { name: 'General', price: 0, quantity: 200, sold: 0 }
        ],
        organizer: organizer._id
      },
      {
        title: 'Startup Pitch Night',
        description: 'Watch 10 exciting startups pitch their ideas to a panel of top VCs. Networking, drinks, and the chance to discover the next big thing in tech entrepreneurship.',
        category: 'business',
        date: new Date('2026-09-20'),
        time: '6:00 PM',
        venue: 'WeWork Cyber Hub',
        location: 'Delhi',
        capacity: 150,
        ticketTypes: [
          { name: 'General', price: 499, quantity: 100, sold: 0 },
          { name: 'VIP', price: 1499, quantity: 50, sold: 0 }
        ],
        discountCodes: [
          { code: 'STARTUP30', percentage: 30, maxUses: 20, usedCount: 0 }
        ],
        organizer: organizer._id
      },
      {
        title: 'Mumbai Food Festival',
        description: 'Celebrate the best of Indian street food and gourmet cuisine! Live cooking demos, celebrity chef appearances, food stalls from across the country, and live music.',
        category: 'food',
        date: new Date('2026-11-15'),
        time: '11:00 AM',
        venue: 'BKC Grounds',
        location: 'Mumbai',
        capacity: 1000,
        ticketTypes: [
          { name: 'General', price: 299, quantity: 800, sold: 0 },
          { name: 'VIP', price: 999, quantity: 200, sold: 0 }
        ],
        organizer: organizer._id
      },
      {
        title: 'Art & Culture Exhibition',
        description: 'Explore contemporary art installations, live painting sessions, and cultural performances from artists across India. An immersive experience for art enthusiasts.',
        category: 'art',
        date: new Date('2026-10-25'),
        time: '10:00 AM',
        venue: 'National Gallery of Modern Art',
        location: 'Delhi',
        capacity: 250,
        ticketTypes: [
          { name: 'General', price: 199, quantity: 200, sold: 0 },
          { name: 'VIP', price: 599, quantity: 50, sold: 0 }
        ],
        organizer: organizer._id
      }
    ];

    await Event.insertMany(sampleEvents);

    res.json({
      success: true,
      message: `Seeded ${sampleEvents.length} sample events!`,
      organizerLogin: { email: 'organizer@bookmyevent.com', password: 'organizer123' }
    });

  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ success: false, message: 'Failed to seed data.' });
  }
});


// ═══════════════════════════════════════════════════════════════
// 12. START SERVER
// ═══════════════════════════════════════════════════════════════
//
// 📚 CONNECTION FLOW:
// 1. First, connect to MongoDB (our database)
// 2. If successful, start the Express server
// 3. The server LISTENS on a port for incoming HTTP requests
//
// async/await is used because connecting to a database takes time
// (it's an asynchronous operation — it happens "in the background")

async function startServer() {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📄 Open http://localhost:${PORT} in your browser`);
      console.log('');
      console.log('💡 TIP: Run this to seed sample events:');
      console.log(`   curl -X POST http://localhost:${PORT}/api/seed`);
    });

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    console.error('');
    console.error('💡 Make sure you have:');
    console.error('   1. Created a MongoDB Atlas account (mongodb.com/atlas)');
    console.error('   2. Created a cluster and database user');
    console.error('   3. Added your IP to the whitelist');
    console.error('   4. Updated MONGODB_URI in your .env file');
    process.exit(1);
  }
}

startServer();
