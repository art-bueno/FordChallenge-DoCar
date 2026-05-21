# Ford Pickup Intel — Entrega Mobile
### Disciplina: Mobile Development & IoT | FIAP

---

## Sobre o Projeto

O **Ford Pickup Intel** é uma plataforma de inteligência competitiva automotiva desenvolvida para o desafio proposto pela Ford na FIAP. O aplicativo mobile permite que analistas consultem e comparem especificações técnicas de picapes concorrentes da Ranger em tempo real, com extração automatizada de dados via agente de IA.

---

## Acesso ao App

**URL:** https://ford-challenge-do-car-raxun2b7c-art-buenos-projects.vercel.app/login

| Campo | Valor |
|-------|-------|
| Email | `admin@ford.com` |
| Senha | `Admin@2025!` |

> O app roda diretamente no browser — não é necessário instalar nada.

---

## Funcionalidades

### Dashboard
Visão geral do banco de dados com total de veículos cadastrados, marcas, veículos com especificações e maior potência registrada.

### Veículos
Lista todos os veículos cadastrados com suas especificações. Toque em um veículo para ver os detalhes completos. Toque longo para excluir.

### Comparativo
Selecione dois veículos e compare lado a lado suas especificações numéricas (potência, torque, marchas, airbags, garantia) e equipamentos (4x4, diesel, câmbio automático, etc.), com destaque em verde para o melhor valor.

### Extrair Specs (Agente de IA)
Selecione marca, modelo, versão e ano — o agente de IA busca automaticamente as especificações técnicas na internet e salva no banco de dados. Consultas repetidas retornam do banco sem chamar a IA novamente, demonstrando o sistema de cache inteligente.

---

## Requisitos Atendidos

| Requisito | Implementação |
|-----------|---------------|
| React Native + Expo | ✅ Expo SDK 52, Expo Router v3 |
| App multiplataforma | ✅ iOS, Android e Web |
| Navegação com Expo Router | ✅ Tabs + Stack navigation |
| Consumo de API externa | ✅ API REST própria hospedada no Railway |
| Componentes React Native | ✅ ScrollView, TextInput, TouchableOpacity, etc. |
| Gerenciamento de estado | ✅ useState + useEffect |
| Armazenamento local | ✅ SecureStore (nativo) / localStorage (web) |
| Integração com IA | ✅ Agente Claude AI para extração de specs |
| Autenticação JWT | ✅ Login com tokens de acesso e refresh |

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo |
| Roteamento | Expo Router v3 |
| Linguagem | TypeScript |
| API | Fastify + Node.js (Railway) |
| Banco de dados | Oracle (FIAP) via TypeORM |
| Autenticação | JWT + HMAC |
| IA | Claude API (Anthropic) |
| Deploy Mobile | Vercel |
| Deploy API | Railway |

---

## Repositório

https://github.com/art-bueno/FordChallenge-DoCar

---

*Desenvolvido por Arthur Bueno — FIAP 2025*