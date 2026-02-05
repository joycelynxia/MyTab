import type { Expense, Member } from "../types/types";
import { formatDate, getNameFromId } from "../utils/formatStrings";
import "../styling/DataTable.css";
interface Props {
  members: Member[];
  expenses: Expense[];
  canDelete?: boolean;
  onDeleteExpense?: (expenseId: string) => void;
}

const ExpensesTable: React.FC<Props> = ({ members, expenses, canDelete, onDeleteExpense }) => {
  return (
      <table className="grid-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Payer</th>
            <th>Split Between</th>
            {canDelete && <th></th>}
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>{formatDate(expense.date)}</td>
              <td>{expense.expenseName}</td>
              <td>${expense.amount.toFixed(2)}</td>
              <td>{getNameFromId(members, expense.payerId)}</td>
              <td>
                <div className="split-column">
                  {expense.splits.map((participant) => (
                    <div key={participant.memberId}>
                      {participant.memberName}: ${participant.amount.toFixed(2)}
                    </div>
                  ))}
                </div>
              </td>
              {canDelete && onDeleteExpense && (
                <td>
                  <button className="table-delete-btn" onClick={() => onDeleteExpense(expense.id)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
  );
};

export default ExpensesTable;
