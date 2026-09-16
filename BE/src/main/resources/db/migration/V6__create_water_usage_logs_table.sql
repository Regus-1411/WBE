-- ═══════════════════════════════════════════
-- V6: Water usage logs table
-- ═══════════════════════════════════════════
CREATE TABLE water_usage_logs (
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
    household_id        BIGINT          NOT NULL,
    reading_date        DATE            NOT NULL,
    meter_reading       DECIMAL(12,2)   NOT NULL,
    previous_reading    DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    consumption         DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    recorded_by         BIGINT,
    billing_cycle_id    BIGINT,
    source              VARCHAR(20)     NOT NULL DEFAULT 'MANUAL',
    is_validated        BOOLEAN         DEFAULT FALSE,
    notes               VARCHAR(255),
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_water_usage_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    CONSTRAINT fk_water_usage_recorded_by FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_water_usage_billing_cycle FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles(id) ON DELETE SET NULL,

    -- Prevent duplicate readings for the same household on the same date
    UNIQUE KEY uk_household_reading_date (household_id, reading_date),

    INDEX idx_water_usage_household (household_id),
    INDEX idx_water_usage_date (reading_date),
    INDEX idx_water_usage_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
