import React, { useState } from 'react';
import {
  FaTimes,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaClock,
  FaPercentage,
  FaTicketAlt,
  FaBell,
  FaBan,
  FaUndo,
} from 'react-icons/fa';

const SubscriptionModal = ({ school, plans, onClose, onUpdate, isLoading }) => {
  const [formData, setFormData] = useState({
    planId: school?.subscription_plan_id || '',
    pricePerStudent: school?.price_per_student || 800,
    billingFrequency: school?.billing_frequency || 'monthly',
    subscriptionStatus: school?.subscription_status || 'active',
    trialStartDate: school?.trial_start_date?.split('T')[0] || '',
    trialEndDate: school?.trial_end_date?.split('T')[0] || '',
    subscriptionStartDate: school?.subscription_start_date?.split('T')[0] || '',
    subscriptionEndDate: school?.subscription_end_date?.split('T')[0] || '',
    gracePeriodDays: school?.grace_period_days || 7,
    discountPercentage: school?.discount_percentage || 0,
    couponCode: school?.coupon_code || '',
    renewalReminderDays: school?.renewal_reminder_days || 7,
    latePaymentDays: school?.late_payment_days || 7,
    autoSuspendAfterDays: school?.auto_suspend_after_days || 30,
    manualSuspension: school?.manual_suspension || false,
    autoReactivate: school?.auto_reactivate || false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Subscription Management</h3>
            <p className="text-sm text-gray-500">{school?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Plan Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscription Plan
            </label>
            <select
              name="planId"
              value={formData.planId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            >
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ₦{plan.price_per_student}/student ({plan.billing_frequency})
                </option>
              ))}
            </select>
          </div>

          {/* Price & Billing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaMoneyBillWave className="inline mr-1" />
                Price Per Student (₦)
              </label>
              <input
                type="number"
                name="pricePerStudent"
                value={formData.pricePerStudent}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                min="0"
                step="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaClock className="inline mr-1" />
                Billing Frequency
              </label>
              <select
                name="billingFrequency"
                value={formData.billingFrequency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
              >
                <option value="monthly">Monthly</option>
                <option value="termly">Termly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscription Status
            </label>
            <select
              name="subscriptionStatus"
              value={formData.subscriptionStatus}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            >
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Trial Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaCalendarAlt className="inline mr-1" />
                Trial Start Date
              </label>
              <input
                type="date"
                name="trialStartDate"
                value={formData.trialStartDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaCalendarAlt className="inline mr-1" />
                Trial End Date
              </label>
              <input
                type="date"
                name="trialEndDate"
                value={formData.trialEndDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
              />
            </div>
          </div>

          {/* Subscription Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaCalendarAlt className="inline mr-1" />
                Subscription Start Date
              </label>
              <input
                type="date"
                name="subscriptionStartDate"
                value={formData.subscriptionStartDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaCalendarAlt className="inline mr-1" />
                Subscription End Date
              </label>
              <input
                type="date"
                name="subscriptionEndDate"
                value={formData.subscriptionEndDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
              />
            </div>
          </div>

          {/* Grace Period & Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaClock className="inline mr-1" />
                Grace Period (Days)
              </label>
              <input
                type="number"
                name="gracePeriodDays"
                value={formData.gracePeriodDays}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaPercentage className="inline mr-1" />
                Discount Percentage
              </label>
              <input
                type="number"
                name="discountPercentage"
                value={formData.discountPercentage}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Coupon & Reminders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaTicketAlt className="inline mr-1" />
                Coupon Code
              </label>
              <input
                type="text"
                name="couponCode"
                value={formData.couponCode}
                onChange={handleChange}
                placeholder="Enter coupon code"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaBell className="inline mr-1" />
                Renewal Reminder (Days Before)
              </label>
              <input
                type="number"
                name="renewalReminderDays"
                value={formData.renewalReminderDays}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                min="0"
              />
            </div>
          </div>

          {/* Late Payment & Auto Suspend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaClock className="inline mr-1" />
                Late Payment Days (Grace)
              </label>
              <input
                type="number"
                name="latePaymentDays"
                value={formData.latePaymentDays}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaBan className="inline mr-1" />
                Auto Suspend After (Days)
              </label>
              <input
                type="number"
                name="autoSuspendAfterDays"
                value={formData.autoSuspendAfterDays}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                min="0"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="manualSuspension"
                checked={formData.manualSuspension}
                onChange={handleChange}
                className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
              />
              <span className="text-sm text-gray-700">Enable Manual Suspension</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="autoReactivate"
                checked={formData.autoReactivate}
                onChange={handleChange}
                className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
              />
              <span className="text-sm text-gray-700">
                <FaUndo className="inline mr-1" />
                Enable Auto Reactivation
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? 'Updating...' : 'Update Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionModal;