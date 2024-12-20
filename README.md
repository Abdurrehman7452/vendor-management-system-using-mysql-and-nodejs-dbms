# Vendor Management System using mySQL and NodeJS (DBMS)

### Project Overview

This project is a Vendor Management System developed as part of a Database Management Systems (DBMS) course. It integrates a MySQL database for backend data storage, a Node.js backend for handling business logic, and a dynamic frontend built using HTML, CSS, and Bootstrap for an interactive and responsive user interface.

The system provides role-based access with distinct functionalities for:

- Admin: Manages vendors, departments, and user accounts.
- Vendor Manager: Oversees vendor details, calculates performance metrics, and updates vendor information.
- Department Head: Manages departmental budgets, purchase orders, and interactions with vendors.
- Vendor: Accesses their performance data, views purchase orders, creates new contracts, and reviews existing ones.

### Features by User Roles
#### Admin:
- Add and update vendors and users.
- Manage departments and allocate budgets.
#### Vendor Manager:
- Manage vendor records and update information.
- Evaluate and track vendor performance.
#### Department Head:
- Oversee departmental budgets.
- Manage purchase orders with vendors.
#### Vendor:
- View performance statistics and purchase orders.
- Create and manage contracts with departments.

## Technologies Used
- MySQL: Relational database for storing and managing vendor information.

- Node.js: Server-side framework for backend logic and database operations.

- Express.js: For creating RESTful API endpoints.

- HTML, CSS, and Bootstrap: For designing a responsive and user-friendly frontend.

The design is clean and interactive, with clear navigation options for all users.

## How to Run this Project

1. Make sure you have NodeJS and mySQL Workbench installed in your system.
2. Run the PROJECT.sql script in Workbench, it will create the database.
3. Open the Folder in vscode, open terminal and run the command "npm install".
4. In Terminal write : "node index.js".
5. Open the application in your browser at http://localhost:3000.
