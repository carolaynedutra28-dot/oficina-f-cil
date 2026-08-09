# Sistema para Oficina Mecânica

## Visão geral

Sistema web simples, feito para uso interno da oficina, protegido por uma senha compartilhada. O foco é substituir planilhas e cadernetas: lançar dinheiro que entra e sai, controlar peças no estoque, cadastrar clientes e carros, gerar orçamentos e recibos em PDF, e tirar relatórios prontos para a contabilidade.

## Funcionalidades principais

1. **Acesso protegido por senha**
   - Uma única senha para abrir o sistema (uso compartilhado da oficina).
   - Sem cadastro de usuários individuais.

2. **Dashboard inicial**
   - Saldo do caixa do mês atual.
   - Total de entradas e saídas do mês.
   - Ordens de serviço em aberto.
   - Alertas de peças com estoque baixo.

3. **Fluxo de caixa**
   - Lançar entradas (serviços, peças vendidas, etc.).
   - Lançar saídas (compras de peças, aluguel, salários, impostos, etc.).
   - Categorias pré-definidas para facilitar os relatórios contábeis.
   - Filtro por período.

4. **Estoque**
   - Cadastro de peças/produtos com quantidade, custo e preço de venda.
   - Alerta quando a quantidade ficar abaixo do mínimo.
   - Baixa automática no estoque quando uma peça é usada em uma ordem de serviço.

5. **Clientes e veículos**
   - Cadastro de clientes (nome, telefone, CPF/CNPJ opcional).
   - Cadastro de carros vinculados ao cliente (placa, modelo, ano, cor).

6. **Ordens de serviço e orçamentos**
   - Criar uma OS com cliente, veículo, descrição do serviço, peças utilizadas e valores.
   - Status: orçamento pendente, aprovado, em execução, finalizado, pago.
   - Quando aprovado, o orçamento vira ordem de serviço.
   - Ao finalizar, gera automaticamente a entrada no fluxo de caixa.

7. **PDF de orçamento e recibo**
   - Geração de PDF com dados da oficina, cliente, veículo, serviços, peças e totais.
   - Layout limpo, pronto para imprimir ou enviar pelo WhatsApp.

8. **Relatórios contábeis**
   - Relatório de entradas e saídas por período (filtro de data).
   - Resumo mensal simplificado com total de entradas, saídas e saldo.
   - Exportação em PDF.

## Estrutura de dados

```text
workshop_settings  -> nome, CNPJ, endereço, telefone, logo (opcional)
customers          -> nome, telefone, documento, endereço
vehicles           -> placa, modelo, ano, cor, customer_id
products           -> nome, código, quantidade, min_quantity, cost_price, sale_price
orders             -> número, customer_id, vehicle_id, status, description, labor_value, total, created_at, finished_at
order_items        -> order_id, product_id, quantity, unit_price
cash_flow          -> tipo (entrada/saída), categoria, descrição, valor, data, order_id (opcional)
```

## Telas do sistema

```text
/login              -> tela de senha compartilhada
/dashboard          -> resumo do mês e alertas
/cash-flow          -> lançamentos e filtro por período
/cash-flow/new      -> novo lançamento
/products           -> lista de peças/produtos
/products/new       -> cadastrar produto
/customers          -> lista de clientes
/customers/new      -> cadastrar cliente
/orders             -> lista de ordens de serviço
/orders/new         -> criar nova OS/orçamento
/orders/$id         -> detalhes da OS e botão de gerar PDF
/reports            -> relatórios contábeis
```

## Tecnologia e infraestrutura

- **Frontend e backend**: TanStack Start (React + server functions).
- **Banco de dados**: Lovable Cloud (PostgreSQL) para persistir clientes, estoque, caixa e ordens.
- **Autenticação**: senha compartilhada criptografada em cookie de sessão (sem login individual).
- **PDFs**: geração server-side em PDF pronto para impressão.

## Próximos passos

1. Habilitar Lovable Cloud no projeto.
2. Criar as tabelas do banco de dados.
3. Implementar o gate de senha compartilhada.
4. Criar as telas de dashboard, fluxo de caixa, estoque, clientes e ordens.
5. Implementar a geração de PDF de orçamentos e recibos.
6. Criar os relatórios contábeis.

## Pergunta para seguir

Você quer que eu comece a construir este sistema agora? Se sim, preciso primeiro ativar o Lovable Cloud (banco de dados) e definir a senha de acesso da oficina.
