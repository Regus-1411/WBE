-- ═══════════════════════════════════════════
-- V7: Add MAIN_ADMIN support & approval document fields to Users table
-- ═══════════════════════════════════════════

ALTER TABLE users
    ADD COLUMN approval_status VARCHAR(20) DEFAULT 'APPROVED',
    ADD COLUMN document_bond TEXT,
    ADD COLUMN document_certificate TEXT,
    ADD COLUMN document_id_proof TEXT,
    ADD COLUMN document_notes TEXT,
    ADD COLUMN rejection_reason VARCHAR(255),
    ADD COLUMN approved_at TIMESTAMP NULL;
