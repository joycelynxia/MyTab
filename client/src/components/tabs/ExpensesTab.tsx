import type { Expense } from "../../types/types";

interface Props {
  expenses: Expense[];
  getNameFromId: (id: string) => string | undefined;
  canDelete?: boolean;
  onDeleteExpense?: (expenseId: string) => void;
}

const ExpensesTab: React.FC<Props> = ({
  expenses,
  getNameFromId,
  canDelete,
  onDeleteExpense,
}) => (
  <div className="expenses-container">
    <ul>
      {expenses.length > 0 ? (
        expenses.map((expense) => (
          <div className="expense-container item" key={expense.id}>
            <div className="title-payer">
              <h4>{expense.expenseName}</h4>
              <p style={{ fontSize: 13 }}>
                paid by {getNameFromId(expense.payerId)}
              </p>
            </div>
            <div className="expense-item-actions">
              <h4 className="amount">${expense.amount}</h4>
              {canDelete && onDeleteExpense && (
                <button className="table-delete-btn" onClick={() => onDeleteExpense(expense.id)}>Delete</button>
              )}
            </div>
            {/* <p>{formatSplitWithString(expense.splits)}</p> */}
          </div>
        ))
      ) : (
        <div>no expenses recorded</div>
      )}
    </ul>
  </div>
);

export default ExpensesTab;
