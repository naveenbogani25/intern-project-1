-- =============================================================
-- FirstCry Intellitots: Child Health & Allergy Tracker
-- Complete MySQL Database Schema
-- Written by: CSE 1st Year Student Project
-- =============================================================

-- Create the database (run this first if it doesn't exist)
CREATE DATABASE IF NOT EXISTS intellitots_tracker;
USE intellitots_tracker;

-- =============================================================
-- CORE TRACKING TABLES
-- These tables store the main day-to-day data for the center
-- =============================================================

-- Classrooms table: stores info about each class/room in the center
CREATE TABLE classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,            -- e.g. "Butterfly Room", "Sunshine Class"
    capacity INT DEFAULT 20,               -- max kids allowed in this room
    age_group VARCHAR(50),                 -- e.g. "2-3 years", "3-4 years"
    teacher_name VARCHAR(150),             -- assigned teacher's name
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Children table: the main table - stores each child's profile
CREATE TABLE children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    date_of_birth DATE,
    age INT,                               -- calculated or entered age in years
    gender ENUM('Male', 'Female', 'Other') DEFAULT 'Other',
    blood_group VARCHAR(10),               -- e.g. "A+", "O-", "B+"
    classroom_id INT,                      -- which classroom they belong to
    photo_url VARCHAR(500),                -- profile picture link
    doctor_notes TEXT,                     -- raw medical notes from the doctor
    status ENUM('Active', 'Inactive', 'Graduated') DEFAULT 'Active',
    admission_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Link this child to their classroom
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL
);

-- Parents table: stores parent/guardian contact details
CREATE TABLE parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,                 -- which child this parent belongs to
    name VARCHAR(200) NOT NULL,
    relation VARCHAR(50),                  -- "Mother", "Father", "Guardian"
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(200),
    address TEXT,
    is_emergency_contact BOOLEAN DEFAULT FALSE,  -- can they be called in emergencies?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Link parent to child (if child is deleted, remove parent too)
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Admissions table: tracks when a child was admitted and their enrollment status
CREATE TABLE admissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    admission_date DATE NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Waitlisted', 'Cancelled') DEFAULT 'Pending',
    documents_submitted TEXT,              -- comma-separated list of documents
    admission_fee DECIMAL(10, 2),          -- fee paid at admission
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Enquiries table: when parents call or visit asking about enrollment
CREATE TABLE enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_name VARCHAR(200) NOT NULL,
    parent_phone VARCHAR(20),
    parent_email VARCHAR(200),
    child_name VARCHAR(200),
    child_age INT,
    interest_level ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
    preferred_classroom VARCHAR(100),
    follow_up_date DATE,                   -- when to call them back
    status ENUM('New', 'Contacted', 'Enrolled', 'Dropped') DEFAULT 'New',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table: daily check-in and check-out for each child
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    date DATE NOT NULL,
    check_in_time TIME,                    -- when the child arrived
    check_out_time TIME,                   -- when the child left
    status ENUM('Present', 'Absent', 'Late', 'Half-Day') DEFAULT 'Present',
    marked_by VARCHAR(150),                -- teacher who marked it
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Daycare Routines: the daily schedule for each classroom
CREATE TABLE daycare_routines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id INT NOT NULL,
    time_slot VARCHAR(50) NOT NULL,        -- e.g. "09:00 - 09:30"
    activity VARCHAR(200) NOT NULL,        -- e.g. "Circle Time", "Snack Break"
    description TEXT,                      -- details about what happens
    day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
);


-- =============================================================
-- HEALTH & SAFETY TABLES
-- These tables handle allergies, medicines, meals, and alerts
-- =============================================================

-- Allergies table: known allergies for each child
CREATE TABLE allergies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    allergy_type VARCHAR(100) NOT NULL,    -- e.g. "Peanuts", "Dairy", "Gluten"
    severity ENUM('Mild', 'Moderate', 'Severe') DEFAULT 'Moderate',
    reaction_details TEXT,                 -- what happens if exposed
    doctor_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Medications table: medicines a child is currently taking
CREATE TABLE medications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    medicine_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),                   -- e.g. "5ml twice daily"
    schedule VARCHAR(200),                 -- e.g. "Morning and Evening"
    prescribing_doctor VARCHAR(200),
    start_date DATE,
    end_date DATE,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Meals table: standard meals served at the daycare center
CREATE TABLE meals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,            -- e.g. "Veggie Pasta", "Fruit Salad"
    ingredients TEXT NOT NULL,             -- comma-separated list of ingredients
    category ENUM('Breakfast', 'Lunch', 'Snack', 'Dinner') DEFAULT 'Lunch',
    suitable_age_group VARCHAR(50),        -- e.g. "2+ years"
    calories INT,
    is_vegetarian BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meal Restrictions: links children to meals they CANNOT eat
CREATE TABLE meal_restrictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    meal_id INT NOT NULL,
    restriction_reason VARCHAR(500),       -- why this meal is restricted
    flagged_by VARCHAR(150),               -- who flagged it (teacher/system)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
);

-- Communication Log: messages sent between parents and center
CREATE TABLE communication_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT,
    message_type ENUM('SMS', 'Email', 'In-App', 'Phone Call') DEFAULT 'In-App',
    sender VARCHAR(200),                   -- who sent the message
    recipient VARCHAR(200),                -- who received it
    subject VARCHAR(300),
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL
);


-- =============================================================
-- OPERATIONS TABLES
-- These tables handle photos, lessons, milestones, fees, etc.
-- =============================================================

-- Photos: pictures taken of children during activities
CREATE TABLE photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT,
    photo_url VARCHAR(500) NOT NULL,
    caption VARCHAR(300),
    activity VARCHAR(200),                 -- what activity the photo is from
    uploaded_by VARCHAR(150),
    upload_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL
);

-- Lesson Plans: weekly/daily plans for each classroom
CREATE TABLE lesson_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id INT NOT NULL,
    topic VARCHAR(300) NOT NULL,           -- e.g. "Colors and Shapes"
    objectives TEXT,                       -- what kids should learn
    plan_date DATE NOT NULL,
    prepared_by VARCHAR(150),
    status ENUM('Draft', 'Approved', 'Completed') DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
);

-- Curriculum Activities: individual activities within a lesson plan
CREATE TABLE curriculum_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_plan_id INT NOT NULL,
    activity_name VARCHAR(200) NOT NULL,
    description TEXT,
    materials_needed TEXT,                 -- what supplies are needed
    duration_minutes INT DEFAULT 30,
    activity_order INT DEFAULT 1,          -- order in the lesson plan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE
);

-- Developmental Milestones: tracking each child's growth milestones
CREATE TABLE milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    category ENUM('Physical', 'Cognitive', 'Social', 'Language', 'Emotional') DEFAULT 'Cognitive',
    milestone_name VARCHAR(300) NOT NULL,  -- e.g. "Can count to 10"
    description TEXT,
    achieved_date DATE,
    assessed_by VARCHAR(150),              -- teacher who assessed this
    status ENUM('Not Started', 'In Progress', 'Achieved') DEFAULT 'Not Started',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Teacher Tasks: to-do list for teachers
CREATE TABLE teacher_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_name VARCHAR(150) NOT NULL,
    task_title VARCHAR(300) NOT NULL,
    description TEXT,
    due_date DATE,
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Logs: feedback from parents about the center
CREATE TABLE feedback_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT,
    parent_id INT,
    feedback_text TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),  -- 1 to 5 star rating
    category ENUM('General', 'Food', 'Safety', 'Teaching', 'Facilities') DEFAULT 'General',
    response_text TEXT,                    -- center's response to feedback
    feedback_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL
);

-- Fees: tracking fee payments for each child
CREATE TABLE fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    fee_type ENUM('Tuition', 'Admission', 'Transport', 'Meals', 'Other') DEFAULT 'Tuition',
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,                        -- NULL if not yet paid
    payment_method ENUM('Cash', 'UPI', 'Card', 'Bank Transfer') DEFAULT 'Cash',
    status ENUM('Pending', 'Paid', 'Overdue', 'Waived') DEFAULT 'Pending',
    receipt_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Occupancy: daily room occupancy tracking
CREATE TABLE occupancy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id INT NOT NULL,
    record_date DATE NOT NULL,
    current_count INT DEFAULT 0,           -- how many kids are in the room today
    max_capacity INT,                      -- max allowed (copied from classrooms for history)
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
);

-- Transport: pick-up and drop-off details for children using school transport
CREATE TABLE transport (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    route_name VARCHAR(200),               -- e.g. "Route A - Koramangala"
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(150),
    driver_phone VARCHAR(20),
    pickup_time TIME,
    drop_time TIME,
    pickup_address TEXT,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Center Supplies: inventory tracking for the daycare center
CREATE TABLE center_supplies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(200) NOT NULL,       -- e.g. "Crayons", "Sanitizer", "Diapers"
    category ENUM('Art', 'Cleaning', 'Food', 'Medical', 'Toys', 'Office', 'Other') DEFAULT 'Other',
    quantity INT DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pieces',     -- e.g. "pieces", "liters", "boxes"
    reorder_level INT DEFAULT 5,           -- alert when quantity falls below this
    supplier_name VARCHAR(200),
    last_restocked DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================
-- INSERT SOME SAMPLE DATA FOR TESTING
-- =============================================================

-- Sample Classrooms
INSERT INTO classrooms (name, capacity, age_group, teacher_name) VALUES
('Butterfly Room', 15, '2-3 years', 'Ms. Priya Sharma'),
('Sunshine Class', 18, '3-4 years', 'Ms. Anita Desai'),
('Rainbow Room', 20, '4-5 years', 'Mr. Rahul Verma');

-- Sample Meals (used by the rule engine to check safety)
INSERT INTO meals (name, ingredients, category, suitable_age_group, is_vegetarian) VALUES
('Veggie Pasta', 'pasta, tomato sauce, carrots, peas, cheese, olive oil', 'Lunch', '2+ years', TRUE),
('Peanut Butter Sandwich', 'bread, peanut butter, honey, butter', 'Snack', '3+ years', TRUE),
('Fruit Yogurt Bowl', 'yogurt, milk, strawberries, banana, honey, granola', 'Breakfast', '2+ years', TRUE),
('Rice & Dal', 'rice, lentils, turmeric, ghee, cumin, salt', 'Lunch', '2+ years', TRUE),
('Chocolate Milk Shake', 'milk, chocolate syrup, sugar, ice cream', 'Snack', '3+ years', TRUE),
('Egg Fried Rice', 'rice, eggs, soy sauce, vegetables, sesame oil', 'Lunch', '3+ years', FALSE),
('Mixed Fruit Salad', 'apple, banana, grapes, orange, pomegranate', 'Snack', '2+ years', TRUE);
