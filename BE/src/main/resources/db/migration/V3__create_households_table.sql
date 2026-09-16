-- ═══════════════════════════════════════════
-- V3: Households table + users.household_id FK
-- ═══════════════════════════════════════════
CREATE TABLE households (
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
    unit_number         VARCHAR(20)     NOT NULL,
    floor               VARCHAR(10),
    block               VARCHAR(20),
    apartment_id        BIGINT          NOT NULL,
    meter_serial_number VARCHAR(50)     UNIQUE,
    meter_installed_date DATE,
    is_active           BOOLEAN         DEFAULT TRUE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_households_apartment FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    UNIQUE KEY uk_household_unit_apartment (unit_number, apartment_id),
    INDEX idx_households_apartment (apartment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Now add the deferred FK from users → households
ALTER TABLE users
    ADD CONSTRAINT fk_users_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL;

ALTER TABLE users
    ADD INDEX idx_users_household (household_id);
