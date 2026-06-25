# Livro das Palavras (Grimório)

Uma aplicação interativa gamificada para o aprendizado de vocabulário em inglês, com um tema de fantasia/grimório mágico.

## Funcionalidades
- **Sessões Diárias:** Aprenda 20 novas palavras (ou revise palavras atrasadas) todos os dias.
- **Sistema Leitner (Repetição Espaçada):** As palavras que você acerta demoram mais para reaparecer, as que você erra voltam logo.
- **Minigames (Desafios):** Múltipla escolha, digitação com áudio TTS, anagramas, reconhecimento de voz e exercícios de fixação avançados.
- **Oráculo:** Receba feedback detalhado e personalizado sobre seus erros diários através de um sistema inteligente.
- **Sistema de Níveis:** Aprendiz, Iniciante, Intermediário, Avançado e Mestre. Cada um com desafios únicos.

## Tecnologias Usadas
- Next.js 14+ (App Router)
- React 19
- Prisma ORM
- SQLite (Local)
- Framer Motion (Animações)
- Lucide React (Ícones)
- Integração TTS (Google Translate API via Backend)
- Reconhecimento de Voz (Web Speech API)

## Preparação para Produção (Vercel)

Este projeto, por padrão, utiliza **SQLite local** via `better-sqlite3`. Isso funciona perfeitamente para desenvolvimento local, mas na **Vercel** o sistema de arquivos é efêmero, significando que o banco de dados (`dev.db`) será reiniciado a cada novo deploy ou inatividade do servidor.

Para hospedar de forma persistente, você deve migrar o banco para um serviço externo. Opções recomendadas:
1. **Turso (LibSQL)** - 100% compatível com a sintaxe e driver local, ideal para projetos na edge.
2. **Vercel Postgres**
3. **Supabase / PlanetScale**

### Como rodar localmente

1. Instale as dependências:
```bash
npm install
```

2. Inicialize o banco de dados Prisma (se necessário):
```bash
npx prisma generate
npx prisma db push
```

3. Crie um arquivo `.env.local` na raiz do projeto com sua chave de API para o Oráculo:
```env
GROQ_API_KEY=sua_chave_aqui
```

4. Inicie o servidor:
```bash
npm run dev
```
