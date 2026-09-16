-- ═══════════════════════════════════════════
-- V2: Users table
-- ═══════════════════════════════════════════
CREATE TABLE users (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)     NOT NULL UNIQUE,
    email           VARCHAR(100)    NOT NULL UNIQUE,
    password        VARCHAR(255)    NOT NULL,
    full_name       VARCHAR(100)    NOT NULL,
    phone           VARCHAR(15),
    role            VARCHAR(20)     NOT NULL DEFAULT 'RESIDENT',
    apartment_id    BIGINT,
    household_id    BIGINT,
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_apartment FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE SET NULL,
    INDEX idx_users_apartment (apartment_id),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- NOTE: household_id FK is added in V3 after households table is created.
