-- ═══════════════════════════════════════════
-- V5: Billing cycles table
-- ═══════════════════════════════════════════
CREATE TABLE billing_cycles (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    apartment_id    BIGINT          NOT NULL,
    cycle_name      VARCHAR(50)     NOT NULL,
    start_date      DATE            NOT NULL,
    end_date        DATE            NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'OPEN',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_billing_cycles_apartment FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    INDEX idx_billing_cycles_apartment (apartment_id),
    INDEX idx_billing_cycles_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
