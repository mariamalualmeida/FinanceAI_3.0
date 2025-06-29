#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Sistema Unificado de Parsers para Bancos Brasileiros
Extrai dados de extratos e faturas de cartão de crédito dos principais bancos do Brasil
"""

import re
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional
import json

class BrazilianBanksParser:
    """Parser unificado para todos os bancos brasileiros"""
    
    def __init__(self):
        self.bank_patterns = self._initialize_bank_patterns()
        self.transaction_patterns = self._initialize_transaction_patterns()
        self.credit_card_patterns = self._initialize_credit_card_patterns()
    
    def _initialize_bank_patterns(self) -> Dict[str, Dict]:
        """Padrões de identificação dos bancos brasileiros"""
        return {
            'itau': {
                'identifiers': ['ITAÚ', 'ITAU', 'BANCO ITAÚ', 'UNIBANCO', '341'],
                'account_pattern': r'AG\.?\s*(\d{4})\s*C/C\.?\s*(\d{5,}-\d)',
                'date_format': r'(\d{2})/(\d{2})/(\d{4})',
                'value_pattern': r'R?\$?\s*([\d\.,]+)',
                'transaction_indicators': ['TRANSFERENCIA', 'PIX', 'TED', 'DOC', 'DEBITO', 'CREDITO']
            },
            'bradesco': {
                'identifiers': ['BRADESCO', 'BANCO BRADESCO', '237'],
                'account_pattern': r'AG\.?\s*(\d{4})-(\d)\s*CC\.?\s*(\d{6,}-\d)',
                'date_format': r'(\d{2})/(\d{2})/(\d{4})',
                'value_pattern': r'R?\$?\s*([\d\.,]+)',
                'transaction_indicators': ['TRANSF', 'PIX', 'TED', 'DOC', 'COMPRA', 'SAQUE']
            },
            'santander': {
                'identifiers': ['SANTANDER', 'BANCO SANTANDER', '033'],
                'account_pattern': r'AG\.?\s*(\d{4})\s*CC\.?\s*(\d{8})',
                'date_format': r'(\d{2})/(\d{2})/(\d{4})',
                'value_pattern': r'R?\$?\s*([\d\.,]+)',
                'transaction_indicators': ['TRANSFERENCIA', 'PIX', 'TED', 'COMPRA DEBITO', 'SAQUE']
            },
            'caixa': {
                'identifiers': ['CAIXA', 'CAIXA ECONÔMICA', 'CEF', '104'],
                'account_pattern': r'(\d{5})\s*\|\s*(\d{4})\s*\|\s*(\d{12}-\d)',
                'date_format': r'(\d{2})/(\d{2})/(\d{4})',
                'value_pattern': r'(\d{1,3}(?:\.\d{3})*),(\d{2})',
                'transaction_indicators': ['CRED PIX', 'ENVIO PIX', 'TED', 'DOC', 'SAQUE', 'DEPOSITO']
            },
            'bb': {
                'identifiers': ['BANCO DO BRASIL', 'BB', '001'],
                'account_pattern': r'AG\.?\s*(\d{4,5})-(\d)\s*CC\.?\s*(\d{6,}-\d)',
                'date_format': r'(\d{2})/(\d{2})/(\d{4})',
                'value_pattern': r'R?\$?\s*([\d\.,]+)',
                'transaction_indicators': ['TRANSFERENCIA', 'PIX', 'TED', 'DOC', 'COMPRA', 'SAQUE']
            },
            'nubank': {
                'identifiers': ['NUBANK', 'NU PAGAMENTOS', 'NUCONTA'],
                'account_pattern': r'Conta:\s*(\d{4}\.\d{4}\.\d{4}-\d{2})',
                'date_format': r'(\d{2})/(\d{2})/(\d{4})',
                'value_pattern': r'R?\$?\s*([\d\.,]+)',
                'transaction_indicators': ['Pix', 'Transferência', 'Compra', 'Pagamento', 'Recebimento']
            },
            'inter': {
                'identifiers': ['INTER', 'BANCO INTER', '077'],
                'account_pattern': r'Conta:\s*(\d+)',
                'date_format': r'(\d{2})/(\d{2})/(\d{4})',
                'value_pattern': r'R?\$?\s*([\d\.,]+)',
                'transaction_indicators': ['PIX', 'Transferência', 'Compra', 'Recebimento', 'TED']
            },
            'c6': {
                'identifiers': ['C6 BANK', 'C6', 'BANCO C6'],
                'account_pattern': r'Conta:\s*(\d+)',
                'date_format': r'(\d{2})/(\d{2})/(\d{4})',
                'value_pattern': r'R?\$?\s*([\d\.,]+)',
                'transaction_indicators': ['PIX', 'Compra', 'Transferência', 'Recebimento']
            },
            'original': {
                'identifiers': ['ORIGINAL', 'BANCO ORIGINAL'],
                'account_pattern': r'Conta:\s*(\d+)',
                'date_format': r'(\d{2})/(\d{2})/(\d{4})',
                'value_pattern': r'R?\$?\s*([\d\.,]+)',
                'transaction_indicators': ['PIX', 'Transferência', 'Compra', 'Recebimento']
            },
            'next': {
                'identifiers': ['NEXT', 'BANCO NEXT'],
                'account_pattern': r'Conta:\s*(\d+)',
                'date_format': r'(\d{2})/(\d{2})/(\d{4})',
                'value_pattern': r'R?\$?\s*([\d\.,]+)',
                'transaction_indicators': ['PIX', 'Transferência', 'Compra', 'Pagamento']
            },
            'picpay': {
                'identifiers': ['PICPAY', 'PIC PAY'],
                'account_pattern': r'Conta:\s*(@[\w\.]+)',
                'date_format': r'(\d{2})/(\d{2})/(\d{4})',
                'value_pattern': r'R?\$?\s*([\d\.,]+)',
                'transaction_indicators': ['PIX', 'Transferência', 'Pagamento', 'Recebimento']
            },
            'btg': {
                'identifiers': ['BTG', 'BTG PACTUAL'],
                'account_pattern': r'Conta:\s*(\d+)',
                'date_format': r'(\d{2})/(\d{2})/(\d{4})',
                'value_pattern': r'R?\$?\s*([\d\.,]+)',
                'transaction_indicators': ['PIX', 'Transferência', 'Investimento', 'Resgate']
            },
            'xp': {
                'identifiers': ['XP', 'XP INVESTIMENTOS'],
                'account_pattern': r'Conta:\s*(\d+)',
                'date_format': r'(\d{2})/(\d{2})/(\d{4})',
                'value_pattern': r'R?\$?\s*([\d\.,]+)',
                'transaction_indicators': ['PIX', 'Transferência', 'Investimento', 'Resgate']
            }
        }
    
    def _initialize_transaction_patterns(self) -> Dict[str, str]:
        """Padrões comuns de transações em extratos"""
        return {
            'pix': r'PIX|Pix|pix',
            'ted': r'TED|Ted|ted',
            'doc': r'DOC|Doc|doc',
            'transferencia': r'TRANSFER[EÊ]NCIA|Transfer[eê]ncia|TRANSF|Transf',
            'saque': r'SAQUE|Saque|saque|RETIRADA|Retirada',
            'deposito': r'DEP[OÓ]SITO|Dep[oó]sito|CREDITO|Cr[eé]dito',
            'compra_debito': r'COMPRA D[EÉ]BITO|Compra D[eé]bito|DEBITO|D[eé]bito',
            'compra_credito': r'COMPRA CR[EÉ]DITO|Compra Cr[eé]dito',
            'pagamento': r'PAGAMENTO|Pagamento|PAG\.|Pag\.',
            'recebimento': r'RECEBIMENTO|Recebimento|REC\.|Rec\.',
            'tarifa': r'TARIFA|Tarifa|TAXA|Taxa',
            'juros': r'JUROS|Juros|RENDIMENTO|Rendimento',
            'estorno': r'ESTORNO|Estorno|CANCELAMENTO|Cancelamento'
        }
    
    def _initialize_credit_card_patterns(self) -> Dict[str, Dict]:
        """Padrões específicos para faturas de cartão de crédito"""
        return {
            'itau': {
                'identifiers': ['FATURA CARTÃO', 'ITAUCARD', 'CREDICARD'],
                'transaction_pattern': r'(\d{2}\/\d{2})\s+([^0-9]+)\s+([\d\.,]+)',
                'total_pattern': r'TOTAL DA FATURA.*?R\$\s*([\d\.,]+)',
                'vencimento_pattern': r'VENCIMENTO.*?(\d{2}\/\d{2}\/\d{4})'
            },
            'bradesco': {
                'identifiers': ['BRADESCO CARTÕES', 'FATURA'],
                'transaction_pattern': r'(\d{2}\/\d{2})\s+([^0-9]+)\s+([\d\.,]+)',
                'total_pattern': r'VALOR TOTAL.*?R\$\s*([\d\.,]+)',
                'vencimento_pattern': r'VENCIMENTO.*?(\d{2}\/\d{2}\/\d{4})'
            },
            'nubank': {
                'identifiers': ['NUBANK FATURA', 'CARTÃO DE CRÉDITO'],
                'transaction_pattern': r'(\d{2}\s[A-Z]{3})\s+([^R$]+)\s+R\$\s*([\d\.,]+)',
                'total_pattern': r'TOTAL.*?R\$\s*([\d\.,]+)',
                'vencimento_pattern': r'VENCIMENTO.*?(\d{2}\/\d{2}\/\d{4})'
            }
        }
    
    def detect_bank(self, text_content: str) -> Optional[str]:
        """Detecta qual banco baseado no conteúdo do texto"""
        text_upper = text_content.upper()
        
        for bank_name, bank_info in self.bank_patterns.items():
            for identifier in bank_info['identifiers']:
                if identifier in text_upper:
                    return bank_name
        
        return None
    
    def detect_document_type(self, text_content: str) -> str:
        """Detecta se é extrato bancário ou fatura de cartão"""
        text_upper = text_content.upper()
        
        # Indicadores de fatura de cartão
        credit_indicators = [
            'FATURA', 'CARTÃO', 'CARD', 'CRÉDITO', 'LIMITE',
            'VENCIMENTO', 'PAGAMENTO MÍNIMO', 'TOTAL A PAGAR'
        ]
        
        # Indicadores de extrato bancário
        statement_indicators = [
            'EXTRATO', 'SALDO', 'MOVIMENTAÇÃO', 'PERÍODO',
            'CONTA CORRENTE', 'POUPANÇA'
        ]
        
        credit_score = sum(1 for indicator in credit_indicators if indicator in text_upper)
        statement_score = sum(1 for indicator in statement_indicators if indicator in text_upper)
        
        return 'fatura_cartao' if credit_score > statement_score else 'extrato_bancario'
    
    def parse_bank_statement(self, text_content: str, bank: str) -> List[Dict]:
        """Parser genérico para extratos bancários"""
        transactions = []
        
        if bank not in self.bank_patterns:
            return []
        
        bank_info = self.bank_patterns[bank]
        
        # Extrair informações da conta
        account_match = re.search(bank_info['account_pattern'], text_content)
        account_info = account_match.groups() if account_match else None
        
        # Padrões de linha de transação para cada banco
        if bank == 'caixa':
            # Padrão específico da Caixa (já implementado)
            return self._parse_caixa_transactions(text_content)
        elif bank == 'itau':
            return self._parse_itau_transactions(text_content)
        elif bank == 'bradesco':
            return self._parse_bradesco_transactions(text_content)
        elif bank == 'santander':
            return self._parse_santander_transactions(text_content)
        elif bank == 'bb':
            return self._parse_bb_transactions(text_content)
        elif bank == 'nubank':
            return self._parse_nubank_transactions(text_content)
        elif bank == 'inter':
            return self._parse_inter_transactions(text_content)
        else:
            return self._parse_generic_transactions(text_content, bank)
    
    def _parse_caixa_transactions(self, text_content: str) -> List[Dict]:
        """Parser específico para Caixa (reutilizando implementação existente)"""
        from caixa_extrato_parser import process_caixa_extrato_text
        
        try:
            result = process_caixa_extrato_text(text_content)
            if result.get('processing_success', False):
                return result.get('transactions', [])
        except Exception as e:
            print(f"Erro no parser da Caixa: {e}")
        
        return []
    
    def _parse_itau_transactions(self, text_content: str) -> List[Dict]:
        """Parser específico para Itaú"""
        transactions = []
        
        # Padrão Itaú: data | descrição | valor | saldo
        pattern = r'(\d{2}\/\d{2}\/\d{4})\s+([^0-9]+?)\s+([\d\.,]+)\s+([CD])\s+([\d\.,]+)\s+([CD])'
        
        for match in re.finditer(pattern, text_content):
            date_str, description, value_str, value_type, balance_str, balance_type = match.groups()
            
            try:
                date = datetime.strptime(date_str, '%d/%m/%Y').isoformat()
                value = self._parse_value(value_str)
                
                # Determinar se é débito ou crédito
                if value_type == 'D':
                    value = -abs(value)
                
                transactions.append({
                    'date': date,
                    'description': self._clean_description(description),
                    'value': value,
                    'type': 'debit' if value < 0 else 'credit',
                    'category': self._categorize_transaction(description),
                    'bank': 'itau'
                })
            except Exception as e:
                continue
        
        return transactions
    
    def _parse_bradesco_transactions(self, text_content: str) -> List[Dict]:
        """Parser específico para Bradesco"""
        transactions = []
        
        # Padrão Bradesco: data | descrição | documento | valor | saldo
        pattern = r'(\d{2}\/\d{2})\s+([^0-9]+?)\s+(\d+)?\s*([\d\.,]+)[-+]?\s*([\d\.,]+)?'
        
        current_year = datetime.now().year
        
        for match in re.finditer(pattern, text_content):
            date_str, description, doc, value_str, balance_str = match.groups()
            
            try:
                # Adicionar ano atual se não estiver presente
                if len(date_str.split('/')) == 2:
                    date_str += f'/{current_year}'
                
                date = datetime.strptime(date_str, '%d/%m/%Y').isoformat()
                value = self._parse_value(value_str)
                
                # Determinar sinal baseado na descrição
                if any(keyword in description.upper() for keyword in ['SAQUE', 'COMPRA', 'PAGAMENTO', 'TRANSFERENCIA']):
                    value = -abs(value)
                
                transactions.append({
                    'date': date,
                    'description': self._clean_description(description),
                    'value': value,
                    'type': 'debit' if value < 0 else 'credit',
                    'category': self._categorize_transaction(description),
                    'bank': 'bradesco'
                })
            except Exception as e:
                continue
        
        return transactions
    
    def _parse_santander_transactions(self, text_content: str) -> List[Dict]:
        """Parser específico para Santander"""
        transactions = []
        
        # Padrão Santander similar ao Itaú
        pattern = r'(\d{2}\/\d{2}\/\d{4})\s+([^0-9]+?)\s+([\d\.,]+)\s+([CD])'
        
        for match in re.finditer(pattern, text_content):
            date_str, description, value_str, value_type = match.groups()
            
            try:
                date = datetime.strptime(date_str, '%d/%m/%Y').isoformat()
                value = self._parse_value(value_str)
                
                if value_type == 'D':
                    value = -abs(value)
                
                transactions.append({
                    'date': date,
                    'description': self._clean_description(description),
                    'value': value,
                    'type': 'debit' if value < 0 else 'credit',
                    'category': self._categorize_transaction(description),
                    'bank': 'santander'
                })
            except Exception as e:
                continue
        
        return transactions
    
    def _parse_bb_transactions(self, text_content: str) -> List[Dict]:
        """Parser específico para Banco do Brasil"""
        transactions = []
        
        # Padrão BB similar aos outros
        pattern = r'(\d{2}\/\d{2}\/\d{4})\s+([^0-9]+?)\s+([\d\.,]+)\s+([CD])'
        
        for match in re.finditer(pattern, text_content):
            date_str, description, value_str, value_type = match.groups()
            
            try:
                date = datetime.strptime(date_str, '%d/%m/%Y').isoformat()
                value = self._parse_value(value_str)
                
                if value_type == 'D':
                    value = -abs(value)
                
                transactions.append({
                    'date': date,
                    'description': self._clean_description(description),
                    'value': value,
                    'type': 'debit' if value < 0 else 'credit',
                    'category': self._categorize_transaction(description),
                    'bank': 'bb'
                })
            except Exception as e:
                continue
        
        return transactions
    
    def _parse_nubank_transactions(self, text_content: str) -> List[Dict]:
        """Parser específico para Nubank"""
        transactions = []
        
        # Padrão Nubank (formato diferente)
        pattern = r'(\d{2}\/\d{2}\/\d{4})\s+([^R$]+)\s+R\$\s*([\d\.,]+)'
        
        for match in re.finditer(pattern, text_content):
            date_str, description, value_str = match.groups()
            
            try:
                date = datetime.strptime(date_str, '%d/%m/%Y').isoformat()
                value = self._parse_value(value_str)
                
                # Nubank usa contexto para determinar sinal
                if any(keyword in description.upper() for keyword in ['PAGAMENTO', 'COMPRA', 'TRANSFERÊNCIA ENVIADA']):
                    value = -abs(value)
                
                transactions.append({
                    'date': date,
                    'description': self._clean_description(description),
                    'value': value,
                    'type': 'debit' if value < 0 else 'credit',
                    'category': self._categorize_transaction(description),
                    'bank': 'nubank'
                })
            except Exception as e:
                continue
        
        return transactions
    
    def _parse_inter_transactions(self, text_content: str) -> List[Dict]:
        """Parser específico para Banco Inter"""
        transactions = []
        
        # Padrão Inter
        pattern = r'(\d{2}\/\d{2}\/\d{4})\s+([^R$]+)\s+R\$\s*([\d\.,]+)'
        
        for match in re.finditer(pattern, text_content):
            date_str, description, value_str = match.groups()
            
            try:
                date = datetime.strptime(date_str, '%d/%m/%Y').isoformat()
                value = self._parse_value(value_str)
                
                # Inter similar ao Nubank
                if any(keyword in description.upper() for keyword in ['PAGAMENTO', 'COMPRA', 'TRANSFERÊNCIA']):
                    value = -abs(value)
                
                transactions.append({
                    'date': date,
                    'description': self._clean_description(description),
                    'value': value,
                    'type': 'debit' if value < 0 else 'credit',
                    'category': self._categorize_transaction(description),
                    'bank': 'inter'
                })
            except Exception as e:
                continue
        
        return transactions
    
    def _parse_generic_transactions(self, text_content: str, bank: str) -> List[Dict]:
        """Parser genérico para bancos não específicos"""
        transactions = []
        
        # Padrões genéricos mais flexíveis
        patterns = [
            r'(\d{2}\/\d{2}\/\d{4})\s+([^0-9]+?)\s+([\d\.,]+)',
            r'(\d{2}\/\d{2})\s+([^0-9]+?)\s+([\d\.,]+)',
            r'(\d{2}-\d{2}-\d{4})\s+([^0-9]+?)\s+([\d\.,]+)'
        ]
        
        for pattern in patterns:
            for match in re.finditer(pattern, text_content):
                groups = match.groups()
                if len(groups) >= 3:
                    date_str, description, value_str = groups[:3]
                    
                    try:
                        # Normalizar formato de data
                        if '-' in date_str:
                            date_str = date_str.replace('-', '/')
                        
                        if len(date_str.split('/')) == 2:
                            date_str += f'/{datetime.now().year}'
                        
                        date = datetime.strptime(date_str, '%d/%m/%Y').isoformat()
                        value = self._parse_value(value_str)
                        
                        transactions.append({
                            'date': date,
                            'description': self._clean_description(description),
                            'value': value,
                            'type': 'debit' if value < 0 else 'credit',
                            'category': self._categorize_transaction(description),
                            'bank': bank
                        })
                    except Exception as e:
                        continue
        
        return transactions
    
    def parse_credit_card_statement(self, text_content: str, bank: str) -> List[Dict]:
        """Parser para faturas de cartão de crédito"""
        transactions = []
        
        if bank not in self.credit_card_patterns:
            return self._parse_generic_credit_card(text_content, bank)
        
        card_info = self.credit_card_patterns[bank]
        pattern = card_info['transaction_pattern']
        
        for match in re.finditer(pattern, text_content):
            groups = match.groups()
            
            try:
                if bank == 'nubank':
                    date_str, description, value_str = groups
                    # Converter formato de data do Nubank (ex: "15 JAN")
                    date = self._parse_nubank_date(date_str)
                else:
                    date_str, description, value_str = groups
                    date = datetime.strptime(f"{date_str}/{datetime.now().year}", '%d/%m/%Y').isoformat()
                
                value = self._parse_value(value_str)
                
                transactions.append({
                    'date': date,
                    'description': self._clean_description(description),
                    'value': -abs(value),  # Fatura é sempre débito
                    'type': 'debit',
                    'category': self._categorize_transaction(description),
                    'bank': bank,
                    'document_type': 'credit_card'
                })
            except Exception as e:
                continue
        
        return transactions
    
    def _parse_generic_credit_card(self, text_content: str, bank: str) -> List[Dict]:
        """Parser genérico para faturas de cartão"""
        transactions = []
        
        # Padrões genéricos para faturas
        patterns = [
            r'(\d{2}\/\d{2})\s+([^0-9]+?)\s+([\d\.,]+)',
            r'(\d{2}\s[A-Z]{3})\s+([^R$]+)\s+R\$\s*([\d\.,]+)',
            r'(\d{2}-\d{2})\s+([^0-9]+?)\s+([\d\.,]+)'
        ]
        
        for pattern in patterns:
            for match in re.finditer(pattern, text_content):
                groups = match.groups()
                if len(groups) >= 3:
                    date_str, description, value_str = groups[:3]
                    
                    try:
                        if ' ' in date_str and any(month in date_str for month in ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']):
                            date = self._parse_nubank_date(date_str)
                        else:
                            date = datetime.strptime(f"{date_str}/{datetime.now().year}", '%d/%m/%Y').isoformat()
                        
                        value = self._parse_value(value_str)
                        
                        transactions.append({
                            'date': date,
                            'description': self._clean_description(description),
                            'value': -abs(value),
                            'type': 'debit',
                            'category': self._categorize_transaction(description),
                            'bank': bank,
                            'document_type': 'credit_card'
                        })
                    except Exception as e:
                        continue
        
        return transactions
    
    def _parse_value(self, value_str: str) -> float:
        """Converte string de valor para float"""
        # Remove caracteres não numéricos exceto vírgulas e pontos
        cleaned = re.sub(r'[^\d\.,]', '', value_str.strip())
        
        # Trata vírgulas como separador decimal
        if ',' in cleaned:
            if '.' in cleaned:
                # Formato: 1.234,56
                cleaned = cleaned.replace('.', '').replace(',', '.')
            else:
                # Formato: 1234,56
                cleaned = cleaned.replace(',', '.')
        
        try:
            return float(cleaned)
        except ValueError:
            return 0.0
    
    def _parse_nubank_date(self, date_str: str) -> str:
        """Converte data do formato Nubank (15 JAN) para ISO"""
        months = {
            'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04',
            'MAI': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
            'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12'
        }
        
        try:
            day, month_abbr = date_str.strip().split()
            month = months.get(month_abbr, '01')
            year = datetime.now().year
            
            return datetime(year, int(month), int(day)).isoformat()
        except:
            return datetime.now().isoformat()
    
    def _clean_description(self, description: str) -> str:
        """Limpa e padroniza a descrição da transação"""
        # Remove espaços extras e caracteres especiais
        cleaned = re.sub(r'\s+', ' ', description.strip())
        cleaned = re.sub(r'[^\w\s\-\.]', ' ', cleaned)
        
        return cleaned.strip().title()
    
    def _categorize_transaction(self, description: str) -> str:
        """Categoriza a transação baseada na descrição"""
        desc_upper = description.upper()
        
        # Categorização básica
        if any(word in desc_upper for word in ['PIX', 'TRANSFERENCIA', 'TED', 'DOC']):
            return 'Transferências'
        elif any(word in desc_upper for word in ['SAQUE', 'RETIRADA']):
            return 'Saques'
        elif any(word in desc_upper for word in ['DEPOSITO', 'CREDITO']):
            return 'Depósitos'
        elif any(word in desc_upper for word in ['COMPRA', 'PAGAMENTO']):
            return 'Compras e Pagamentos'
        elif any(word in desc_upper for word in ['TARIFA', 'TAXA']):
            return 'Tarifas'
        elif any(word in desc_upper for word in ['JUROS', 'RENDIMENTO']):
            return 'Rendimentos'
        else:
            return 'Outros'
    
    def process_document(self, text_content: str) -> Dict[str, Any]:
        """Processa um documento financeiro completo"""
        # Detectar banco e tipo de documento
        bank = self.detect_bank(text_content)
        doc_type = self.detect_document_type(text_content)
        
        # Extrair transações baseado no tipo
        if doc_type == 'fatura_cartao':
            transactions = self.parse_credit_card_statement(text_content, bank if bank else 'generic')
        else:
            transactions = self.parse_bank_statement(text_content, bank if bank else 'generic')
        
        # Calcular estatísticas
        total_income = sum(t['value'] for t in transactions if t['value'] > 0)
        total_expenses = sum(abs(t['value']) for t in transactions if t['value'] < 0)
        net_balance = total_income - total_expenses
        
        # Detectar padrões suspeitos
        suspicious_patterns = self._detect_suspicious_patterns(transactions)
        
        return {
            'processing_success': len(transactions) > 0,
            'bank': bank if bank else 'unknown',
            'document_type': doc_type,
            'transaction_count': len(transactions),
            'transactions': transactions,
            'total_income': total_income,
            'total_expenses': total_expenses,
            'net_balance': net_balance,
            'suspicious_patterns': suspicious_patterns,
            'text_content': text_content[:1000] + '...' if len(text_content) > 1000 else text_content
        }
    
    def _detect_suspicious_patterns(self, transactions: List[Dict]) -> Dict[str, List]:
        """Detecta padrões suspeitos nas transações"""
        suspicious = {
            'mula_financeira': [],
            'estruturacao': [],
            'lavagem_dinheiro': [],
            'gambling': []
        }
        
        gambling_keywords = ['BET', 'CASA', 'JOGO', 'APOSTA', 'CASINO', 'BINGO', 'POKER']
        
        for i, transaction in enumerate(transactions):
            desc_upper = transaction['description'].upper()
            
            # Detectar apostas
            if any(keyword in desc_upper for keyword in gambling_keywords):
                suspicious['gambling'].append(transaction)
            
            # Detectar possível estruturação (valores redondos seguidos)
            if i > 0 and abs(transaction['value']) == abs(transactions[i-1]['value']) and abs(transaction['value']) % 1000 == 0:
                suspicious['estruturacao'].append(transaction)
            
            # Detectar possível mula financeira (muitas transferências PIX pequenas)
            if 'PIX' in desc_upper and abs(transaction['value']) < 500:
                suspicious['mula_financeira'].append(transaction)
        
        return suspicious


def parse_brazilian_bank_document(text_content: str, doc_type: Optional[str] = None) -> Dict[str, Any]:
    """Função principal para processar documentos bancários brasileiros"""
    parser = BrazilianBanksParser()
    return parser.process_document(text_content)


# Exportar função principal
__all__ = ['parse_brazilian_bank_document', 'BrazilianBanksParser']