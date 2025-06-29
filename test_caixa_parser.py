#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
sys.path.append('attached_assets')

from caixa_extrato_parser import process_caixa_extrato_text
import PyPDF2

def test_caixa_parser():
    """Testa o parser da Caixa com o PDF real do usuário"""
    
    # Caminho para o PDF de teste
    pdf_path = "attached_assets/comprovante2025-06-10_101932_250610_133644_1751170942105.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"Arquivo não encontrado: {pdf_path}")
        return
    
    # Extrair texto do PDF
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        text_content = ""
        
        for page in pdf_reader.pages:
            text_content += page.extract_text() + "\n"
    
    print("=== TEXTO EXTRAÍDO DO PDF ===")
    print(text_content[:1000] + "..." if len(text_content) > 1000 else text_content)
    print("\n" + "="*50 + "\n")
    
    # Processar com o parser da Caixa
    try:
        result = process_caixa_extrato_text(text_content)
        
        print("=== RESULTADO DO PROCESSAMENTO ===")
        print(f"Sucesso: {result['processing_success']}")
        print(f"Banco: {result['bank']}")
        print(f"Total de transações: {result['transaction_count']}")
        print(f"Receitas: R$ {result['total_income']:,.2f}")
        print(f"Despesas: R$ {result['total_expenses']:,.2f}")
        print(f"Saldo líquido: R$ {result['net_balance']:,.2f}")
        
        if result['transaction_count'] > 0:
            print("\n=== PRIMEIRAS 10 TRANSAÇÕES ===")
            for i, trans in enumerate(result['transactions'][:10]):
                print(f"{i+1}. {trans['date']} - {trans['description']} - R$ {trans['value']:,.2f}")
        
        # Padrões suspeitos
        suspicious = result['suspicious_patterns']
        if any(suspicious.values()):
            print("\n=== PADRÕES SUSPEITOS DETECTADOS ===")
            if suspicious['mula_financeira']:
                print(f"Atividade de mula financeira: {len(suspicious['mula_financeira'])} casos")
            if suspicious['estruturacao']:
                print(f"Estruturação financeira: {len(suspicious['estruturacao'])} casos")
            if suspicious['lavagem_dinheiro']:
                print(f"Possível lavagem de dinheiro: {len(suspicious['lavagem_dinheiro'])} casos")
        
    except Exception as e:
        print(f"ERRO no processamento: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_caixa_parser()