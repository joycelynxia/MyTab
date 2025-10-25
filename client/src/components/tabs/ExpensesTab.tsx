import type { Expense } from "../../types/types";

interface Props {
  expenses: Expense[];
  getNameFromId: (id: string) => string | undefined;
}

const ExpensesTab: React.FC<Props> = ({
  expenses,
  getNameFromId,
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
            <h4 className="amount">${expense.amount}</h4>
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
