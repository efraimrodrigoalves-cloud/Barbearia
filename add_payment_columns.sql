-- Adicionar colunas de pagamento na tabela de agendamentos
-- Necessário para rastrear método e status de pagamento

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pending' CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'wallet', 'cash', 'card_at_shop', 'pending'));
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled'));

-- Comentários
COMMENT ON COLUMN appointments.payment_method IS 'Método de pagamento: pix, credit_card, debit_card, wallet, cash, card_at_shop, pending';
COMMENT ON COLUMN appointments.payment_status IS 'Status do pagamento: pending, paid, refunded, cancelled';

-- Atualizar agendamentos existentes
UPDATE appointments SET payment_method = 'pending', payment_status = 'pending' WHERE payment_method IS NULL;
