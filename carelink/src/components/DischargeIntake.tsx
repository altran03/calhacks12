"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, FileText, Phone, Calendar, MapPin, Stethoscope } from "lucide-react";

interface PatientInfo {
  name: string;
  age: number;
  medicalCondition: string;
  accessibilityNeeds: string;
  dietaryNeeds: string;
  socialNeeds: string;
  dischargeDate: string;
  hospital: string;
  contactPhone: string;
}

export default function DischargeIntake() {
  const [formData, setFormData] = useState<PatientInfo>({
    name: "",
    age: 0,
    medicalCondition: "",
    accessibilityNeeds: "",
    dietaryNeeds: "",
    socialNeeds: "",
    dischargeDate: "",
    hospital: "",
    contactPhone: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8000/api/discharge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
          setFormData({
            name: "",
            age: 0,
            medicalCondition: "",
            accessibilityNeeds: "",
            dietaryNeeds: "",
            socialNeeds: "",
            dischargeDate: "",
            hospital: "",
            contactPhone: "",
          });
        }, 3000);
      }
    } catch (error) {
      console.error("Error submitting discharge:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "age" ? parseInt(value) || 0 : value,
    }));
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Discharge Workflow Initiated!</h3>
        <p className="text-gray-600">Our AI agents are coordinating shelter placement, transport, and social worker assignment.</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Patient Discharge Intake</h2>
        <p className="text-gray-600">Enter patient information to initiate the CareLink coordination workflow</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-500" />
              Patient Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter patient's full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                min="0"
                max="120"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter age"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(415) 555-0123"
              />
            </div>
          </div>

          {/* Medical & Discharge Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Stethoscope className="w-5 h-5 mr-2 text-green-500" />
              Medical & Discharge Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical Condition</label>
              <input
                type="text"
                name="medicalCondition"
                value={formData.medicalCondition}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Diabetes, Hypertension"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
              <select
                name="hospital"
                value={formData.hospital}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Hospital</option>
                <option value="UCSF Medical Center">UCSF Medical Center</option>
                <option value="SF General Hospital">SF General Hospital</option>
                <option value="California Pacific Medical Center">California Pacific Medical Center</option>
                <option value="St. Mary's Medical Center">St. Mary's Medical Center</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Date</label>
              <input
                type="date"
                name="dischargeDate"
                value={formData.dischargeDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Special Needs */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-purple-500" />
            Special Needs & Requirements
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accessibility Needs</label>
              <textarea
                name="accessibilityNeeds"
                value={formData.accessibilityNeeds}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Wheelchair accessible, mobility assistance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Needs</label>
              <textarea
                name="dietaryNeeds"
                value={formData.dietaryNeeds}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Diabetic diet, vegetarian, allergies"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Social Needs</label>
              <textarea
                name="socialNeeds"
                value={formData.socialNeeds}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mental health support, substance abuse counseling"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 shadow-lg"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Initiating Workflow...</span>
              </div>
            ) : (
              "Start Coordination Workflow"
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
