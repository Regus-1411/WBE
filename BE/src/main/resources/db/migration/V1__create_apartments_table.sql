-- ═══════════════════════════════════════════
-- V1: Apartments table
-- ═══════════════════════════════════════════
CREATE TABLE apartments (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150)    NOT NULL,
    address         VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(100),
    pincode         VARCHAR(10),
    total_units     INT             DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
