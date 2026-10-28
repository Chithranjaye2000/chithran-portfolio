-- Phase 05: additive public-sharing metadata only; no existing content is changed.
-- MySQL DDL commits implicitly. The data import runs in a separate transaction.
-- For partial/rerun safety use db:migrate:qa; its runner checks existing metadata.

ALTER TABLE qa_evidence ADD COLUMN summary_approved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE qa_evidence ADD COLUMN source_reviewed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE qa_evidence ADD COLUMN public_report_approved BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE qa_evidence ADD CONSTRAINT chk_qa_evidence_summary_approved CHECK (summary_approved IN (0, 1));
ALTER TABLE qa_evidence ADD CONSTRAINT chk_qa_evidence_source_reviewed CHECK (source_reviewed IN (0, 1));
ALTER TABLE qa_evidence ADD CONSTRAINT chk_qa_evidence_public_report_approved CHECK (public_report_approved IN (0, 1));
