# Sistema EEG v2.0 - HGP Palmas

Sistema de Agendamento de EEG Pediátrico do Hospital Geral de Palmas.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)

## 🚀 Features

- **Dashboard** - Visão geral com estatísticas e ações rápidas
- **Pacientes** - CRUD completo com filtros por município
- **Pedidos** - Gerenciamento de pedidos com sistema de prioridades (P1-P4)
- **Agendamentos** - Agenda diária com calendário integrado
- **Mapa de Impressão** - Geração de mapas para impressão
- **Arquivados** - Histórico de pedidos concluídos/cancelados
- **Relatórios** - Estatísticas de produtividade e gestão
- **Configurações** - Equipe, capacidade e backup

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Deploy**: Vercel

## 📦 Instalação

```bash
# Clone o repositório
git clone <seu-repositorio>

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Rode o servidor de desenvolvimento
npm run dev
```

## 🗄️ Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie a `URL` e `anon key` do projeto
3. Cole em `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key_aqui
   ```
4. Execute o schema SQL em `supabase/schema.sql` no SQL Editor do Supabase

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router pages
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Dashboard
│   ├── pacientes/          # Módulo pacientes
│   ├── pedidos/            # Módulo pedidos
│   ├── agendamentos/       # Módulo agendamentos
│   ├── mapa-impressao/     # Mapa para impressão
│   ├── arquivados/         # Pedidos arquivados
│   ├── relatorios/         # Relatórios
│   └── configuracoes/      # Configurações
├── components/
│   ├── layout/             # Sidebar, Header
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── supabase/           # Clientes Supabase
│   └── utils.ts            # Utilitários
└── types/                  # TypeScript types
```

## 🚢 Deploy na Vercel

1. Conecte o repositório à Vercel
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy!

## 📋 Próximos Passos

- [ ] Implementar autenticação de usuários
- [ ] Conectar CRUD real ao Supabase
- [ ] Adicionar log de contatos
- [ ] Implementar histórico do sistema (systemLog)
- [ ] Migração de dados do sistema antigo

## 📄 Licença

Desenvolvido para o Hospital Geral de Palmas - EEG Pediátrico.

---

Desenvolvido com ❤️ por Outliers.team & EEG HGP
