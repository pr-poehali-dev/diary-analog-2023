-- Таблица пользователей (ученики, учителя, директор)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'director')),
    full_name VARCHAR(200) NOT NULL,
    class_name VARCHAR(10),
    avatar_emoji VARCHAR(10) DEFAULT '😊',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица предметов
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    teacher_id INTEGER REFERENCES users(id)
);

-- Таблица оценок
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    grade INTEGER NOT NULL CHECK (grade >= 2 AND grade <= 5),
    date DATE DEFAULT CURRENT_DATE,
    teacher_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица SMS кодов для авторизации
CREATE TABLE IF NOT EXISTS sms_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставляем директора (первый пользователь - это ты)
INSERT INTO users (phone, role, full_name, avatar_emoji) 
VALUES ('+79999999999', 'director', 'Директор', '👑')
ON CONFLICT (phone) DO NOTHING;

-- Создаём базовые предметы
INSERT INTO subjects (name, icon) VALUES
('Математика', 'Calculator'),
('Русский язык', 'BookOpen'),
('История', 'Scroll'),
('Физика', 'Atom'),
('Английский язык', 'Languages'),
('Химия', 'Flask'),
('Биология', 'Leaf'),
('География', 'Globe'),
('Литература', 'BookMarked'),
('Информатика', 'Code')
ON CONFLICT DO NOTHING;

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_codes(phone, used);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
