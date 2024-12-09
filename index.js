const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // For parsing JSON in API requests
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'Vendor_Management'
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL connected...');
});

// Serve Home Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/home.html'));
});

// Serve Admin Page
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// Handle Login
app.post('/login', (req, res) => {
  const { username, password } = req.body; // Role is not sent, so it's omitted
  const query = 'SELECT * FROM Users WHERE UserName = ?';

  db.query(query, [username], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      const user = results[0];
      // Compare the entered password with the stored password (plain text comparison)
      if (password === user.Password) {
        const userRole = user.Role;
        if (userRole === 'admin') {
          res.redirect('/admin.html');
        } else if (userRole === 'department head') {
          res.redirect('/department.html');
        } else if (userRole === 'vendor manager') {
          res.redirect('/vendor-manager.html');
        } else {
          res.send('Role is not assigned properly.');
        }
      } else {
        res.send('Invalid credentials! Please try again.');
      }
    } else {
      res.send('Invalid credentials! Please try again.');
    }
  });
});

// Handle Signup
app.post('/signup', (req, res) => {
  const { email, username, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.send('Passwords do not match!');
  }

  const role = ''; // Empty role field as per your requirement
  const query = 'INSERT INTO Users (UserName, Role, Email, Password) VALUES (?, ?, ?, ?)';

  db.query(query, [username, role, email, password], (err, result) => {
    if (err) throw err;
    // After successful signup, redirect to login page
    res.redirect('/login.html');
  });
});

// Fetch all users for the admin panel
app.get('/api/users', (req, res) => {
  const query = 'SELECT User_ID, UserName, Email, Role FROM Users';
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching users');
    } else {
      res.json(results); // Send users data as JSON
    }
  });
});

// Update a user's role
app.post('/api/update-role/:id', (req, res) => {
  const { id } = req.params; // Get User_ID from URL
  const { role } = req.body; // Get updated role from request body

  const query = 'UPDATE Users SET Role = ? WHERE User_ID = ?';
  db.query(query, [role, id], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error updating role');
    } else {
      res.status(200).send('Role updated successfully');
    }
  });
});

// Handle Vendor Registration
app.post('/vendor-register', (req, res) => {
  const {
    vendorName,
    contactInfo,
    serviceCategories,
    complianceCertifications
  } = req.body;

  const registrationDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
  const query =
    'INSERT INTO Vendors (VendorName, Contact_Info, Service_Categories, Compliance_Certifications, Registration_Date) VALUES (?, ?, ?, ?, ?)';

  db.query(
    query,
    [vendorName, contactInfo, serviceCategories, complianceCertifications, registrationDate],
    (err, result) => {
      if (err) throw err;
      // After successful registration, redirect to login page
      res.redirect('/login.html');
    }
  );
});


// Vendor Sign-in Endpoint
app.post('/api/vendor-signin', (req, res) => {
  const { vendorName, vendorContact } = req.body;

  if (!vendorName || !vendorContact) {
      return res.status(400).json({ message: 'Vendor name and contact are required' });
  }

  const query = `SELECT Vendor_ID FROM Vendors WHERE VendorName = ? AND Contact_Info = ?`;
  db.query(query, [vendorName, vendorContact], (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ message: 'Database error' });
      }

      if (results.length > 0) {
          const vendorId = results[0].Vendor_ID;
          res.json({ message: 'Sign-in successful', vendorId });
      } else {
          res.status(401).json({ message: 'Invalid credentials' });
      }
  });
});


// Vendor Manager Dashboard Endpoint
app.get('/vendor-manager/data', (req, res) => {
  const query = `
    SELECT 
      v.Vendor_ID, 
      v.VendorName, 
      v.Contact_Info, 
      v.Compliance_Certifications, 
      v.Performance_Rating, 
      (SELECT COUNT(*) FROM Contracts WHERE Vendor_ID = v.Vendor_ID) AS NumberOfContracts,
      (SELECT COUNT(*) FROM Purchase_Orders WHERE Vendor_ID = v.Vendor_ID) AS NumberOfPurchaseOrders
    FROM Vendors v
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error retrieving vendor data.');
    } else {
      results.forEach(vendor => {
        // Example formula to calculate performance: weighted rating + contract influence
        vendor.Performance_Rating += vendor.NumberOfContracts * 0.1 + vendor.NumberOfPurchaseOrders * 0.05;
      });
      res.json(results);
    }
  });
});

// Update Compliance Certifications
app.post('/vendor-manager/update-compliance', (req, res) => {
  const { vendorId, newCertification } = req.body;

  const query = 'UPDATE Vendors SET Compliance_Certifications = ? WHERE Vendor_ID = ?';

  db.query(query, [newCertification, vendorId], (err, result) => {
    if (err) {
      console.error(err);
      res.json({ success: false });
    } else {
      res.json({ success: true });
    }
  });
});

// Vendor Performance Data Endpoint
app.get('/vendor-performance/data', (req, res) => {
  const { vendorId } = req.query; // Get the vendorId from query parameters

  const query = `
      SELECT 
          v.VendorName, 
          vp.Timeliness_Score, 
          vp.Service_Quality_Score, 
          vp.Feedback,
          vp.Performance_Rating
      FROM Vendor_Performance_Evaluations vp
      JOIN Vendors v ON vp.Vendor_ID = v.Vendor_ID
      WHERE v.Vendor_ID = ?;
  `;

  db.query(query, [vendorId], (err, results) => {
      if (err) {
          console.error(err);
          res.status(500).json({ message: 'Error retrieving vendor performance data.' });
      } else {
          if (results.length > 0) {
              res.json(results[0]); // Send the first result (there should be only one per vendor)
          } else {
              res.status(404).json({ message: 'Vendor performance data not found.' });
          }
      }
  });
});



app.post('/api/vendor-performance', (req, res) => {
  if (!req.session.vendorId) {
      return res.status(401).json({ message: 'Unauthorized: Vendor not signed in' });
  }

  const vendorId = req.session.vendorId;
  const query = `
      SELECT 
          vp.Evaluation_ID, vp.Performance_Rating, 
          vp.Timeliness_Score, vp.Service_Quality_Score, vp.Feedback
      FROM Vendor_Performance_Evaluations vp
      WHERE vp.Vendor_ID = ?`;

  db.query(query, [vendorId], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Database error' });
      }
      res.json({ evaluations: results });
  });
});



// Update Vendor Performance Evaluation
app.post('/vendor-performance/update', (req, res) => {
  const { vendorId, timelinessScore, serviceQualityScore, feedback, performanceRating } = req.body;

  // Update Vendor Performance Evaluation
  const updatePerformanceQuery = `
    INSERT INTO Vendor_Performance_Evaluations (Vendor_ID, Timeliness_Score, Service_Quality_Score, Feedback, Performance_Rating)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      Timeliness_Score = VALUES(Timeliness_Score),
      Service_Quality_Score = VALUES(Service_Quality_Score),
      Feedback = VALUES(Feedback),
      Performance_Rating = VALUES(Performance_Rating)
  `;

  const updateVendorContractsQuery = `
    UPDATE Vendors
    SET Performance_Rating = ?
    WHERE Vendor_ID = ?
  `;

  db.query(updatePerformanceQuery, [vendorId, timelinessScore, serviceQualityScore, feedback, performanceRating], (err, results) => {
    if (err) {
      console.error(err);
      res.json({ success: false });
    } else {
      db.query(updateVendorContractsQuery, [performanceRating, vendorId], (err) => {
        if (err) {
          console.error(err);
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    }
  });
});


// Define the route to fetch vendor name by vendorId
app.get('/vendor-name/data', (req, res) => {
  const vendorId = req.query.vendorId; // Retrieve vendorId from the query string

  if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
  }

  const query = 'SELECT VendorName FROM Vendors WHERE Vendor_ID = ?';
  db.execute(query, [vendorId], (err, results) => {
      if (err) {
          console.error('Error fetching vendor data:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (results.length === 0) {
          return res.status(404).json({ error: 'Vendor not found' });
      }

      res.json({ VendorName: results[0].VendorName });
  });
});


// Fetch all departments for departments.html
app.get('/api/departments', (req, res) => {
  const query = 'SELECT Department_ID, DepartmentName, Budget_Allocated FROM Departments';
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error retrieving departments.');
    } else {
      res.json(results); // Send department data as JSON
    }
  });
});

app.post('/api/register-department', (req, res) => {
  const { departmentName, budgetAllocated } = req.body;

  // Validate input
  if (!departmentName || isNaN(budgetAllocated) || budgetAllocated <= 0) {
    return res.status(400).json({ message: 'Please provide a valid department name and budget.' });
  }

  // Insert the department and its budget into the Departments table
  const departmentQuery = 'INSERT INTO Departments (DepartmentName, Budget_Allocated) VALUES (?, ?)';
  db.query(departmentQuery, [departmentName, budgetAllocated], (err, result) => {
    if (err) {
      console.error('Error inserting department:', err);
      return res.status(500).json({ message: 'Error registering department' });
    }

    res.status(200).json({
      message: 'Department registered successfully!',
      departmentId: result.insertId, // Return the ID of the newly inserted department
    });
  });
});



// Update department budget
app.post('/api/update-department-budget', (req, res) => {
  const { departmentId, newBudget } = req.body;

  const query = 'UPDATE Departments SET Budget_Allocated = ? WHERE Department_ID = ?';
  db.query(query, [newBudget, departmentId], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error updating department budget.');
    } else {
      res.status(200).send('Budget updated successfully.');
    }
  });
});

app.get('/budget-allocation/data', (req, res) => {
  const query = 'SELECT Allocation_ID, Department_ID, Amount_Allocated, Amount_Spent, Budget_Status FROM Budget_Allocations';
  db.query(query, (err, results) => {
      if (err) {
          console.error(err);
          res.status(500).send('Error fetching budget allocation data.');
      } else {
          res.json(results);
      }
  });
});

app.post('/budget-allocation/save', (req, res) => {
  const { departmentId, allocatedAmount, spentAmount, budgetStatus } = req.body;

  const query = `
      INSERT INTO Budget_Allocations (Department_ID, Amount_Allocated, Amount_Spent, Budget_Status)
      VALUES (?, ?, ?, ?)
  `;

  db.query(query, [departmentId, allocatedAmount, spentAmount, budgetStatus], (err, results) => {
      if (err) {
          console.error(err);
          res.json({ success: false });
      } else {
          res.json({ success: true });
      }
  });
});



app.post('/vendor-contracts', (req, res) => {
  const { vendorId, departmentId, startDate, endDate, termsAndConditions, status, renewalDate } = req.body;
  
  // Insert contract data into the database
  const query = `INSERT INTO contracts (vendorId, departmentId, startDate, endDate, termsAndConditions, status, renewalDate) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.query(query, [vendorId, departmentId, startDate, endDate, termsAndConditions, status, renewalDate], (err, result) => {
    if (err) {
        console.error('Error executing query:', err);
        return res.status(500).send('Error saving contract');
    }
    res.status(200).send('Contract saved successfully');
});

});


// Fetch all purchase orders
app.get('/api/purchase-orders', (req, res) => {
  const query = 'SELECT * FROM Purchase_Orders';
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching purchase orders');
    } else {
      res.json(results); // Send purchase orders data as JSON
    }
  });
});

// Create a new purchase order
app.post('/api/purchase-orders', (req, res) => {
  const {
    orderId,
    vendorId,
    departmentId,
    orderDate,
    totalAmount,
    status
  } = req.body;

  // Validate input (you can add more validations as necessary)
  if (!orderId || !vendorId || !departmentId || !orderDate || !totalAmount || !status) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = `
    INSERT INTO Purchase_Orders (Order_ID, Vendor_ID, Department_ID, Order_Date, Total_Amount, Status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [orderId, vendorId, departmentId, orderDate, totalAmount, status], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error creating purchase order');
    } else {
      res.status(201).json({ message: 'Purchase order created successfully', purchaseOrderId: result.insertId });
    }
  });
});



// Start Server 
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
