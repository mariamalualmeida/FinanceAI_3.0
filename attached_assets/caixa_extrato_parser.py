#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import pandas as pd
from datetime import datetime
from decimal import Decimal, InvalidOperation
import logging

def parse_caixa_extrato_pdf(text_content: str, doc_type: str) -> list:
    """
    Parser específico para extratos da Caixa Econômica Federal.
    Baseado no formato real dos extratos fornecidos pelo usuário.
    """
    transactions = []
    
    if not text_content or not text_content.strip():
        return transactions
    
    try:
        # Detectar se é um extrato da Caixa
        if not _is_caixa_extrato(text_content):
            return transactions
        
        # Extrair informações do cabeçalho
        header_info = _extract_header_info(text_content)
        
        # Extrair transações usando padrões específicos da Caixa
        transactions = _extract_caixa_transactions(text_content, header_info)
        
        # Categorizar transações
        for transaction in transactions:
            transaction['category'] = _categorize_caixa_transaction(transaction)
            transaction['subcategory'] = _get_subcategory(transaction)
        
        logging.info(f"Extraídas {len(transactions)} transações do extrato da Caixa")
        return transactions
        
    except Exception as e:
        logging.error(f"Erro ao processar extrato da Caixa: {str(e)}")
        return transactions

def _is_caixa_extrato(text: str) -> bool:
    """Verifica se o documento é um extrato da Caixa Econômica Federal."""
    indicators = [
        "CAIXA ECONÔMICA FEDERAL",
        "SAC CAIXA:",
        "Alô CAIXA:",
        "Extrato por período",
        "Conta:",
        "SALDO ANTERIOR",
        "SALDO DIA"
    ]
    
    text_upper = text.upper()
    return sum(1 for indicator in indicators if indicator.upper() in text_upper) >= 3

def _extract_header_info(text: str) -> dict:
    """Extrai informações do cabeçalho do extrato."""
    header_info = {
        'cliente': '',
        'conta': '',
        'data_extrato': '',
        'periodo': '',
        'mes': ''
    }
    
    # Cliente
    cliente_match = re.search(r'Cliente:\s*(.+?)(?:\n|$)', text, re.IGNORECASE)
    if cliente_match:
        header_info['cliente'] = cliente_match.group(1).strip()
    
    # Conta
    conta_match = re.search(r'Conta:\s*(.+?)(?:\n|$)', text, re.IGNORECASE)
    if conta_match:
        header_info['conta'] = conta_match.group(1).strip()
    
    # Data do extrato
    data_match = re.search(r'Data:\s*(.+?)(?:\n|$)', text, re.IGNORECASE)
    if data_match:
        header_info['data_extrato'] = data_match.group(1).strip()
    
    # Período
    periodo_match = re.search(r'Período:\s*(.+?)(?:\n|$)', text, re.IGNORECASE)
    if periodo_match:
        header_info['periodo'] = periodo_match.group(1).strip()
    
    # Mês
    mes_match = re.search(r'Mês:\s*(.+?)(?:\n|$)', text, re.IGNORECASE)
    if mes_match:
        header_info['mes'] = mes_match.group(1).strip()
    
    return header_info

def _extract_caixa_transactions(text: str, header_info: dict) -> list:
    """Extrai as transações do extrato da Caixa usando padrões específicos."""
    transactions = []
    
    # Padrão principal para transações da Caixa
    # Formato: DD/MM/YYYY    NNNNNN    DESCRIÇÃO    VALOR D/C    SALDO C
    transaction_pattern = r'(\d{2}/\d{2}/\d{4})\s+(\d+)\s+(.+?)\s+([\d.,]+)\s+([DC])\s+([\d.,]+)\s+C'
    
    # Padrão alternativo para linhas que podem estar quebradas
    alt_pattern = r'(\d{2}/\d{2}/\d{4})\s+(\d+)\s+(.+?)\s+([\d.,]+)\s+([DC])'
    
    lines = text.split('\n')
    current_year = datetime.now().year
    
    # Tentar extrair o ano do cabeçalho
    if header_info.get('mes'):
        year_match = re.search(r'(\d{4})', header_info['mes'])
        if year_match:
            current_year = int(year_match.group(1))
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        
        # Ignorar linhas de cabeçalho e separadores
        if any(skip in line.upper() for skip in [
            'DATA MOV', 'NR. DOC', 'HISTÓRICO', 'VALOR', 'SALDO',
            'EXTRATO', 'CLIENTE:', 'CONTA:', 'DATA:', 'MÊS:', 'PERÍODO:',
            'SAC CAIXA', 'OUVIDORIA', 'ALÔ CAIXA', 'LANÇAMENTOS DO DIA',
            'SALDO ANTERIOR', 'SALDO DIA', '000000'
        ]):
            continue
        
        # Tentar padrão principal
        match = re.match(transaction_pattern, line)
        if not match:
            # Tentar padrão alternativo
            match = re.match(alt_pattern, line)
            if match and i + 1 < len(lines):
                # Verificar se a próxima linha tem o saldo
                next_line = lines[i + 1].strip()
                saldo_match = re.search(r'([\d.,]+)\s+C', next_line)
                if saldo_match:
                    match = list(match.groups()) + [saldo_match.group(1)]
                else:
                    match = None
        
        if match:
            try:
                date_str = match[0] if isinstance(match, (list, tuple)) else match.group(1)
                doc_num = match[1] if isinstance(match, (list, tuple)) else match.group(2)
                description = match[2] if isinstance(match, (list, tuple)) else match.group(3)
                value_str = match[3] if isinstance(match, (list, tuple)) else match.group(4)
                transaction_type = match[4] if isinstance(match, (list, tuple)) else match.group(5)
                
                # Parse da data
                try:
                    # Se o ano não estiver na data, usar o ano atual ou do cabeçalho
                    if len(date_str.split('/')) == 3:
                        transaction_date = datetime.strptime(date_str, '%d/%m/%Y')
                    else:
                        day, month = date_str.split('/')[:2]
                        transaction_date = datetime(current_year, int(month), int(day))
                except ValueError:
                    continue
                
                # Parse do valor
                try:
                    # Limpar e converter o valor
                    clean_value = value_str.replace('.', '').replace(',', '.')
                    value = float(clean_value)
                    
                    # Aplicar sinal baseado no tipo (D = débito/negativo, C = crédito/positivo)
                    if transaction_type == 'D':
                        value = -abs(value)
                    else:
                        value = abs(value)
                        
                except (ValueError, InvalidOperation):
                    continue
                
                # Limpar descrição
                clean_description = _clean_description(description)
                
                transaction = {
                    'date': transaction_date.isoformat(),
                    'description': clean_description,
                    'value': value,
                    'document_number': doc_num,
                    'transaction_type': 'debit' if transaction_type == 'D' else 'credit',
                    'bank': 'Caixa Econômica Federal',
                    'account': header_info.get('conta', ''),
                    'raw_line': line
                }
                
                transactions.append(transaction)
                
            except Exception as e:
                logging.warning(f"Erro ao processar linha de transação: {line}. Erro: {str(e)}")
                continue
    
    # Ordenar por data
    transactions.sort(key=lambda x: x['date'])
    
    return transactions

def _clean_description(description: str) -> str:
    """Limpa e padroniza a descrição da transação."""
    if not description:
        return ''
    
    # Remover espaços extras
    clean_desc = ' '.join(description.split())
    
    # Mapear códigos comuns da Caixa para descrições mais claras
    mappings = {
        'CRED PIX': 'Recebimento PIX',
        'ENVIO PIX': 'Transferência PIX',
        'PAG BOLETO': 'Pagamento de Boleto',
        'DP DIN LOT': 'Depósito em Dinheiro',
        'SAQUE LOT': 'Saque',
        'COMPRA': 'Compra com Cartão',
        'CRED FGTS': 'Crédito FGTS'
    }
    
    for code, description_text in mappings.items():
        if code in clean_desc:
            clean_desc = clean_desc.replace(code, description_text)
    
    return clean_desc

def _categorize_caixa_transaction(transaction: dict) -> str:
    """Categoriza a transação baseada na descrição e tipo."""
    description = transaction['description'].upper()
    value = transaction['value']
    
    # Transferências PIX
    if 'PIX' in description:
        if value > 0:
            return 'receitas_pix'
        else:
            return 'transferencias_pix'
    
    # Depósitos
    if any(term in description for term in ['DEPÓSITO', 'DP DIN', 'CRED']):
        return 'receitas_depositos'
    
    # Saques
    if 'SAQUE' in description:
        return 'saques'
    
    # Pagamentos
    if any(term in description for term in ['PAG BOLETO', 'PAGAMENTO']):
        return 'contas_servicos'
    
    # Compras
    if 'COMPRA' in description:
        return 'compras_cartao'
    
    # FGTS
    if 'FGTS' in description:
        return 'receitas_fgts'
    
    # Telecomunicações
    if any(term in description for term in ['OI FIBRA', 'TELEFONE', 'INTERNET']):
        return 'telecomunicacoes'
    
    # Baseado no valor
    if value > 0:
        return 'receitas_outras'
    else:
        return 'gastos_outros'

def _get_subcategory(transaction: dict) -> str:
    """Define a subcategoria da transação."""
    description = transaction['description'].upper()
    category = transaction.get('category', '')
    
    subcategory_mapping = {
        'receitas_pix': 'transferencias_recebidas',
        'transferencias_pix': 'transferencias_enviadas',
        'receitas_depositos': 'depositos_dinheiro',
        'saques': 'saques_caixa',
        'contas_servicos': 'pagamento_boletos',
        'compras_cartao': 'compras_diversos',
        'receitas_fgts': 'beneficios_governo',
        'telecomunicacoes': 'internet_telefone',
        'receitas_outras': 'receitas_nao_identificadas',
        'gastos_outros': 'gastos_nao_identificados'
    }
    
    return subcategory_mapping.get(category, 'nao_categorizado')

def _detect_suspicious_patterns(transactions: list) -> dict:
    """Detecta padrões suspeitos nas transações da Caixa."""
    suspicious_patterns = {
        'mula_financeira': [],
        'estruturacao': [],
        'lavagem_dinheiro': [],
        'apostas': []
    }
    
    if not transactions:
        return suspicious_patterns
    
    # Detectar atividade de "mula financeira"
    # Recebimentos PIX imediatos seguidos de transferências do mesmo valor
    for i, transaction in enumerate(transactions):
        if 'RECEBIMENTO PIX' in transaction['description'].upper() and transaction['value'] > 0:
            # Procurar transferência similar nas próximas transações (mesmo dia)
            for j in range(i + 1, min(i + 10, len(transactions))):
                next_trans = transactions[j]
                if ('TRANSFERÊNCIA PIX' in next_trans['description'].upper() and 
                    next_trans['value'] < 0 and 
                    abs(next_trans['value']) == transaction['value']):
                    
                    # Verificar se é no mesmo dia ou muito próximo
                    date1 = datetime.fromisoformat(transaction['date'])
                    date2 = datetime.fromisoformat(next_trans['date'])
                    
                    if abs((date2 - date1).total_seconds()) < 3600:  # 1 hora
                        suspicious_patterns['mula_financeira'].append({
                            'recebimento': transaction,
                            'transferencia': next_trans,
                            'valor': transaction['value'],
                            'tempo_diferenca': abs((date2 - date1).total_seconds())
                        })
                    break
    
    # Detectar estruturação (valores fracionados)
    value_frequency = {}
    for transaction in transactions:
        value = abs(transaction['value'])
        # Arredondar para detectar valores similares
        rounded_value = round(value, -2)  # Arredondar para centenas
        if rounded_value >= 1000:  # Só considerar valores altos
            value_frequency[rounded_value] = value_frequency.get(rounded_value, 0) + 1
    
    for value, frequency in value_frequency.items():
        if frequency >= 5:  # Mesmo valor repetido 5+ vezes
            suspicious_patterns['estruturacao'].append({
                'valor': value,
                'frequencia': frequency,
                'descricao': f'Valor R$ {value:,.2f} repetido {frequency} vezes'
            })
    
    # Detectar possível lavagem (movimentação alta com saldo baixo)
    total_movimentacao = sum(abs(t['value']) for t in transactions)
    receitas = sum(t['value'] for t in transactions if t['value'] > 0)
    gastos = sum(abs(t['value']) for t in transactions if t['value'] < 0)
    
    if total_movimentacao > 50000 and receitas > 0:  # Movimentação alta
        proporcao_passagem = gastos / receitas if receitas > 0 else 0
        if proporcao_passagem > 0.95:  # 95%+ do dinheiro é transferido
            suspicious_patterns['lavagem_dinheiro'].append({
                'total_movimentacao': total_movimentacao,
                'receitas': receitas,
                'gastos': gastos,
                'proporcao_passagem': proporcao_passagem,
                'descricao': f'Alta movimentação (R$ {total_movimentacao:,.2f}) com {proporcao_passagem*100:.1f}% de passagem'
            })
    
    return suspicious_patterns

# Função principal para uso externo
def process_caixa_extrato_text(text_content: str) -> dict:
    """
    Função principal para processar texto de extrato da Caixa.
    Retorna dicionário com transações e análises.
    """
    transactions = parse_caixa_extrato_pdf(text_content, 'extrato_bancario')
    
    result = {
        'transactions': transactions,
        'transaction_count': len(transactions),
        'total_income': sum(t['value'] for t in transactions if t['value'] > 0),
        'total_expenses': sum(abs(t['value']) for t in transactions if t['value'] < 0),
        'net_balance': sum(t['value'] for t in transactions),
        'suspicious_patterns': _detect_suspicious_patterns(transactions),
        'bank': 'Caixa Econômica Federal',
        'processing_success': True
    }
    
    return result

if __name__ == "__main__":
    # Teste com dados de exemplo
    sample_text = """
    Extrato por período
    Cliente:     NATHALIA MANOELA F S BARNABE
    Conta:       02475 | 1288 | 000757299314-2
    Data:        10/06/2025 - 10:14
    Mês:         Maio/2025
    Período:     1 - 31

    05/05/2025        041904          ENVIO PIX             6,00 D        0,00 C
    08/05/2025        081505          CRED PIX          1.106,00 C    1.106,00 C
    08/05/2025        081507          PAG BOLETO        1.106,00 D        0,00 C
    """
    
    result = process_caixa_extrato_text(sample_text)
    print(f"Processamento concluído: {result['transaction_count']} transações encontradas")