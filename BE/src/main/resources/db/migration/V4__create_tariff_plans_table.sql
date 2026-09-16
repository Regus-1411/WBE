-- ═══════════════════════════════════════════
-- V4: Tariff plans table
-- ═══════════════════════════════════════════
CREATE TABLE tariff_plans (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    description     TEXT,
    rate_per_unit   DECIMAL(10,2)   NOT NULL,
    min_charge      DECIMAL(10,2)   DEFAULT 0.00,
    free_units      INT             DEFAULT 0,
    apartment_id    BIGINT          NOT NULL,
    effective_from  DATE            NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_tariff_plans_apartment FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    INDEX idx_tariff_plans_apartment (apartment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
