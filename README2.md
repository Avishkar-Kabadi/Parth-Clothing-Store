# PARTH CLOTHING STORE - USER MANUAL

## 1. GETTING STARTED
- Installation: Run the "Parth Clothing Store Setup.exe" file to install the application on your computer.
- First Login: Open the app. If no accounts exist yet, you will need to contact your system administrator to provide the initial Admin username and password.

### The application has two types of accounts:
- Admin: Can view the Dashboard, access the Ledger, and manage staff/products.
- Staff: Can only create bills and view the dashboard (cannot view overall ledger or manage other staff/products).

### Keyboard Navigation:
You can quickly switch between sidebar tabs using keyboard shortcuts:
- Alt + 1: Dashboard
- Alt + 2: Quick Bill
- Alt + 3: Sales Ledger
- Alt + 4: Product Catalog (Admin only)
- Alt + 5: Staff Management (Admin only)


## 2. DASHBOARD
The Dashboard provides an overview of your sales performance.
### Top Cards: View Today's Revenue, Total Bills Today, Cash Collection, and UPI Collection.
### Sales Trends Chart: Visualizes revenue over time. You can use the dropdown to filter the chart by:
  - Last 7 Days (Weekly)
  - Last 4 Weeks (Monthly)
  - Last 12 Months (Yearly)


## 3. QUICK BILL (Creating a Sale)
This is the main screen for billing customers.

1. Enter Customer Details: 
   - Type the "Customer Name" and "Phone Number". 
   - Note: The Name must be at least 4 letters, and the Phone Number must be exactly 10 digits. The Save/Print buttons will remain disabled until these requirements are met.
   
2. Add Items to Bill:
   - Select a product from the dropdown menu.
   - Enter the unit price (e.g., 500) and quantity.
   - Click the [+] button to add it to the cart.
   - To remove an item, click the red trash icon next to it in the table.

3. Tax Calculation:
   - By default, Tax is 0%.
   - To apply tax, type the percentage in the "Tax (%)" field under the Bill Summary. The system will automatically calculate the Rupee amount and update the Grand Total.

4. Complete the Sale:
   - Choose the Payment Method ("Cash" or "UPI").
   - Click "Save" (or press Ctrl + S) to just record the bill silently in the database.
   - Click "Print & Save" (or press Ctrl + P) to record the bill AND open the system print preview dialog to print a physical receipt (default format: 80mm roll).


## 4. SALES LEDGER (Admins Only)
The Ledger tracks all historical sales made by the store.

### View Sales: See every bill, including the customer's name, total amount, taxes, date, and payment mode.
### Searching: You can search directly by Customer Name or Phone Number using the search box at the top.
### Editing: Click the edit icon to modify past bills. You can adjust items, prices, and the applied tax percentage if a mistake was made.


## PRODUCT CATALOG (Admins Only)
### Manage your store's inventory items that appear in the Quick Bill dropdown.
### Products are automatically sorted alphabetically by Category, then by Name.
### Use the Search bar to quickly find existing products.
### To add a product, type the Product Name and Category, then click [+ Add Product].


## STAFF MANAGEMENT (Admins Only)

### Add new staff members by typing a Username and Password, then clicking [+ Add Staff].
### Usernames must be unique (the system will alert you if you try to use an existing one).
### Staff can be deleted by clicking the red trash icon (Admins cannot be deleted).


## GENERAL FEATURES

### Database Backup: Click the "Backup Database" button at the bottom of the sidebar at any time to export a full copy of your system data securely to your Documents/backups folder.
### Offline Capability: All data is stored securely on your local machine. No internet connection is required to make sales or check the ledger.
