DROP DATABASE IF EXISTS fittrack;

CREATE DATABASE fittrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE fittrack;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exercises (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    muscle_group VARCHAR(50) NOT NULL,
    exercise_type ENUM('strength', 'cardio', 'bodyweight') NOT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_muscle_group (muscle_group),
    INDEX idx_created_by (created_by),
    INDEX idx_exercise_type (exercise_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workout_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE template_exercises (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NOT NULL,
    exercise_id INT NOT NULL,
    order_index INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    INDEX idx_template_id (template_id),
    INDEX idx_order (template_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workout_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    template_id INT NULL,
    name VARCHAR(100) NOT NULL,
    date_started DATETIME NOT NULL,
    date_completed DATETIME NULL,
    duration_minutes INT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_date_started (date_started),
    INDEX idx_date_completed (date_completed),
    INDEX idx_template_id (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE session_exercises (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    exercise_id INT NOT NULL,
    order_index INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_order (session_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exercise_sets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_exercise_id INT NOT NULL,
    set_number INT NOT NULL,
    reps INT NULL,
    weight_kg DECIMAL(6,2) NULL,
    duration_seconds INT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_exercise_id) REFERENCES session_exercises(id) ON DELETE CASCADE,
    INDEX idx_session_exercise_id (session_exercise_id),
    INDEX idx_set_number (session_exercise_id, set_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE personal_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    exercise_id INT NOT NULL,
    max_weight DECIMAL(6,2) NOT NULL,
    achieved_at DATETIME NOT NULL,
    session_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_exercise (user_id, exercise_id),
    INDEX idx_user_id (user_id),
    INDEX idx_achieved_at (achieved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (email, password_hash, name, role) VALUES 
('admin@fittrack.com', '$2a$10$ycKFJr0eddlRll9ux5hPO.U28bhZ2Irj6OLmt1EWsVHJhfmF6qQfS', 'Admin User', 'admin');

INSERT INTO exercises (name, muscle_group, exercise_type, created_by) VALUES
('Bench Press', 'Chest', 'strength', NULL),
('Incline Bench Press', 'Chest', 'strength', NULL),
('Dumbbell Flyes', 'Chest', 'strength', NULL),
('Push-ups', 'Chest', 'bodyweight', NULL),
('Chest Dips', 'Chest', 'bodyweight', NULL);

INSERT INTO exercises (name, muscle_group, exercise_type, created_by) VALUES
('Deadlift', 'Back', 'strength', NULL),
('Pull-ups', 'Back', 'bodyweight', NULL),
('Barbell Rows', 'Back', 'strength', NULL),
('Lat Pulldown', 'Back', 'strength', NULL),
('T-Bar Row', 'Back', 'strength', NULL);

INSERT INTO exercises (name, muscle_group, exercise_type, created_by) VALUES
('Squats', 'Legs', 'strength', NULL),
('Leg Press', 'Legs', 'strength', NULL),
('Lunges', 'Legs', 'strength', NULL),
('Leg Curl', 'Legs', 'strength', NULL),
('Calf Raises', 'Legs', 'strength', NULL);

INSERT INTO exercises (name, muscle_group, exercise_type, created_by) VALUES
('Overhead Press', 'Shoulders', 'strength', NULL),
('Lateral Raises', 'Shoulders', 'strength', NULL),
('Front Raises', 'Shoulders', 'strength', NULL),
('Rear Delt Flyes', 'Shoulders', 'strength', NULL);

INSERT INTO exercises (name, muscle_group, exercise_type, created_by) VALUES
('Barbell Curl', 'Arms', 'strength', NULL),
('Tricep Dips', 'Arms', 'bodyweight', NULL),
('Hammer Curls', 'Arms', 'strength', NULL),
('Tricep Pushdown', 'Arms', 'strength', NULL);

INSERT INTO exercises (name, muscle_group, exercise_type, created_by) VALUES
('Plank', 'Core', 'bodyweight', NULL),
('Russian Twists', 'Core', 'bodyweight', NULL),
('Leg Raises', 'Core', 'bodyweight', NULL),
('Cable Crunches', 'Core', 'strength', NULL);

INSERT INTO exercises (name, muscle_group, exercise_type, created_by) VALUES
('Treadmill', 'Cardio', 'cardio', NULL),
('Cycling', 'Cardio', 'cardio', NULL),
('Rowing Machine', 'Cardio', 'cardio', NULL);

CREATE TABLE service_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    created_by INT NOT NULL,
    revoked TINYINT(1) DEFAULT 0,
    expires_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by),
    INDEX idx_revoked (revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;