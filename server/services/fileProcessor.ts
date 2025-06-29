import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export interface ProcessedDocument {
  text: string;
  tables: any[];
  metadata: {
    docType: string;
    bank?: string;
    pageCount?: number;
    transactions?: any[];
    personalData?: any;
    financialSummary?: any;
  };
}

export class FileProcessor {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(process.cwd(), 'python_modules');
  }

  async processDocument(filePath: string, fileType: string): Promise<ProcessedDocument> {
    try {
      // Create a temporary Python script that imports and uses the existing modules
      const tempScriptPath = path.join(this.pythonScriptPath, `process_${uuidv4()}.py`);
      
      const pythonScript = this.generatePythonScript(filePath, fileType);
      await fs.writeFile(tempScriptPath, pythonScript);

      // Execute the Python script
      const { stdout, stderr } = await execAsync(`python ${tempScriptPath}`, {
        cwd: this.pythonScriptPath,
        timeout: 60000, // 60 seconds timeout
      });

      // Clean up temp script
      await fs.unlink(tempScriptPath).catch(() => {}); // Ignore errors

      if (stderr && !stderr.includes('warning')) {
        throw new Error(`Python processing error: ${stderr}`);
      }

      // Parse the JSON output from Python
      const result = JSON.parse(stdout);
      
      return {
        text: result.text || '',
        tables: result.tables || [],
        metadata: {
          docType: result.doc_type || 'unknown',
          bank: result.bank,
          pageCount: result.page_count,
          transactions: result.transactions || [],
          personalData: result.personal_data,
          financialSummary: result.financial_summary,
        },
      };
    } catch (error) {
      console.error('File processing error:', error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  private generatePythonScript(filePath: string, fileType: string): string {
    return `
import sys
import json
import os
from pathlib import Path

# Add the attached assets directory to Python path
sys.path.append('${path.join(process.cwd(), 'attached_assets')}')

# Import the existing modules
from file_io_utils_1750515734455_1750930356999 import handle_uploaded_file, detect_file_type_by_filename, detect_bank_from_filename, perform_ocr
from data_parsing_1750515734453_1750930357029 import parse_date_string, parse_financial_value, extrair_dados_cadastrais, processar_contracheque
from dataframe_parsers_1750515734454_1750930357013 import process_dataframe_generic, process_nubank_extrato_csv, process_nubank_fatura_csv, process_inter_extrato_csv, process_inter_fatura_csv, process_caixa_extrato_csv, process_picpay_fatura_csv
from bank_specific_parsers_1750515734450_1750930357073 import parse_nubank_extrato_pdf, parse_c6_fatura_pdf
from categorization_logic_1750515734451_1750930357059 import categorizar_transacao_granular, categorize_transactions_detailed
from config_1750515734453_1750930357044 import SITES_APOSTAS, PROCESSADORAS_PAGAMENTO_NAO_APOSTA, MAPPING_COLUNAS_PADRAO_GENERICO
from caixa_extrato_parser import parse_caixa_extrato_pdf, process_caixa_extrato_text

def extract_transactions(file_path, file_type):
    """Main function to extract and categorize transactions from documents."""
    try:
        # Detect document and bank type
        filename = os.path.basename(file_path)
        doc_type = detect_file_type_by_filename(filename)
        bank = detect_bank_from_filename(filename)
        
        # Handle file upload and extraction
        extracted_data = handle_uploaded_file(file_path, file_type)
        
        transactions = []
        
        # Process based on file type and bank
        if file_type == 'pdf':
            text_content = extracted_data.get('text', '')
            
            # Try bank-specific parsers first
            if 'nubank' in bank.lower() and doc_type == 'extrato_bancario':
                transactions = parse_nubank_extrato_pdf(text_content, doc_type)
            elif 'c6' in bank.lower() and doc_type == 'fatura_cartao':
                transactions = parse_c6_fatura_pdf(text_content, doc_type)
            elif 'caixa' in bank.lower() or 'CAIXA' in text_content:
                # Use the new Caixa parser
                transactions = parse_caixa_extrato_pdf(text_content, doc_type)
            
            # Generic fallback for PDFs that might be bank statements
            if not transactions and text_content.strip():
                # Try to detect if it looks like a Caixa statement
                if any(indicator in text_content.upper() for indicator in [
                    'CAIXA ECONÔMICA', 'SAC CAIXA', 'ALÔ CAIXA', 'EXTRATO POR PERÍODO'
                ]):
                    transactions = parse_caixa_extrato_pdf(text_content, doc_type)
            
            # OCR fallback for scanned PDFs
            if not transactions and not text_content.strip():
                ocr_text = perform_ocr(file_path)
                if ocr_text:
                    if 'nubank' in bank.lower():
                        transactions = parse_nubank_extrato_pdf(ocr_text, doc_type)
                    elif any(indicator in ocr_text.upper() for indicator in [
                        'CAIXA ECONÔMICA', 'SAC CAIXA', 'ALÔ CAIXA'
                    ]):
                        transactions = parse_caixa_extrato_pdf(ocr_text, doc_type)
        
        elif file_type in ['csv', 'xlsx']:
            # Process DataFrames
            tables = extracted_data.get('tables', [])
            if tables:
                df = tables[0]  # Use first table
                
                # Try bank-specific processors
                if 'nubank' in bank.lower():
                    if doc_type == 'extrato_bancario':
                        transactions = process_nubank_extrato_csv(df, doc_type)
                    elif doc_type == 'fatura_cartao':
                        transactions = process_nubank_fatura_csv(df, doc_type)
                elif 'inter' in bank.lower():
                    if doc_type == 'extrato_bancario':
                        transactions = process_inter_extrato_csv(df, doc_type)
                    elif doc_type == 'fatura_cartao':
                        transactions = process_inter_fatura_csv(df, doc_type)
                elif 'caixa' in bank.lower():
                    transactions = process_caixa_extrato_csv(df, doc_type)
                elif 'picpay' in bank.lower():
                    transactions = process_picpay_fatura_csv(df, doc_type)
                else:
                    # Generic processor
                    transactions = process_dataframe_generic(df, doc_type)
        
        # Convert datetime objects to strings for JSON serialization
        for transaction in transactions:
            if hasattr(transaction.get('date'), 'isoformat'):
                transaction['date'] = transaction['date'].isoformat()
        
        # Extract personal data if it's a contracheque
        personal_data = None
        financial_summary = None
        
        text_content = extracted_data.get('text', '')
        if doc_type == 'contracheque' and text_content:
            personal_data = extrair_dados_cadastrais(text_content)
            financial_summary = processar_contracheque(text_content)
        elif text_content:
            personal_data = extrair_dados_cadastrais(text_content)
        
        # Categorize transactions
        categorized_data = None
        if transactions:
            import pandas as pd
            df_transactions = pd.DataFrame(transactions)
            if not df_transactions.empty:
                inputs_df, outputs_df, card_df, card_credits_df = categorize_transactions_detailed(df_transactions)
                categorized_data = {
                    'inputs': inputs_df.to_dict('records') if not inputs_df.empty else [],
                    'outputs': outputs_df.to_dict('records') if not outputs_df.empty else [],
                    'card_transactions': card_df.to_dict('records') if not card_df.empty else [],
                    'card_credits': card_credits_df.to_dict('records') if not card_credits_df.empty else []
                }
        
        # Calculate financial summary
        if transactions:
            total_income = sum(t['value'] for t in transactions if t['value'] > 0)
            total_expenses = sum(abs(t['value']) for t in transactions if t['value'] < 0)
            net_balance = total_income - total_expenses
            
            # Detect betting transactions
            betting_transactions = []
            for transaction in transactions:
                desc_lower = transaction['description'].lower()
                if any(site in desc_lower for site in SITES_APOSTAS):
                    # Check if it's not a legitimate processor
                    if not any(proc in desc_lower for proc in PROCESSADORAS_PAGAMENTO_NAO_APOSTA):
                        betting_transactions.append(transaction)
            
            financial_summary = {
                'total_income': total_income,
                'total_expenses': total_expenses,
                'net_balance': net_balance,
                'transaction_count': len(transactions),
                'betting_transactions': betting_transactions,
                'betting_amount': sum(abs(t['value']) for t in betting_transactions),
                'categorized_data': categorized_data
            }
        
        result = {
            'text': text_content,
            'tables': [df.to_dict('records') for df in extracted_data.get('tables', [])],
            'doc_type': doc_type,
            'bank': bank,
            'transactions': transactions,
            'personal_data': personal_data,
            'financial_summary': financial_summary,
            'success': True
        }
        
        return result
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'text': '',
            'tables': [],
            'doc_type': 'unknown',
            'transactions': []
        }

if __name__ == "__main__":
    file_path = "${filePath.replace(/\\/g, '\\\\')}"
    file_type = "${fileType}"
    
    result = extract_transactions(file_path, file_type)
    print(json.dumps(result, ensure_ascii=False, default=str))
`;
  }

  async calculateCreditScore(transactions: any[], personalData: any): Promise<number> {
    try {
      const tempScriptPath = path.join(this.pythonScriptPath, `score_${uuidv4()}.py`);
      
      const pythonScript = this.generateCreditScoreScript(transactions, personalData);
      await fs.writeFile(tempScriptPath, pythonScript);

      const { stdout, stderr } = await execAsync(`python ${tempScriptPath}`, {
        cwd: this.pythonScriptPath,
        timeout: 30000,
      });

      await fs.unlink(tempScriptPath).catch(() => {});

      if (stderr && !stderr.includes('warning')) {
        throw new Error(`Credit score calculation error: ${stderr}`);
      }

      const result = JSON.parse(stdout);
      return result.credit_score || 0;
    } catch (error) {
      console.error('Credit score calculation error:', error);
      return 0;
    }
  }

  private generateCreditScoreScript(transactions: any[], personalData: any): string {
    return `
import json
import pandas as pd
from datetime import datetime, timedelta

def calculate_credit_score(transactions, personal_data):
    """Calculate credit score based on transaction history and personal data."""
    
    if not transactions:
        return 300  # Minimum score for no data
    
    df = pd.DataFrame(transactions)
    
    # Base score
    score = 500
    
    # Income consistency (20% weight)
    income_transactions = [t for t in transactions if t['value'] > 0]
    if income_transactions:
        incomes = [t['value'] for t in income_transactions]
        if len(incomes) > 1:
            income_std = pd.Series(incomes).std()
            income_mean = pd.Series(incomes).mean()
            cv = income_std / income_mean if income_mean > 0 else 1
            consistency_score = max(0, 100 - (cv * 100))
            score += consistency_score
    
    # Expense control (20% weight)
    expense_transactions = [t for t in transactions if t['value'] < 0]
    if expense_transactions and income_transactions:
        total_expenses = sum(abs(t['value']) for t in expense_transactions)
        total_income = sum(t['value'] for t in income_transactions)
        expense_ratio = total_expenses / total_income if total_income > 0 else 1
        
        if expense_ratio < 0.5:
            score += 100
        elif expense_ratio < 0.7:
            score += 80
        elif expense_ratio < 0.9:
            score += 60
        elif expense_ratio < 1.0:
            score += 40
        else:
            score -= 50
    
    # Transaction frequency and variety (15% weight)
    if len(transactions) > 10:
        score += 50
    elif len(transactions) > 5:
        score += 30
    
    # Betting detection penalty (25% weight)
    betting_count = 0
    betting_amount = 0
    
    sites_apostas = ['bet365', 'betano', 'sportingbet', 'pixbet', 'blaze', 'stake', 'aposta', 'cassino']
    
    for transaction in transactions:
        desc_lower = transaction['description'].lower()
        if any(site in desc_lower for site in sites_apostas):
            betting_count += 1
            betting_amount += abs(transaction['value'])
    
    if betting_count > 0:
        total_amount = sum(abs(t['value']) for t in transactions)
        betting_ratio = betting_amount / total_amount if total_amount > 0 else 0
        
        penalty = min(200, betting_ratio * 500 + betting_count * 10)
        score -= penalty
    
    # Balance consistency (10% weight)
    values = [t['value'] for t in transactions]
    running_balance = []
    balance = 0
    
    for value in values:
        balance += value
        running_balance.append(balance)
    
    negative_balance_count = sum(1 for b in running_balance if b < 0)
    if negative_balance_count == 0:
        score += 50
    elif negative_balance_count < len(running_balance) * 0.1:
        score += 30
    
    # Recent activity (10% weight)
    recent_transactions = []
    cutoff_date = datetime.now() - timedelta(days=30)
    
    for transaction in transactions:
        try:
            if isinstance(transaction['date'], str):
                trans_date = datetime.fromisoformat(transaction['date'].replace('Z', '+00:00'))
            else:
                trans_date = transaction['date']
            
            if trans_date >= cutoff_date:
                recent_transactions.append(transaction)
        except:
            continue
    
    if len(recent_transactions) > 0:
        score += min(30, len(recent_transactions) * 3)
    
    # Ensure score is within valid range
    score = max(300, min(850, score))
    
    return int(score)

if __name__ == "__main__":
    transactions = ${JSON.stringify(transactions)}
    personal_data = ${JSON.stringify(personalData)}
    
    credit_score = calculate_credit_score(transactions, personal_data)
    
    result = {
        'credit_score': credit_score,
        'success': True
    }
    
    print(json.dumps(result))
`;
  }
}

export const fileProcessor = new FileProcessor();
