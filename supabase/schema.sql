-- ============================================
-- SCHEMA DO BANCO DE DADOS - Sistema EEG v2.0
-- Hospital Geral de Palmas - EEG Pediátrico
-- ============================================

-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Tabela: profiles (Perfis de Usuário)
-- Vinculada ao Supabase Auth
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'medico', 'enfermeiro', 'tecnico')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver todos os perfis"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================
-- Tabela: patients (Pacientes)
-- ============================================
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_completo TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  cartao_sus TEXT,
  nome_responsavel TEXT NOT NULL,
  telefones TEXT[] DEFAULT '{}',
  whatsapp TEXT,
  email TEXT,
  municipio TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para patients
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_municipio ON patients(municipio);
CREATE INDEX idx_patients_nome ON patients(nome_completo);

-- RLS para patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver pacientes"
  ON patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar pacientes"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar pacientes"
  ON patients FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- Tabela: orders (Pedidos de Exame)
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Agendado', 'Concluido', 'Cancelado')),
  prioridade INT NOT NULL CHECK (prioridade BETWEEN 1 AND 4),
  tipo_paciente TEXT CHECK (tipo_paciente IN ('Ambulatorio', 'Internado')),
  necessidade_sedacao TEXT CHECK (necessidade_sedacao IN ('Com', 'Sem')),
  medico_solicitante TEXT,
  medica_executora TEXT,
  observacoes_medicas TEXT,
  data_pedido DATE NOT NULL,
  scheduled_date DATE,
  scheduled_time TEXT,
  data_conclusao TIMESTAMPTZ,
  executed_by_doctors TEXT[] DEFAULT '{}',
  executed_by_nurses TEXT[] DEFAULT '{}',
  executed_by_technicians TEXT[] DEFAULT '{}',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para orders
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_prioridade ON orders(prioridade);
CREATE INDEX idx_orders_scheduled_date ON orders(scheduled_date);
CREATE INDEX idx_orders_patient_id ON orders(patient_id);
CREATE INDEX idx_orders_data_pedido ON orders(data_pedido);

-- RLS para orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver pedidos"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar pedidos"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar pedidos"
  ON orders FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- Tabela: contact_logs (Logs de Contato)
-- ============================================
CREATE TABLE contact_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ NOT NULL,
  meio TEXT NOT NULL,
  resultado TEXT NOT NULL,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para contact_logs
CREATE INDEX idx_contact_logs_order_id ON contact_logs(order_id);

-- RLS para contact_logs
ALTER TABLE contact_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver logs de contato"
  ON contact_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar logs de contato"
  ON contact_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar logs de contato"
  ON contact_logs FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- Tabela: system_logs (Logs do Sistema)
-- ============================================
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('patient', 'order')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para system_logs
CREATE INDEX idx_system_logs_entity ON system_logs(entity_type, entity_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- RLS para system_logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver logs do sistema"
  ON system_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar logs do sistema"
  ON system_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- Tabela: capacity_config (Configuração de Capacidade)
-- ============================================
CREATE TABLE capacity_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  capacity INT NOT NULL DEFAULT 4 CHECK (capacity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para capacity_config
CREATE INDEX idx_capacity_config_date ON capacity_config(date);

-- RLS para capacity_config
ALTER TABLE capacity_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver capacidades"
  ON capacity_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar capacidades"
  ON capacity_config FOR ALL
  TO authenticated
  USING (true);

-- ============================================
-- Tabela: team_members (Membros da Equipe)
-- ============================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('medico', 'enfermeiro', 'tecnico', 'solicitante')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para team_members
CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_active ON team_members(active);

-- RLS para team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver membros da equipe"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar membros da equipe"
  ON team_members FOR ALL
  TO authenticated
  USING (true);

-- ============================================
-- Funções e Triggers para updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capacity_config_updated_at
    BEFORE UPDATE ON capacity_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Views Úteis
-- ============================================

-- View: Pedidos com dados do paciente
CREATE OR REPLACE VIEW orders_with_patients AS
SELECT 
  o.*,
  p.nome_completo AS patient_name,
  p.data_nascimento AS patient_dob,
  p.nome_responsavel AS patient_responsavel,
  p.municipio AS patient_municipio,
  p.whatsapp AS patient_whatsapp,
  p.telefones AS patient_telefones
FROM orders o
LEFT JOIN patients p ON o.patient_id = p.id;

-- View: Estatísticas do Dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM orders WHERE status = 'Pendente') AS pending_total,
  (SELECT COUNT(*) FROM orders WHERE status = 'Pendente' AND prioridade = 1) AS pending_p1,
  (SELECT COUNT(*) FROM orders WHERE status = 'Pendente' AND prioridade = 2) AS pending_p2,
  (SELECT COUNT(*) FROM orders WHERE status = 'Pendente' AND prioridade = 3) AS pending_p3,
  (SELECT COUNT(*) FROM orders WHERE status = 'Pendente' AND prioridade = 4) AS pending_p4,
  (SELECT COUNT(*) FROM orders WHERE status = 'Agendado' AND scheduled_date = CURRENT_DATE) AS scheduled_today,
  (SELECT COUNT(*) FROM orders WHERE status = 'Agendado' AND scheduled_date > CURRENT_DATE AND scheduled_date <= CURRENT_DATE + INTERVAL '7 days') AS scheduled_next_7_days,
  (SELECT COUNT(*) FROM patients WHERE status = 'Ativo') AS total_patients,
  (SELECT COALESCE(capacity, 0) FROM capacity_config WHERE date = CURRENT_DATE) AS capacity_today;
