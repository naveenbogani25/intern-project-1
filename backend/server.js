// =============================================================
// FirstCry Intellitots: Child Health & Allergy Tracker
// Backend Node.js Express API Server (PostgreSQL with Mock Fallback)
// Prepared for local run and cloud deployment (Render.com)
// =============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// =============================================================
// DATABASE CONNECTION & INITIALIZATION
// =============================================================

let pool = null;
let usingMockData = false;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.dwabqnflxvtkehzsrtph:V92A2yvaTVwy1O1s@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres';

async function initDatabase() {
  try {
    console.log('[DB] Connecting to PostgreSQL database...');
    pool = new Pool({
      connectionString: connectionString,
      ssl: connectionString.includes('supabase.com') || connectionString.includes('render.com')
        ? { rejectUnauthorized: false }
        : false
    });

    // Verify database connection
    const client = await pool.connect();
    console.log('[DB] Successfully connected to PostgreSQL.');
    client.release();

    // Auto-migrate tables if not present
    await runMigrations();
    usingMockData = false;
  } catch (err) {
    console.error(`[DB ERROR] Could not connect to PostgreSQL: ${err.message}`);
    console.warn('[DB] Falling back to in-memory MOCK DATA mode.');
    usingMockData = true;
  }
}

// Automatically create tables on startup if empty
async function runMigrations() {
  try {
    console.log('[DB] Running database migrations if tables are missing...');
    
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(200) UNIQUE NOT NULL,
        password VARCHAR(200) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default admin if missing
    const adminCheck = await pool.query("SELECT * FROM users WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      console.log('[DB] Seeding default admin user...');
      await pool.query(`
        INSERT INTO users (username, email, password, role)
        VALUES ('admin', 'admin@intellitots.com', 'Admin@123', 'admin')
      `);
    }

    // Core Tracking Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classrooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        capacity INT DEFAULT 20,
        age_group VARCHAR(50),
        teacher_name VARCHAR(150),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS children (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100),
        date_of_birth DATE,
        age INT,
        gender VARCHAR(50) DEFAULT 'Other',
        blood_group VARCHAR(10),
        classroom_id INT,
        photo_url VARCHAR(500),
        doctor_notes TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        admission_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS parents (
        id SERIAL PRIMARY KEY,
        child_id INT NOT NULL,
        name VARCHAR(200) NOT NULL,
        relation VARCHAR(50),
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(200),
        address TEXT,
        is_emergency_contact BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        child_id INT NOT NULL,
        date DATE NOT NULL,
        check_in_time TIME,
        check_out_time TIME,
        status VARCHAR(50) DEFAULT 'Present',
        marked_by VARCHAR(150),
        notes VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS allergies (
        id SERIAL PRIMARY KEY,
        child_id INT NOT NULL,
        allergy_type VARCHAR(100) NOT NULL,
        severity VARCHAR(50) DEFAULT 'Moderate',
        reaction_details TEXT,
        doctor_confirmed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS medications (
        id SERIAL PRIMARY KEY,
        child_id INT NOT NULL,
        medicine_name VARCHAR(200) NOT NULL,
        dosage VARCHAR(100),
        schedule VARCHAR(200),
        prescribing_doctor VARCHAR(200),
        start_date DATE,
        end_date DATE,
        special_instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS meals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        ingredients TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'Lunch',
        suitable_age_group VARCHAR(50),
        calories INT,
        is_vegetarian BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id SERIAL PRIMARY KEY,
        child_id INT NOT NULL,
        category VARCHAR(50) DEFAULT 'Cognitive',
        milestone_name VARCHAR(300) NOT NULL,
        description TEXT,
        achieved_date DATE,
        assessed_by VARCHAR(150),
        status VARCHAR(50) DEFAULT 'Not Started',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fees (
        id SERIAL PRIMARY KEY,
        child_id INT NOT NULL,
        fee_type VARCHAR(50) DEFAULT 'Tuition',
        amount DECIMAL(10, 2) NOT NULL,
        due_date DATE NOT NULL,
        paid_date DATE,
        payment_method VARCHAR(50) DEFAULT 'Cash',
        status VARCHAR(50) DEFAULT 'Pending',
        receipt_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
      )
    `);

    // Seed classrooms if none exist
    const classroomsRes = await pool.query('SELECT COUNT(*) as count FROM classrooms');
    if (parseInt(classroomsRes.rows[0].count) === 0) {
      console.log('[DB] Seeding classrooms table...');
      await pool.query(`
        INSERT INTO classrooms (name, capacity, age_group, teacher_name) VALUES
        ('Butterfly Room', 15, '2-3 years', 'Ms. Priya Sharma'),
        ('Sunshine Class', 18, '3-4 years', 'Ms. Anita Desai'),
        ('Rainbow Room', 20, '4-5 years', 'Mr. Rahul Verma')
      `);
    }

    // Seed meals if none exist
    const mealsRes = await pool.query('SELECT COUNT(*) as count FROM meals');
    if (parseInt(mealsRes.rows[0].count) === 0) {
      console.log('[DB] Seeding meals table...');
      await pool.query(`
        INSERT INTO meals (name, ingredients, category, suitable_age_group, is_vegetarian) VALUES
        ('Veggie Pasta', 'pasta, tomato sauce, carrots, peas, cheese, olive oil', 'Lunch', '2+ years', TRUE),
        ('Peanut Butter Sandwich', 'bread, peanut butter, honey, butter', 'Snack', '3+ years', TRUE),
        ('Fruit Yogurt Bowl', 'yogurt, milk, strawberries, banana, honey, granola', 'Breakfast', '2+ years', TRUE),
        ('Rice & Dal', 'rice, lentils, turmeric, ghee, cumin, salt', 'Lunch', '2+ years', TRUE),
        ('Chocolate Milk Shake', 'milk, chocolate syrup, sugar, ice cream', 'Snack', '3+ years', TRUE),
        ('Egg Fried Rice', 'rice, eggs, soy sauce, vegetables, sesame oil', 'Lunch', '3+ years', FALSE),
        ('Mixed Fruit Salad', 'apple, banana, grapes, orange, pomegranate', 'Snack', '2+ years', TRUE)
      `);
    }

    console.log('[DB] Migrations and seeding check completed.');
  } catch (err) {
    console.error(`[MIGRATION ERROR] Failed to run database migrations: ${err.message}`);
  }
}

// =============================================================
// IN-MEMORY MOCK DATA (Used when PostgreSQL is not available)
// =============================================================

let mockIdCounter = 4;
let mockMilestoneIdCounter = 11;
let mockFeeIdCounter = 7;
let mockAttendanceIdCounter = 4;
let mockUserIdCounter = 6;
const MOCK_USERS = [
  { id: 1, username: 'admin', email: 'admin@intellitots.com', password: 'Admin@123', role: 'admin' },
  { id: 2, username: 'priya', email: 'priya@email.com', password: 'password123', role: 'teacher' },
  { id: 3, username: 'anita', email: 'anita@email.com', password: 'password123', role: 'teacher' },
  { id: 4, username: 'preet', email: 'preet.singh@email.com', password: 'password123', role: 'parent' },
  { id: 5, username: 'raj', email: 'raj.patel@email.com', password: 'password123', role: 'parent' }
];

const MOCK_CLASSROOMS = [
  { id: 1, name: 'Butterfly Room', age_group: '2-3 years', teacher_name: 'Ms. Priya Sharma' },
  { id: 2, name: 'Sunshine Class', age_group: '3-4 years', teacher_name: 'Ms. Anita Desai' },
  { id: 3, name: 'Rainbow Room', age_group: '4-5 years', teacher_name: 'Mr. Rahul Verma' },
];

const MOCK_CHILDREN = [
  {
    id: 1,
    first_name: 'Aarav',
    last_name: 'Patel',
    age: 3,
    gender: 'Male',
    blood_group: 'A+',
    classroom_id: 2,
    classroom_name: 'Sunshine Class',
    doctor_notes: 'Aarav has a history of severe peanut allergy confirmed by skin prick test. He also shows mild lactose intolerance. Prescribed EpiPen for emergencies. Avoid all tree nuts and peanut-based products. Monitor for skin rashes after dairy consumption. Last checkup: January 2026.',
    status: 'Active',
    allergies: [
      { id: 1, allergy_type: 'Peanuts', severity: 'Severe' },
      { id: 2, allergy_type: 'Dairy', severity: 'Mild' },
    ],
    medications: [
      { id: 1, medicine_name: 'EpiPen (Epinephrine)', dosage: '0.15mg auto-injector', schedule: 'Emergency use only' },
      { id: 2, medicine_name: 'Cetirizine', dosage: '2.5ml once daily', schedule: 'Evening after dinner' },
    ],
    parents: [
      { id: 1, name: 'Raj Patel', relation: 'Father', phone: '+91-9876543210', email: 'raj.patel@email.com', is_emergency_contact: true },
      { id: 2, name: 'Meera Patel', relation: 'Mother', phone: '+91-9876543211', email: 'meera.patel@email.com', is_emergency_contact: true },
    ],
  },
  {
    id: 2,
    first_name: 'Diya',
    last_name: 'Sharma',
    age: 4,
    gender: 'Female',
    blood_group: 'B+',
    classroom_id: 3,
    classroom_name: 'Rainbow Room',
    doctor_notes: 'Diya is a healthy child with no major medical concerns. Routine vaccinations are up to date. She had a minor cold last month, fully recovered. No known food allergies. Parents report she is a picky eater but nutritionally adequate.',
    status: 'Active',
    allergies: [],
    medications: [],
    parents: [
      { id: 3, name: 'Vikram Sharma', relation: 'Father', phone: '+91-9123456789', email: 'vikram.s@email.com', is_emergency_contact: true },
    ],
  },
  {
    id: 3,
    first_name: 'Kabir',
    last_name: 'Singh',
    age: 2,
    gender: 'Male',
    blood_group: 'O+',
    classroom_id: 1,
    classroom_name: 'Butterfly Room',
    doctor_notes: 'Kabir has severe dairy allergy - anaphylactic risk. Must avoid all milk, cheese, yogurt, butter, and whey products. Also allergic to eggs (moderate severity - causes hives). Prescribed antihistamine drops. Parents carry backup EpiPen. Soy-based formula recommended as milk alternative.',
    status: 'Active',
    allergies: [
      { id: 3, allergy_type: 'Dairy', severity: 'Severe' },
      { id: 4, allergy_type: 'Eggs', severity: 'Moderate' },
    ],
    medications: [
      { id: 3, medicine_name: 'Allegra Drops', dosage: '1ml twice daily', schedule: 'Morning and evening' },
    ],
    parents: [
      { id: 4, name: 'Preet Singh', relation: 'Father', phone: '+91-9988776655', email: 'preet.singh@email.com', is_emergency_contact: true },
      { id: 5, name: 'Simran Singh', relation: 'Mother', phone: '+91-9988776656', email: 'simran.s@email.com', is_emergency_contact: false },
    ],
  },
];

const MOCK_MEALS = [
  { id: 1, name: 'Veggie Pasta', ingredients: 'pasta, tomato sauce, carrots, peas, cheese, olive oil', category: 'Lunch' },
  { id: 2, name: 'Peanut Butter Sandwich', ingredients: 'bread, peanut butter, honey, butter', category: 'Snack' },
  { id: 3, name: 'Fruit Yogurt Bowl', ingredients: 'yogurt, milk, strawberries, banana, honey, granola', category: 'Breakfast' },
  { id: 4, name: 'Rice & Dal', ingredients: 'rice, lentils, turmeric, ghee, cumin, salt', category: 'Lunch' },
  { id: 5, name: 'Chocolate Milk Shake', ingredients: 'milk, chocolate syrup, sugar, ice cream', category: 'Snack' },
  { id: 6, name: 'Egg Fried Rice', ingredients: 'rice, eggs, soy sauce, vegetables, sesame oil', category: 'Lunch' },
  { id: 7, name: 'Mixed Fruit Salad', ingredients: 'apple, banana, grapes, orange, pomegranate', category: 'Snack' },
];

const MOCK_ATTENDANCE = [
  { id: 1, child_id: 1, date: '2026-06-18', status: 'Present', check_in_time: '08:45', check_out_time: null, notes: '' },
  { id: 2, child_id: 2, date: '2026-06-18', status: 'Present', check_in_time: '09:00', check_out_time: null, notes: '' },
  { id: 3, child_id: 3, date: '2026-06-18', status: 'Absent', check_in_time: null, check_out_time: null, notes: 'Parent called - mild fever' },
];

const MOCK_MILESTONES = [
  { id: 1, child_id: 1, category: 'Cognitive', milestone_name: 'Can count to 10', status: 'Achieved', achieved_date: '2026-05-15' },
  { id: 2, child_id: 1, category: 'Physical', milestone_name: 'Can hop on one foot', status: 'In Progress', achieved_date: null },
  { id: 3, child_id: 1, category: 'Social', milestone_name: 'Plays cooperatively with peers', status: 'Achieved', achieved_date: '2026-04-20' },
  { id: 4, child_id: 1, category: 'Language', milestone_name: 'Speaks in 4-5 word sentences', status: 'Achieved', achieved_date: '2026-03-10' },
  { id: 5, child_id: 2, category: 'Cognitive', milestone_name: 'Recognizes basic shapes', status: 'Achieved', achieved_date: '2026-02-28' },
  { id: 6, child_id: 2, category: 'Physical', milestone_name: 'Can catch a bounced ball', status: 'Achieved', achieved_date: '2026-05-01' },
  { id: 7, child_id: 2, category: 'Language', milestone_name: 'Tells simple stories', status: 'In Progress', achieved_date: null },
  { id: 8, child_id: 3, category: 'Physical', milestone_name: 'Walks steadily', status: 'Achieved', achieved_date: '2026-01-15' },
  { id: 9, child_id: 3, category: 'Language', milestone_name: 'Says 10+ words', status: 'In Progress', achieved_date: null },
  { id: 10, child_id: 3, category: 'Social', milestone_name: 'Shows interest in other children', status: 'Not Started', achieved_date: null },
];

const MOCK_FEES = [
  { id: 1, child_id: 1, child_name: 'Aarav Patel', fee_type: 'Tuition', amount: 15000.00, due_date: '2026-06-01', paid_date: null, status: 'Overdue', payment_method: null },
  { id: 2, child_id: 1, child_name: 'Aarav Patel', fee_type: 'Meals', amount: 3000.00, due_date: '2026-06-01', paid_date: '2026-05-28', status: 'Paid', payment_method: 'UPI' },
  { id: 3, child_id: 2, child_name: 'Diya Sharma', fee_type: 'Tuition', amount: 15000.00, due_date: '2026-06-01', paid_date: '2026-06-01', status: 'Paid', payment_method: 'Card' },
  { id: 4, child_id: 2, child_name: 'Diya Sharma', fee_type: 'Transport', amount: 2500.00, due_date: '2026-07-01', paid_date: null, status: 'Pending', payment_method: null },
  { id: 5, child_id: 3, child_name: 'Kabir Singh', fee_type: 'Tuition', amount: 15000.00, due_date: '2026-06-01', paid_date: null, status: 'Overdue', payment_method: null },
  { id: 6, child_id: 3, child_name: 'Kabir Singh', fee_type: 'Admission', amount: 5000.00, due_date: '2026-01-15', paid_date: '2026-01-15', status: 'Paid', payment_method: 'Cash' },
];

// =============================================================
// RULE ENGINE: Allergy Ingredient Matcher
// =============================================================

const ALLERGY_INGREDIENT_MAP = {
  peanuts: ['peanut', 'peanuts', 'groundnut', 'groundnuts'],
  dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'ghee', 'whey', 'ice cream', 'paneer', 'curd'],
  eggs: ['egg', 'eggs', 'mayonnaise', 'meringue'],
  gluten: ['wheat', 'bread', 'pasta', 'flour', 'barley', 'rye', 'noodles'],
  soy: ['soy', 'soya', 'tofu', 'soy sauce', 'edamame'],
  shellfish: ['shrimp', 'crab', 'lobster', 'prawn', 'prawns'],
  'tree nuts': ['almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan'],
  fish: ['fish', 'salmon', 'tuna', 'cod', 'sardine'],
  sesame: ['sesame', 'tahini'],
};

function checkMealSafety(childAllergies, mealIngredients) {
  const ingredientsLower = (mealIngredients || '').toLowerCase();
  const matchedAllergens = [];

  for (const allergy of childAllergies) {
    const allergyKey = allergy.toLowerCase().trim();
    const keywords = ALLERGY_INGREDIENT_MAP[allergyKey] || [allergyKey];

    for (const keyword of keywords) {
      if (ingredientsLower.includes(keyword)) {
        matchedAllergens.push({
          allergy: allergy,
          matched_ingredient: keyword
        });
        break;
      }
    }
  }

  return {
    status: matchedAllergens.length > 0 ? 'RESTRICTED' : 'SAFE',
    matched_allergens: matchedAllergens
  };
}

const HIGH_RISK_ALLERGIES = ['peanuts', 'dairy', 'shellfish', 'tree nuts', 'eggs'];
const HIGH_RISK_SEVERITIES = ['severe'];

function isHighRisk(allergies) {
  for (const allergy of allergies) {
    const severity = (allergy.severity || '').toLowerCase();
    const type = (allergy.allergy_type || '').toLowerCase();

    if (HIGH_RISK_SEVERITIES.includes(severity) || HIGH_RISK_ALLERGIES.includes(type)) {
      return true;
    }
  }
  return false;
}

// =============================================================
// GEMINI AI ASSISTANT: Note Summarizer
// =============================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
let genAI = null;

if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('[AI] Google Gemini SDK initialized successfully.');
  } catch (err) {
    console.error('[AI ERROR] Google Gemini SDK initialization failed:', err.message);
  }
} else {
  console.log('[AI] Gemini API Key not set. Using raw notes/mock responses.');
}

async function getGeminiSummary(medicalNotes) {
  if (!genAI || !GEMINI_API_KEY) {
    return {
      summary: '[!] AI summary unavailable - Gemini API key not configured. Please review the child\'s medical notes manually.',
      meal_suggestion: 'Plain rice with steamed vegetables (safe default option)',
      source: 'fallback'
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a FirstCry Intellitots medical safety assistant for a daycare/preschool center.
    A teacher needs a quick safety briefing about a child. Below are the child's doctor/medical notes.
    
    DOCTOR/MEDICAL NOTES:
    ${medicalNotes}
    
    Please respond in EXACTLY this JSON format (no extra text or markdown wrappers):
    {
        "summary": "<A strict 2-sentence safety directive for daycare teachers. Be specific about what to avoid and what to watch for.>",
        "meal_suggestion": "<One safe, kid-friendly meal alternative that avoids any mentioned allergens or restrictions.>"
    }`;

    console.log('[AI] Sending medical notes to Gemini...');
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary,
      meal_suggestion: parsed.meal_suggestion,
      source: 'gemini'
    };
  } catch (err) {
    console.error(`[AI ERROR] Gemini summarizer failed: ${err.message}`);
    return {
      summary: `[!] AI summary temporarily unavailable. Error: ${err.message.substring(0, 50)}. Please review doctor notes manually.`,
      meal_suggestion: 'Plain rice with steamed vegetables (safe default option)',
      source: 'error'
    };
  }
}

// =============================================================
// API ROUTES
// =============================================================

// User Login Endpoint
app.post('/api/login', async (req, res) => {
  console.log('\n[API] POST /api/login');
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    let user = null;
    if (!usingMockData) {
      const dbRes = await pool.query(
        'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
        [identifier.trim()]
      );
      user = dbRes.rows[0];
    } else {
      user = MOCK_USERS.find(
        u => u.username.toLowerCase() === identifier.trim().toLowerCase() ||
             u.email.toLowerCase() === identifier.trim().toLowerCase()
      );
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    return res.json({
      message: 'Login successful!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(`[API ERROR] Login failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// Admin User Registration Endpoint
app.post('/api/users', async (req, res) => {
  console.log('\n[API] POST /api/users - Registering new user...');
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required (username, email, password, role)' });
    }

    if (!usingMockData) {
      const exists = await pool.query(
        'SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
        [username.trim(), email.trim()]
      );
      if (exists.rows.length > 0) {
        return res.status(400).json({ error: 'Username or email already registered' });
      }

      const userRes = await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [username.trim(), email.trim(), password, role]
      );
      return res.status(201).json({ message: 'User created successfully', userId: userRes.rows[0].id });
    } else {
      const exists = MOCK_USERS.some(
        u => u.username.toLowerCase() === username.trim().toLowerCase() ||
             u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (exists) {
        return res.status(400).json({ error: 'Username or email already registered' });
      }

      const userId = mockUserIdCounter++;
      MOCK_USERS.push({
        id: userId,
        username: username.trim(),
        email: email.trim(),
        password,
        role
      });
      return res.status(201).json({ message: 'User created successfully (mock)', userId });
    }
  } catch (err) {
    console.error(`[API ERROR] Create user failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// Update Profile Endpoint
app.put('/api/users/profile', async (req, res) => {
  console.log('\n[API] PUT /api/users/profile - Updating profile...');
  try {
    const { userId, username, password } = req.body;
    if (!userId || !username || !password) {
      return res.status(400).json({ error: 'userId, username, and password are required' });
    }

    if (!usingMockData) {
      const exists = await pool.query(
        'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id <> $2',
        [username.trim(), parseInt(userId)]
      );
      if (exists.rows.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      await pool.query(
        'UPDATE users SET username = $1, password = $2 WHERE id = $3',
        [username.trim(), password, parseInt(userId)]
      );

      const userRes = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [parseInt(userId)]);
      return res.json({ message: 'Profile updated successfully!', user: userRes.rows[0] });
    } else {
      const user = MOCK_USERS.find(u => u.id === parseInt(userId));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const exists = MOCK_USERS.some(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== parseInt(userId));
      if (exists) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      user.username = username.trim();
      user.password = password;

      return res.json({
        message: 'Profile updated successfully! (mock)',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }
  } catch (err) {
    console.error(`[API ERROR] Update profile failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// List Users Endpoint
app.get('/api/users', async (req, res) => {
  console.log('\n[API] GET /api/users');
  try {
    if (!usingMockData) {
      const dbRes = await pool.query('SELECT id, username, email, role FROM users ORDER BY role, username');
      return res.json(dbRes.rows);
    } else {
      const list = MOCK_USERS.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role }));
      return res.json(list);
    }
  } catch (err) {
    console.error(`[API ERROR] GET users failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// Parent Children Fetch Endpoint
app.get('/api/parent/children', async (req, res) => {
  console.log('\n[API] GET /api/parent/children');
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    if (!usingMockData) {
      const parentsRes = await pool.query(
        'SELECT child_id FROM parents WHERE LOWER(email) = LOWER($1)',
        [email.trim()]
      );
      const childIds = parentsRes.rows.map(r => r.child_id);
      if (childIds.length === 0) {
        return res.json([]);
      }

      const childrenRes = await pool.query(
        `SELECT c.id, c.first_name, c.last_name, c.age, c.gender, c.blood_group, c.classroom_id, cl.name as classroom_name
         FROM children c
         LEFT JOIN classrooms cl ON c.classroom_id = cl.id
         WHERE c.id = ANY($1)
         ORDER BY c.first_name`,
        [childIds]
      );
      
      // Map allergies and medications just in case
      const result = [];
      for (const child of childrenRes.rows) {
        const allergiesRes = await pool.query('SELECT allergy_type, severity FROM allergies WHERE child_id = $1', [child.id]);
        const medicationsRes = await pool.query('SELECT medicine_name, dosage, schedule FROM medications WHERE child_id = $1', [child.id]);
        result.push({
          ...child,
          allergies: allergiesRes.rows.map(a => a.allergy_type),
          medications: medicationsRes.rows,
          risk_status: isHighRisk(allergiesRes.rows) ? 'High Risk' : 'Normal'
        });
      }
      return res.json(result);
    } else {
      const matchedChildren = [];
      for (const child of MOCK_CHILDREN) {
        const matches = child.parents.some(p => p.email.toLowerCase() === email.trim().toLowerCase());
        if (matches) {
          matchedChildren.push({
            id: child.id,
            first_name: child.first_name,
            last_name: child.last_name,
            age: child.age,
            gender: child.gender,
            blood_group: child.blood_group,
            classroom_id: child.classroom_id,
            classroom_name: child.classroom_name,
            allergies: child.allergies.map(a => a.allergy_type),
            medications: child.medications,
            risk_status: isHighRisk(child.allergies) ? 'High Risk' : 'Normal'
          });
        }
      }
      return res.json(matchedChildren);
    }
  } catch (err) {
    console.error(`[API ERROR] GET parent children failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 1. POST /api/children - Create child profile
app.post('/api/children', async (req, res) => {
  console.log('\n[API] POST /api/children - Creating child profile...');
  try {
    const data = req.body;
    const required = ['first_name', 'age', 'classroom_id', 'parent_name', 'parent_phone', 'parent_email'];
    const missing = required.filter(field => !data[field] || data[field] === '');

    if (missing.length > 0) {
      console.warn(`[API] Validation failed. Missing: ${missing}`);
      return res.status(400).json({
        error: 'Missing required fields',
        missing_fields: missing,
        message: 'Please fill in all required fields: child\'s name, age, classroom, parent name, parent phone, and parent email.'
      });
    }

    let childId;
    if (!usingMockData) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Check if parent email is registered in users table with role 'parent'
        const parentUserCheck = await client.query(
          "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND role = 'parent'",
          [data.parent_email.trim()]
        );
        if (parentUserCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'parent not registered', message: 'parent not registered' });
        }

        const childRes = await client.query(
          `INSERT INTO children (first_name, last_name, age, gender, blood_group, classroom_id, doctor_notes, admission_date, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active') RETURNING id`,
          [
            data.first_name,
            data.last_name || '',
            parseInt(data.age),
            data.gender || 'Other',
            data.blood_group || '',
            parseInt(data.classroom_id),
            data.doctor_notes || '',
            new Date().toISOString().split('T')[0]
          ]
        );
        childId = childRes.rows[0].id;

        await client.query(
          `INSERT INTO parents (child_id, name, relation, phone, email, is_emergency_contact)
           VALUES ($1, $2, $3, $4, $5, TRUE)`,
          [
            childId,
            data.parent_name,
            data.parent_relation || 'Parent',
            data.parent_phone,
            data.parent_email.trim()
          ]
        );

        const allergies = data.allergies || [];
        const severities = data.allergy_severities || [];
        for (let i = 0; i < allergies.length; i++) {
          const severity = severities[i] || 'Moderate';
          await client.query(
            `INSERT INTO allergies (child_id, allergy_type, severity) VALUES ($1, $2, $3)`,
            [childId, allergies[i], severity]
          );
        }

        const medications = data.medications || [];
        for (const med of medications) {
          await client.query(
            `INSERT INTO medications (child_id, medicine_name, dosage, schedule) VALUES ($1, $2, $3, $4)`,
            [childId, med.name || '', med.dosage || '', med.schedule || '']
          );
        }

        await client.query('COMMIT');
        console.log(`[DB] Created child with ID ${childId}`);
      } catch (dbErr) {
        await client.query('ROLLBACK');
        throw dbErr;
      } finally {
        client.release();
      }
    } else {
      // Mock mode parent check
      const parentUserExists = MOCK_USERS.some(
        u => u.email.toLowerCase() === data.parent_email.trim().toLowerCase() && u.role === 'parent'
      );
      if (!parentUserExists) {
        return res.status(400).json({ error: 'parent not registered', message: 'parent not registered' });
      }

      childId = mockIdCounter++;
      let classObj = MOCK_CLASSROOMS.find(c => c.id === parseInt(data.classroom_id));
      const classroomName = classObj ? classObj.name : 'Unknown';

      const allergies = (data.allergies || []).map((type, i) => ({
        id: Math.floor(Math.random() * 10000),
        allergy_type: type,
        severity: (data.allergy_severities || [])[i] || 'Moderate'
      }));

      const medications = (data.medications || []).map((med, i) => ({
        id: Math.floor(Math.random() * 10000),
        medicine_name: med.name || '',
        dosage: med.dosage || '',
        schedule: med.schedule || ''
      }));

      MOCK_CHILDREN.push({
        id: childId,
        first_name: data.first_name,
        last_name: data.last_name || '',
        age: parseInt(data.age),
        gender: data.gender || 'Other',
        blood_group: data.blood_group || '',
        classroom_id: parseInt(data.classroom_id),
        classroom_name: classroomName,
        doctor_notes: data.doctor_notes || '',
        status: 'Active',
        allergies: allergies,
        medications: medications,
        parents: [{
          id: childId * 10,
          name: data.parent_name,
          relation: data.parent_relation || 'Parent',
          phone: data.parent_phone,
          email: data.parent_email || '',
          is_emergency_contact: true
        }]
      });
      console.log(`[MOCK] Created child with ID ${childId}`);
    }

    return res.status(201).json({
      message: 'Child profile created successfully!',
      child_id: childId
    });
  } catch (err) {
    console.error(`[API ERROR] POST /api/children failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 2. GET /api/children - List children with dashboard stats & filters
app.get('/api/children', async (req, res) => {
  console.log('\n[API] GET /api/children - Fetching dashboard list...');
  try {
    const classroomFilter = (req.query.classroom || '').trim();
    const allergyFilter = (req.query.allergy_type || '').trim();
    const searchQuery = (req.query.search || '').trim().toLowerCase();
    const teacherUsername = (req.query.teacher_username || '').trim().toLowerCase();

    const result = [];

    if (!usingMockData) {
      let query = `
        SELECT DISTINCT c.id, c.first_name, c.last_name, c.age, c.gender,
                        c.blood_group, c.classroom_id, c.status,
                        cl.name as classroom_name
        FROM children c
        LEFT JOIN classrooms cl ON c.classroom_id = cl.id
        LEFT JOIN allergies a ON c.id = a.child_id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      if (teacherUsername) {
        const teacherClassRes = await pool.query(
          "SELECT id FROM classrooms WHERE LOWER(teacher_name) LIKE $1",
          [`%${teacherUsername}%`]
        );
        const assignedClassroomIds = teacherClassRes.rows.map(r => r.id);
        if (assignedClassroomIds.length === 0) {
          return res.json([]);
        }
        query += ` AND c.classroom_id = ANY($${paramCount++})`;
        params.push(assignedClassroomIds);
      }

      if (classroomFilter) {
        query += ` AND cl.name = $${paramCount++}`;
        params.push(classroomFilter);
      }
      if (allergyFilter) {
        query += ` AND a.allergy_type = $${paramCount++}`;
        params.push(allergyFilter);
      }
      if (searchQuery) {
        query += ` AND (LOWER(c.first_name) LIKE $${paramCount} OR LOWER(c.last_name) LIKE $${paramCount})`;
        paramCount++;
        params.push(`%${searchQuery}%`);
      }
      query += ' ORDER BY c.first_name ASC';

      const dbRes = await pool.query(query, params);
      const children = dbRes.rows;

      for (const child of children) {
        const allergiesRes = await pool.query(
          'SELECT allergy_type, severity FROM allergies WHERE child_id = $1',
          [child.id]
        );
        const allergies = allergiesRes.rows;

        result.push({
          id: child.id,
          first_name: child.first_name,
          last_name: child.last_name || '',
          age: child.age,
          gender: child.gender,
          blood_group: child.blood_group || '',
          classroom_id: child.classroom_id,
          classroom_name: child.classroom_name || 'Unassigned',
          status: child.status,
          allergies: allergies.map(a => a.allergy_type),
          risk_status: isHighRisk(allergies) ? 'High Risk' : 'Normal'
        });
      }
    } else {
      let assignedClassroomNames = [];
      if (teacherUsername) {
        assignedClassroomNames = MOCK_CLASSROOMS.filter(
          c => c.teacher_name.toLowerCase().includes(teacherUsername)
        ).map(c => c.name);
        if (assignedClassroomNames.length === 0) {
          return res.json([]);
        }
      }

      for (const child of MOCK_CHILDREN) {
        if (teacherUsername && !assignedClassroomNames.includes(child.classroom_name)) continue;
        if (classroomFilter && child.classroom_name !== classroomFilter) continue;
        if (allergyFilter) {
          const types = child.allergies.map(a => a.allergy_type);
          if (!types.includes(allergyFilter)) continue;
        }
        if (searchQuery) {
          const fullName = `${child.first_name} ${child.last_name || ''}`.toLowerCase();
          if (!fullName.includes(searchQuery)) continue;
        }

        result.push({
          id: child.id,
          first_name: child.first_name,
          last_name: child.last_name || '',
          age: child.age,
          gender: child.gender,
          blood_group: child.blood_group || '',
          classroom_id: child.classroom_id,
          classroom_name: child.classroom_name || 'Unassigned',
          status: child.status,
          allergies: child.allergies.map(a => a.allergy_type),
          risk_status: isHighRisk(child.allergies) ? 'High Risk' : 'Normal'
        });
      }
    }

    console.log(`[API] Returning ${result.length} children.`);
    return res.json(result);
  } catch (err) {
    console.error(`[API ERROR] GET /api/children failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 3. GET /api/children/:child_id - Get child profile detailed view
app.get('/api/children/:child_id', async (req, res) => {
  const childId = parseInt(req.params.child_id);
  console.log(`\n[API] GET /api/children/${childId} - Detailed view...`);

  try {
    let childData = null;
    let meals = [];

    if (!usingMockData) {
      const childRes = await pool.query(
        `SELECT c.*, cl.name as classroom_name
         FROM children c
         LEFT JOIN classrooms cl ON c.classroom_id = cl.id
         WHERE c.id = $1`,
        [childId]
      );
      const child = childRes.rows[0];

      if (!child) {
        console.warn(`[API] Child ${childId} not found.`);
        return res.status(404).json({ error: 'Child not found', message: `No child found with ID ${childId}` });
      }

      const parentsRes = await pool.query('SELECT * FROM parents WHERE child_id = $1', [childId]);
      const allergiesRes = await pool.query('SELECT * FROM allergies WHERE child_id = $1', [childId]);
      const medicationsRes = await pool.query('SELECT * FROM medications WHERE child_id = $1', [childId]);
      const dbMeals = await pool.query('SELECT * FROM meals');
      meals = dbMeals.rows;

      childData = {
        id: child.id,
        first_name: child.first_name,
        last_name: child.last_name || '',
        age: child.age,
        gender: child.gender,
        blood_group: child.blood_group || '',
        classroom_id: child.classroom_id,
        classroom_name: child.classroom_name || 'Unassigned',
        doctor_notes: child.doctor_notes || '',
        status: child.status,
        risk_status: isHighRisk(allergiesRes.rows) ? 'High Risk' : 'Normal',
        parents: parentsRes.rows.map(p => ({
          id: p.id,
          name: p.name,
          relation: p.relation || '',
          phone: p.phone,
          email: p.email || '',
          is_emergency_contact: Boolean(p.is_emergency_contact)
        })),
        allergies: allergiesRes.rows.map(a => ({
          id: a.id,
          allergy_type: a.allergy_type,
          severity: a.severity
        })),
        medications: medicationsRes.rows.map(m => ({
          id: m.id,
          medicine_name: m.medicine_name,
          dosage: m.dosage || '',
          schedule: m.schedule || ''
        }))
      };
    } else {
      const child = MOCK_CHILDREN.find(c => c.id === childId);
      if (!child) {
        console.warn(`[MOCK] Child ${childId} not found.`);
        return res.status(404).json({ error: 'Child not found', message: `No child found with ID ${childId}` });
      }

      childData = {
        ...child,
        risk_status: isHighRisk(child.allergies) ? 'High Risk' : 'Normal'
      };
      meals = MOCK_MEALS;
    }

    // Run Rule Engine checking
    const allergyTypes = childData.allergies.map(a => a.allergy_type);
    console.log(`[RULE ENGINE] Checking meal safety for child ${childId} with allergies: [${allergyTypes}]`);

    const mealSafety = [];
    for (const meal of meals) {
      const safety = checkMealSafety(allergyTypes, meal.ingredients);
      mealSafety.push({
        meal_name: meal.name,
        meal_category: meal.category,
        ingredients: meal.ingredients,
        status: safety.status,
        matched_allergens: safety.matched_allergens
      });
    }

    childData.meal_safety = mealSafety;

    // Get Gemini AI Summary
    const doctorNotes = childData.doctor_notes || '';
    if (doctorNotes.trim()) {
      childData.ai_summary = await getGeminiSummary(doctorNotes);
    } else {
      childData.ai_summary = {
        summary: 'No medical notes available for this child. Please add doctor\'s notes to enable AI safety analysis.',
        meal_suggestion: 'Standard daycare meals are suitable.',
        source: 'none'
      };
    }

    console.log(`[API] Returning detailed view for child ${childId}`);
    return res.json(childData);
  } catch (err) {
    console.error(`[API ERROR] Detailed child view failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 4. GET /api/classrooms - Classroom list
app.get('/api/classrooms', async (req, res) => {
  console.log('\n[API] GET /api/classrooms - Fetching classroom list...');
  try {
    if (!usingMockData) {
      const dbRes = await pool.query('SELECT id, name, age_group, teacher_name FROM classrooms ORDER BY name');
      return res.json(dbRes.rows);
    } else {
      return res.json(MOCK_CLASSROOMS);
    }
  } catch (err) {
    console.error(`[API ERROR] GET /api/classrooms failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 5. PUT /api/children/:child_id - Update child profile
app.post('/api/children/:child_id', async (req, res) => {
  return updateChildProfile(req, res);
});

app.put('/api/children/:child_id', async (req, res) => {
  return updateChildProfile(req, res);
});

async function updateChildProfile(req, res) {
  const childId = parseInt(req.params.child_id);
  console.log(`\n[API] PUT /api/children/${childId} - Updating profile...`);

  try {
    const data = req.body;

    if (!usingMockData) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await client.query(
          `UPDATE children SET first_name=$1, last_name=$2, age=$3, gender=$4, blood_group=$5, classroom_id=$6, doctor_notes=$7
           WHERE id=$8`,
          [
            data.first_name,
            data.last_name || '',
            parseInt(data.age),
            data.gender || 'Other',
            data.blood_group || '',
            parseInt(data.classroom_id),
            data.doctor_notes || '',
            childId
          ]
        );

        if (data.parent_name) {
          const parentsRes = await client.query('SELECT id FROM parents WHERE child_id=$1 LIMIT 1', [childId]);
          if (parentsRes.rows.length > 0) {
            await client.query(
              `UPDATE parents SET name=$1, relation=$2, phone=$3, email=$4 WHERE id=$5`,
              [
                data.parent_name,
                data.parent_relation || 'Parent',
                data.parent_phone || '',
                data.parent_email || '',
                parentsRes.rows[0].id
              ]
            );
          }
        }

        // Replace allergies
        await client.query('DELETE FROM allergies WHERE child_id=$1', [childId]);
        const allergies = data.allergies || [];
        const severities = data.allergy_severities || [];
        for (let i = 0; i < allergies.length; i++) {
          const severity = severities[i] || 'Moderate';
          await client.query(
            'INSERT INTO allergies (child_id, allergy_type, severity) VALUES ($1,$2,$3)',
            [childId, allergies[i], severity]
          );
        }

        // Replace medications
        await client.query('DELETE FROM medications WHERE child_id=$1', [childId]);
        const medications = data.medications || [];
        for (const med of medications) {
          await client.query(
            'INSERT INTO medications (child_id, medicine_name, dosage, schedule) VALUES ($1,$2,$3,$4)',
            [childId, med.name || med.medicine_name || '', med.dosage || '', med.schedule || '']
          );
        }

        await client.query('COMMIT');
        console.log(`[DB] Updated child with ID ${childId}`);
      } catch (dbErr) {
        await client.query('ROLLBACK');
        throw dbErr;
      } finally {
        client.release();
      }
    } else {
      const child = MOCK_CHILDREN.find(c => c.id === childId);
      if (!child) {
        console.warn(`[MOCK] Child ${childId} not found.`);
        return res.status(404).json({ error: 'Child not found', message: `No child found with ID ${childId}` });
      }

      child.first_name = data.first_name || child.first_name;
      child.last_name = data.last_name !== undefined ? data.last_name : child.last_name;
      child.age = data.age !== undefined ? parseInt(data.age) : child.age;
      child.gender = data.gender || child.gender;
      child.blood_group = data.blood_group !== undefined ? data.blood_group : child.blood_group;
      child.classroom_id = data.classroom_id !== undefined ? parseInt(data.classroom_id) : child.classroom_id;
      child.doctor_notes = data.doctor_notes !== undefined ? data.doctor_notes : child.doctor_notes;

      let classObj = MOCK_CLASSROOMS.find(c => c.id === child.classroom_id);
      child.classroom_name = classObj ? classObj.name : 'Unknown';

      if (data.parent_name && child.parents && child.parents.length > 0) {
        child.parents[0].name = data.parent_name;
        child.parents[0].relation = data.parent_relation || child.parents[0].relation;
        child.parents[0].phone = data.parent_phone || child.parents[0].phone;
        child.parents[0].email = data.parent_email !== undefined ? data.parent_email : child.parents[0].email;
      }

      child.allergies = (data.allergies || []).map((type, i) => ({
        id: childId * 100 + i,
        allergy_type: type,
        severity: (data.allergy_severities || [])[i] || 'Moderate'
      }));

      child.medications = (data.medications || []).map((med, i) => ({
        id: childId * 100 + i,
        medicine_name: med.name || med.medicine_name || '',
        dosage: med.dosage || '',
        schedule: med.schedule || ''
      }));

      console.log(`[MOCK] Updated child with ID ${childId}`);
    }

    return res.json({ message: 'Child profile updated successfully!' });
  } catch (err) {
    console.error(`[API ERROR] Update profile failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

// 6. DELETE /api/children/:child_id - Delete child profile
app.delete('/api/children/:child_id', async (req, res) => {
  const childId = parseInt(req.params.child_id);
  console.log(`\n[API] DELETE /api/children/${childId}`);

  try {
    if (!usingMockData) {
      await pool.query('DELETE FROM children WHERE id=$1', [childId]);
      console.log(`[DB] Deleted child with ID ${childId}`);
    } else {
      const originalLen = MOCK_CHILDREN.length;
      MOCK_CHILDREN.splice(
        MOCK_CHILDREN.findIndex(c => c.id === childId),
        1
      );
      if (MOCK_CHILDREN.length === originalLen) {
        return res.status(404).json({ error: 'Child not found' });
      }
      console.log(`[MOCK] Deleted child with ID ${childId}`);
    }

    return res.json({ message: 'Child deleted successfully.' });
  } catch (err) {
    console.error(`[API ERROR] DELETE child failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 7. GET /api/attendance - Fetch attendance logs
app.get('/api/attendance', async (req, res) => {
  const targetDate = req.query.date || new Date().toISOString().split('T')[0];
  const teacherUsername = (req.query.teacher_username || '').trim().toLowerCase();
  console.log(`\n[API] GET /api/attendance for date=${targetDate}, teacher=${teacherUsername}`);

  try {
    if (!usingMockData) {
      let query = `
        SELECT a.*, c.first_name, c.last_name, cl.name as classroom_name
        FROM attendance a
        JOIN children c ON a.child_id = c.id
        LEFT JOIN classrooms cl ON c.classroom_id = cl.id
        WHERE a.date = $1
      `;
      const params = [targetDate];
      
      if (teacherUsername) {
        const teacherClassRes = await pool.query(
          "SELECT id FROM classrooms WHERE LOWER(teacher_name) LIKE $1",
          [`%${teacherUsername}%`]
        );
        const assignedClassroomIds = teacherClassRes.rows.map(r => r.id);
        if (assignedClassroomIds.length === 0) {
          return res.json([]);
        }
        query += ` AND c.classroom_id = ANY($2)`;
        params.push(assignedClassroomIds);
      }
      query += ` ORDER BY c.first_name`;

      const recordsRes = await pool.query(query, params);
      return res.json(recordsRes.rows);
    } else {
      let assignedClassroomNames = [];
      if (teacherUsername) {
        assignedClassroomNames = MOCK_CLASSROOMS.filter(
          c => c.teacher_name.toLowerCase().includes(teacherUsername)
        ).map(c => c.name);
        if (assignedClassroomNames.length === 0) {
          return res.json([]);
        }
      }

      const result = [];
      for (const child of MOCK_CHILDREN) {
        if (teacherUsername && !assignedClassroomNames.includes(child.classroom_name)) continue;
        const record = MOCK_ATTENDANCE.find(att => att.child_id === child.id && att.date === targetDate);
        result.push({
          id: record ? record.id : null,
          child_id: child.id,
          first_name: child.first_name,
          last_name: child.last_name || '',
          classroom_name: child.classroom_name || 'Unassigned',
          date: targetDate,
          status: record ? record.status : 'Not Marked',
          check_in_time: record ? record.check_in_time : null,
          check_out_time: record ? record.check_out_time : null,
          notes: record ? record.notes : ''
        });
      }
      return res.json(result);
    }
  } catch (err) {
    console.error(`[API ERROR] GET /api/attendance failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// Child Attendance History Fetch Endpoint
app.get('/api/children/:child_id/attendance', async (req, res) => {
  const childId = parseInt(req.params.child_id);
  console.log(`\n[API] GET /api/children/${childId}/attendance`);
  try {
    if (!usingMockData) {
      const dbRes = await pool.query(
        'SELECT * FROM attendance WHERE child_id = $1 ORDER BY date DESC LIMIT 30',
        [childId]
      );
      return res.json(dbRes.rows);
    } else {
      const list = MOCK_ATTENDANCE.filter(a => a.child_id === childId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.json(list.slice(0, 30));
    }
  } catch (err) {
    console.error(`[API ERROR] GET child attendance failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 8. POST /api/attendance - Mark attendance
app.post('/api/attendance', async (req, res) => {
  console.log('\n[API] POST /api/attendance');
  try {
    const data = req.body;
    const childId = parseInt(data.child_id);
    const attDate = data.date || new Date().toISOString().split('T')[0];
    const status = data.status || 'Present';
    const notes = data.notes || '';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    if (!usingMockData) {
      const existing = await pool.query('SELECT id FROM attendance WHERE child_id=$1 AND date=$2', [childId, attDate]);
      if (existing.rows.length > 0) {
        await pool.query(
          'UPDATE attendance SET status=$1, check_in_time=$2, notes=$3 WHERE id=$4',
          [status, status === 'Present' ? nowTime : null, notes, existing.rows[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO attendance (child_id, date, status, check_in_time, notes) VALUES ($1, $2, $3, $4, $5)',
          [childId, attDate, status, status === 'Present' ? nowTime : null, notes]
        );
      }
      console.log(`[DB] Marked attendance for child ID ${childId} as ${status}`);
    } else {
      const att = MOCK_ATTENDANCE.find(a => a.child_id === childId && a.date === attDate);
      if (att) {
        att.status = status;
        att.check_in_time = ['Present', 'Late'].includes(status) ? nowTime : null;
        att.notes = notes;
      } else {
        MOCK_ATTENDANCE.push({
          id: mockAttendanceIdCounter++,
          child_id: childId,
          date: attDate,
          status: status,
          check_in_time: ['Present', 'Late'].includes(status) ? nowTime : null,
          check_out_time: null,
          notes: notes
        });
      }
      console.log(`[MOCK] Marked attendance for child ID ${childId} as ${status}`);
    }

    return res.json({ message: `Attendance marked as ${status}` });
  } catch (err) {
    console.error(`[API ERROR] Mark attendance failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 9. GET /api/children/:child_id/milestones - Get milestones
app.get('/api/children/:child_id/milestones', async (req, res) => {
  const childId = parseInt(req.params.child_id);
  console.log(`\n[API] GET /api/children/${childId}/milestones`);

  try {
    if (!usingMockData) {
      const milestones = await pool.query(
        'SELECT * FROM milestones WHERE child_id=$1 ORDER BY category, milestone_name',
        [childId]
      );
      return res.json(milestones.rows);
    } else {
      const list = MOCK_MILESTONES.filter(m => m.child_id === childId);
      return res.json(list);
    }
  } catch (err) {
    console.error(`[API ERROR] GET milestones failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 10. POST /api/children/:child_id/milestones - Add or update milestone
app.post('/api/children/:child_id/milestones', async (req, res) => {
  const childId = parseInt(req.params.child_id);
  console.log(`\n[API] POST /api/children/${childId}/milestones`);

  try {
    const data = req.body;

    if (!usingMockData) {
      if (data.id) {
        await pool.query(
          'UPDATE milestones SET status=$1, achieved_date=$2 WHERE id=$3',
          [data.status, data.achieved_date || null, data.id]
        );
      } else {
        await pool.query(
          `INSERT INTO milestones (child_id, category, milestone_name, status, achieved_date)
           VALUES ($1, $2, $3, $4, $5)`,
          [childId, data.category, data.milestone_name, data.status || 'Not Started', data.achieved_date || null]
        );
      }
    } else {
      if (data.id) {
        const m = MOCK_MILESTONES.find(mil => mil.id === parseInt(data.id));
        if (m) {
          m.status = data.status || m.status;
          m.achieved_date = data.achieved_date !== undefined ? data.achieved_date : m.achieved_date;
        }
      } else {
        MOCK_MILESTONES.push({
          id: mockMilestoneIdCounter++,
          child_id: childId,
          category: data.category,
          milestone_name: data.milestone_name,
          status: data.status || 'Not Started',
          achieved_date: data.achieved_date || null
        });
      }
    }

    return res.json({ message: 'Milestone saved successfully!' });
  } catch (err) {
    console.error(`[API ERROR] POST milestone failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 11. GET /api/fees - Fetch fee log
app.get('/api/fees', async (req, res) => {
  const childFilter = req.query.child_id;
  const statusFilter = req.query.status;
  console.log(`\n[API] GET /api/fees (child=${childFilter}, status=${statusFilter})`);

  try {
    if (!usingMockData) {
      let query = `
        SELECT f.*, c.first_name, c.last_name,
               CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) as child_name
        FROM fees f
        JOIN children c ON f.child_id = c.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      if (childFilter) {
        query += ` AND f.child_id = $${paramCount++}`;
        params.push(parseInt(childFilter));
      }
      if (statusFilter) {
        query += ` AND f.status = $${paramCount++}`;
        params.push(statusFilter);
      }
      query += ' ORDER BY f.due_date DESC';

      const feesRes = await pool.query(query, params);
      return res.json(feesRes.rows.map(f => ({ ...f, amount: parseFloat(f.amount) })));
    } else {
      const list = MOCK_FEES.filter(f => {
        if (childFilter && f.child_id !== parseInt(childFilter)) return false;
        if (statusFilter && f.status !== statusFilter) return false;
        return true;
      });
      return res.json(list);
    }
  } catch (err) {
    console.error(`[API ERROR] GET fees failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 12. PUT /api/fees/:fee_id - Update fee record
app.put('/api/fees/:fee_id', async (req, res) => {
  const feeId = parseInt(req.params.fee_id);
  console.log(`\n[API] PUT /api/fees/${feeId}`);

  try {
    const data = req.body;

    if (!usingMockData) {
      await pool.query(
        'UPDATE fees SET status=$1, paid_date=$2, payment_method=$3 WHERE id=$4',
        [data.status, data.paid_date || null, data.payment_method || 'Cash', feeId]
      );
      console.log(`[DB] Updated fee ID ${feeId}`);
    } else {
      const f = MOCK_FEES.find(fee => fee.id === feeId);
      if (f) {
        f.status = data.status || f.status;
        f.paid_date = data.paid_date !== undefined ? data.paid_date : f.paid_date;
        f.payment_method = data.payment_method || f.payment_method;
      }
      console.log(`[MOCK] Updated fee ID ${feeId}`);
    }

    return res.json({ message: 'Fee updated successfully!' });
  } catch (err) {
    console.error(`[API ERROR] Update fee failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 13. GET /api/meals - Meal menu list
app.get('/api/meals', async (req, res) => {
  console.log('\n[API] GET /api/meals');
  try {
    if (!usingMockData) {
      const mealsRes = await pool.query('SELECT * FROM meals ORDER BY category, name');
      return res.json(mealsRes.rows);
    } else {
      return res.json(MOCK_MEALS);
    }
  } catch (err) {
    console.error(`[API ERROR] GET meals failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 14. POST /api/meals - Add new meal to menu
app.post('/api/meals', async (req, res) => {
  console.log('\n[API] POST /api/meals');
  try {
    const data = req.body;
    let mealId;

    if (!usingMockData) {
      const resObj = await pool.query(
        'INSERT INTO meals (name, ingredients, category) VALUES ($1, $2, $3) RETURNING id',
        [data.name, data.ingredients, data.category || 'Lunch']
      );
      mealId = resObj.rows[0].id;
    } else {
      mealId = MOCK_MEALS.reduce((max, m) => m.id > max ? m.id : max, 0) + 1;
      MOCK_MEALS.push({
        id: mealId,
        name: data.name,
        ingredients: data.ingredients,
        category: data.category || 'Lunch'
      });
    }

    return res.status(201).json({ message: 'Meal added!', meal_id: mealId });
  } catch (err) {
    console.error(`[API ERROR] POST meal failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 15. POST /api/check-custom-meal - Custom check
app.post('/api/check-custom-meal', async (req, res) => {
  console.log('\n[API] POST /api/check-custom-meal');
  try {
    const data = req.body;
    const childId = parseInt(data.child_id);
    const ingredients = data.ingredients || '';
    const mealName = data.meal_name || 'Custom Meal';

    if (!childId || !ingredients) {
      return res.status(400).json({ error: 'child_id and ingredients are required' });
    }

    let allergies = [];
    let childName = 'Unknown';

    if (!usingMockData) {
      const dbAllergies = await pool.query('SELECT allergy_type FROM allergies WHERE child_id=$1', [childId]);
      allergies = dbAllergies.rows.map(a => a.allergy_type);
      const child = await pool.query('SELECT first_name, last_name FROM children WHERE id=$1', [childId]);
      if (child.rows.length > 0) {
        childName = `${child.rows[0].first_name} ${child.rows[0].last_name || ''}`.trim();
      }
    } else {
      const child = MOCK_CHILDREN.find(c => c.id === childId);
      if (!child) {
        return res.status(404).json({ error: 'Child not found' });
      }
      allergies = child.allergies.map(a => a.allergy_type);
      childName = `${child.first_name} ${child.last_name || ''}`.trim();
    }

    const safety = checkMealSafety(allergies, ingredients);

    return res.json({
      child_name: childName,
      meal_name: mealName,
      ingredients: ingredients,
      child_allergies: allergies,
      safety_status: safety.status,
      matched_allergens: safety.matched_allergens
    });
  } catch (err) {
    console.error(`[API ERROR] Custom check failed: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});


// =============================================================
// SERVE FRONTEND STATIC BUILD FOR MONOREPO DEPLOYMENT
// =============================================================

const buildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(buildPath));

app.get('*', (req, res, next) => {
  // If it's an API route let it slide through to show 404
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  const fs = require('fs');
  if (fs.existsSync(path.join(buildPath, 'index.html'))) {
    res.sendFile(path.join(buildPath, 'index.html'));
  } else {
    res.status(404).send('Not Found: The frontend build index.html was not found on this server. Run npm run build.');
  }
});


// =============================================================
// STARTUP SERVER
// =============================================================

async function startServer() {
  console.log('\n' + '='.repeat(60));
  console.log('  FirstCry Intellitots: Child Health & Allergy Tracker');
  console.log('  Backend Node.js Server Startup');
  console.log('='.repeat(60));

  await initDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n[STARTUP] Express server running on http://localhost:${PORT}`);
    console.log('='.repeat(60) + '\n');
  });
}

startServer();
