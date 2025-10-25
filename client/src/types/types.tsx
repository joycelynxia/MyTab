export interface Group {
  id: string;
  groupName: string | "new group";
  members?: string[];
  expenses?: string[];
  settlements?: string[];
}

export interface Member {
  id: string;
  groupId: string;
  memberName: string;
  balance: number | 0;
  expenses?: string[];
  expensesPaid?: string[]; // expenses paid in full
  expensesParticipated?: string[]; // expenses where the member participated - must pay back
  settlementsPaid?: string[]
  settlementsReceived?: string[];
}

export interface Split {
  memberId: string;
  memberName?: string
  amount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  expenseName: string;
  amount: number;
  date: Date;
  splits: Split[];
  payerId: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  amount: number;
  date: Date;
  note: string;
  payerId: string;
  payeeId: string;
}