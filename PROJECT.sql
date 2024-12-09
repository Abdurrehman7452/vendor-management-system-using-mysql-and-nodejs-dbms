-- Create the database
CREATE DATABASE Vendor_Management;
USE Vendor_Management;

-- Create the Vendors table
CREATE TABLE Vendors (
    Vendor_ID INT AUTO_INCREMENT PRIMARY KEY,
    VendorName VARCHAR(50) NOT NULL,
    Contact_Info VARCHAR(50),
    Service_Categories TEXT,
    Compliance_Certifications TEXT,
    Registration_Date DATE,
    Performance_Rating FLOAT CHECK (Performance_Rating >= 0)
);

-- Create the Departments table
CREATE TABLE Departments (
    Department_ID INT AUTO_INCREMENT PRIMARY KEY,
    DepartmentName VARCHAR(50) NOT NULL,
    Budget_Allocated DECIMAL(9, 2) NOT NULL CHECK (Budget_Allocated > 0)
);

-- Create the Contracts table
CREATE TABLE Contracts (
    Contract_ID INT AUTO_INCREMENT PRIMARY KEY,
    Vendor_ID INT NOT NULL,
    Department_ID INT NOT NULL,
    Start_Date DATE,
    End_Date DATE,
    Terms_and_Conditions TEXT,
    Status VARCHAR(20) NOT NULL,
    Renewal_Date DATE,
    FOREIGN KEY (Vendor_ID) REFERENCES Vendors(Vendor_ID) ON DELETE CASCADE,
    FOREIGN KEY (Department_ID) REFERENCES Departments(Department_ID) ON DELETE CASCADE
);

-- Create the Purchase Orders table
CREATE TABLE Purchase_Orders (
    PO_ID INT AUTO_INCREMENT PRIMARY KEY,
    Vendor_ID INT NOT NULL,
    Department_ID INT NOT NULL,
    Item_Details TEXT,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    Cost DECIMAL(9, 2) NOT NULL CHECK (Cost > 0),
    Status VARCHAR(30) NOT NULL,
    PO_Date DATE,
    Budget_Valid_Status VARCHAR(20) NOT NULL,
    FOREIGN KEY (Vendor_ID) REFERENCES Vendors(Vendor_ID) ON DELETE CASCADE,
    FOREIGN KEY (Department_ID) REFERENCES Departments(Department_ID) ON DELETE CASCADE
);

-- Create the Budget Allocations table
CREATE TABLE Budget_Allocations (
    Allocation_ID INT AUTO_INCREMENT PRIMARY KEY,
    Department_ID INT NOT NULL,
    Amount_Allocated DECIMAL(9, 2) NOT NULL CHECK (Amount_Allocated > 0),
    Amount_Spent DECIMAL(9, 2) NOT NULL CHECK (Amount_Spent >= 0),
    Budget_Status VARCHAR(20) NOT NULL,
    FOREIGN KEY (Department_ID) REFERENCES Departments(Department_ID) ON DELETE CASCADE
);

-- Create the Vendor Performance Evaluations table
CREATE TABLE Vendor_Performance_Evaluations (
    Evaluation_ID INT AUTO_INCREMENT PRIMARY KEY,
    Vendor_ID INT NOT NULL,
    Performance_Rating INT NOT NULL CHECK (Performance_Rating >= 0),
    Timeliness_Score INT NOT NULL CHECK (Timeliness_Score >= 0),
    Service_Quality_Score INT NOT NULL CHECK (Service_Quality_Score >= 0),
    Feedback TEXT,
    FOREIGN KEY (Vendor_ID) REFERENCES Vendors(Vendor_ID) ON DELETE CASCADE
);

-- Create the Users table (Role-based actors)
CREATE TABLE Users (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    UserName VARCHAR(50) NOT NULL,
    Role VARCHAR(20),
    Email VARCHAR(40) NOT NULL UNIQUE,
    Password VARCHAR(40) NOT NULL
);

INSERT INTO Users (UserName, Role, Email, Password)
VALUES
    ('Abdurrehman', 'admin', 'mabdrehman7452@gmail.com', 'Admin123');




DELIMITER //

CREATE TRIGGER PreventVendorDelete
BEFORE DELETE ON Vendors
FOR EACH ROW
BEGIN
    DECLARE contract_count INT;

    -- Check if the vendor has any active contracts
    SELECT COUNT(*)
    INTO contract_count
    FROM Contracts
    WHERE Vendor_ID = OLD.Vendor_ID AND Status = 'active';

    -- If there are active contracts, prevent deletion
    IF contract_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete vendor with active contracts';
    END IF;
END //

DELIMITER ;
