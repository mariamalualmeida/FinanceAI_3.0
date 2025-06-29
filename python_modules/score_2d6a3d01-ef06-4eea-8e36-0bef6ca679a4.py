
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
    transactions = [{"date":"2025-03-17T00:00:00","description":"Pix Pix Recebido De Nathalia Manoela Franca Sales Barnabe","value":99,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"},{"date":"2025-03-21T00:00:00","description":"Pix Pix Recebido De Denio Carlos De Souza","value":10000,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"},{"date":"2025-03-26T00:00:00","description":"Pix Pix Recebido De Nathália França","value":150,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"},{"date":"2025-03-31T00:00:00","description":"Pix Pix Recebido De Alisson Machado De Souza","value":1000,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"},{"date":"2025-04-03T00:00:00","description":"Pix Pix Recebido De Nathalia Manoela Franca Sales Barnabe","value":200,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"},{"date":"2025-04-04T00:00:00","description":"Pix Pix Recebido De Patricia Franca Sales","value":1300,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"},{"date":"2025-04-09T00:00:00","description":"Pix Pix Recebido De Nathalia Manoela Franca Sales Barnabe","value":1200,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"},{"date":"2025-04-11T00:00:00","description":"Pix Pix Recebido De Nathalia Manoela Franca Sales Barnabe","value":12,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"},{"date":"2025-04-17T00:00:00","description":"Pix Pix Recebido De Denio Carlos De Souza","value":500,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"},{"date":"2025-04-30T00:00:00","description":"Pix Pix Recebido De Cleiton Costa Menezes 01236927680","value":2940,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"},{"date":"2025-05-04T00:00:00","description":"Pix Pix Recebido De Denio Carlos De Souza","value":1000,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"},{"date":"2025-05-08T00:00:00","description":"Pix Pix Recebido De Patricia Franca Sales","value":10,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"},{"date":"2025-05-27T00:00:00","description":"Pix Pix Recebido De Marianne Martins Penna","value":335,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"},{"date":"2025-06-05T00:00:00","description":"Pix Pix Recebido De Alisson Machado De Souza","value":285,"type":"credit","category":"Transferências","bank":"bb","document_type":"extrato_bancario","transaction_type":"Entrada"}]
    personal_data = undefined
    
    credit_score = calculate_credit_score(transactions, personal_data)
    
    result = {
        'credit_score': credit_score,
        'success': True
    }
    
    print(json.dumps(result))
