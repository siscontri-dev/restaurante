-- Script para agregar el campo is_produced a la tabla transactions
-- Este campo controlará qué transacciones han sido procesadas en producción

USE siscontr_pos37;

-- Agregar el campo is_produced a la tabla transactions
ALTER TABLE transactions 
ADD COLUMN is_produced TINYINT(1) DEFAULT 0 
COMMENT 'Indica si la transacción ha sido procesada en producción (0=no procesada, 1=procesada)';

-- Crear índice para optimizar las consultas de transacciones no procesadas
CREATE INDEX idx_is_produced ON transactions(is_produced);

-- Actualizar todas las transacciones existentes como no procesadas
UPDATE transactions SET is_produced = 0 WHERE is_produced IS NULL;

-- Verificar que el campo se agregó correctamente
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT, 
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'siscontr_pos37' 
AND TABLE_NAME = 'transactions' 
AND COLUMN_NAME = 'is_produced';

-- Mostrar algunas transacciones de ejemplo con el nuevo campo
SELECT 
    id, 
    invoice_no, 
    final_total, 
    is_produced, 
    created_at 
FROM transactions 
ORDER BY created_at DESC 
LIMIT 5;




