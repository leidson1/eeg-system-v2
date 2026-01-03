// Tipos principais do Sistema EEG

// Status de pedido
export type OrderStatus = 'Pendente' | 'Agendado' | 'Concluido' | 'Cancelado';

// Prioridade de pedido  
export type Priority = 1 | 2 | 3 | 4;

// Tipo de paciente
export type PatientType = 'Ambulatorio' | 'Internado';

// Necessidade de sedação
export type SedationNeed = 'Com' | 'Sem';

// Roles de usuário
export type UserRole = 'admin' | 'medico' | 'enfermeiro' | 'tecnico';

// Tipo membro da equipe
export type TeamMemberRole = 'medico' | 'enfermeiro' | 'tecnico' | 'solicitante';

// Paciente
export interface Patient {
  id: string;
  nome_completo: string;
  data_nascimento: string; // YYYY-MM-DD
  cartao_sus?: string;
  nome_responsavel: string;
  telefones?: string[];
  whatsapp?: string;
  email?: string;
  municipio?: string;
  observacoes?: string;
  status: 'Ativo' | 'Inativo';
  created_at: string;
  updated_at: string;
}

// Pedido de Exame
export interface Order {
  id: string;
  patient_id: string;
  status: OrderStatus;
  prioridade: Priority;
  tipo_paciente: PatientType;
  necessidade_sedacao: SedationNeed;
  medico_solicitante?: string;
  medica_executora?: string;
  observacoes_medicas?: string;
  data_pedido: string; // YYYY-MM-DD
  scheduled_date?: string; // YYYY-MM-DD
  scheduled_time?: string;
  data_conclusao?: string;
  executed_by_doctors?: string[];
  executed_by_nurses?: string[];
  executed_by_technicians?: string[];
  archived_at?: string;
  created_at: string;
  updated_at: string;
  // Join data
  patient?: Patient;
  contact_logs?: ContactLog[];
}

// Log de Contato
export interface ContactLog {
  id: string;
  order_id: string;
  data_hora: string;
  meio: string;
  resultado: string;
  observacoes?: string;
  created_at: string;
}

// Log do Sistema
export interface SystemLog {
  id: string;
  entity_type: 'patient' | 'order';
  entity_id: string;
  action: string;
  user_id?: string;
  created_at: string;
}

// Configuração de Capacidade
export interface CapacityConfig {
  id: string;
  date: string; // YYYY-MM-DD
  capacity: number;
}

// Membro da Equipe
export interface TeamMember {
  id: string;
  name: string;
  role: TeamMemberRole;
  active: boolean;
}

// Perfil de Usuário
export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

// Descrições de Prioridade
export const PRIORITY_DESCRIPTIONS: Record<Priority, string> = {
  1: 'Não dormiu/Não veio, mas comunicou',
  2: 'Faltou e não comunicou', 
  3: 'Fila normal',
  4: 'Não localizado, aguardando Sec. Saúde'
};

// Cores de Prioridade (para badges)
export const PRIORITY_COLORS: Record<Priority, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-green-500',
  4: 'bg-gray-500'
};

// Lista de municípios do Tocantins
export const CIDADES_TOCANTINS = [
  "Abreulândia", "Aguiarnópolis", "Aliança do Tocantins", "Almas", "Alvorada", "Ananás",
  "Angico", "Aparecida do Rio Negro", "Aragominas", "Araguacema", "Araguaçu", "Araguaína",
  "Araguanã", "Araguatins", "Arapoema", "Arraias", "Augustinópolis", "Aurora do Tocantins",
  "Axixá do Tocantins", "Babaçulândia", "Bandeirantes do Tocantins", "Barra do Ouro",
  "Barrolândia", "Bernardo Sayão", "Bom Jesus do Tocantins", "Brasilândia do Tocantins",
  "Brejinho de Nazaré", "Buriti do Tocantins", "Cachoeirinha", "Campos Lindos", "Cariri do Tocantins",
  "Carmolândia", "Carrasco Bonito", "Caseara", "Centenário", "Chapada da Natividade", "Chapada de Areia",
  "Colinas do Tocantins", "Colméia", "Combinado", "Conceição do Tocantins", "Couto Magalhães",
  "Cristalândia", "Crixás do Tocantins", "Darcinópolis", "Dianópolis", "Divinópolis do Tocantins",
  "Dois Irmãos do Tocantins", "Dueré", "Esperantina", "Fátima", "Figueirópolis", "Filadélfia",
  "Formoso do Araguaia", "Fortaleza do Tabocão", "Goianorte", "Goiatins", "Guaraí", "Gurupi",
  "Ipueiras", "Itacajá", "Itaguatins", "Itapiratins", "Itaporã do Tocantins", "Jaú do Tocantins",
  "Juarina", "Lagoa da Confusão", "Lagoa do Tocantins", "Lajeado", "Lavandeira", "Lizarda", "Luzinópolis",
  "Marianópolis do Tocantins", "Mateiros", "Maurilândia do Tocantins", "Miracema do Tocantins",
  "Miranorte", "Monte do Carmo", "Monte Santo do Tocantins", "Muricilândia", "Natividade", "Nazaré",
  "Nova Olinda", "Nova Rosalândia", "Novo Acordo", "Novo Alegre", "Novo Jardim", "Oliveira de Fátima",
  "Palmas", "Palmeirante", "Palmeiras do Tocantins", "Palmeirópolis", "Paraíso do Tocantins",
  "Paranã", "Pau D'Arco", "Pedro Afonso", "Peixe", "Pequizeiro", "Pindorama do Tocantins", "Piraquê",
  "Pium", "Ponte Alta do Bom Jesus", "Ponte Alta do Tocantins", "Porto Alegre do Tocantins",
  "Porto Nacional", "Praia Norte", "Presidente Kennedy", "Pugmil", "Recursolândia", "Riachinho",
  "Rio da Conceição", "Rio dos Bois", "Rio Sono", "Sampaio", "Sandolândia", "Santa Fé do Araguaia",
  "Santa Maria do Tocantins", "Santa Rita do Tocantins", "Santa Rosa do Tocantins", "Santa Tereza do Tocantins",
  "Santa Terezinha do Tocantins", "São Bento do Tocantins", "São Félix do Tocantins",
  "São Miguel do Tocantins", "São Salvador do Tocantins", "São Sebastião do Tocantins",
  "São Valério", "Silvanópolis", "Sítio Novo do Tocantins", "Sucupira", "Taguatinga", "Taipas do Tocantins",
  "Talismã", "Tocantínia", "Tocantinópolis", "Tupirama", "Tupiratins", "Wanderlândia", "Xambioá"
].sort((a, b) => a.localeCompare(b));
