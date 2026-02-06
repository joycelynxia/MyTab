import { useState } from "react";
import TrashIcon from "../TrashIcon";
import type { Expense } from "../../types/types";
import ViewExpenseModal from "../modals/ViewExpenseModal";

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
}) => {
  const [viewModal, setViewModal] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const handleViewExpense = (expense: Expense) => {    
    setViewModal(true);
    setSelectedExpense(expense);
  }
  const handleCloseModal = () => {
    setViewModal(false);
    setSelectedExpense(null);
  }
  return (
  <div className="expenses-container">
    <ul>
      {expenses.length > 0 ? (
        expenses.map((expense) => (
          <div className="expense-container item" key={expense.id} onClick={() => handleViewExpense(expense)} style={{ cursor: "pointer" }}>
            <div className="title-payer">
              <h4>{expense.expenseName}</h4>
              <p style={{ fontSize: 13 }}>
                paid by {getNameFromId(expense.payerId)}
              </p>
            </div>
            <div className="expense-item-actions">
              <h4 className="amount">${expense.amount}</h4>
              {canDelete && onDeleteExpense && (
                <button className="table-delete-btn" onClick={(e) => { e.stopPropagation(); onDeleteExpense(expense.id); }} title="Delete" aria-label="Delete"><TrashIcon /></button>
              )}
            </div>
            {/* <p>{formatSplitWithString(expense.splits)}</p> */}
          </div>
        ))
      ) : (
        <div>no expenses recorded</div>
      )}
    </ul>
    {viewModal && selectedExpense && (
      <ViewExpenseModal expense={selectedExpense} onClose={handleCloseModal} />
    )}
      </div>
  )
}
;

export default ExpensesTab;
