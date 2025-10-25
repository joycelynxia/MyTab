cd client
npm run dev

cd server
npm run dev
npx prisma studio 

in terminal:
psql -U joyce -h localhost -d mytab_app

----------------------
features to add
balance tab
- click on user to see all expenses and settlements

expense tab
- click on expense to view full details of split amount, date, etc
- add uneven split by amount and percentage 

edit expenses
search bar
itemized breakdown
scan and parse receipt 