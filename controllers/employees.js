import Employee from "../models/employee.js";
import Cafe from "../models/cafe.js";
import mongoose from "mongoose";

function calculateWorkingDays(cafes, employee) {
  const today = new Date().getDate()
  const cafe = cafes.find(c => c.employees?.find(e => e.employee_id === employee.id));

  if (cafe) {
    const date = cafe.employees?.find(x => x.employee_id === employee.id).startedAt.getDate();
    return today - date;
  } else {
    return 0;
  }
}

export const getEmployees = async (req, res) => {
  const { cafe } = req.query;

  try {
    const employees = await Employee.find();
    const cafes = await Cafe.find();
    const employeeCafe = [];
    employees.map(employee => (
      employeeCafe.push({
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        gender: employee.gender,
        days: calculateWorkingDays(cafes, employee),
        cafe: cafes.find(ca => ca.employees?.some(e => e.employee_id === employee.id))?.name
      })
    ))
    if (cafe) {
      res.status(200).json(employeeCafe.filter(e => e.cafe?.toLowerCase() === cafe?.toLowerCase()));
    } else {
      res.status(200).json(employeeCafe);
    }

  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createEmployee = async (req, res) => {
  const employee = req.body;
  const newEmployee = new Employee(employee);

  try {
    await newEmployee.save();
    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  const { id: _id } = req.params;
  const employee = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send("No employee with that id");

  const updatedEmployee = await Employee.findByIdAndUpdate(_id, { ...employee, _id }, { new: true });

  res.json(updatedEmployee);
};

export const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send("No employee with that id");
  const cafe = await Cafe.find();
  const cafeEmployee = cafe.find(c => c.employees.find(e => e.employee_id === id));
  if (cafeEmployee) await Cafe.findOneAndUpdate({ _id: cafeEmployee._id }, { $pull: { employees: { employee_id: id } } }, { new: true });
  await Employee.findByIdAndRemove(id);

  res.json({ message: 'Employee deleted successfully!' });
};
