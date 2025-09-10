const express = require('express');
const User = require('../models/User');
const Branch = require('../models/Branch');
const { auth, adminAuth, employeeAuth } = require('../middleware/auth');

const router = express.Router();

// Get all employees (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .populate('assignedBranch', 'name location')
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign employee to branch (Admin only)
router.put('/:employeeId/assign-branch', adminAuth, async (req, res) => {
  try {
    const { branchId } = req.body;

    const employee = await User.findOne({ 
      _id: req.params.employeeId, 
      role: 'employee' 
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Remove employee from old branch if assigned
    if (employee.assignedBranch) {
      await Branch.findByIdAndUpdate(
        employee.assignedBranch,
        { $pull: { employees: employee._id } }
      );
    }

    // Assign employee to new branch
    employee.assignedBranch = branchId;
    await employee.save();

    // Add employee to new branch
    if (!branch.employees.includes(employee._id)) {
      branch.employees.push(employee._id);
      await branch.save();
    }

    await employee.populate('assignedBranch', 'name location');
    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send salary to employee (Admin only)
router.post('/:employeeId/send-salary', adminAuth, async (req, res) => {
  try {
    const { amount, note } = req.body;

    const employee = await User.findOne({ 
      _id: req.params.employeeId, 
      role: 'employee' 
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Add salary to employee's wallet
    employee.walletAmount += parseFloat(amount);

    // Add to salary history
    employee.salaryHistory.push({
      amount: parseFloat(amount),
      note: note || 'Salary payment'
    });

    await employee.save();

    res.json({ 
      message: 'Salary sent successfully',
      newWalletAmount: employee.walletAmount 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employee salary information
router.get('/salary-info', employeeAuth, async (req, res) => {
  try {
    const employee = await User.findById(req.user._id).select('walletAmount salaryHistory');
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      totalAmount: employee.walletAmount,
      salaryHistory: employee.salaryHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employee's assigned branch info
router.get('/my-branch', employeeAuth, async (req, res) => {
  try {
    const employee = await User.findById(req.user._id)
      .populate('assignedBranch', 'name location totalSales');

    if (!employee.assignedBranch) {
      return res.status(404).json({ message: 'No branch assigned' });
    }

    res.json(employee.assignedBranch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
