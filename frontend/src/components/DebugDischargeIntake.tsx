"use client";

import React, { useState } from "react";

export default function DebugDischargeIntake() {
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    medicalRecordNumber: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`);
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Form submitted successfully!");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Patient Intake Form</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Patient Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            placeholder="Enter patient's name"
          />
          <p className="text-xs mt-1 text-gray-500">
            Current value: {formData.name}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
          <p className="text-xs mt-1 text-gray-500">
            Current value: {formData.dateOfBirth}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Medical Record Number *
          </label>
          <input
            type="text"
            name="medicalRecordNumber"
            value={formData.medicalRecordNumber}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            placeholder="MRN"
          />
          <p className="text-xs mt-1 text-gray-500">
            Current value: {formData.medicalRecordNumber}
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700"
        >
          Submit Form
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <pre className="text-sm">{JSON.stringify(formData, null, 2)}</pre>
      </div>
    </div>
  );
}
